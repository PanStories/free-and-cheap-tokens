# Changelog

All notable changes to this project will be documented here. Format: [Keep a Changelog](https://keepachangelog.com/) · SemVer.

## [1.3.0] - 2026-10-08

### Security

- **Upgraded `@modelcontextprotocol/sdk` 1.30.1 → 1.32.1**, clearing **GHSA-6qxp-vccf-f47h /
  CVE-2026-104850** (CVSS 7.5 High) — the OAuth client could send stored credentials to an
  authorization server named by the MCP server. **Not reachable from this project**: the
  advisory's "Am I affected" section excludes MCP *servers* built with the SDK and stdio
  clients, and this server holds no OAuth credentials. Fixed anyway so scanners stop
  flagging a dependency that genuinely cannot reach it.
- `npm audit` highs reduced 8 → 6. The remainder come through `apify` SDK's
  `proxy-agent` chain and the `apify-cli` publish toolchain, both outside the served
  surface; `apify` is already at the latest 3.7.2.

### Added

- **MCP tool annotations on all 8 tools** — `readOnlyHint: true`, `destructiveHint: false`,
  `idempotentHint: true`, `openWorldHint: false`, matching actual behaviour (every tool is a
  pure read over the bundled catalog; `report_promo_issue` only formats a GitHub issue URL
  and sends nothing). OpenAI's MCP directory rejects tools missing these hints.
- **`tests/tools.test.ts`** — 14 contract tests covering every tool by name, plus an
  annotation contract and `lang` parity checks. Test coverage 20 → 34.
- **M8ven Trust Index badge** in the README, pointing at the independent security review.

## [Unreleased]

### Changed

- **Static site redesign (2026-09-29)** — `site/` now follows the same design language as
  `mcp-stock-analyst`: navy sticky header, `#f5f7fa` page background, white cards with soft
  navy shadow, blue primary buttons, and an `EN / 中文` switch in the top navigation.
- **Single bilingual page, English by default** — `site/index.html` carries both languages
  inline (`.lang-en` / `.lang-zh` spans) and toggles client-side; `<html lang="en">` is the
  default, the choice persists in `localStorage`. `site/en.html` is kept as a relative
  redirect stub so existing links do not 404.
- **Own brand mark** — a price tag holding a token coin (`#f0b429`, inline SVG, also used as
  the favicon), deliberately different from the stock-analyst line-chart mark.
- New sections: promo directory (stats + filters), pricing table, and a Connect block with
  remote / local stdio tabs and copy buttons.
- Emoji removed from the language toggle and the promo-data note (P0 red line).

## [1.2.0] - 2026-10-07

### Added
- **Persistent free tiers are now first-class.** `search_promos` / `filter_promos` accept a new
  `offer_type` filter (enum incl. `free_tier`) so agents can isolate permanent free tiers from
  limited-time promos. 14 of 17 catalog entries are `free_tier`.
- **Free-tier label in human output.** List and detail views now tag `free_tier` offers with
  "Permanent free tier" (永久免费额度 / 永久免費額度).

### Changed
- **Positioning copy leads with free tiers.** README + llms.txt now frame FaCT as persistent free
  tiers + limited-time promos (was promo-centric).

## [1.1.1] - 2026-09-28

### Added

- **Bilingual documentation** — every public-facing doc now ships in Chinese (default) + English sibling:
  - `README.md` ↔ `README.en.md`
  - `SPEC.md` ↔ `SPEC.en.md`
  - `CONTRIBUTING.md` ↔ `CONTRIBUTING.en.md`
  - Each Chinese doc has a `[🇬🇧 English version →]` link at the top
- **Bilingual static site** — `scripts/build-site.mjs` now generates two pages from one catalog:
  - `site/index.html` (zh-CN, default at `/`)
  - `site/en.html` (English UI; promo `headline` / `summary` remain Chinese with a `lang-note` banner explaining the v1.2 roadmap for bilingual data fields)
  - Both pages carry a `中文 | English` toggle (`<a class="lang-toggle">`) that round-trips between the two
  - `<link rel="alternate" hreflang="…">` tags in both pages for SEO / discovery
- New `LOCALES` map in `scripts/build-site.mjs` — adding a third language is now a one-object-literal PR
- New `.lang-note` CSS class + `<a class="lang-toggle">` styles (zero new dependencies)

## [1.1.0] - 2026-09-28

### Changed

- **Deployment model: Apify Standby → Pay-Per-Event (PPE) Actor + webServer.** Per user 2026-09-28 ruling: "I don't want to pay Apify anything except for the commisions for each sale or pay per event."
  - Idle cost: **$0** (vs $4.5/mo or $144/mo with Standby)
  - Side benefit: Actor now qualifies for **Apify Agentic Payments** (x402 / Skyfire) — AI Agents can pay per call with crypto wallet, no Apify account needed
- Removed Standby-specific hard constraints (C2 memory lock, C3 `Actor.init()`, C4 health probe / `process.exit`)
- MCP transport remains stateless (ADR-002 unchanged)

### Updated files

- `.actor/actor.json` — added `pricingModel: "PAY_PER_EVENT"` + `pricingEvents` dictionary (10 events: 3 free, 7 paid)
- `.actor/Dockerfile` — removed Standby-specific comments; same Node 24 base image
- `SPEC.md` §4 tech stack table; §5 AC-04/AC-20/AC-21/AC-22 replaced free-quota with PPE billing ACs; §11 pitfalls updated
- `docs/ARCHITECTURE.md` §2 completely rewritten (PPE feasibility + comparison with Standby); §3 selection matrix (4.40 → 4.85)
- `docs/decisions/ADR-001-stack.md` — Superseded status declared, v1.1.0 added
- `README.md` — deployment section updated

## [1.0.0] - 2026-09-28

### Added

- MCP server with 8 tools / 4 resources / 3 prompts (Streamable HTTP transport)
- 17 curated promos across 17 providers (international + Chinese market focus)
- Zero-dependency static daily listing page (HTML + CSS + JS, ~27 KB)
- RSS 2.0 feed (`feed.xml`) — filters `active` and `expiring_soon`
- iCalendar feed (`promos.ics`) — VEVENT for each promo with `expires_at`; 7-day VALARM
- OG share card generator (`scripts/generate-og.mjs` — runs in CI only)
- `data/promos/` curated library as the single source of truth
- `schemas/promo.schema.json` (Draft 2020-12) with conditional assertions
- GitHub Actions: `preflight` (typecheck + lint + test + P0 scan), `build-site` (Pages), `refresh` (6h discovery feed)
- ~~Apify Standby deployment config (Task hostname 256MB + idle 300s, **not** Actor-level hostname)~~ (superseded by v1.1.0 PPE)
- Tier/quota system (free: ≤10 results / 100 calls / 24h; paid: unlimited via Apify token or WorkBuddy Pro)
- P0 self-check script (`scripts/check-p0.mjs`) — emoji / purple-pink gradient / bounce easing / placeholder text
- 13 unit tests covering schema (12 illegal samples) + business logic

### Changed

- (none — first release)

### Security

- DNS rebinding protection via Origin / Host whitelist (Express layer; SDK 1.30.1 marked `enableDnsRebindingProtection` deprecated)
- Stateless transport: no session storage, no cookies, no user data persistence
- All links are first-party (no third-party trackers) — GDPR/ePrivacy clean by design

### Documentation

- `README.md` — entry point, quick start, architecture diagram
- `SPEC.md` — locked specification (12 sections, EARS acceptance criteria)
- `docs/PRD.md` — product requirements
- `docs/ARCHITECTURE.md` — architecture + Apify constraints + cost analysis ($4.5/mo)
- `docs/UIUX.md` — design rationale + token system
- `docs/decisions/ADR-001..003` — stack, transport, data layer
- `docs/decisions/OPEN-DECISIONS.md` — outstanding questions (all resolved)
- `CONTRIBUTING.md` — how to submit a new promo
- `CODE_OF_CONDUCT.md` — Contributor Covenant v2.1

## Decisions Log

| ID | Decision |
|----|----------|
| D1-D8 | See PRD §13 / SPEC §13 |
| D9 | Monetization: **OSS + Hosted Convenience** (撤回原联盟返佣) — code MIT free, Apify paid Actor + WorkBuddy paid Skill |
| D10 | Free/paid boundary: result count + rate limit (no field-level paywall) |
| D11 | Payment routes: Apify Stripe → PayPal/US Bank; WorkBuddy → 微信支付 |
| **D12** | **Hosting model: Apify Standby → Pay-Per-Event + webServer. 基础成本 $0; 获得 Agentic Payments 资格 (x402 / Skyfire)** |

## Removed from MVP

- Affiliate links / 联盟返佣（entire `disclosure` field deprecated; UI §7 rewritten as project transparency stance）
- Email subscription (ICP + business email compliance → replaced by RSS + ICS)