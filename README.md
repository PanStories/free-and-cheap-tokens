# Free & Cheap Tokens

> [🇬🇧 English version →](README.en.md) · 策展团队每日核实、机器可读的 **AI 模型/服务免费额度与低价 token 促销** 清单。
> 一个 MCP server + 一个零依赖静态站 + 一份 RSS / ICS + 一个同名 Skill。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-24.21.0_LTS-339933)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/MCP-1.30.1-purple)](https://modelcontextprotocol.io)
[![Apify PPE](https://img.shields.io/badge/Apify-Pay--Per--Event-0099FF)](https://apify.com)

---

## 这项目是什么

`free-and-cheap-tokens` 把全球 AI 模型/推理服务（OpenAI / Anthropic / Google / 智谱 / 硅基流动 / 阿里云百炼 / Cloudflare Workers AI / Groq …）的**免费额度与低价 token 促销**整理成**结构化数据**，对外提供三种使用方式：

1. **MCP server**（机器消费）—— AI Agent 直接调 8 个 tools / 4 个 resources / 3 个 prompts
2. **静态每日清单页**（人消费）—— 零依赖 HTML/CSS/JS，已部署到 GitHub Pages
3. **同名 Skill**（Agent 编排）—— 每日简报 + 实时查询的 WorkBuddy / Claude Skill

每条 promo 都有：

- 归类后的条款（22 项受控标签）
- 上手难度分级（easy / medium / hard）+ Agent 降级路径
- 区域披露（global / include / exclude 三态）
- 到期时间（含 `no_fixed_expiry`）
- 「如何薅」步骤（hard 项必填）
- **人工核验时间** —— 我们的核心差异化

---

## 项目立场（替代原返佣披露）

> 开源 · 不接硬广 · 不挂联盟 · 数据每日核实 · MIT

四处置顶一致：

- 站点顶部 sticky 条
- 每张卡片底部
- 分享卡片版面内
- 复制分享文案内

**为什么这样**：原 v2 计划走联盟返佣路线，但合规负担（FTC 16 CFR 255、中国《互联网广告管理办法》第九/十八条）太重。改为「策展即服务」路线后，可信度壁垒从相对优势升级成**结构性优势**。详见 [`docs/PRD.md`](docs/PRD.md) §8.5 与 [`SPEC.md`](SPEC.md) §13 D9。

---

## 快速开始

### 1. 本地跑 MCP server（stdio）

```bash
git clone https://github.com/PanStories/free-and-cheap-tokens.git
cd free-and-cheap-tokens
npm ci
npm run build:catalog
npm run dev
```

stdio transport 启动后，按 `mcp.json` 配你的 client：

```json
{
  "mcpServers": {
    "free-and-cheap-tokens": {
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

### 2. 远程 MCP server（Apify Pay-Per-Event + Streamable HTTP）

部署到 Apify 后，客户端用 `npx mcp-remote` 桥接（因为 Apify 网关要求每请求带 Bearer token）：

```json
{
  "mcpServers": {
    "free-and-cheap-tokens": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://YOUR-APIFY-HOSTNAME/mcp", "--header", "Authorization: Bearer YOUR-APIFY-TOKEN"]
    }
  }
}
```

**计费**：每个 MCP tool call = 1 个事件（如 `mcp-search` = $0.001 / 次）。**无月费** —— 没有调用时 Apify 不产生任何费用。这是 v1.1.0（2026-09-28）的关键切换：从 Standby 常驻容器改为 Pay-Per-Event 按事件计费，详见 [`docs/decisions/ADR-001-stack.md`](docs/decisions/ADR-001-stack.md) §1 与 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) §2。

**Agentic Payments**：本 Actor 满足 Apify Agentic Payments 资格（Pay-per-event + 无 Standby + 有限权限 + KYC）。AI Agent 可用 x402 / Skyfire 协议直接按调用付费，无需 Apify 账号。

### 3. 用每日清单页 + RSS / ICS

- 清单页：https://freeandcheaptokens.dev/
- RSS：https://freeandcheaptokens.dev/feed.xml
- ICS：https://freeandcheaptokens.dev/promos.ics

### 4. 订阅 Skill

- WorkBuddy 技能市场（微信支付）：`free-and-cheap-tokens` Pro 订阅
- Apify Store 付费 Actor（按事件计费，**无月费**）：`free-and-cheap-tokens`

---

## MCP 原语

### Tools（8）

| Tool | 用途 |
|------|------|
| `search_promos` | 语义 + 条件混合检索 |
| `filter_promos` | 纯结构化过滤 + 确定性排序 |
| `get_promo` | 单条详情（含 terms[]、actionability） |
| `list_providers` | 厂商列表（按国家过滤） |
| `get_recent_updates` | 自指定时间以来的变更 |
| `get_expiring_soon` | 14 天内到期（默认窗口） |
| `what_can_i_get` | 给出 eligible + blocked_by + how_to_clear |
| `report_promo_issue` | 一键生成 GitHub Issue 模板 |

### Resources（4）

| URI | 内容 |
|-----|------|
| `catalog://snapshot` | Catalog 元数据 |
| `catalog://daily/{date}` | 当日清单 Markdown |
| `schema://promo` | JSON Schema 本身 |
| `providers://index` | 厂商索引 |

### Prompts（3）

| Name | 用途 |
|------|------|
| `daily-deal-brief` | 每日羊毛简报（≤200 字） |
| `pick-for-me` | 给我挑 ≤3 条最合适的 |
| `explain-terms` | 把 terms[] 翻成人话 |

---

## Tier / 配额

| 维度 | 免费版 | 付费版 |
|------|--------|--------|
| 调用次数 | 100 次 / 24h / IP+UA 哈希 | 不限 |
| 返回条数 | ≤ 10 条 | 不限 |
| 提前到期告警 | 7 天前 | **30 天前** |
| 新发现可见 | 与清单同步 | **早 24 小时** |
| `verification.confidence` | 不暴露 | 暴露 |
| 鉴权 | 无（仅 IP+UA） | Apify token / WorkBuddy Pro |

---

## 架构

```
┌────────────────────────────────────────────────────────┐
│ GitHub Pages (零依赖静态)                              │
│  · index.html · styles.css · app.js · feed.xml · ics │
│  · og.png (CI 期 sharp 生成)                          │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Apify Standby Actor (Streamable HTTP · stateless)    │
│  · Node 24.21.0 + Express 5 + MCP SDK 1.30.1          │
│  · Task hostname 256MB (不是 Actor 级 1024MB!)        │
│  · 每请求 Bearer token (mcp-remote 桥接)              │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ 同名 Skill (WorkBuddy / Claude)                       │
│  · 每日简报 + 实时查询                                │
│  · 走 MCP 原语                                        │
└────────────────────────────────────────────────────────┘
```

详细见 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) 与 [`SPEC.md`](SPEC.md)。

---

## 项目结构

```
free-and-cheap-tokens/
├── .actor/                     Apify Actor 配置
├── .github/workflows/          CI: preflight / build-site / refresh
├── data/promos/                策展数据（每文件一条 promo）
├── docs/                       PRD / ARCHITECTURE / UIUX / 决策记录
├── design/                     Design Tokens（json + css）
├── schemas/                    promo.schema.json（Draft 2020-12，机器校验唯一源）
├── scripts/                      build-catalog / build-site / refresh / generate-og
├── site/                       构建产物（gitignored 除必要）
├── src/                        TypeScript 源码（MCP server / tools / tier）
├── tests/                      vitest 测试
├── SPEC.md                     规格即契约（zh-CN · [English →](SPEC.en.md)）
├── README.md                   ← 你在这（zh-CN · [English →](README.en.md)）
├── LICENSE                     MIT
└── CONTRIBUTING.md             收录流程（zh-CN · [English →](CONTRIBUTING.en.md)）
```

---

## 开发

```bash
npm ci                  # 安装（含 devDeps）
npm run typecheck       # tsc --noEmit
npm run lint            # eslint
npm test                # vitest（schema 校验 + 业务逻辑）
npm run check:p0        # P0 红线（emoji / 紫粉渐变 / 回弹缓动 / 空洞占位）
npm run build:catalog   # 构建 build/catalog.json
npm run build:site      # 生成 site/ 全套
node scripts/generate-og.mjs  # 生成 site/og.png（需 sharp）
npm run preflight       # 一键跑完上面所有
```

---

## 收录与纠错

- 想收录新 promo？见 [`CONTRIBUTING.md`](CONTRIBUTING.md)（[English →](CONTRIBUTING.en.md)）
- 看到错误 / 过期的 promo？点页面右下角「数据有误？」或直接开 Issue（模板自动生成）

---

## 路线图（按 SPEC §2）

| 状态 | 项 |
|------|------|
| ✅ MVP v1.0 | 14 条策展 + MCP server + 静态站 + RSS/ICS |
| 🚧 Skill | WorkBuddy / Claude 同名 Skill（待上架） |
| 🚧 Apify 付费 | Store 付费 Actor（待配置 Task hostname） |
| 📋 Phase 2 F15 | refresh 自动入库（Phase 1 discovery feed 已上线；auto-publish 待人工评估） |

---

## License

MIT — 见 [`LICENSE`](LICENSE)。
任何人都可以 fork、自部署、自托管、自修改。

---

## 致谢

- 灵感来源：[cheahjs/free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources)（社区维护的免费 LLM 列表）
- 数据交叉验证：[benchlm.ai](https://benchlm.ai)、[aiforker](https://aiforker.com)
- 协议：[Model Context Protocol](https://modelcontextprotocol.io)

数据核实：每天由策展团队人工维护。最后一次生成时间见页面顶部的「数据生成于」。