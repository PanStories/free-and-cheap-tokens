# Free & Cheap Tokens 架构文档

版本 1.0 — 2026-09-28 — 高见远（首席架构师）

本文档是 Phase 2 实现的唯一契约。规格没写清的地方，实现者会自己猜；猜出来的往往就是返工。因此本文档点名文件、钉死版本、写明不做的事、并把已验证的坑内嵌进来。

---

## 1. 目标与背景

一个名为 **Free & Cheap Tokens** 的 MCP server，让 AI Agent 与非技术用户检索 AI 模型/推理服务的免费额度与低价 token 促销（下称 promo）。每条 promo 是结构化记录：提供方、优惠内容、**归类后的条款**、**上手难度 easy/medium/hard**、**适用区域**。

数据来自策展库（Git 版本化）+ 定时联网刷新的混合模式。交付三件套：MCP server + 同名 Skill + 零依赖静态每日清单页（带分享卡片），通过 OSS + Hosted Convenience 变现（Apify 付费 Actor + WorkBuddy 付费 Skill，源码 MIT 开源免费）。

成功长什么样：

1. Agent 能用一次 `search_promos` 拿到带条款与下一步动作的结构化结果，不需要追问。
2. 非技术用户打开每日清单页，能在 30 秒内知道"今天能薅什么、怎么做、有什么坑"。
3. 数据每天刷新一次，失效条目在 24 小时内被标记，人工评审在 PR 里完成。
4. 月度运行成本在 Free 计划可覆盖的量级（见第 12 节）。

---

## 2. Apify Pay-Per-Event + webServer 可行性判定（v1.1.0，**已替代原 Standby 方案**）

**判定：可行 + 零基础成本。** 用户 2026-09-28 追加要求「**只付 Apify 佣金 / 按事件付费，不付月费**」后，Standby 方案整体退役，PPE 方案接管。

### 2.1 为什么 PPE 取代 Standby（决策依据，来自 Apify 官方文档）

Apify Actor 三种定价模型（2026 年现状）：

| 定价模型 | 触发计费条件 | 空闲时计费 | 是否支持 webServer |
|----------|--------------|------------|---------------------|
| **Pay-per-event** (PPE) | 我们自己 `Actor.charge({ eventName })` 定义事件 | **$0**（容器不运行） | 是（每请求 = 1 次 run） |
| Pay-per-usage | 按 CU（compute units）消耗计费 | $0（同 PPE，容器按请求启停） | 是 |
| Rental（**已 sunset**） | 月费 + 平台 usage | 月费 + usage | 是 |

> 来源：`docs.apify.com/actors/running/actors-in-store` 与 `docs.apify.com/actors/publishing/monetize`
>
> **关键发现**：「**Not use Standby** mode」是 Apify Agentic Payments（x402 / Skyfire 协议）的**资格要求之一**。我们切到 PPE 后，AI Agent 可以用加密钱包直接按调用付费，无需 Apify 账号。这是把"无月费"从减法变成乘法的关键升级。

### 2.2 PPE + webServer 的运行时模型

```
HTTP 请求 → Apify 网关 → 启动 Actor run（冷启动 2-4s）
                              ↓
                        src/handler.ts 接收 Express 请求
                              ↓
                        解析 MCP JSON-RPC（POST /mcp）
                              ↓
                        路由到对应 tool / resource / prompt
                              ↓
                   Actor.charge({ eventName: 'mcp-search' })
                              ↓
                        返回 JSON-RPC 响应 + 立即回收 run
```

**关键事实**：
- Actor 不持有空闲进程；零调用时 $0
- 每次 HTTP 请求 = 1 次 Actor run；事件单价由开发者预设，Apify 平台在结算时抽成
- `webServer.requestHandler` 指向 `src/handler.ts`，框架帮你做端口监听、就绪探针、SIGTERM 处理
- **不写 `usesStandbyMode: true`**；Standby 标志位**不存在或必须为 false**

### 2.3 定价事件表（写入 `.actor/actor.json` 的 `pricingEvents`）

| 事件名 | 用途 | 单价 USD | 备注 |
|--------|------|----------|------|
| `mcp-initialize` | 握手 | $0 | 免费，让 Agent 试探 |
| `mcp-list-tools` | 工具发现 | $0 | 免费，让 Agent 探索 |
| `mcp-search` | 语义搜索 | $0.005 | 主入口 |
| `mcp-filter` | 纯结构化过滤 | $0.005 | 同上 |
| `mcp-get-promo` | 单条详情 | $0.002 | 简单读取 |
| `mcp-list-providers` | 厂商列表 | $0.002 | 简单读取 |
| `mcp-recent-updates` | 变更追踪 | $0.005 | 同搜索 |
| `mcp-expiring-soon` | 7-30 天到期 | $0.005 | 同搜索 |
| `mcp-what-can-i-get` | 行动建议（高推理） | $0.01 | 溢价：要走 `actionability` 引擎 |
| `mcp-report-issue` | 报错 | $0 | 免费，鼓励纠错 |

> 定价依据（2026-09-28 市场校准）：Apify Store MCP actor 参考价 $0.03–0.035/tool call（travel-tools-mcp、enterprise-mcp-gateway），情报类 MCP $0.045–0.50。我们定位为该区间下沿的 1/6–1/7（只读 catalog、无上游 API 成本）。注意 Apify PPE 提价有 14 天通知期、降价即时生效，故首次发布前定准。

**月成本估算**（以保守场景算）：
- 1000 calls/月（早期用户）：约 $4 / 月
- 10000 calls/月（早期活跃）：约 $40 / 月
- **月成本与使用量线性相关，且 Apify 抽成后我们仍能拿到事件单价的 80% 左右**

### 2.4 与 Standby 方案对比（为什么这是升级不是降级）

| 维度 | Standby（v1.0） | PPE + webServer（v1.1.0） |
|------|----------------|--------------------------|
| 基础成本 | $4.5/月（Free 计划额度内）或 $144/月（误用 Actor hostname 时） | **$0** |
| 冷启动 | 偶发（idle 后） | 每次（2-4s） |
| 多并发 | 自动扩容新 run | 每请求 1 run，平台自动并发 |
| Agentic Payments 资格 | ❌ 不符合（用了 Standby） | ✅ 符合（无 Standby + 有限权限 + KYC） |
| x402 / Skyfire 协议 | ❌ | ✅ Agent 可用加密钱包直接付 |
| 计费粒度 | CU × 小时（粗糙） | 每事件（精确） |
| C2 锁 1024MB | ⚠️ 致命陷阱 | **不存在**（无空闲容器） |
| 配置文件 | `usesStandbyMode: true` | **`usesStandbyMode` 不出现** |

### 2.5 不再需要的旧约束（v1.0 → v1.1.0 退役）

