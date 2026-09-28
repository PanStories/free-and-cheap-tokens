# ADR-001: 用 Apify **Pay-Per-Event Actor + webServer** + Streamable HTTP + TypeScript MCP SDK 作为运行时与分发形态

## Status

**Superseded** by ADR-001 v1.1.0（2026-09-28 追加用户裁决「只付 Apify 佣金 / 按事件付费，不付月费」）

原 v1.0.0 版本（2026-09-28，Apify Standby + Streamable HTTP）**整体退役**，理由见下方 §1。

---

## 1. 为什么 Standby 方案退役

| 维度 | Standby（v1.0） | PPE + webServer（v1.1.0） |
|------|----------------|--------------------------|
| 基础成本 | $4.5/月（Free 计划额度内）或 $144/月（误用 Actor hostname 时） | **$0** |
| Agentic Payments 资格 | ❌ 不符合（用了 Standby） | ✅ 符合 |
| 计费粒度 | CU × 小时（粗糙） | 每事件（精确） |
| C2 锁 1024MB 陷阱 | ⚠️ 致命陷阱 | **不存在** |

**用户裁决原文**（2026-09-28）：
> "I don't want to pay Apify anything except for the commisions for each sale or pay per event."

该裁决在 v1.0 Standby 方案锁定**之后**追加，触发 v1.1.0 重新评估。

---

## 2. 背景

Free & Cheap Tokens 需要同时交付三件套：一个可被 AI Agent 调用的 MCP server、一个同名 Skill、一个零依赖静态每日清单页。分发形态由用户确认为 **Apify**，但具体定价模型由 2026-09-28 用户追加裁决改为 **Pay-Per-Event**（不付月费）。

约束条件：

1. MCP server 必须能被远程客户端调用（Streamable HTTP），同时不持有空闲基础设施以避免月费。
2. 策展库必须 Git 版本化、可人工评审。
3. 每日清单页必须零外部依赖（无 React/Vue/CDN，图标用 inline SVG）。
4. **MVP 阶段月度运行成本必须为 $0**（用户 2026-09-28 追加硬约束）。
5. 数据来源是"策展 + 定时联网刷新"混合，因此刷新任务与 MCP 读取是两个独立进程。
6. 变现路径：开发者通过 Apify Store 售卖 MCP 事件；用户付费时 Apify 抽成。

## 3. Decision Drivers

- **D1 可行性**：webServer + PAY_PER_EVENT 能否稳定承载 Streamable HTTP 的请求/响应语义。
- **D2 零基础成本**：空闲容器必须不产生费用，且每调用单价可预测。
- **D3 冷启动**：每请求 2-4s 冷启动可接受（每次 MCP tool call 本就是独立操作），但延迟敏感场景需有 stdio 兜底。
- **D4 零依赖交付**：清单页不能引入任何运行时外部资源。
- **D5 版本可锚定**：所有依赖必须有真实存在且可解析的版本号。
- **D6 数据一致性**：人工策展的事实优先级必须高于爬虫产出。
- **D7 Agentic Payments 资格**：能拿到 x402/Skyfire 协议资格，让 AI Agent 用加密钱包按调用付费。

## 4. Considered Options

### 方案 A（选定）：Apify Pay-Per-Event Actor + webServer + Streamable HTTP + TS

- `.actor/actor.json` 设 `pricingModel: "PAY_PER_EVENT"` + `pricingEvents` 字典（每个 MCP tool 对应一个事件名 + 单价）+ `webServer.requestHandler: "src/handler.ts"`。
- **不写** `usesStandbyMode: true`（该字段不存在或必须为 false 以保留 Agentic Payments 资格）。
- 传输：`@modelcontextprotocol/sdk` 的 `StreamableHTTPServerTransport`，**stateless** 模式（ADR-002）。
- 计费：`src/handler.ts` 在路由到对应 tool 后立即 `Actor.charge({ eventName: 'mcp-search' })`（单价定义在 `.actor/actor.json`，2026-09-28 市场校准：查询 $0.005 / 读取 $0.002 / 推理 $0.01）。
- 静态页：GitHub Pages，零依赖 HTML/CSS/JS。

### 方案 B：Apify Standby + Streamable HTTP + TS（**v1.0 已选定，v1.1.0 退役**）

理由：用户追加裁决否决月费支出。

### 方案 C：Apify 定时 Actor 只做刷新，MCP 走本地 stdio（npx 分发）

完全绕开远程托管成本。

- 缺点：用户已确认要远程 HTTP 端点（自传播与分享需要稳定 URL）。
- 保留为降级路径 P1（Apify 平台不可用时启用）。

### 方案 D：自托管在 Cloudflare Workers + DO + Apify Store 仅做市场分发

冷启动几乎为零、成本更低，但引入新平台依赖（CF 账号、Workers 配额）。

- 缺点：增加架构表面；失去 Apify 一站式部署的简洁性。
- 保留为降级路径 P2。

## 5. Decision

采用 **方案 A**。语言与运行时统一为 TypeScript on Node.js。

### 版本锁定（全部经 npm registry 实际查询确认，日期 2026-09-28）

