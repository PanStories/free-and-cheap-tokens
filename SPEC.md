# Spec — Free and Cheap Tokens v1.1.0

> [🇬🇧 English version →](SPEC.en.md) · 生成日期：2026-09-28
> 基于：PRD v3 + ARCHITECTURE v3 + UIUX v3 + promo.schema.json v1
> 状态：**已确认 / 已锁定**（用户 v3 变现路线裁决 + v1.1.0 PPE 切换已落地）
> 范本仓库：`<github-user>/<github-repo>`

---

## 1. 产品定义

- **一句话描述**：让 AI Agent 和非技术用户检索全球 AI 模型/推理服务的**免费额度与低价 token 促销**（promo），每条结构化记录提供方、归类后的条款、上手难度、适用区域、到期时间与「如何吃下这个羊毛」的步骤。
- **目标用户**：①非技术订阅者（very basic technical skills）②独立开发者 / 羊毛党 ③AI Agent（机器消费方）④推荐者（传播侧）
- **核心问题**：现有聚合源要么过期无标识、要么给一段 Markdown 没有结构化字段、要么没有上手难度区分、要么没有区域标注、要么不能被 Agent 程序化消费。

---

## 2. MVP 范围（锁定 —— 不在此列表的功能一律不做）

| 优先级 | 功能 | 验收标准摘要 | RICE |
|--------|------|-------------|------|
| **P0** | promo 数据模型 + JSON Schema 校验 | Draft 2020-12，draft-07 兼容；非法样本 12 类全部正确拒绝；条件断言（`affiliate` 嵌套、`expires_at` 互斥等）落地 | 6.00 |
| **P0** | MCP server（8 tools / 4 resources / 3 prompts） | 通过 `@modelcontextprotocol/sdk@1.30.1` 注册；Streamable HTTP + stateless；每次响应含 `structuredContent` 与人类摘要 | 6.75 |
| **P0** | 难度分级 + Agent 降级路径（hard 必填 `agent_degraded_path`） | 三档枚举 + 三重视觉编码（形状/文字/颜色）；hard 条目缺降级路径 → Schema 拒绝 | 12.00 |
| **P0** | 区域披露（global / include / exclude 三态） | `region.availability` 枚举 + `countries[]` + `notes`；筛选器严格结构化匹配，不做字符串子串 | 7.00 |
| **P0** | 实时查询（语义 + 条件过滤 + actionability） | `search_promos` 支持语义 + 字段混合；`what_can_i_get` 给出 eligible/blocked_by/如何消除门槛 | 8.00 |
| **P0** | 到期追踪（7 天提前告警 / 永久免费 `no_fixed_expiry`） | `get_expiring_soon` 默认 14 天窗口；`expires_at` 与 `no_fixed_expiry` 互斥（Schema allOf 约束） | 5.33 |
| **P0** | 项目透明度声明（替代原联盟披露） | 站点条 / 卡片底部 / 分享卡片 / 复制文案 **四处一致**显示「开源·不接硬广·不挂联盟」五要点 | 8.00 |
| **P0** | F15 定时刷新（discovery feed 范围） | 6h GitHub Actions 跑；产出**全部**标 `unverified`，仅进 Skill 提示；不入清单页 | 4.27 |
| **P1** | Skill（每日简报 / 实时查询） | Skill manifest（WorkBuddy/Claude）每日 09:00 本地时区简报；接 MCP 原语 | 5.60 |
| **P1** | 每日清单页（静态站 + RSS + ICS） | 零依赖 HTML/CSS/JS；含分享卡片；RSS 含 active+expiring_soon；ICS 提前 7 天 VALARM | 3.60 |
| **P1** | 自传播机制（分享卡片 + agent_pitch + 一行安装命令） | 1200×630 OG；`agent_pitch ≤ 120 字`；`share_slug` 与日期戳用于追踪 | 5.60 |
| **P1** | 数据埋点（PromoCallStats） | 仅记录调用方、工具名、时间戳——不存 IP/UA | 5.00 |
| **P2** | OSS + Hosted Convenience 双轨付费 | Apify 付费 Actor（PPE，事件计费）+ WorkBuddy 付费 Skill（微信支付）；**基础成本 $0**（无 Standby） | — |

