# Free & Cheap Tokens

> [🇨🇳 中文版 →](README.md) · Daily verified, machine-readable catalog of **free tiers & cheap token promos** for AI models and inference services.
> A MCP server + a zero-dependency static site + an RSS / ICS feed + a same-name Skill.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-24.21.0_LTS-339933)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/MCP-1.30.1-purple)](https://modelcontextprotocol.io)
[![Apify PPE](https://img.shields.io/badge/Apify-Pay--Per--Event-0099FF)](https://apify.com)

---

## What this project is

`free-and-cheap-tokens` curates **free tiers and cheap token promos** from AI model / inference providers worldwide (OpenAI / Anthropic / Google / Zhipu / SiliconFlow / Aliyun Bailian / Cloudflare Workers AI / Groq …) into **structured data**, exposed via three consumption paths:

1. **MCP server** (machine consumption) — AI Agents call 8 tools / 4 resources / 3 prompts directly
2. **Static daily listing page** (human consumption) — zero-dependency HTML/CSS/JS, deployed on GitHub Pages
3. **Same-name Skill** (Agent orchestration) — daily briefing + real-time queries for WorkBuddy / Claude

Every promo record includes:

- Normalized terms (22 controlled tags)
- Onboarding difficulty rating (**easy / medium / hard**) + Agent fallback path
- Region disclosure (global / include / exclude — three states)
- Expiry timestamp (with `no_fixed_expiry` for permanent free tiers)
- "How to claim" step list (required for `hard` items)
- **Human-verified timestamp** — our core differentiator

---

## Project stance (replaces affiliate disclosure)

> Open source · No paid placements · No affiliate links · Daily verified data · MIT

Consistently displayed in **four places**:

- Site top sticky bar
- Bottom of each card
- Inside the share card
- Inside the copy-share text

**Why**: The original v2 plan was an affiliate/commission model, but compliance burdens (FTC 16 CFR 255, China 《互联网广告管理办法》 Art. 9 & 18) were too heavy. After pivoting to "curation-as-a-service", the trust barrier upgrades from a relative advantage to a **structural advantage**. See [`docs/PRD.md`](docs/PRD.md) §8.5 and [`SPEC.md`](SPEC.md) §13 D9.

---

## Quick start

### 1. Run MCP server locally (stdio)

```bash
git clone https://github.com/PanStories/free-and-cheap-tokens.git
cd free-and-cheap-tokens
npm ci
npm run build:catalog
npm run dev
```

After stdio transport starts, configure your client per `mcp.json`:

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

### 2. Remote MCP server (Apify Pay-Per-Event + Streamable HTTP)

After deploying to Apify, bridge the client with `npx mcp-remote` (because Apify gateway requires a Bearer token per request):

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

**Billing**: each MCP tool call = 1 event (e.g. `mcp-search` = $0.001 / call). **No monthly fee** — when idle, Apify charges you nothing. This is the key v1.1.0 (2026-09-28) switch: from Standby-resident container to Pay-Per-Event. See [`docs/decisions/ADR-001-stack.md`](docs/decisions/ADR-001-stack.md) §1 and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) §2.

**Agentic Payments**: This Actor qualifies for Apify Agentic Payments (x402 / Skyfire) — AI Agents can pay per call via crypto wallet, no Apify account required.

### 3. Use the daily listing page + RSS / ICS

- Listing page: https://freeandcheaptokens.dev/
- RSS: https://freeandcheaptokens.dev/feed.xml
- ICS: https://freeandcheaptokens.dev/promos.ics

### 4. Subscribe to the Skill

- WorkBuddy Skill Market (WeChat Pay): `free-and-cheap-tokens` Pro subscription
- Apify Store paid Actor (per-event billing, **no monthly fee**): `free-and-cheap-tokens`

---

## MCP Primitives

### Tools (8)

| Tool | Purpose |
|------|---------|
| `search_promos` | Semantic + conditional hybrid search |
| `filter_promos` | Pure structured filtering + deterministic sort |
| `get_promo` | Single detail (includes terms[], actionability) |
| `list_providers` | Provider list (filterable by country) |
| `get_recent_updates` | Changes since a specified time |
| `get_expiring_soon` | Expiring within 14 days (default window) |
| `what_can_i_get` | Returns eligible + blocked_by + how_to_clear |
| `report_promo_issue` | One-click GitHub Issue template generator |

### Resources (4)

| URI | Content |
|-----|---------|
| `catalog://snapshot` | Catalog metadata |
| `catalog://daily/{date}` | Today's listing in Markdown |
| `schema://promo` | The JSON Schema itself |
| `providers://index` | Provider index |

### Prompts (3)

| Name | Purpose |
|------|---------|
| `daily-deal-brief` | Daily deal brief (≤200 chars) |
| `pick-for-me` | Pick ≤3 most suitable for me |
| `explain-terms` | Translate terms[] into plain language |

---

## Tier / Quota

| Dimension | Free tier | Paid tier |
|-----------|-----------|-----------|
| Call count | 100 / 24h / IP+UA hash | Unlimited |
| Result count | ≤ 10 | Unlimited |
| Expiry warning lead-time | 7 days | **30 days** |
| New discoveries visible | Synced with listing | **24h earlier** |
| `verification.confidence` | Hidden | Exposed |
| Authentication | None (IP+UA only) | Apify token / WorkBuddy Pro |

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│ GitHub Pages (zero-dependency static)                 │
│  · index.html · styles.css · app.js · feed.xml · ics │
│  · og.png (CI-generated via sharp)                    │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Apify Pay-Per-Event Actor (Streamable HTTP · stateless)│
│  · Node 24.21.0 + Express 5 + MCP SDK 1.30.1          │
│  · webServer.requestHandler = src/handler.ts           │
│  · Actor.charge({ eventName }) per tool call           │
│  · Bearer token per request (mcp-remote bridge)        │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Same-name Skill (WorkBuddy / Claude)                  │
│  · Daily briefing + real-time queries                  │
│  · Wraps MCP primitives                                │
└────────────────────────────────────────────────────────┘
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`SPEC.md`](SPEC.md) for details.

---

## Project layout

```
free-and-cheap-tokens/
├── .actor/                     Apify Actor config
├── .github/workflows/          CI: preflight / build-site / refresh
├── data/promos/                Curated data (one JSON per promo)
├── docs/                       PRD / ARCHITECTURE / UIUX / decision records
├── design/                     Design tokens (json + css)
├── schemas/                    promo.schema.json (Draft 2020-12, single source of truth)
├── scripts/                      build-catalog / build-site / refresh / generate-og
├── site/                       Build output (gitignored except essentials)
├── src/                        TypeScript source (MCP server / tools / tier)
├── tests/                      vitest tests
├── SPEC.md                     Specification-as-contract
├── README.md                   ← You are here (zh-CN)
├── README.en.md                ← English version
├── LICENSE                     MIT
└── CONTRIBUTING.md             Submission workflow
```

---

## Development

```bash
npm ci                  # Install (incl. devDeps)
npm run typecheck       # tsc --noEmit
npm run lint            # eslint
npm test                # vitest (schema validation + business logic)
npm run check:p0        # P0 redlines (emoji / purple-pink gradient / bounce easing / placeholder text)
npm run build:catalog   # Build build/catalog.json
npm run build:site      # Generate site/ outputs
node scripts/generate-og.mjs  # Generate site/og.png (needs sharp)
npm run preflight       # One-shot run all of the above
```

---

## Submission & error reporting

- Want to submit a new promo? See [`CONTRIBUTING.md`](CONTRIBUTING.md) (or [English version](CONTRIBUTING.en.md))
- Spotted an error / expired promo? Click "Report data issue" at the bottom-right of each card, or open an Issue directly (template auto-generated)

---

## Roadmap (per SPEC §2)

| Status | Item |
|--------|------|
| ✅ MVP v1.0 | 14 curated promos + MCP server + static site + RSS/ICS |
| 🚧 Skill | WorkBuddy / Claude same-name Skill (awaiting listing) |
| 🚧 Apify paid | Store paid Actor (awaiting Task hostname configuration) |
| 📋 Phase 2 F15 | refresh auto-curate (Phase 1 discovery feed is live; auto-publish awaits human review) |

---

## License

MIT — see [`LICENSE`](LICENSE).
Anyone can fork, self-deploy, self-host, self-modify.

---

## Acknowledgments

- Inspiration: [cheahjs/free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources) (community-maintained free LLM list)
- Cross-validation: [benchlm.ai](https://benchlm.ai), [aiforker](https://aiforker.com)
- Protocol: [Model Context Protocol](https://modelcontextprotocol.io)

Data verification: human-maintained daily by the curation team. Last generation timestamp shown in the page header under "Last generated".