| 组件 | 锁定版本 | 校验方式 |
|---|---|---|
| Node.js（本地与 CI） | `24.21.0` LTS (Krypton) | `nodejs.org/dist/index.json` 中 `lts: "Krypton"` 的最新版本 |
| Docker 基础镜像 | `apify/actor-node:24-slim` | Apify 官方文档：Node 镜像支持 22/24/26；`-slim` 不预装 npm 包 |
| `apify`（Apify SDK） | `3.7.2` | `registry.npmjs.org/apify/latest`；提供 `Actor.charge()` API |
| `@modelcontextprotocol/sdk` | `1.30.1` | `registry.npmjs.org/@modelcontextprotocol/sdk` 的 `dist-tags.latest` |
| `zod` | `4.6.5` | SDK 的 peerDependency 为 `^3.25 \|\| ^4.0` |
| `ajv` | `8.20.0` | 策展库校验 |
| `ajv-formats` | `3.0.1` | `format: date-time` / `uri` 校验 |
| `express` | `5.2.1` | SDK 1.30.1 直接依赖 express ^5.2.1 |
| TypeScript | `5.9.3` | **故意不用 `latest`（7.0.2）**：TS 7 是主版本切换，MVP 阶段不引入未知的类型检查行为差异 |
| `tsx` | `4.23.15` | 本地跑 MCP inspector |
| `vitest` | `5.0.2` | 单测 |
| `prettier` | `3.9.9` | 格式化 |
| `eslint` | `10.11.0` | 静态检查门禁 |
| `apify-cli` | `1.10.0` | 本地 `apify run` / `apify push` |
| `sharp`（**仅 CI 用，devDependency**） | `0.35.5` | GitHub Actions 中把 OG 分享卡 SVG 转 PNG；不进容器、不进站点 |

### MCP 协议版本

`@modelcontextprotocol/sdk@1.30.1` 的 `types.js` 中：

```
LATEST_PROTOCOL_VERSION = '2025-11-25'
DEFAULT_NEGOTIATED_PROTOCOL_VERSION = '2025-03-26'
SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05', '2024-10-07']
```

因此 **对外声明协商版本为 `2025-11-25`**。注意 MCP 官网规范最新已是 `2026-07-28`，本 SDK 尚未覆盖——这是已知的版本落差，写进风险 R5。不要在文档或代码里声称支持 2026-07-28。

### Apify PPE 侧硬约束（来自官方文档，逐条验收）

1. `.actor/actor.json` 必须含 `pricingModel: "PAY_PER_EVENT"` + `pricingEvents` 字典（每个 tool 对应一个事件）。CI 必须校验 `pricingEvents` 字段齐全（含 `mcp-initialize` / `mcp-list-tools` / `mcp-search` / `mcp-filter` / `mcp-get-promo` / `mcp-list-providers` / `mcp-recent-updates` / `mcp-expiring-soon` / `mcp-what-can-i-get` / `mcp-report-issue`）。
2. `.actor/actor.json` 必须含 `webServer.requestHandler: "src/handler.ts"`（handler 文件不存在会让 Apify 启动失败）。
3. **不得** 含 `usesStandbyMode: true`（一旦存在，Agentic Payments 资格立刻失效）。
4. **handler 必须显式调用 `Actor.charge()`**，否则 Apify 不会计费，且会触发告警。
5. **开发者必须完成 KYC** —— Agentic Payments 资格的前置条件；不完成则 Actor 不被 `allowsAgenticUsers=true` 标记，AI Agent 无法自动付费。
6. **必须申请有限权限**（`restrictedActorPermissions`）—— Agentic Payments 资格要求。请求全权限会被排除。
7. **价格不得含 platform usage** —— 必须是纯事件计费，不能开启 "Pay per event + usage" 选项。

### v1.0 旧约束的处置

| 旧约束 | 处置 |
|--------|------|
| C1 必须无状态 | ✅ **保留** —— 改成"PPE 每请求独立 run，session 必断"，落到 M1 |
| C2 必须建 Task hostname | ❌ **退役** —— PPE 无 idle container，Task 概念不适用 |
| C3 必须 `Actor.init()` 不用 `Actor.main()` | ❌ **退役** —— PPE 不用 `Actor.init()` 启动常驻 server |
| C4 不可恢复错误 `process.exit()` | ❌ **退役** —— PPE 每 run 是独立进程，错误即结束 |
| C5 Bearer token 客户端兼容性 | ✅ **保留**，但描述改为"PPE 仍要求 Apify 鉴权" |

## 6. Consequences

正面：

- **基础成本 $0**（用户 2026-09-28 裁决达成）。空闲时容器不运行。
- **Agentic Payments 资格**：x402 / Skyfire 协议让 AI Agent 用加密钱包直接付费，无需 Apify 账号。这是 v1.0 Standby 方案拿不到的乘数效应。
- TypeScript 一条工具链贯穿 MCP server、刷新脚本、清单页生成器、Skill 的校验脚本。
- 刷新任务放在 GitHub Actions，公共仓库分钟数不限，刷新成本为零且天然与 Git 策展库同源。
- 每事件单价可预测，月成本 = 月调用量 × 事件均价。

负面 / 代价：

- **每请求 2-4s 冷启动**：Apify PPE 文档明确说明。低频调用方体感明显。缓解：高频调用方走 `npx free-and-cheap-tokens`（stdio，零延迟）。
- **每次请求都需 Apify API token**（`Authorization: Bearer <token>`）。部分 MCP 客户端不支持自定义请求头，需要 `npx mcp-remote` 做本地桥接。
- 引入 Apify 平台锁定：迁出需要重写 `src/handler.ts` 与 `.actor/`，但 MCP 层（tools/resources/prompts 定义）与数据层完全可移植。
- KYC 是开发者本人合规事项，需用户配合完成（不可由我代办）。

## 7. Related ADRs

- ADR-002: Streamable HTTP 使用无状态（stateless）模式（未变）
- ADR-003: 策展库以 Git 为事实源，构建期编译为只读 catalog（未变）