---

## 3. 明确不做（Out-of-Scope —— 锁定）

| 不做的功能 | 原因 | 何时考虑 |
|------------|------|----------|
| **O1** 代注册 / 代领 / 托管 API Key | AWS APN 禁止转售，厂商 ToS 禁止共享账号 | 永不（架构 O2） |
| **O2** 代理转发推理请求 / 转售 token | 薅穿了会反噬整个生态（C1 README 第一句明告） | 永不 |
| **O3** 自建公共共享 Key | 同 O2 | 永不 |
| **O4** 模型定价对比 / 性能基准 | promptibus 与 BenchLM 已做 | 不做（除非另有调研） |
| **O5** 多级分销 / 现金结算 / 推荐排行榜 | 传销风险 | 永不 |
| **O6** 付费订阅墙 / 会员制 | 变现路径 = Apify 付费 Actor + WorkBuddy 付费 Skill，平台层付费，**不挂用户** | 永不 |
| **O7** 用户账号体系 | 平台账本不算我们的账本；Apify/WorkBuddy 平台鉴权已够 | 永不 |
| **O8** 移动端原生 App | 零依赖静态页已覆盖 | 不做 |
| **O9** UGC 评论社区 | OOS 范围内 | v2.0 |
| **O10** 横向扩张成 AI 工具目录 | C2（羊茅）强项 | 永不（聚焦 promo） |
| **O11** 端点存活性探测 | C1（cheahjs/free-llm-api-resources）已做 | 永不（职责分离） |
| **O12** 邮箱订阅 | 破坏零后端约束 + ICP 备案 + 商业邮件合规 | 改 RSS + ICS 已替代 |

---

## 4. 技术架构（锁定 — 含版本锚定）

| 层 | 技术 | 实际版本 | 锁定原因 |
|----|------|----------|----------|
| 运行时 | Node.js | **24.21.0 LTS** | Apify Actor `apify/actor-node:24-slim` 镜像（PAY_PER_EVENT 模式） |
| 语言 | TypeScript | **5.9.3**（故意不用 7.0.2） | MVP 不引入未知类型检查行为差异 |
| MCP SDK | `@modelcontextprotocol/sdk` | **1.30.1** | StreamableHTTPServerTransport 当前 API 形态；声明 `2025-11-25` 协议版本 |
| Schema 校验 | `ajv` + `ajv-formats` | **8.20.0** / **3.0.1** | Draft 2020-12 官方推荐 |
| HTTP | `express` | **5.2.1** | 简单成熟；`streamableHttp` 路由易挂 |
| 数据校验 | `zod` | **4.6.5** | tool 入参 schema |
| Apify SDK | `apify` | **3.7.2** | `Actor.charge()` 事件计费配套 |
| CLI | `apify-cli` | **1.10.0** | 本地调试 / 部署 |
| Lint | `eslint` | **10.11.0** | — |
| Format | `prettier` | **3.9.9** | — |
| 测试 | `vitest` | **5.0.2** | 速度快，TypeScript 友好 |
| OG 图生成 | `sharp` | **0.35.5** | **devDependency**，仅 CI 生成；不进容器不进站点 |
| 部署 | Apify **Pay-Per-Event Actor** + `webServer` | **无 Standby → 基础成本 $0**；每次 MCP tool call = 1 个事件；空闲时容器不运行 | v1.1.0 用户裁决：从 Standby 切到 PPE（见 §13 D12） |
| 静态站 | 零依赖 HTML/CSS/JS | — | 用户偏好 + 隐私即合规 |
| 图标 | 自建 inline SVG（`#i-*` 24px 1.5px 描边） | — | 与「零依赖」收敛到同一答案 |
| 字体 | 系统字体回退链（Inter/JetBrains Mono **不引入**） | — | 不引 CDN |
| CI 刷新 | GitHub Actions | `cron: '0 */6 * * *'` | 公共仓库分钟数不限，成本 $0 |

---

## 5. API 端点清单（锁定 —— 开发时以此为唯一依据）

> MCP 原语（取代传统 HTTP API）：

### Tools（8）