- ~~C1 必须无状态~~ → 仍然成立（但理由从"Standby 扩容"改为"PPE 每请求独立 run"）
- ~~C2 必须建 Task hostname~~ → **不存在**（PPE 无 idle container）
- ~~C3 `Actor.init()` vs `Actor.main()`~~ → **不再适用**（PPE 不用 `Actor.init()` 启动常驻 server）
- ~~C4 不可恢复错误 `process.exit()`~~ → **不再适用**（PPE 每个 run 是独立进程，错误即结束）
- ~~C5 Bearer token 客户端兼容性~~ → **仍然适用**（PPE 仍要求 Apify 鉴权）

### 2.6 仍需的约束

- **M1 MCP transport 必须 stateless**（ADR-002 未变）—— PPE 每请求独立 run，session 必断
- **M2 必须 `Origin` / `Host` 白名单**（DNS rebinding）—— 同 v1.0
- **M3 `Actor.charge` 必须在 `handler.ts` 显式调用**—— 不调用则该次调用不计费（Apify 会告警）
- **M4 开发者必须完成 KYC** —— Agentic Payments 资格的前置条件

### 2.7 替代方案（仍保留为降级路径）

**降级路径 P1**：完全弃用 Apify 远程端点，MCP 仅 stdio 分发（`npx free-and-cheap-tokens`）。这保留"每日清单页 + RSS/ICS + 分享传播"闭环。代价：非技术用户无法直连 MCP（必须 `npx`）。这是 Apify 平台出问题时的退路。

**降级路径 P2**：MCP server 迁移到其他 serverless（Cloudflare Workers / Vercel / Deno Deploy），Apify 仅保留 Store 列表 + PPE Actor。迁移只影响 `src/handler.ts` + `.actor/`。

---

## 3. 技术选型对比矩阵

评分 1-5，权重按 MVP 阶段取：学习成本 0.25、成本 0.25、生态成熟度 0.20、团队熟悉度 0.20、扩展性 0.10。

| 维度（权重） | A. Apify PPE + webServer + TS | B. Apify Standby + Python/FastMCP | C. stdio 本地 + Apify 定时刷新 | D. Cloudflare Workers + DO |
|---|---|---|---|---|
| 学习成本 (0.25) | 4 | 4 | 5 | 3 |
| 成本 (0.25) | **5**（$0 基础） | 3 | 5 | 5 |
| 生态成熟度 (0.20) | 5 | 4 | 4 | 3 |
| 团队熟悉度 (0.20) | 5 | 2 | 5 | 2 |
| 扩展性 (0.10) | **5**（Agentic Payments） | 4 | 2 | 4 |
| **加权总分** | **4.85** | 3.45 | 4.50 | 3.30 |

**结论：选 A（PPE）。** v1.1.0 用户裁决「只付佣金 / 按事件付费」后，A 选项从「成本 4」升至「成本 5」，并因获得 Agentic Payments 资格将扩展性从 4 升至 5，加权总分 4.40 → **4.85**。C 的加权分（4.50）仍排其后，但它是降级路径 P1，不取代 A。

差异说明：

- A v1.1.0 的额外红利：**Agentic Payments 资格**。PPE + 无 Standby + 有限权限 + KYC = AI Agent 可用 x402/Skyfire 加密钱包按调用付费，无需 Apify 账号。
- B 在团队熟悉度上明显低（本项目其余资产是 TS/Node），且 Python 镜像内存占用更高。
- D 推翻用户已确认的 Apify 分发决策；保留为降级路径 P2。

**结论：选 A。** C 的加权分略高（4.50），但它牺牲了用户已确认的远程 HTTP 端点与自传播闭环——这是产品级取舍，不是技术级取舍，不由架构评分决定。C 保留为降级路径 P1。

差异说明：

- B 在团队熟悉度上明显低（本项目其余资产是 TS/Node），且 Python 镜像内存占用更高，在按内存计费的 Standby 上是直接成本劣势。
- D 推翻用户已确认的分发决策，且失去 Apify Store 分发位与 Pay-per-event 变现通道。

---

## 4. 分层架构

```
                        用户 / AI Agent
                              |
        +---------------------+---------------------+
        |                     |                     |
   MCP 客户端            Skill 编排层          浏览器
 (Claude/WorkBuddy)   (SKILL.md + prompts)   (每日清单页)
        |                     |                     |
        | Streamable HTTP     | 调用 MCP tools       | 静态 HTML
        | POST /mcp           |                     |
        v                     v                     v
+---------------------------------------------------------------+
|                表现层  src/transport/                          |
|  Express 5 应用                                                |
|  /mcp        StreamableHTTPServerTransport (stateless, JSON)   |
|  /healthz    自检 + catalog_source 标记                        |
|  /           就绪探针（x-apify-container-server-readiness-probe）|
|  中间件：Origin/Host 白名单（DNS rebinding 防护）               |
+---------------------------------------------------------------+
        |
        v
+---------------------------------------------------------------+
|                业务层  src/domain/                             |
|  catalog-repo    载入 + 索引 + 内存缓存                        |
|  query           过滤 / 排序 / 分页 / 语义打分                 |
|  region-match    区域匹配（global / include / exclude）        |
|  actionability   可薅指数与 blockers 推导                      |
|  render          human_summary 与 next_steps 生成              |
+---------------------------------------------------------------+
        |
        v
+---------------------------------------------------------------+
|                数据层  src/data/                               |
|  catalog-store  镜像内置 catalog + KVS 轮询热更新              |
|  schema         ajv 校验（promo.schema.json）                  |
+---------------------------------------------------------------+
        ^                                    ^
        | 构建期编译                          | 15 分钟轮询
        |                                    |
+---------------+                  +----------------------+
| data/promos/  |                  | Apify Key-Value Store|
| Git 事实源    |  <-- PR 合并 --  | record: "catalog"    |
+---------------+                  +----------------------+
        ^
        | 每日
+---------------+
| GitHub Actions|
| refresh job   |
+---------------+
```

依赖方向严格单向：`transport -> domain -> data`。`domain` 不许 import `transport`，`data` 不许 import `domain`。用 `eslint` 的 `no-restricted-imports` 规则在 CI 里强制。

---

## 5. 目录结构与文件组织约束

