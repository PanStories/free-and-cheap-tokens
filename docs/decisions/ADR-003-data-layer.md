# ADR-003: 策展库以 Git 为事实源，构建期编译为只读 catalog，KVS 做热更新通道

## Status

Accepted (2026-09-28)

## Background

数据来源是"策展库 + 定时联网刷新"混合模式。需要同时满足四个彼此拉扯的诉求：

1. **版本化与人工评审**：策展库必须能 diff、能回滚、能走 PR 评审。
2. **低读取延迟**：MCP 在请求路径上不能去爬网页或打数据库网络往返。
3. **低成本**：不能为几百条记录常驻一个数据库实例。
4. **刷新可写入**：定时任务的产出必须能进入系统，且不能污染人工策展的事实。

## Considered Options

| 方案 | 版本化 | 读延迟 | 成本 | 刷新写入 | 结论 |
|---|---|---|---|---|---|
| A. Git 内 JSON（单一事实源）+ 构建期编译 + KVS 热更新 | 强 | 内存级 | 近零 | 通过 PR / KVS | **选定** |
| B. Apify Key-Value Store 作事实源 | 弱（无 diff、无评审） | 一次网络读 | 低 | 直接写 | 人工评审闭环断掉，否决 |
| C. Apify Dataset 作事实源 | 弱 | 一次网络读 | 低 | 直接写 | 同上，且 Dataset 面向爬虫产物，无 schema 校验门 |
| D. SQLite 放 KVS | 中（二进制，diff 难读） | 低 | 低 | 需整文件上传 | 二进制无法 PR 评审，否决 |
| E. 每次请求直接抓官网 | 不适用 | 秒级，不可用 | 高 | 不适用 | Agent 关键路径上不能做网络抓取，否决 |

## Decision

三层结构：

```
第 1 层  事实源      data/promos/*.json        Git 版本化，PR 评审，人工策展优先级最高
第 2 层  读模型      build/catalog.json        构建期编译，MCP 与静态页只消费它
第 3 层  热更新      Apify KVS 记录 "catalog"  Standby 容器启动时拉一次，之后按 checksum 轮询
```

### 读写分离

- **写**：只有 Git 提交能改变事实。刷新任务产出写进 `data/inbox/<date>.json`，不直接改 `data/promos/`。
- **读**：MCP 进程只读 `build/catalog.json`（镜像内置）或 KVS 中的同名快照，从不读 `data/promos/` 原始分片。

### 容器内的 catalog 加载策略

1. 容器启动时从镜像内置 `build/catalog.json` 载入内存——**这一步保证 KVS 挂掉也能应答**。
2. 随后每 15 分钟读一次 KVS 记录的 `checksum`（`sha256:<hex>`），与内存值不同才拉全量替换。
3. KVS 不可达时保持内存版本并在 `/healthz` 里标记 `catalog_source: "baked_in"`。

### 合并规则（人工 vs 爬虫）

按字段来源判定优先级，`provenance.source` 决定：

- `curator`（人工策展）的字段值**永远**覆盖 `crawler` 的值。
- 爬虫只能更新"可观测事实"子集：`status`、`verification.*`、`offer.expires_at`、`provenance.last_seen_at`、`offer.amount.raw_text`。
- 爬虫试图改动 `difficulty`、`terms`、`actionability.next_steps` 时，不改数据，改为把该条推进**待复核队列**（`provenance.review_required = true`，同时把 `verification.status` 降级为 `reported`）。
- 同一字段被两个爬虫源给出不同值 → 进待复核队列，不猜。

### 去重键

- 主键：`id`（人工分配 slug）。
- 爬虫候选的匹配键：`provider.id` + `offer.type` + `amount.unit` + `amount.raw_text` 归一化后的指纹。指纹命中已有条目则走"更新"分支，否则作为新增进待复核队列。
- 归一化：金额去除货币符号与千分位、单位统一小写、raw_text 去空白与全角转半角。

### 置信度

`verification.confidence`（0-1）= `source_weight` × `freshness_factor` × `corroboration_factor`，在构建期计算并写入：

- `source_weight`：`official_feed` 0.9 / `curator` 0.85 / `crawler` 0.6 / `user_report` 0.4
- `freshness_factor`：`max(0.4, 1 - days_since(last_verified_at) / 60)`
- `corroboration_factor`：`min(1, 0.7 + 0.15 × (独立来源数 - 1))`
- `review_required = true` 时对外输出强制降级为 `reported`，不暴露原 confidence

### 待复核队列

`catalog.review_queue` 是 `promos` 的镜像子集。刷新任务每天把队列内容生成一个 Markdown 摘要，作为 PR 描述，人工在 PR 里决定合并或丢弃。队列条目**默认不出现在对外输出**（`search_promos` 等默认 `only_verified=true`）。

## Consequences

正面：

- 数据变更可审计、可回滚，符合"策展库"定位。
- MCP 读路径是纯内存，P99 在毫秒级，与容器生命周期解耦。
- 刷新任务与 MCP 完全解耦，刷新失败不会让 MCP 不可用。
- 数据更新不需要重建 Apify 镜像（走 KVS），也不需要用镜像构建当发布闸门。

负面：

- 数据从 Git 合入到线上生效有最多 15 分钟的延迟。对这个产品（额度促销，按天变化）完全可接受。
- 多了一层构建产物，`build/catalog.json` 必须与 `data/promos/` 保持同步——用 CI 门保证：每次 PR 都跑 `validate + build`，产物不一致直接红。
- KVS 是 Apify 平台绑定项，迁出平台时需替换为任意对象存储（接口收敛在 `src/data/catalog-store.ts` 一个文件里）。

## Related ADRs

- ADR-001（运行时与分发形态）
- ADR-002（无状态传输）