| Tool | 入参 | 返回 |
|------|------|------|
| `search_promos` | `{ query?: string, region?: string[], difficulty?: enum[], requires_credit_card?: boolean, provider_id?: string, expires_within_days?: number, categories?: enum[], limit?: number, cursor?: string }` | `{ structuredContent: { results: PromoSummary[], total, cursor }, content: [{ type: 'text', text: 'human summary' }] }` |
| `filter_promos` | `{ region: string[], difficulty: enum[], requires_credit_card?: boolean, expires_within_days?: number, sort: enum, limit?: number }` | 与 `search_promos` 同 |
| `get_promo` | `{ id: string }` | `{ structuredContent: PromoFull, content: [...] }` |
| `list_providers` | `{ country?: string }` | `{ structuredContent: { providers: Provider[] } }` |
| `get_recent_updates` | `{ since: ISO8601, type?: enum }` | `{ structuredContent: { updates: UpdateEvent[] } }` |
| `get_expiring_soon` | `{ within_days: number, region?: string[] }` | 与 `search_promos` 同 |
| `what_can_i_get` | `{ region: string[], has_credit_card: boolean, willingness: enum, categories?: enum[] }` | `{ structuredContent: { eligible: Promo[], blocked_by: Array<{promo_id, blocking_terms[]}>, how_to_clear: Promo[] }, content: [...] }` |
| `report_promo_issue` | `{ promo_id: string, type: enum, description: string }` | `{ structuredContent: { ticket_url: string } }` |

### Resources（4）

| URI | MIME | 内容 |
|-----|------|------|
| `catalog://snapshot` | `application/json` | 全量 catalog 元数据（provider 数、promo 数、最后更新） |
| `catalog://daily/{date}` | `text/markdown` | 当日清单 Markdown（与清单页同源） |
| `schema://promo` | `application/schema+json` | 当前生效的 promo.schema.json |
| `providers://index` | `application/json` | 厂商索引（中英名、country、promo 数） |

### Prompts（3）

| Name | Args | 模板摘要 |
|------|------|----------|
| `daily-deal-brief` | `{ date?: string, region?: string }` | 抓取 `catalog://daily/{date}` → 让 Agent 用 200 字总结 |
| `pick-for-me` | `{ region, has_card, willingness }` | 调 `what_can_i_get` → 让 Agent 用「我会推荐 X，因为…」口吻输出 ≤ 3 条 |
| `explain-terms` | `{ promo_id }` | 调 `get_promo` → 让 Agent 用小白能懂的语言解释 `terms[]` 22 项受控词 |

> **本服务无传统 HTTP REST API**。所有调用经 MCP Streamable HTTP（`POST /mcp`）。运行时零调用代理：MCP server 部署为 Apify Pay-Per-Event Actor，每个 HTTP 请求触发一次 Actor run，按事件计费（详见 §4 部署行与 §13 D12）。公开静态清单页的 HTML / RSS / ICS 由 `scripts/build-site.mjs` 在构建期**内联进静态文件**，运行时零请求。

---

## 6. 数据库表清单（锁定）

> 本服务**不持有数据库**。策展库即 Git 仓库内的 JSON 文件，按目录组织：

| 目录 / 文件 | 内容 | 校验 |
|------------|------|------|
| `data/promos/*.json` | 每文件一个 promo（Draft 2020-12 合规样本） | `ajv` 严格校验 |
| `data/providers/*.json` | 每文件一个 provider | `ajv` |
| `data/changelog/*.md` | 每日变更日志 | 不校验 |
| `build/catalog.json` | 构建期从上面生成的**只读**聚合（带 sha256 checksum） | 一致性校验 |
| `.kv/catalog.json`（Apify KVS） | 与 `build/catalog.json` 同内容，启动拉一次，6h 比对 | checksum 比对 |

---

## 7. 页面清单（锁定）

> 本服务**唯一**可视化为零依赖静态清单页：

| 页面 | 路由（GitHub Pages） | 核心组件 | 数据来源 |
|------|---------------------|----------|----------|
| **每日清单页** | `/` | sticky 透明度条 → 页头（字标/更新时间/搜索/分享）→ stat cards ×4 → sticky 筛选 → 分区列表 → 页脚 | 构建期内联 `build/catalog.json` |
| **RSS feed** | `/feed.xml` | — | 同上，过滤 `status=active|expiring_soon` |
| **ICS calendar** | `/promos.ics` | — | 同上，过滤 `expires_at != null && expiry_type ∈ {fixed_date, rolling_window}` |
| **OG share card** | `/og.png` | 1200×630 PNG | `scripts/generate-og.mjs`（CI 期，sharp） |
| **项目透明度声明** | `/transparency`（锚点 + 页脚重复） | — | 与 §7 立场一致 |