```
MCP-Free-and-Cheap-Tokens/
  .actor/
    actor.json                 usesStandbyMode + webServerMcpPath + webServerSchema
    input_schema.json          空对象（Standby 不需要 run input）
    pay_per_event.json         Phase 2，MVP 先留空数组
  Dockerfile                   FROM apify/actor-node:24-slim
  package.json                 type: module, 锁定版本见 ADR-001
  src/
    main.ts                    <150 行。只做：init -> 装配 -> listen -> 信号兜底
    transport/
      server.ts                Express 应用与中间件装配  <200 行
      mcp.ts                   McpServer 实例工厂与 tools/resources/prompts 注册 <300 行
      origin-guard.ts          Origin/Host 白名单中间件 <80 行
      health.ts                /healthz 与自检  <80 行
    domain/
      catalog-repo.ts          catalog 载入、索引、缓存  <300 行
      query.ts                 过滤/排序/分页/语义打分  <300 行
      region-match.ts          <80 行
      actionability.ts         <150 行
      render.ts                human_summary / next_steps  <200 行
    data/
      catalog-store.ts         镜像内置 + KVS 轮询  <200 行
      schema.ts                ajv 编译与校验  <80 行
    tools/
      search-promos.ts         一个文件一个 tool，各自 <150 行
      filter-promos.ts
      get-promo.ts
      list-providers.ts
      recent-updates.ts
      expiring-soon.ts
      what-can-i-get.ts
      report-issue.ts
    resources/
      catalog-snapshot.ts
      daily-brief.ts
      schema-resource.ts
      providers-index.ts
    prompts/
      daily-deal-brief.ts
      pick-for-me.ts
      explain-terms.ts
  data/
    promos/                    一个 provider 一个 json 文件，人工策展
    inbox/                     刷新任务产出，<date>.json
    providers.json             provider 主数据
  build/
    catalog.json               构建期产物，只读读模型
  site/
    index.html                 每日清单页，零依赖
    daily/<YYYY-MM-DD>.html
    tokens.css                 构建期从 design/design-tokens.css 复制，不在 site/ 里手写
    icons.ts                   构建期从 design/UIUX.md 的图标常量表生成，不在 site/ 里手写
    og/<YYYY-MM-DD>.png        CI 生成
  scripts/
    validate.ts                ajv 校验 data/ + build/catalog.json
    build-catalog.ts           data/ -> build/catalog.json
    build-site.ts              catalog -> site/
    refresh.ts                 定时刷新（GitHub Actions 调用）
    push-snapshot.ts           catalog -> Apify KVS
  schemas/
    promo.schema.json          已落盘并通过 round-trip 测试
  docs/
    ARCHITECTURE.md
    openapi.yaml
    decisions/ADR-001..003
  skills/
    free-and-cheap-tokens/SKILL.md
```

### 硬规则

1. **单文件不超过 300 行**。超了就是职责没拆干净，拆文件，不要靠注释分区。
2. **入口只装配**。`src/main.ts` 不许出现业务逻辑，只做 init、装配、listen、SIGTERM 兜底。
3. **一个 tool 一个文件**。`src/tools/` 下每个文件只注册一个 tool，文件名即 tool 名。
4. **按资源分包**，不按技术分层（不要在根目录建 `services/` `utils/` 这种万能目录）。
5. **`src/domain/` 不 import `src/transport/`**，反向也不行。CI 强制。

---

## 6. 数据层设计

（决策与理由见 ADR-003，这里只写可执行细节。）

### 6.1 事实源：`data/promos/<provider-id>.json`

每个 provider 一个文件，内容是 promo 对象数组。人工通过 PR 修改，CI 用 `schemas/promo.schema.json` 校验。

### 6.2 编译：`scripts/build-catalog.ts`

`data/` -> `build/catalog.json`，构建期完成五件事：

1. **校验**：ajv 校验每条 promo，失败即构建红。
2. **过滤软删除**：`deleted_at` 非 null 的条目在此处一次性剔除，不进入 `catalog.promos`。这是全链路唯一的墓碑过滤点——MCP 各 tool 与 `/api/v1/daily` 不再二次过滤，杜绝"某处忘了过滤"。
3. **派生字段**：`status` 按 `expires_at` 距今天数自动置位（<=14 天且未过期 -> `expiring`；已过期 -> `expired`）；`actionability.score` 按公式计算。
4. **难度口径校验**：`difficulty` 与 `terms` 冲突时报错（例如 `difficulty: "easy"` 但 terms 里有 `credit_card_required` 且 severity=blocker）。
5. **checksum**：`promos` 数组的 sha256，写入 `checksum` 字段。

`actionability.score` 公式（0-100，整数）：

```
base      = easy 60 / medium 40 / hard 20
amount    = 0-20   按 unit 归一化的额度规模分档
freshness = 0-20   no_fixed_expiry ? 20 : max(0, 20 - max(0, days_to_expiry) * 20 / 90)
penalty   = 每条 severity=blocker 的 term 扣 8 分，最多扣 30
score     = clamp(0, 100, base + amount + freshness - penalty)
```

### 6.3 运行时：`src/data/catalog-store.ts`

```
启动：  读镜像内置 build/catalog.json -> 载入内存
轮询：  每 15 分钟读 KVS 记录的 checksum（只取头，不取全量）
        checksum 不同 -> 拉全量 -> ajv 校验 -> 校验通过才替换内存
        校验失败 -> 保留旧版本，记 warn 日志，不替换
降级：  KVS 不可达 -> 保持内存版本，/healthz 返回 catalog_source: "baked_in"
```

### 6.4 定时刷新

**跑在 GitHub Actions**（公共仓库分钟数不限；私有仓库 2000 分钟/月，本任务每天约 3-5 分钟，也在额度内）。

```
.github/workflows/refresh.yml      cron '0 */6 * * *'   每 6 小时（与清单页文案"每 6 小时核验一次"一致）
.github/workflows/verify.yml       cron '30 5 * * *'    每日 05:30 UTC，claim_url 可达性核验
.github/workflows/build-site.yml   由 refresh.yml 成功后触发（workflow_run），不单独定时
```

刷新频率取 6 小时而不是每日一次，原因：清单页与页脚已对终端用户承诺"每 6 小时核验一次"（`docs/UIUX.md` 第 365、814 行），架构必须兑现文案承诺。成本上 4 次/天 × 约 4 分钟 ≈ 480 分钟/月，公共仓库免费额度不限，私有仓库 2000 分钟额度也够。

`scripts/refresh.ts` 流程：

1. 读 `data/providers.json`，对每个 provider 的 `source_url` 列表抓取。
2. 用 per-provider adapter 抽取候选 promo（adapter 放 `scripts/sources/<provider-id>.ts`，抓不到就跳过，不猜）。
3. 归一化 + 指纹去重，与 `build/catalog.json` 比对。
4. 按 ADR-003 的合并规则决定：忽略 / 更新可观测字段 / 进待复核队列。
5. 写 `data/inbox/<date>.json`，开 PR，PR 描述里附待复核队列的 Markdown 摘要。
6. 自动合并条件：**只改了可观测字段** 且 **没有待复核条目**。否则打 `needs-review` 标签等人。

`scripts/verify.ts` 每周跑一次：HTTP 检查 `claim_url` 可达性，不可达则把 `verification.status` 置 `stale` 并进待复核队列。

### 6.5 promo Schema

