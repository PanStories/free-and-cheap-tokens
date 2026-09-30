# Free and Cheap Tokens (FaCT)

> **FaCT** = **F**ree **a**nd **C**heap **T**okens. That is where the short name comes from.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-24.21.0_LTS-339933)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/MCP-1.30.1-purple)](https://modelcontextprotocol.io)
[![Apify PPE](https://img.shields.io/badge/Apify-Pay--Per--Event-0099FF)](https://apify.com)

🌐 **[English](#english)** · **[简体中文](#简体中文)** · **[繁體中文](#繁體中文)**

| Where it lives | Link |
|---|---|
| MCP endpoint (Apify Standby) | `https://neeenja--free-and-cheap-tokens.apify.actor/mcp` |
| Apify Store | https://apify.com/neeenja/free-and-cheap-tokens |
| Source code (MIT) | https://github.com/PanStories/free-and-cheap-tokens |
| Directory listing | https://sartbot.com/mcp/free-and-cheap-tokens/ |
| Featured on | [Sartbot Featured](https://sartbot.com/mcp/free-and-cheap-tokens/) |
| Daily listing page | https://freeandcheaptokens.dev/ |

---

<a id="english"></a>

# English

A curated, **daily human-verified**, machine-readable catalog of **free tiers and cheap token promos** for AI models and inference services — served as one MCP server over Streamable HTTP.

## What you get

- **8 tools** — `search_promos`, `filter_promos`, `get_promo`, `list_providers`, `get_recent_updates`, `get_expiring_soon`, `what_can_i_get`, `report_promo_issue`
- **4 resources** — `catalog://snapshot`, `catalog://daily/{date}`, `schema://promo`, `providers://index`
- **3 prompts** — `daily-deal-brief`, `pick-for-me`, `explain-terms`
- **17 curated promos** covering OpenAI / Anthropic / Google / Zhipu / SiliconFlow / Alibaba Cloud Model Studio / Cloudflare Workers AI / Groq …

Every promo record carries normalized terms (22 controlled tags), an onboarding difficulty rating (**easy / medium / hard**) with an Agent fallback path, region disclosure (global / include / exclude), an expiry timestamp (including `no_fixed_expiry`), a "how to claim" step list, and a **human-verified timestamp** — the last one is our core differentiator.

## Connect

Any MCP client can connect. Authentication is a Bearer token (your Apify API token).

```bash
curl -X POST https://neeenja--free-and-cheap-tokens.apify.actor/mcp \
  -H "Authorization: Bearer $APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"my-client","version":"1.0"}}}'
```

Remote (`mcp-remote` bridge, because the Apify gateway needs a Bearer token per request):

```json
{
  "mcpServers": {
    "free-and-cheap-tokens": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://neeenja--free-and-cheap-tokens.apify.actor/mcp", "--header", "Authorization: Bearer YOUR-APIFY-TOKEN"]
    }
  }
}
```

Local (stdio):

```bash
git clone https://github.com/PanStories/free-and-cheap-tokens.git
cd free-and-cheap-tokens
npm ci && npm run build:catalog && npm run dev
```

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

## Pricing (Pay-Per-Event, no monthly fee)

| Event | Price |
|---|---|
| `mcp-search` (search / filter / recent / expiring) | $0.005 / call |
| `mcp-what-can-i-get` (reasoned recommendation) | $0.01 / call |
| `mcp-get-promo`, `mcp-list-providers` | $0.002 / call |
| `mcp-initialize`, `mcp-list-tools`, `mcp-report-issue` | **free** |

Nothing is charged while idle. Note: Apify **Agentic Payments (x402 / Skyfire) is not available** for this Actor — that program requires Standby mode to be disabled, and an MCP endpoint needs Standby. Billing runs through your own Apify token.

## Project stance

> Open source · No paid placements · No affiliate links · Daily verified data · MIT

Shown consistently in four places: the site's sticky top bar, the bottom of each card, inside the share card, and inside the copy-share text. The original v2 plan was an affiliate model, but the compliance burden (FTC 16 CFR 255, China 《互联网广告管理办法》 Art. 9 & 18) was too heavy. "Curation-as-a-service" turns trust from a relative advantage into a structural one.

## Development

```bash
npm ci                  # Install (incl. devDeps)
npm run typecheck       # tsc --noEmit
npm run lint            # eslint
npm test                # vitest (schema validation + business logic)
npm run check:p0        # P0 redlines (emoji / purple-pink gradient / bounce easing / placeholder text)
npm run build:catalog   # Build build/catalog.json
npm run build:site      # Generate site/ outputs
npm run preflight       # One-shot run all of the above
```

## Submission & error reporting

- Submit a new promo: see [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Error or expired promo: call `report_promo_issue`, or open a GitHub Issue (template auto-generated)

---

<a id="简体中文"></a>

# 简体中文

一份**每日人工核实**、机器可读的 **AI 模型 / 推理服务免费额度与低价 token 促销**策展清单，以一个 MCP server 的形式通过 Streamable HTTP 对外提供。

## 你能拿到什么

- **8 个 tools** — `search_promos`、`filter_promos`、`get_promo`、`list_providers`、`get_recent_updates`、`get_expiring_soon`、`what_can_i_get`、`report_promo_issue`
- **4 个 resources** — `catalog://snapshot`、`catalog://daily/{date}`、`schema://promo`、`providers://index`
- **3 个 prompts** — `daily-deal-brief`、`pick-for-me`、`explain-terms`
- **17 条策展 promo**，覆盖 OpenAI / Anthropic / Google / 智谱 / 硅基流动 / 阿里云百炼 / Cloudflare Workers AI / Groq …

每条 promo 都带：归类后的条款（22 项受控标签）、上手难度分级（**easy / medium / hard**）+ Agent 降级路径、区域披露（global / include / exclude）、到期时间（含 `no_fixed_expiry`）、「如何薅」步骤（hard 项必填），以及**人工核验时间** —— 最后这项是我们的核心差异化。

## 怎么连

任何 MCP 客户端都能连，用 Bearer token 鉴权（Apify API token）：

```bash
curl -X POST https://neeenja--free-and-cheap-tokens.apify.actor/mcp \
  -H "Authorization: Bearer $APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"my-client","version":"1.0"}}}'
```

远程（`mcp-remote` 桥接，因为 Apify 网关要求每请求带 Bearer token）：

```json
{
  "mcpServers": {
    "free-and-cheap-tokens": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://neeenja--free-and-cheap-tokens.apify.actor/mcp", "--header", "Authorization: Bearer YOUR-APIFY-TOKEN"]
    }
  }
}
```

本地（stdio）：

```bash
git clone https://github.com/PanStories/free-and-cheap-tokens.git
cd free-and-cheap-tokens
npm ci && npm run build:catalog && npm run dev
```

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

## 计费（Pay-Per-Event，无月费）

| 事件 | 价格 |
|---|---|
| `mcp-search`（搜索 / 过滤 / 近期更新 / 即将到期） | $0.005 / 次 |
| `mcp-what-can-i-get`（推理推荐） | $0.01 / 次 |
| `mcp-get-promo`、`mcp-list-providers` | $0.002 / 次 |
| `mcp-initialize`、`mcp-list-tools`、`mcp-report-issue` | **免费** |

空闲时不产生任何费用。注意：本 Actor **不支持 Apify Agentic Payments（x402 / Skyfire）** —— 该计划要求关闭 Standby，而 MCP 端点必须开 Standby。计费走你自己的 Apify token。

## 项目立场

> 开源 · 不接硬广 · 不挂联盟 · 数据每日核实 · MIT

四处置顶一致：站点顶部 sticky 条、每张卡片底部、分享卡片版面内、复制分享文案内。原 v2 计划走联盟返佣，但合规负担（FTC 16 CFR 255、中国《互联网广告管理办法》第九 / 十八条）太重。改为「策展即服务」后，可信度壁垒从相对优势升级成结构性优势。

## 开发

```bash
npm ci                  # 安装（含 devDeps）
npm run typecheck       # tsc --noEmit
npm run lint            # eslint
npm test                # vitest（schema 校验 + 业务逻辑）
npm run check:p0        # P0 红线（emoji / 紫粉渐变 / 回弹缓动 / 空洞占位）
npm run build:catalog   # 构建 build/catalog.json
npm run build:site      # 生成 site/ 全套
npm run preflight       # 一键跑完上面所有
```

## 收录与纠错

- 想收录新 promo？见 [`CONTRIBUTING.md`](CONTRIBUTING.md)
- 看到错误 / 过期的 promo？调 `report_promo_issue`，或直接开 Issue（模板自动生成）

---

<a id="繁體中文"></a>

# 繁體中文

一份**每日人工核實**、機器可讀的 **AI 模型 / 推論服務免費額度與低價 token 促銷**策展清單，以單一 MCP server 的形式透過 Streamable HTTP 對外提供。

## 你能拿到什麼

- **8 個 tools** — `search_promos`、`filter_promos`、`get_promo`、`list_providers`、`get_recent_updates`、`get_expiring_soon`、`what_can_i_get`、`report_promo_issue`
- **4 個 resources** — `catalog://snapshot`、`catalog://daily/{date}`、`schema://promo`、`providers://index`
- **3 個 prompts** — `daily-deal-brief`、`pick-for-me`、`explain-terms`
- **17 筆策展 promo**，涵蓋 OpenAI / Anthropic / Google / 智譜 / 矽基流動 / 阿里雲百鍊 / Cloudflare Workers AI / Groq …

每筆 promo 都帶有：歸類後的條款（22 項受控標籤）、上手難度分級（**easy / medium / hard**）+ Agent 降級路徑、區域揭露（global / include / exclude）、到期時間（含 `no_fixed_expiry`）、「如何領」步驟（hard 項目必填），以及**人工核驗時間** —— 最後這項是我們的核心差異化。

## 怎麼連

任何 MCP 用戶端都能連，使用 Bearer token 驗證（你的 Apify API token）：

```bash
curl -X POST https://neeenja--free-and-cheap-tokens.apify.actor/mcp \
  -H "Authorization: Bearer $APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"my-client","version":"1.0"}}}'
```

遠端（`mcp-remote` 橋接，因為 Apify 閘道要求每個請求都帶 Bearer token）：

```json
{
  "mcpServers": {
    "free-and-cheap-tokens": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://neeenja--free-and-cheap-tokens.apify.actor/mcp", "--header", "Authorization: Bearer YOUR-APIFY-TOKEN"]
    }
  }
}
```

本機（stdio）：

```bash
git clone https://github.com/PanStories/free-and-cheap-tokens.git
cd free-and-cheap-tokens
npm ci && npm run build:catalog && npm run dev
```

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

## 計費（Pay-Per-Event，無月費）

| 事件 | 價格 |
|---|---|
| `mcp-search`（搜尋 / 篩選 / 近期更新 / 即將到期） | $0.005 / 次 |
| `mcp-what-can-i-get`（推理推薦） | $0.01 / 次 |
| `mcp-get-promo`、`mcp-list-providers` | $0.002 / 次 |
| `mcp-initialize`、`mcp-list-tools`、`mcp-report-issue` | **免費** |

閒置時不會產生任何費用。注意：本 Actor **不支援 Apify Agentic Payments（x402 / Skyfire）** —— 該計畫要求關閉 Standby，而 MCP 端點必須開啟 Standby。計費走你自己的 Apify token。

## 專案立場

> 開源 · 不接硬廣 · 不掛聯盟 · 資料每日核實 · MIT

四處一致標示：站台頂部 sticky 條、每張卡片底部、分享卡片版面內、複製分享文案內。原本 v2 計畫走聯盟返傭路線，但合規負擔（FTC 16 CFR 255、中國《互聯網廣告管理辦法》第九／十八條）太重。改為「策展即服務」後，可信度壁壘從相對優勢升級為結構性優勢。

## 開發

```bash
npm ci                  # 安裝（含 devDeps）
npm run typecheck       # tsc --noEmit
npm run lint            # eslint
npm test                # vitest（schema 校驗 + 業務邏輯）
npm run check:p0        # P0 紅線（emoji / 紫粉漸層 / 回彈緩動 / 空洞佔位）
npm run build:catalog   # 建置 build/catalog.json
npm run build:site      # 產生 site/ 全套
npm run preflight       # 一鍵跑完上面所有
```

## 收錄與糾錯

- 想收錄新的 promo？見 [`CONTRIBUTING.md`](CONTRIBUTING.md)
- 發現錯誤或過期的 promo？呼叫 `report_promo_issue`，或直接開 Issue（範本自動產生）

---

## 致谢 / Acknowledgments

- 灵感来源：[cheahjs/free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources)
- 数据交叉验证：[benchlm.ai](https://benchlm.ai)、[aiforker](https://aiforker.com)
- 协议：[Model Context Protocol](https://modelcontextprotocol.io)

License: MIT — anyone can fork, self-deploy, self-host and modify.
数据核实：每天由策展团队人工维护。
---

## Support · 赞助 · 贊助

**EN** — **Free and Cheap Tokens (FaCT)** is open source (MIT), ad-free, and its
catalog is verified by a human every day. It is funded by the community, not by ads
or affiliate links. If it saves you money or time, please support it:
- ☕ Ko-fi (the **Sponsor** ❤️ button on this repo routes here): https://ko-fi.com/panstories

**简体中文** — **Free and Cheap Tokens (FaCT)** 开源（MIT）、无广告，目录每日由人工核实，
由社区资助而非广告或联盟返佣。若它帮你省了钱或时间，欢迎赞助：GitHub Sponsors 点本仓库的
**Sponsor** 按钮，或前往 Ko-fi: https://ko-fi.com/panstories

**繁體中文** — **Free and Cheap Tokens (FaCT)** 開源（MIT）、無廣告，目錄每日由人工核實，
由社群資助而非廣告或聯盟返佣。若它幫你省了錢或時間，歡迎贊助：GitHub Sponsors 點本倉庫的
**Sponsor** 按鈕，或前往 Ko-fi: https://ko-fi.com/panstories

Thank you! · 谢谢 · 謝謝 💙