---

## 8. 设计 Token（锁定）

> 详见 `design/design-tokens.json` + `design/design-tokens.css`。摘要：

- **主色**：Petrol `#0B6E8F`（深石油蓝，主动避开 Indigo/Purple）
- **背景**：`#F5F6F8`（冷调浅灰）；**前景**：`#15181D`（带冷调非纯黑）
- **语义色**：success `#177245` / warn `#9A5B00` / danger `#B42318`
- **字体**：系统回退链（`-apple-system / Segoe UI / PingFang SC / Noto Sans SC`），正文下限 14px，数字走 `tabular-nums`
- **图标库**：`#i-*` 自建 inline SVG（24px 网格 / 1.5px 描边 / 语义命名）
- **主题**：浅色（用户偏好 IDE/交付环境为浅色）；深色 token 已预留但不启用
- **对标**：Stripe Dashboard + Linear + Bloomberg Terminal 浅色版

---

## 9. 验收标准（锁定 —— QA 测试时以此为唯一依据）

> EARS 格式（Easy Approach to Requirements Syntax）

| 编号 | 功能 | EARS 格式验收标准 | 优先级 |
|------|------|-------------------|--------|
| AC-01 | Schema 校验 | **While** 加载任意 `data/promos/*.json`，**the system shall** 通过 ajv 校验全部字段；条件断言（`disclosure.affiliate === true ⇒ disclosure_text 必填` 等）必须命中 | P0 |
| AC-02 | MCP tools 注册 | **While** MCP server 启动，**the system shall** 暴露 8 个 tools / 4 个 resources / 3 个 prompts，全部 `listChanged: false` | P0 |
| AC-03 | Streamable HTTP | **When** 客户端发 `POST /mcp` 含合法 `initialize` 请求，**the system shall** 在 5 秒内返回 `200 + protocolVersion: '2025-11-25'` | P0 |
| AC-04 | 鉴权 | **If** 请求缺 `Authorization: Bearer` 或 token 失效，**the system shall** 返回 `401`（来自 Apify Store 调用方鉴权） | P0 |
| AC-05 | 无状态 | **While** 收到任意请求，**the system shall** 不读 / 不写任何 session，进程重启后行为不变 | P0 |
| AC-06 | search_promos | **When** 调 `search_promos({ query: 'free embedding' })`，**the system shall** 返回至少 1 条 embedding 类 prom，结构化字段齐全 | P0 |
| AC-07 | filter_promos | **When** 调 `filter_promos({ region: ['CN'], difficulty: ['easy'] })`，**the system shall** 只返回满足 region.include 含 CN **且** difficulty === easy 的条目 | P0 |
| AC-08 | what_can_i_get | **When** 调 `what_can_i_get({ region: ['CN'], has_credit_card: false, willingness: 'easy' })`，**the system shall** 返回 eligible + blocked_by + how_to_clear 三组，blocked_by 必填 blocking term 名 | P0 |
| AC-09 | get_expiring_soon | **When** 调 `get_expiring_soon({ within_days: 14 })`，**the system shall** 仅返回 `expires_at` 在未来 14 天内 **且** `status ∈ {active, expiring_soon}` | P0 |
| AC-10 | 难度分级视觉 | **While** 渲染 promo 卡片，**the system shall** 显示三重视觉编码（形状 + 文字 + 颜色），灰度模式下仍可读（WCAG 1.4.1 Level A） | P0 |
| AC-11 | 区域三态筛选 | **While** 用户在筛选条选 region，**the system shall** 用结构化字段匹配（availability/countries），**不**用子串匹配 | P0 |
| AC-12 | 到期倒计时 | **When** `expires_at` 已过，**the system shall** 卡片显示「已过期」pill 并从默认排序降权 | P0 |
| AC-13 | 项目透明度声明 | **While** 用户访问站点任意页面，**the system shall** 在 sticky 条 / 卡片底部 / 分享卡片 / 复制文案**四处**一致显示「开源·不接硬广·不挂联盟」五要点（替代原返佣披露） | P0 |
| AC-14 | 每日清单页生成 | **When** 跑 `node scripts/build-site.mjs`，**the system shall** 生成 `site/index.html`、`site/feed.xml`、`site/promos.ics`、`site/og.png` | P0 |
| AC-15 | RSS 内容 | **While** 生成 `site/feed.xml`，**the system shall** 仅含 `status ∈ {active, expiring_soon}` 的 promo，每条含 `title / value_display / difficulty / expires_at / last_verified_at / share_slug` | P0 |
| AC-16 | ICS 事件 | **While** 生成 `site/promos.ics`，**the system shall** 为每条 `expires_at != null` 的 promo 生成 VEVENT，提前 7 天 VALARM；`no_fixed_expiry=true` 的不生成 | P0 |
| AC-17 | 构建失败不阻断 | **If** RSS / ICS 生成失败，**the system shall** 主构建（清单页）仍成功，错误写入日志 | P1 |
| AC-18 | Refresh 任务产出全部 unverified | **When** 跑 `node scripts/refresh.mjs`，**the system shall** 产出的所有 promo `verification.status === 'unverified'` 且 `provenance.review_required === true`；不进清单页 / 不进 MCP 默认返回 | P0 |
| AC-19 | unverified → active 只能人工 | **If** 任何自动化流程尝试把 `status` 从 `unverified` 改为 `active`，**the system shall** 在 CI 中断并报错（这是硬约束） | P0 |
| AC-20 | 付费事件计费 | **When** 任意 tool 被调用，**the system shall** 调用 `Actor.charge({ eventName: 'mcp-search' \| 'mcp-filter' \| ... })`；开发者预设单价，Apify Store 扣款后结算（含平台佣金） | P0 |
| AC-21 | 零基础成本 | **When** 没有 MCP 调用，**the system shall** Apify 侧不产生任何费用（无 Standby 计费，无空闲容器） | P0 |
| AC-22 | Agentic Payments 资格 | **The system shall** 不使用 Standby、不使用全权限、定价仅按事件（不含平台 usage），符合 Apify Agentic Payments 资格；KYC 由开发者本人完成 | P1 |
| AC-23 | P0 自查 | **While** CI 跑 `node scripts/check-p0.mjs`，**the system shall** 输出 `FAIL: 0`（emoji / 紫粉渐变 / 回弹缓动 / 空洞占位 / `↗` 当图标） | P0 |
| AC-24 | Schema 锁定**一份** | **The system shall** 仅维护 `schemas/promo.schema.json`（Draft 2020-12），运行时引用此单源；不再维护副本 | P0 |