已落盘：`schemas/promo.schema.json`（JSON Schema Draft 2020-12）。核心字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | slug（>=3 段） | 稳定主键，发布后不变 |
| `provider` | object | `id` / `name_en`（必有）/ `name_zh`（可空）/ `country`（ISO 3166-1 alpha-2）/ `homepage` |
| `offer` | object | `type` / `headline` / `amount` / `expires_at` / `no_fixed_expiry` / `claim_url` / `claim_steps` / `estimated_setup_minutes` |
| `terms` | array | 归类条款，每项 `{tag, severity, note}`。tag 取自 23 项受控词表 |
| `difficulty` | enum | `easy` / `medium` / `hard` |
| `region` | object | `{availability: global\|include\|exclude, countries[], notes}` |
| `categories` | enum[] | `llm` `embedding` `image` `video` `audio` `agent_hosting` `vector_db` `gpu_compute` `other` |
| `status` | enum | `active` `expiring` `expired` `unverified` `withdrawn` `rumored` |
| `verification` | object | `{status, method, confidence, last_verified_at, verified_by}` |
| `disclosure` | object | **deprecated** — 保留 nullable 以备未来 premium 形态；MVP 不消费 |
| `provenance` | object | `{source, source_url, first_seen_at, last_seen_at, curation_review, review_required}` |
| `actionability` | object | `{score, blockers[], next_steps[]}` |
| `created_at` / `updated_at` / `deleted_at` | date-time | 软删除用 `deleted_at` |

### 6.6 条款受控词表（23 项）

词表与 `docs/UIUX.md` §13.2 的表格**逐项一致**（Schema 是真源，UIUX 提供中文标签与图标映射）。

> 勘误：`docs/UIUX.md` §13.2 正文写"22 项受控枚举"，但其表格实际列出 23 行。以本 schema 的 23 项为准，UIUX 的正文计数需要改成 23。

`no_credit_card` `credit_card_required` `phone_verification` `identity_verification` `new_users_only` `one_per_account` `auto_renew` `quota_capped` `time_limited` `region_locked` `vpn_required` `edu_email_required` `business_email_required` `oss_project_required` `byok_required` `rate_limited` `non_commercial_only` `data_used_for_training` `deposit_required` `waitlist_approval` `manual_application` `stackable` `deprecated_service`

每项带 `severity`：`blocker`（不满足就完全拿不到）/ `friction`（增加成本或时间）/ `note`（需知情但不影响领取）。

**新增 tag 必须先改 schema 再改代码**，`additionalProperties: false` 会让未登记的 tag 直接校验失败。这是刻意的：防止实现过程中就地发明分类。

### 6.7 难度判定口径

| 等级 | 判定标准 | 典型 term |
|---|---|---|
| `easy` | 注册/登录即用，无需信用卡、无需审批，分钟级完成 | `no_credit_card` |
| `medium` | 需信用卡、实名或等待审批，小时内可完成 | `credit_card_required` `phone_verification` |
| `hard` | 需申请、审批、教育/企业资质或技术配置，天级或不确定 | `edu_email_required` `manual_application` `waitlist_approval` |

`difficulty_reasons` 必填且每条是一句事实。禁止"较复杂""需要一定技术基础"这类空话。

---

## 7. MCP 原语设计

### 7.1 设计原则

1. **返回值双通道**：每个 tool 同时给 `structuredContent`（给 Agent 消费）和 `content[].text` 的 human summary（给人读）。用 SDK 的 `outputSchema` 声明输出结构。
2. **必带下一步**。`human_summary` 里必须有一条"你现在该做什么"，不能只给数据。
3. **不许编造**。查不到就返回空结果 + 一句"未收录"，不要让 Agent 自己从模型记忆里补 promo。
4. **商业化层接 Apify/WorkBuddy 平台（见 §9.7）。** MCP 不消费 `disclosure` 字段，前端与清单页亦不消费 —— 该字段 deprecated。

### 7.2 Tools（8 个）

所有 tool 用 zod 声明入参，SDK 1.30.1 的 `registerTool(name, {description, inputSchema, outputSchema, annotations}, handler)`。只读 tool 标注 `annotations: { readOnlyHint: true, openWorldHint: false }`。

---

#### T1 `search_promos`

语义/关键词检索 + 条件过滤，结果按相关度排序。

入参：

```ts
{
  query?: string,                    // 自然语言或关键词，例如 "国内能用的免费 embedding 额度"
  provider_id?: string,
  region?: string,                   // ISO 3166-1 alpha-2
  difficulty?: 'easy' | 'medium' | 'hard',
  offer_type?: OfferType,
  categories?: Category[],
  term_tags_include?: TermTag[],     // 必须含这些条款特征
  term_tags_exclude?: TermTag[],     // 必须不含，例如排除 credit_card_required
  only_verified?: boolean,           // 默认 true
  limit?: number,                    // 1-50，默认 10
  cursor?: string
}
```

返回 `structuredContent`：

```ts
{
  items: PromoSummary[],
  total: number,
  next_cursor?: string,
  applied_filters: object,           // 回显实际生效的过滤条件
  human_summary: string
}
```

`PromoSummary`：`{id, provider:{id,name,country}, offer:{type,headline,amount}, difficulty, region_summary, days_to_expiry|null, verification:{status,confidence}, next_step}`

---

#### T2 `filter_promos`

纯结构化过滤，无 query，确定性排序。与 `search_promos` 的区别：不给相关度打分，结果顺序完全由 `sort` 决定，适合"把某类全部列出来"。

入参：`{provider_id?, region?, difficulty?, offer_type?, categories?, status?, sort: 'expiry_asc'|'updated_desc'|'score_desc'|'difficulty_asc', limit?, cursor?}`

至少传一个过滤条件，否则返回 400 级工具错误并提示改用 `search_promos`。

---

#### T3 `get_promo`

入参：`{id: string}`。返回完整 promo 对象，含 `claim_steps` 全量、`terms[]` 全量、`disclosure`、`provenance`。

找不到时返回 `found: false` 且 `human_summary` 写明"未收录该 promo"，并附 `suggest: [相似 id]`。

---

#### T4 `list_providers`

入参：`{region?, has_active_promos?: boolean}`。返回 `[{provider_id, name, country, active_promo_count, easy_count, last_updated}]`。

---

#### T5 `get_recent_updates`

入参：`{since_days?: number (默认 7), change_types?: ('added'|'updated'|'expired'|'withdrawn')[], limit?}`

返回 `[{id, change_type, changed_at, what_changed: string, promo: PromoSummary}]`。`what_changed` 是一句人话，例如"额度从 5 美元调整为 10 美元"。

---

#### T6 `get_expiring_soon`

入参：`{within_days?: number (默认 14), region?, difficulty?}`。按 `days_to_expiry` 升序返回，每条必带 `days_left`。

---

#### T7 `what_can_i_get`

这是"我能怎么薅"的入口，也是面向非技术用户的主工具。

入参：

```ts
{
  region: string,                    // 必填，ISO 3166-1 alpha-2
  has_credit_card?: boolean,
  has_phone_verification?: boolean,  // 能否接码/实名
  willing_effort?: 'easy'|'medium'|'hard',   // 默认 easy
  purpose?: Category,
  limit?: number                     // 默认 5
}
```

返回：

```ts
{
  eligible: PromoSummary[],          // 现在就能拿
  blocked_by: [{promo_id, headline, blocker: string, how_to_unblock: string}],
  human_summary: string,
  next_steps: string[]
}
```

判定逻辑：把入参映射成 term 约束（`has_credit_card=false` -> `term_tags_exclude: ['credit_card_required','deposit_required']`），再叠加 `difficulty <= willing_effort` 与区域匹配。被 blocker 挡掉的进 `blocked_by`，并给出消除门槛的具体办法。

---

#### T8 `report_promo_issue`

入参：`{promo_id, issue: 'expired'|'link_broken'|'terms_wrong'|'amount_wrong'|'region_wrong'|'other', note?}`

返回 `{accepted: boolean, ticket_ref: string}`。写入 Apify KVS 的 `reports` 记录队列，供下次 refresh 消费。标注 `annotations: {readOnlyHint: false}`。

---

### 7.3 Resources（4 个）

| URI | MIME | 内容 |
|---|---|---|
| `catalog://snapshot` | `application/json` | 当前 catalog 全量快照，含 `checksum` 与 `generated_at` |
| `catalog://daily/{date}` | `text/markdown` | 指定日期的每日清单 Markdown；`{date}` 缺省为今天 |
| `schema://promo` | `application/json` | promo.schema.json 原文 |
| `providers://index` | `text/markdown` | provider 清单 + 各自在库 promo 数 |

`catalog://daily/{date}` 用 `ResourceTemplate` 注册。未生成的日期返回"该日期无清单"而不是空字符串。

### 7.4 Prompts（3 个）

| 名称 | 入参 | 用途 |
|---|---|---|
| `daily-deal-brief` | `date?`, `region?`, `max_items?` | 每日羊毛简报。编排顺序：`get_recent_updates` -> `get_expiring_soon` -> `what_can_i_get`，输出按"新增 / 即将到期 / 现在能薅"三段组织 |
| `pick-for-me` | `region`, `has_credit_card?`, `purpose?`, `willing_effort?` | 帮我挑适合我的免费额度。走 `what_can_i_get`，输出强调难度与门槛，不按额度大小排 |
| `explain-terms` | `promo_id` | 条款解读。把 `terms[]` 的受控 tag 翻成人话，指出哪条是 blocker，并说明不满足会怎样 |

---

## 8. Skill 形态与边界

Skill 与 MCP 的关系是**编排层与数据层**的关系，边界必须清楚，否则两边都会长出对方的职责。

| 职责 | Skill | MCP |
|---|---|---|
| 数据事实 | 不持有 | 唯一真源 |
| 检索与过滤算法 | 不实现 | 实现 |
| 何时触发（每日简报） | 负责 | 不负责 |
| 自然语言 -> tool 参数映射 | 负责 | 不负责 |
| 多 tool 组合编排 | 负责 | 不负责 |
| 输出排版（三段式简报） | 负责 | 只给 human_summary |
| ~~联盟披露文案模板~~ | **已下线** | 该模板随 §9.7 撤销同步下线 |
| Schema 与校验 | 不负责 | 负责 |

### Skill 文件

`skills/free-and-cheap-tokens/SKILL.md`，安装位置 `C:/Users/pansh/.workbuddy/skills/free-and-cheap-tokens/SKILL.md`。

### Skill 的三条硬规则

1. **禁止凭模型记忆编造 promo。** 所有事实必须来自 MCP tool 返回。tool 返回空就回答"未收录"，不允许补一条"我记得 XX 也有"。
2. **付费能力差异化不可绕过鉴权。** Skill 模板内若涉及付费能力（confidence 数字、提前到期告警），位置由模板固化，不由模型临场决定要不要呈现。
3. **每日简报只调一次会话。** 一次简报内把 `get_recent_updates` / `get_expiring_soon` / `what_can_i_get` 连续调完再输出，避免跨冷启动把一次简报拉成几十秒。

### MCP 客户端配置

```json
{
  "mcpServers": {
    "free-and-cheap-tokens": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://<task-hostname>.apify.actor/mcp",
               "--header", "Authorization: Bearer ${APIFY_TOKEN}"]
    }
  }
}
```

能直接配自定义头的客户端可以省掉 `mcp-remote` 桥接。

---

## 9. 每日清单页（零依赖）

### 9.1 交付形态

`site/` 下全是纯 HTML/CSS/JS，**运行时零外部依赖**：不引 React/Vue，不引 CDN，不引外部字体，不引图标库，**不发任何网络请求**（OG 图片除外，那是平台抓取的）。

由 `scripts/build-site.ts` 从 `build/catalog.json` 生成 `site/index.html` 与 `site/daily/<YYYY-MM-DD>.html`，托管在 GitHub Pages。

**数据注入方式是构建期内联，不是运行时请求。** 这一点容易被误解，写死在这里：页面需要的数据由构建脚本投影成 `DailyItem` 形状后直接写进 HTML（内联 JSON + 服务端渲染好的 DOM）。页面运行时既不 fetch `/api/v1/daily`（会违反零依赖约束），也拿不到 Apify Bearer token（公开静态页不得持有平台凭据）。`/api/v1/daily` 只为外部程序化消费者存在。

### 9.2 图标方案锁定（P0 规则）

**锁定：自建 inline SVG 图标集**。不引入 Lucide / Heroicons / Font Awesome / Iconify 等任何外部图标包，也不引任何图标 CDN。

理由：项目已确立"零外部依赖"约束。图标走外部包或 CDN 直接违反该约束；走 npm 包再内联则引入构建期依赖和一套需要持续同步的第三方命名体系。本产品只需要约 30 个图形，自建成本低于维护这套同步。

**图标清单以 `docs/UIUX.md` 第 9 节为准（33 项，含 1 个组件级图形 `difficulty-meter`），架构侧不再另立清单。** 规格与实现约定：

| 项 | 锁定值 |
|---|---|
| 网格 | `viewBox="0 0 24 24"` |
| 描边 | `fill="none"` / `stroke="currentColor"` / `stroke-width="1.5"` / `stroke-linecap="round"` / `stroke-linejoin="round"` |
| 命名 | 语义名，无前缀（`search` / `clock` / `coin-stack` …） |
| symbol id | 统一前缀 **`#i-`**，例如 `<use href="#i-clock">` |
| 尺寸档位 | 16 / 20 / 24px 三档，按 UIUX §9 的规定取用 |
| 注入方式 | 构建期以 `<symbol>` 内联进 HTML `<body>` 顶部一个隐藏 `<svg>`，页面用 `<use href="#i-xxx">` 引用。**不产生任何额外 HTTP 请求**，禁止用 CSS `background-image` 引外部文件 |
| 真源文件 | `design/UIUX.md` 第 9 节的常量表；`scripts/build-site.ts` 生成 `site/icons.ts`，**不在 `site/` 里手写图标** |

**禁止用 emoji 作为功能图标**，任何位置都不行——按钮、标签、列表项前缀、空状态、分区标题都不行。