---

## 10. 边界与约束

- 不支持 IE / 旧版 Edge（仅 Chromium 内核 + Firefox + Safari）
- 响应式断点：640px / 1024px / 1440px（移动优先）
- 性能目标：清单页 LCP < 2.5s（4G 模拟）；MCP tool p95 < 500ms
- 合规约束：不挂联盟 / 不接硬广 / 不为付费修改排序（写入项目透明度声明）
- 安全约束：DNS rebinding 防护（Express 层 `Origin` / `Host` 白名单）
- 隐私约束：零第三方 cookie / tracker；合规第一方 cookie 仅用于 `?ref=share` 渠道追踪

---

## 11. 内嵌已知坑

> 当前项目无历史坑库（`pitfalls.jsonl` 尚未创建，MVP 后由 DevOps 维护）。
> 实施期必须警觉的潜在坑：

| 坑 | 签名 | 预防 |
|----|------|------|
| ~~Apify Actor hostname 锁 1024MB~~ | **已下线（v1.1.0）** —— PPE 模式无 Standby，无空闲容器尺寸问题 | — |
| ~~Standby 并发超 3 预起新 run~~ | **已下线（v1.1.0）** —— PPE 每请求独立 run | — |
| PPE 冷启动 2-4s / 请求 | `apify/ppe-cold-start` | MVP 可接受；高频调用方切 `npx free-and-cheap-tokens`（stdio） |
| MCP 客户端不支持 Bearer token | `mcp/bearer-required-by-server` | 主推 `npx mcp-remote` 桥接；README 明示 |
| Actor.charge 事件未定义 | `apify/missing-pricing-events` | CI 校验 `actor.json` 的 `pricingEvents` 字段齐全 |
| TypeScript 7.0.2 主版本切换 | `ts/7-breaking-changes` | 锁 5.9.3 |
| Express 5 async middleware | `express/5-async-handler-required` | 路由用 `express-async-errors` 或自包 |
| ajv Draft 2020-12 vs draft-07 | `ajv/draft-mismatch` | 统一 meta-schema URL |
| Build-time OG 生成时间失控 | `sharp/cold-start` | 仅 CI 跑，输出进仓库 |