**已知冲突（需设计师确认）**：`docs/UIUX.md` 第 249 行用 `[↑]` 作迷你趋势标记、第 320 行用 `↗` 作外链指示。这两个位置应改用已锁定的 inline SVG（`arrow-up` 归入图标集 / `external-link`），否则在部分平台会回退成彩色 emoji 字形，违反 P0。已通过消息同步给设计师。

### 9.3 颜色与动效（P0 规则）

- **唯一颜色真源是 `design/design-tokens.css`（设计师颜好看产出）**，`scripts/build-site.ts` 在构建期把它复制为 `site/tokens.css`。架构侧不另立 token 命名。
- 全部颜色走 CSS 自定义属性：`--bg` `--surface` `--surface-sunken` `--fg` `--fg-2` `--muted` `--meta` `--border` `--border-soft` `--border-strong` `--accent` `--accent-hover` `--accent-active` `--accent-on` `--success` `--warn` `--danger` `--info`。
- **禁止在组件 CSS 里写裸 hex**，唯一例外 `#fff` 与 `#000`。这条由 `scripts/build-site.ts` 的构建后扫描强制：组件样式表里出现非例外的 hex 即构建红。
- **禁止紫色到粉色渐变**作为主视觉。主色用单一实色 accent，不用渐变。
- **禁止弹跳缓动**，不使用 `cubic-bezier(0.68, -0.55, 0.265, 1.55)` 或任何带 overshoot 的曲线。过渡统一用 `ease-out` 或 `cubic-bezier(0.2, 0, 0, 1)`，时长 120-240ms。
- 尊重 `prefers-reduced-motion`，命中时关闭过渡。

### 9.4 文案（P0 规则）

禁止空洞占位文案。清单页每条目必须实到：提供方名、给了什么（带数字）、难度、区域、剩余天数、一条具体下一步。不出现"超值福利""限时特惠""不容错过"。

空状态文案要具体，例如"今天没有新增额度，最近一次更新是 9 月 27 日"，而不是"暂无数据"。

### 9.5 分享卡片

- `og:title` / `og:description` / `og:image` / `twitter:card=summary_large_image` 必备。
- OG 图片：`scripts/render-og.ts` 在 **GitHub Actions 里**用 `sharp@0.35.5` 把 SVG 转 PNG，产出 `site/og/<YYYY-MM-DD>.png`。`sharp` 是 devDependency，**不进容器、不进站点、不影响零依赖约束**。
- 首日未接入该步骤时，`og:image` 指向一张通用静态图，不留空。

### 9.6 显示名规则（项目硬约束）

中企用中文名，非中企用英文名。规则编码在 schema 与渲染器两处，口径一致：

```
provider.country === 'CN' && provider.name_zh != null  ->  显示 name_zh
否则                                                    ->  显示 name_en
```

`name_en` 必填且永远存在，用于去重与检索，不因显示语言切换而消失。

### 9.7 联盟披露（强制）
### 9.7 商业化层：Apify 付费 Actor + WorkBuddy 付费 Skill

> **2026-09-28 重写**：原 §9.7「联盟披露（强制）」整体撤销。变现路线改为 **OSS + Hosted Convenience**，详见 `docs/PRD.md` §8。

**两个独立付费渠道**：

| 渠道 | 鉴权 | 计费 | 开发者结算 |
|---|---|---|---|
| **Apify 付费 Actor** | Apify Store 购买 → 自动获 API token | Apify 平台 Stripe | Stripe Connect → PayPal / US Bank |
| **WorkBuddy 付费 Skill** | WorkBuddy 技能市场订阅 | 腾讯内建微信支付 | 直接到开发者账户 |

**架构原则**：
1. 鉴权与配额由**平台层**完成，本服务不实现用户系统、不存 token、不做支付 —— **O7 用户账号体系仍成立**（平台账本不算我们的账本）
2. 免费版与付费版读**同一份 `build/catalog.json`** —— 数据零差异，只差配额与附加项
3. 付费差异化能力：单次可返回全量（突破 10 条上限）、不限频次、暴露 `verification.confidence`、提前 30 天到期告警、新发现提前 24h

**实现位置**：
- `src/auth/apify.ts` — 读 Apify 用户 token / 解析配额（**最小实现**，重逻辑在 Apify SDK）
- `src/auth/workbuddy.ts` — 读 WorkBuddy Skill 订阅态（**最小实现**，重逻辑在腾讯 SDK）
- `src/transport/rate-limit.ts` — IP 维度限速（免费版默认），Apify token 维度无上限
- `src/mcp/tools.ts` — 工具返回前检查付费态，按 D10 决定返回字段

**Schema 影响**：`disclosure` 字段 deprecated（保留 nullable）。**前端 / MCP / Skill 不消费此字段**。

## 10. 非 MCP HTTP 端点

MCP 走 `/mcp`，以下端点是给运维与 Apify Console 用的。完整 OpenAPI 3.0 定义在 `docs/openapi.yaml`，并在 `.actor/actor.json` 的 `webServerSchema` 中引用，这样 Apify Console 的 Endpoints 标签页能直接渲染并试调。

| Method | Path | 用途 |
|---|---|---|
| GET | `/` | 就绪探针（带 `x-apify-container-server-readiness-probe` 头时立即 200）；普通访问返回服务说明 |
| GET | `/healthz` | 自检：`catalog_source`(`baked_in`\|`kvs`)、`catalog_checksum`、`promo_count`、`uptime_sec` |
| GET | `/api/v1/daily` | 当日清单 JSON（`?date=YYYY-MM-DD` 可取历史） |
| GET | `/api/v1/schema` | 返回 promo.schema.json |
| GET | `/api/v1/stats` | `promo_count` / `provider_count` / `by_difficulty` / `by_region` |

统一响应格式：`{ "code": 0, "data": {}, "message": "" }`，`code` 非 0 为错误。分页用 `{items, total, page, limit, hasMore}`。

### 10.1 两层契约与绑定规则（避免前端绑错层）

项目存在**两份契约，管的是两层**，必须分清：

| 契约 | 层 | 形状 | 谁消费 |
|---|---|---|---|
| `schemas/promo.schema.json` | 存储 / 规范层 | 深嵌套（`offer.*` / `actionability.*` / `verification.*`） | 策展库、构建期、MCP `get_promo` 全量返回 |
| `docs/openapi.yaml` 的 `DailyItem` | 页面渲染层 | 扁平投影 | 每日清单页（构建期内联）、`/api/v1/daily` 的外部消费者 |

**绑定规则（硬约束）：**

1. **每日清单页绑 `DailyItem`，不绑 `promo.schema.json`。** 前端不允许写 `offer.headline` 这类页面层不存在的路径。
2. **清单页的数据来自构建期内联，不是运行时 HTTP 请求。** `scripts/build-site.ts` 从 `build/catalog.json` 投影出 `DailyItem` 形状并直接内联进 HTML。页面运行时**不发起任何网络请求**（零依赖约束），也**无法携带 Apify Bearer token**（公开静态页不能持有平台凭据）。`/api/v1/daily` 是给外部程序化消费者的便利接口，**不是页面的数据源**——把页面接成运行时 fetch 会同时违反这两条。
3. **`DailyItem` 的字段以 `docs/openapi.yaml` 为准**，两个文件不一致时以 openapi 为准并在本文档登记变更。
4. **软删除条目不得出现在任何对外输出。** `deleted_at` 非 null 的 promo 在 `build-catalog` 阶段就投影出去，MCP 各 tool 与 `/api/v1/daily` 都不做墓碑数据的二次过滤——过滤只在一处做（构建期），避免"某处忘了过滤"。

### 10.2 `DailyItem` 字段集（页面渲染层）

`id` `provider{id,name,country,homepage,logo_asset}` `type` `categories[]` `models[]` `headline` `amount{value,currency,unit,raw_text}` `difficulty` `difficulty_reasons[]` `estimated_setup_minutes` `region_summary` `region{availability,countries,notes}` `days_to_expiry` `verification_status` `last_verified_at` `terms[{tag,severity,note}]` `disclosure{deprecated, 不消费}` `curator_note` `claim_url` `next_step` `next_steps[]`

三条使用约束：

- **区域筛选必须用 `region` 对象，禁止用 `region_summary` 做子串匹配。** `availability: exclude` 时 `region_summary` 形如「除 US 外可用」，含 "US" 但美国不可用，子串匹配必然误判。匹配逻辑已在 `src/domain/region-match.ts` 实现，页面层照抄同一套判定。
- **`next_steps[]` 是多步引导，`next_step` 是它的首元素。** 不变式 `next_step === next_steps[0]`，两者由同一构建函数产出，不允许各自生成。单行展示用 `next_step`，多步面板用 `next_steps[]`。
- **不向页面层暴露 `confidence`。** confidence 是策展侧内部排序信号（0-1），对终端用户没有语义，暴露只会诱导 UI 显示一个无法解释的数字。排序在服务端做，页面只拿结果顺序。

---

## 11. 已知坑（内嵌约束，实现时逐条遵守）

1. **`Actor.main()` 会让常驻 server 立即退出。** 只能用 `Actor.init()`，且不要 `Actor.exit()`。
2. **端口必须读 `ACTOR_WEB_SERVER_PORT`**（SDK 里是 `Actor.config.get('containerPort')`）。硬编码端口 = 部署后不可达。
3. **就绪探针必须处理。** 否则 run 永远不 ready。
4. **平台启动后不探活。** 不可恢复错误 `process.exit()`，不要 try/catch 吞掉后继续跑。
5. **Actor 级 hostname 锁死默认配置（1024 MB / 300 s）。** 必须建 Task 改配置，否则成本翻数倍。
6. **每个请求都要 Bearer token。** 客户端不支持自定义头时走 `mcp-remote` 桥接。
7. **SDK 1.30.1 里 `enableDnsRebindingProtection` / `allowedHosts` / `allowedOrigins` 已标 `@deprecated`**，注释要求改用外部中间件。不要依赖它们，自己在 Express 层实现 Origin/Host 校验。
8. **SDK 声明的最新协议版本是 `2025-11-25`**，不是 `2026-07-28`。不要声称支持后者。
9. **Standby 是 Beta。** 接口与计费可能变，关键路径要有降级方案（第 2.3 节）。
10. **`minLength` 按字符计数**，中文短句容易误伤。schema 里 human 文本字段的 minLength 已按中文长度调低（4-6），不要调回去。
11. **容器间不共享内存。** 任何"写进内存等下次请求"的设计都是错的，报告类数据必须落 KVS。
12. **standby run 之间不共享数据**，且平台明确要求"不要只把数据放在 run 内存里"。catalog 有镜像内置兜底正是为此。

---

## 12. 成本估算

### 12.1 计价基准（Apify 官网 pricing 页，2026-09-28）

- 1 CU = **1 GB RAM 运行 1 小时**
- Free 计划：$0/月，含 **$5 预付用量**，超出后 **$0.2 / CU**
- Starter：$19/月，含 $19 用量，$0.2 / CU
- Scale：$199/月，$0.16 / CU
- KVS 存储：1,000 GB-hours = $1.00；1,000 次读 = $0.005

### 12.2 场景测算（月度，30 天）

| 场景 | 内存 | 常驻时长 | CU/月 | Free 计划实付 |
|---|---|---|---|---|
| **S1 推荐**：Task 配 256 MB + idle 300 s，日均 30 次调用、每次存活约 6 分钟 | 256 MB | 约 3 h/天 | **22.5** | **约 $4.50**（$5 额度内） |
| S2：Task 配 256 MB + idle 300 s，日均 80 次调用 | 256 MB | 约 8 h/天 | 60 | 约 $12（超预付 $7） |
| S3：256 MB 常驻 24/7 | 256 MB | 720 h | 180 | 约 $36 |
| S4：512 MB 常驻 24/7 | 512 MB | 720 h | 360 | 约 $72 |
| **S5 反面教材**：用 Actor 级 hostname（默认 1024 MB）常驻 24/7 | 1024 MB | 720 h | **720** | **约 $144** |

### 12.3 其他项

| 项 | 月成本 | 说明 |
|---|---|---|
| 刷新任务（GitHub Actions，公共仓库） | $0 | 公共仓库分钟数不限；每天约 3-5 分钟 |
| 静态页托管（GitHub Pages） | $0 | 公共仓库免费 |
| Apify KVS 存储 | < $0.01 | catalog 约 0.5 MB，存储与读写可忽略 |
| 数据出网 | < $0.10 | 每次响应几 KB |
| 域名（可选） | 约 $1.2/月 | 年费 $10-15；不买则用 GitHub Pages 默认域名 |

### 12.4 MVP 月度总额

**推荐配置 S1：约 $4.5/月，Free 计划的 $5 预付额度即可覆盖，实付 $0。**

缓冲建议：把 Task 的 `maxMemoryMbytes` 设为 512 作为上限，日常跑 256；把 `idleTimeoutSecs` 设为 300（低于此值冷启动频率上升，Agent 体验明显变差；高于此值常驻成本线性上升）。

### 12.5 开发成本

按 `cost-models/development-costs.md` 的 AI 辅助交付提速参考（2-3x）：

| 模块 | 人日（AI 辅助） |
|---|---|
| Schema + 策展库 + 校验门 | 1.5 |
| MCP server（8 tools + 4 resources + 3 prompts） | 3.5 |
| 刷新任务 + 3 个 adapter | 2.5 |
| 每日清单页 + 图标集 + OG 卡 | 2.5 |
| Skill + 端到端验证 | 1.5 |
| **合计** | **约 11.5 人日（约 2.3 人周）** |

隐性成本已在 12.3 列出，无服务器与 AI API 费用。

---

## 13. 风险与不可行警告