---

## 12. 端到端验证步骤（Spec 锁定的最后一项）

```bash
# 0. 安装
cd MCP-Free-and-Cheap-Tokens
npm ci

# 1. 类型检查
npx tsc --noEmit
# 断言：0 error

# 2. 单元测试
npx vitest run
# 断言：所有用例 pass；Schema 用例覆盖 12 类非法样本

# 3. P0 红线自查
node scripts/check-p0.mjs
# 断言：FAIL: 0

# 4. 构建策展库
node scripts/build-catalog.mjs
# 断言：build/catalog.json 生成；sha256 输出

# 5. 构建静态站
node scripts/build-site.mjs
# 断言：site/{index.html, styles.css, app.js, feed.xml, promos.ics, og.png} 全在
# 断言：feed.xml 含 status=active|expiring_soon 的条目
# 断言：promos.ics 不含 no_fixed_expiry=true 的条目

# 6. 本地起 MCP server（stdio）
npm run dev
# 断言：stdio transport 启动；按 mcp.json 配 Client 可连

# 7. 核心成功流（调用方视角）
#   - search_promos({query:'free embedding'})
#   - filter_promos({region:['CN'],difficulty:['easy']})
#   - get_promo({id:'siliconflow-free-tier'})
#   - what_can_i_get({region:['CN'],has_credit_card:false,willingness:'easy'})
# 断言：每条返回 structuredContent + content[0].text

# 8. 关键错误流
#   - get_promo({id:'non-existent'}) → structuredContent.error + 文本「找不到该 promo」
#   - 缺 Authorization → 401
#   - 入参 zod 校验失败 → -32602 Invalid params

# 9. 部署（CI 自动）
#   - push 到 main → .github/workflows/build-site.yml 跑 → 产物发到 gh-pages
#   - Apify Actor 部署（手动 / apify-cli）→ Task hostname 256MB
```

---

## 13. 变更记录

| 日期 | 变更内容 | 原因 | 影响范围 |
|------|----------|------|----------|
| 2026-09-28 | 整体生成 v1.0（基于已批准的三文档） | Phase 1 调研完成 | 全部 |
| 2026-09-28 | D9: 变现路线改为 OSS + Hosted Convenience | 用户裁决（撤回联盟返佣） | §3、§5（付费）、§13.3 |
| 2026-09-28 | Schema `disclosure` 改为 deprecated | 同 D9 | §6 |
| 2026-09-28 | UIUX §7 改为「项目透明度声明」 | 同 D9 | §7、§9 AC-13 |
| 2026-09-28 | D12: Apify Standby → Pay-Per-Event + webServer；基础成本 $0；获 Agentic Payments 资格 (x402/Skyfire) | 用户裁决：「I don't want to pay Apify anything except for the commisions for each sale or pay per event」 | §4 部署行、§9 AC-20/21/22、§11（C2/C3/C4 下线） |
| 2026-09-28 | **v1.1.1 双语文档 + 双语站点**：README / SPEC / CONTRIBUTING 增 `.en.md` 兄弟；`scripts/build-site.mjs` 重构为 LOCALES 驱动，输出 `site/index.html` (zh-CN) + `site/en.html` (en)；en 页附 `lang-note` 标注 promo 正文仍为中文（v1.2 加 `headline_en` / `summary_en` 字段） | 用户追加：「做完后，确保有 中英文」 | §4（CSS 加 `.lang-toggle` / `.lang-note`）、§7（页面清单新增 en.html）、§13 D13 |