| ID | 风险 | 等级 | 处置 |
|---|---|---|---|
| **R1** | **Apify Standby 仍是 Beta**，"Actor uses Standby mode Beta"。接口与计费可能在 MVP 周期内变 | 高 | 关键路径保留降级路径 P1/P2（第 2.3 节）；MCP 层与数据层不绑定平台 |
| **R2** | **默认 1024 MB 常驻 = 约 $144/月**，是预算的 30 倍 | 高 | 必须建 Task 改配置；CI 里加一条检查，确认部署用的是 Task hostname 而非 Actor hostname |
| **R3** | **MCP 客户端不一定支持自定义请求头**，而 Apify 每请求都要 Bearer token | 中高 | 主推 `mcp-remote` 本地桥接；README 明确列出已验证客户端清单 |
| **R4** | **冷启动**。idle 到期后下一次调用要等新 run 起来（文档称"几秒钟"） | 中 | Skill 的每日简报合并成一次会话；清单页走静态产物不经 MCP |
| **R5** | **协议版本落差**：SDK 1.30.1 最新支持 `2025-11-25`，规范站最新为 `2026-07-28` | 中 | 对外只声明 `2025-11-25`；等 SDK 跟进再升，不在 MVP 期自行实现新版本语义 |
| **R6** | **刷新抓取的稳定性**。官网改版会让 adapter 静默失效，表现为"数据不更新"而非报错 | 中 | 每个 adapter 输出 `matched_selector_count`，为 0 时把该 provider 标记 `adapter_broken` 并在 PR 里高亮；不静默跳过 || **R10** | **MVP 期不建议做**：自动注册、自动领取、代客薅额度 | — | 明确不做，见第 15 节。这类自动化触碰服务条款与风控，且把产品从"信息"变成"代理操作"，风险与责任完全不可比 |

### 明确的不可行警告

1. **不要尝试在 Standby 上持有 SSE 长流或有状态会话。** 平台会扩缩容与回收容器，这类设计必然随机掉线（ADR-002）。
2. **不要把刷新任务也放 Standby。** 刷新是分钟级的批处理，放常驻容器等于按常驻计费做批活，成本错配。刷新走 GitHub Actions，成本为零。
3. **不要让 MCP 在请求路径上抓网页。** 5 分钟的首响应超时看似宽裕，但抓取叠加冷启动会把 Agent 的关键路径拉到几十秒，且抓取失败会让整个 tool 调用失败。数据一律走编译好的 catalog。
4. **MVP 不做用户系统、不做付费墙、不做多租户。** Pay-per-event 变现留到 Phase 2，MVP 期 `pay_per_event.json` 保持空数组。

---

## 14. 端到端验证步骤

收尾必须跑通这一条，覆盖核心成功流 + 一条关键错误流。

```bash
# 0. 前置
node -v                      # 必须是 v24.21.0
npm ci

# 1. 静态门禁（拦幻觉依赖与静默缺失）
npm run lint                 # eslint 10.11.0，含 no-restricted-imports 分层检查
npm run typecheck            # tsc 5.9.3 --noEmit
npm run validate             # ajv 校验 data/promos/ 与 build/catalog.json

# 2. 构建
npm run build:catalog        # 产出 build/catalog.json，打印 checksum
npm run build:site           # 产出 site/index.html 与 site/daily/<today>.html

# 3. 本地起 MCP（模拟 Standby 环境）
APIFY_META_ORIGIN=STANDBY ACTOR_WEB_SERVER_PORT=8080 npm run dev

# 4. 核心成功流：用 MCP inspector 连 http://127.0.0.1:8080/mcp
npx @modelcontextprotocol/inspector http://127.0.0.1:8080/mcp
#   依次验证：
#   tools/list            -> 8 个 tool 全部列出，annotations 正确
#   search_promos{query:"免费额度", region:"CN"}   -> 有结果，human_summary 非空，带 next_step
#   what_can_i_get{region:"CN", has_credit_card:false, willing_effort:"easy"} -> eligible 非空
#   get_promo{id:"<上一步返回的 id>"}              -> 全字段，含 claim_steps 与 disclosure
#   resources/read catalog://snapshot              -> JSON，含 checksum
#   prompts/get daily-deal-brief                   -> 三段式消息
#   断言：响应头不含 MCP-Session-Id（证明是 stateless 模式）

# 5. 关键错误流
#   a) get_promo{id:"does-not-exist-xyz"}  -> found:false + 未收录提示 + suggest 数组
#   b) filter_promos{} 无任何过滤条件       -> 工具错误，提示改用 search_promos
#   c) 伪造 Origin: https://evil.example    -> HTTP 403（DNS rebinding 防护生效）
#   d) 停掉 KVS 模拟（设 KVS_DISABLED=1）   -> /healthz 仍 200，catalog_source: "baked_in"

# 6. 探针与生命周期
curl -sI -H 'x-apify-container-server-readiness-probe: 1' http://127.0.0.1:8080/  # 期望 200
curl -s  http://127.0.0.1:8080/healthz                                            # 期望 code:0

# 7. 部署后（Apify Task）
apify push
curl -s -H "Authorization: Bearer $APIFY_TOKEN" \
     https://<task-hostname>.apify.actor/healthz     # 期望 200 且 catalog_source 非 unknown
# 再用 inspector 连 https://<task-hostname>.apify.actor/mcp 复跑第 4 步

# 8. 站点零依赖核验（阻断项）
#    断网后打开 site/index.html：页面完整渲染，控制台零失败请求
grep -c 'src="http' site/index.html          # 期望 0
grep -c 'cdn\.' site/index.html              # 期望 0
grep -cP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' site/index.html   # 期望 0（无 emoji）
```

**完成定义**：以上 8 步全绿 + `npm run lint && typecheck && validate` 零告警 + 第 8 步的三个 grep 计数均为 0。

---

## 15. 本次不做（out-of-scope）

明确列出，杜绝镀金与范围蔓延：

1. 自动注册、自动领取、代客薅额度（R10）。
2. 用户系统、登录、付费墙、多租户。
3. Pay-per-event 变现（Phase 2，`pay_per_event.json` 保持空数组）。
4. 向量检索 / 语义 embedding。MVP 用关键词 + 受控词表匹配即可，数据量在千条以内，不需要向量库。
5. 实时推送、Webhook、邮件订阅。
6. 移动端 App 或小程序。
7. 多语言站点（MVP 只做中文界面；provider 名称的中英文规则已覆盖显示需求，但界面文案不做 i18n）。
8. 评论、评分、社区投稿的公开入口（`report_promo_issue` 只做单向反馈，不做互动）。
9. 历史价格/额度曲线。
10. 除 Apify 之外的第二个部署目标（降级路径只是预案，不在 MVP 内实现）。

---

## 16. 活规格维护

- 实现中发现本文档与现实冲突（接口变了、平台限制变了、新坑），**先改本文档再改代码**，不允许文档与实现失同步。
- 关键决策与理由保留在 `docs/decisions/ADR-001..003`，不就地推翻。
- 被证伪的约束显式修正并注明日期，不放任过时条目误导后续。
