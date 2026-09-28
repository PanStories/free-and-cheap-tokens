# Spec — Free & Cheap Tokens v1.1.0

> [🇨🇳 中文版 →](SPEC.md) · Generated 2026-09-28
> Based on: PRD v3 + ARCHITECTURE v3 + UIUX v3 + promo.schema.json v1
> Status: **Confirmed / Locked** (user v3 monetization ruling + v1.1.0 PPE switch landed)
> Reference repo: `<github-user>/<github-repo>`

---

## 1. Product definition

- **One-liner**: Help AI Agents and non-technical users discover **free tiers & cheap token promos** for AI model / inference services worldwide. Every record has a structured provider, normalized terms, onboarding difficulty, region availability, expiry timestamp, and "how to claim" steps.
- **Target users**: ① Non-technical subscribers (very basic technical skills) ② Indie developers / deal hunters ③ AI Agents (machine consumers) ④ Recommenders (spreading side)
- **Core problem**: Existing aggregators either expire without labels, give raw Markdown without structured fields, lack onboarding-difficulty classification, miss region tagging, or can't be consumed programmatically by Agents.

---

## 2. MVP scope (locked — anything not in this list is OUT)

| Priority | Feature | Acceptance summary | RICE |
|----------|---------|---------------------|------|
| **P0** | Promo data model + JSON Schema validation | Draft 2020-12, draft-07 compatible; 12 illegal samples must all be rejected; conditional assertions (`affiliate` nesting, `expires_at` mutual exclusion, etc.) land | 6.00 |
| **P0** | MCP server (8 tools / 4 resources / 3 prompts) | Registered via `@modelcontextprotocol/sdk@1.30.1`; Streamable HTTP + stateless; each response includes `structuredContent` + human summary | 6.75 |
| **P0** | Difficulty rating + Agent fallback path (hard must have `agent_degraded_path`) | Three-state enum + triple visual encoding (shape/text/color); hard items missing fallback → Schema rejects | 12.00 |
| **P0** | Region disclosure (global / include / exclude three states) | `region.availability` enum + `countries[]` + `notes`; filter strictly matches structured fields, no substring match | 7.00 |
| **P0** | Real-time query (semantic + conditional filter + actionability) | `search_promos` supports semantic + field hybrid; `what_can_i_get` returns eligible / blocked_by / how_to_clear | 8.00 |
| **P0** | Expiry tracking (7-day lead-time alert / `no_fixed_expiry` for permanent free) | `get_expiring_soon` default 14-day window; `expires_at` and `no_fixed_expiry` mutually exclusive (Schema allOf constraint) | 5.33 |
| **P0** | Project transparency statement (replaces affiliate disclosure) | Site bar / card foot / share card / copy text **four places** consistently display "open source · no paid placements · no affiliate links" five points | 8.00 |
| **P0** | F15 scheduled refresh (discovery feed scope) | 6h GitHub Actions; output **all** marked `unverified`, only enters Skill prompt; does not enter the listing page | 4.27 |
| **P1** | Skill (daily brief / real-time query) | Skill manifest (WorkBuddy / Claude) daily 09:00 local TZ brief; wraps MCP primitives | 5.60 |
| **P1** | Daily listing page (static site + RSS + ICS) | Zero-dependency HTML/CSS/JS; includes share card; RSS covers active + expiring_soon; ICS 7-day lead-time VALARM | 3.60 |
| **P1** | Self-spreading mechanism (share card + agent_pitch + one-line install) | 1200×630 OG; `agent_pitch ≤ 120 chars`; `share_slug` + date stamp for tracking | 5.60 |
| **P1** | Data telemetry (PromoCallStats) | Only records caller, tool name, timestamp — no IP/UA stored | 5.00 |
| **P2** | OSS + Hosted Convenience dual-track paid | Apify paid Actor (PPE, per-event) + WorkBuddy paid Skill (WeChat Pay); **base cost $0** (no Standby) | — |

---

## 3. Explicit non-goals (Out-of-Scope — locked)

| Out-of-scope feature | Reason | When to revisit |
|----------------------|--------|----------------|
| **O1** Account proxying / claiming / hosted API keys | AWS APN forbids resale; vendor ToS forbids shared accounts | Never (architectural O2) |
| **O2** Proxying inference requests / reselling tokens | Would burn the ecosystem (C1 README first line warns) | Never |
| **O3** Self-built public shared keys | Same as O2 | Never |
| **O4** Model pricing comparison / performance benchmarks | Already done by promptibus + BenchLM | Never (unless re-researched) |
| **O5** Multi-level marketing / cash payouts / referral leaderboards | MLM risk | Never |
| **O6** Paid subscription walls / membership tiers | Monetization = Apify paid Actor + WorkBuddy paid Skill, payment happens at platform layer, **no user paywall** | Never |
| **O7** User account system | Platform ledger is not our ledger; Apify / WorkBuddy platform auth is enough | Never |
| **O8** Mobile native app | Zero-dependency static page covers it | Never |
| **O9** UGC comment community | Out of scope | v2.0 |
| **O10** Horizontal expansion into AI tool directory | C2 (yangmao.ai) stronghold | Never (focus on promos) |
| **O11** Endpoint liveness probing | C1 (cheahjs/free-llm-api-resources) does this | Never (separation of concerns) |
| **O12** Email subscription | Breaks zero-backend constraint + ICP filing + commercial email compliance | Replaced by RSS + ICS |

---

## 4. Technical architecture (locked — version-pinned)

| Layer | Tech | Pinned version | Lock reason |
|-------|------|----------------|-------------|
| Runtime | Node.js | **24.21.0 LTS** | Apify Actor `apify/actor-node:24-slim` image (PAY_PER_EVENT mode) |
| Language | TypeScript | **5.9.3** (deliberately not 7.0.2) | MVP doesn't introduce unknown type-check behavior changes |
| MCP SDK | `@modelcontextprotocol/sdk` | **1.30.1** | StreamableHTTPServerTransport current API shape; declares `2025-11-25` protocol version |
| Schema validation | `ajv` + `ajv-formats` | **8.20.0** / **3.0.1** | Draft 2020-12 official recommendation |
| HTTP | `express` | **5.2.1** | Simple & mature; `streamableHttp` routing is easy to hang |
| Data validation | `zod` | **4.6.5** | tool input schemas |
| Apify SDK | `apify` | **3.7.2** | `Actor.charge()` per-event billing support |
| CLI | `apify-cli` | **1.10.0** | Local debug / deploy |
| Lint | `eslint` | **10.11.0** | — |
| Format | `prettier` | **3.9.0** | — |
| Tests | `vitest` | **5.0.2** | Fast, TypeScript-friendly |
| OG image gen | `sharp` | **0.35.5** | **devDependency**, CI-only; not in container, not in site |
| Deployment | Apify **Pay-Per-Event Actor** + `webServer` | **No Standby → base cost $0**; each MCP tool call = 1 event; container not running when idle | v1.1.0 user ruling: Standby → PPE (see §13 D12) |
| Static site | Zero-dependency HTML/CSS/JS | — | User preference + privacy-as-compliance |
| Icons | Self-built inline SVG (`#i-*` 24px 1.5px stroke) | — | Converges with "zero dependency" to one answer |
| Fonts | System font fallback chain (Inter/JetBrains Mono **NOT** shipped) | — | No CDN |
| CI refresh | GitHub Actions | `cron: '0 */6 * * *'` | Public repo, no minutes cap, $0 cost |

---

## 5. API endpoint list (locked — only authoritative reference for dev)

> MCP primitives (replaces traditional HTTP API):

### Tools (8)

| Tool | Input | Output |
|------|-------|--------|
| `search_promos` | `{ query?: string, region?: string[], difficulty?: enum[], requires_credit_card?: boolean, provider_id?: string, expires_within_days?: number, categories?: enum[], limit?: number, cursor?: string }` | `{ structuredContent: { results: PromoSummary[], total, cursor }, content: [{ type: 'text', text: 'human summary' }] }` |
| `filter_promos` | `{ region: string[], difficulty: enum[], requires_credit_card?: boolean, expires_within_days?: number, sort: enum, limit?: number }` | Same as `search_promos` |
| `get_promo` | `{ id: string }` | `{ structuredContent: PromoFull, content: [...] }` |
| `list_providers` | `{ country?: string }` | `{ structuredContent: { providers: Provider[] } }` |
| `get_recent_updates` | `{ since: ISO8601, type?: enum }` | `{ structuredContent: { updates: UpdateEvent[] } }` |
| `get_expiring_soon` | `{ within_days: number, region?: string[] }` | Same as `search_promos` |
| `what_can_i_get` | `{ region: string[], has_credit_card: boolean, willingness: enum, categories?: enum[] }` | `{ structuredContent: { eligible: Promo[], blocked_by: Array<{promo_id, blocking_terms[]}>, how_to_clear: Promo[] }, content: [...] }` |
| `report_promo_issue` | `{ promo_id: string, type: enum, description: string }` | `{ structuredContent: { ticket_url: string } }` |

### Resources (4)

| URI | MIME | Content |
|-----|------|---------|
| `catalog://snapshot` | `application/json` | Full catalog metadata (provider count, promo count, last update) |
| `catalog://daily/{date}` | `text/markdown` | Today's listing Markdown (same source as listing page) |
| `schema://promo` | `application/schema+json` | Currently effective promo.schema.json |
| `providers://index` | `application/json` | Provider index (zh/en names, country, promo count) |

### Prompts (3)

| Name | Args | Template summary |
|------|------|------------------|
| `daily-deal-brief` | `{ date?: string, region?: string }` | Fetch `catalog://daily/{date}` → let Agent summarize in ≤200 chars |
| `pick-for-me` | `{ region, has_card, willingness }` | Call `what_can_i_get` → let Agent output ≤3 in "I'd recommend X because…" tone |
| `explain-terms` | `{ promo_id }` | Call `get_promo` → let Agent explain `terms[]` 22 controlled words in plain language |

> **This service has no traditional HTTP REST API**. All calls go through MCP Streamable HTTP (`POST /mcp`). Zero-call proxy at runtime: MCP server deployed as Apify Pay-Per-Event Actor, each HTTP request triggers one Actor run, billed per event (see §4 deployment row + §13 D12). Public static listing page HTML / RSS / ICS are **inlined into static files at build time** by `scripts/build-site.mjs` — zero runtime requests.

---

## 6. Database table list (locked)

> **This service holds no database**. The curated library = JSON files inside the Git repo, organized by directory:

| Directory / file | Content | Validation |
|------------------|---------|------------|
| `data/promos/*.json` | One promo per file (Draft 2020-12 compliant sample) | `ajv` strict validation |
| `data/providers/*.json` | One provider per file | `ajv` |
| `data/changelog/*.md` | Daily change log | not validated |
| `build/catalog.json` | **Read-only** aggregate generated at build time (with sha256 checksum) | Consistency check |
| `.kv/catalog.json` (Apify KVS) | Same content as `build/catalog.json`, fetched once at startup, checksum compared every 6h | checksum comparison |

---

## 7. Page list (locked)

> **The only** visualization is the zero-dependency static listing page:

| Page | Route (GitHub Pages) | Core components | Data source |
|------|----------------------|-----------------|-------------|
| **Daily listing page** | `/` | sticky transparency bar → page head (wordmark / update time / search / share) → stat cards ×4 → sticky filter → grouped list → footer | Build-time inline `build/catalog.json` |
| **RSS feed** | `/feed.xml` | — | Same as above, filter `status=active|expiring_soon` |
| **ICS calendar** | `/promos.ics` | — | Same as above, filter `expires_at != null && expiry_type ∈ {fixed_date, rolling_window}` |
| **OG share card** | `/og.png` | 1200×630 PNG | `scripts/generate-og.mjs` (CI only, sharp) |
| **Project transparency statement** | `/transparency` (anchor + footer repeat) | — | Consistent with §7 stance |

---

## 8. Design tokens (locked)

> See `design/design-tokens.json` + `design/design-tokens.css`. Summary:

- **Primary color**: Petrol `#0B6E8F` (deep petrol-blue, deliberately avoids Indigo/Purple)
- **Background**: `#F5F6F8` (cool light gray); **Foreground**: `#15181D` (cool-tinted near-black)
- **Semantic colors**: success `#177245` / warn `#9A5B00` / danger `#B42318`
- **Fonts**: System fallback chain (`-apple-system / Segoe UI / PingFang SC / Noto Sans SC`), body min 14px, numbers use `tabular-nums`
- **Icon library**: `#i-*` self-built inline SVG (24px grid / 1.5px stroke / semantic naming)
- **Theme**: Light (user prefers light IDE / delivery environment); dark tokens reserved but not enabled
- **Reference**: Stripe Dashboard + Linear + Bloomberg Terminal light version

---

## 9. Acceptance criteria (locked — only authoritative reference for QA)

> EARS format (Easy Approach to Requirements Syntax)

| ID | Feature | EARS acceptance criterion | Priority |
|----|---------|---------------------------|----------|
| AC-01 | Schema validation | **While** loading any `data/promos/*.json`, **the system shall** validate all fields via ajv; conditional assertions (`disclosure.affiliate === true ⇒ disclosure_text required`, etc.) must fire | P0 |
| AC-02 | MCP tools registered | **While** MCP server starts, **the system shall** expose 8 tools / 4 resources / 3 prompts, all `listChanged: false` | P0 |
| AC-03 | Streamable HTTP | **When** client sends `POST /mcp` with valid `initialize` request, **the system shall** return `200 + protocolVersion: '2025-11-25'` within 5 seconds | P0 |
| AC-04 | Authentication | **If** request lacks `Authorization: Bearer` or token invalid, **the system shall** return `401` (from Apify Store caller auth) | P0 |
| AC-05 | Statelessness | **While** receiving any request, **the system shall** read / write no session; behavior unchanged after process restart | P0 |
| AC-06 | search_promos | **When** calling `search_promos({ query: 'free embedding' })`, **the system shall** return ≥1 embedding prom with complete structured fields | P0 |
| AC-07 | filter_promos | **When** calling `filter_promos({ region: ['CN'], difficulty: ['easy'] })`, **the system shall** only return entries where region.include contains CN **and** difficulty === easy | P0 |
| AC-08 | what_can_i_get | **When** calling `what_can_i_get({ region: ['CN'], has_credit_card: false, willingness: 'easy' })`, **the system shall** return eligible + blocked_by + how_to_clear; blocked_by must include blocking term names | P0 |
| AC-09 | get_expiring_soon | **When** calling `get_expiring_soon({ within_days: 14 })`, **the system shall** only return entries with `expires_at` in the next 14 days **and** `status ∈ {active, expiring_soon}` | P0 |
| AC-10 | Difficulty visual encoding | **While** rendering promo cards, **the system shall** display triple visual encoding (shape + text + color), still readable in grayscale (WCAG 1.4.1 Level A) | P0 |
| AC-11 | Region three-state filter | **While** user selects region in filter bar, **the system shall** match by structured fields (availability/countries), **not** by substring | P0 |
| AC-12 | Expiry countdown | **When** `expires_at` is past, **the system shall** display "Expired" pill and deprioritize from default sort | P0 |
| AC-13 | Project transparency statement | **While** user visits any site page, **the system shall** consistently display "open source · no paid placements · no affiliate links" five points in **four places**: sticky bar / card foot / share card / copy text (replaces original affiliate disclosure) | P0 |
| AC-14 | Daily listing page gen | **When** running `node scripts/build-site.mjs`, **the system shall** generate `site/index.html`, `site/feed.xml`, `site/promos.ics`, `site/og.png` | P0 |
| AC-15 | RSS content | **While** generating `site/feed.xml`, **the system shall** only include `status ∈ {active, expiring_soon}` promos; each entry has `title / value_display / difficulty / expires_at / last_verified_at / share_slug` | P0 |
| AC-16 | ICS events | **While** generating `site/promos.ics`, **the system shall** generate one VEVENT per promo with `expires_at != null`, 7-day lead-time VALARM; `no_fixed_expiry=true` promos do not generate events | P0 |
| AC-17 | Build failure isolation | **If** RSS / ICS generation fails, **the system shall** still complete the main build (listing page) successfully; error logged | P1 |
| AC-18 | Refresh output all unverified | **When** running `node scripts/refresh.mjs`, **the system shall** output all promos with `verification.status === 'unverified'` and `provenance.review_required === true`; does not enter listing page / not in MCP default return | P0 |
| AC-19 | unverified → active only human | **If** any automated flow attempts to change `status` from `unverified` to `active`, **the system shall** break in CI and report error (this is a hard constraint) | P0 |
| AC-20 | Paid event billing | **When** any tool is called, **the system shall** call `Actor.charge({ eventName: 'mcp-search' \| 'mcp-filter' \| ... })`; developer pre-sets unit price, Apify Store deducts then settles (incl. platform commission) | P0 |
| AC-21 | Zero base cost | **When** no MCP call, **the system shall** incur zero cost on Apify side (no Standby billing, no idle container) | P0 |
| AC-22 | Agentic Payments eligibility | **The system shall** not use Standby, not use full permissions, pricing only by event (not platform usage), meeting Apify Agentic Payments eligibility; KYC done by developer personally | P1 |
| AC-23 | P0 self-check | **While** CI runs `node scripts/check-p0.mjs`, **the system shall** output `FAIL: 0` (emoji / purple-pink gradient / bounce easing / placeholder text / `↗` as icon) | P0 |
| AC-24 | Schema locked **once** | **The system shall** only maintain `schemas/promo.schema.json` (Draft 2020-12); runtime references this single source; no copies maintained | P0 |

---

## 10. Boundaries & constraints

- No IE / old Edge support (Chromium-based + Firefox + Safari only)
- Responsive breakpoints: 640px / 1024px / 1440px (mobile-first)
- Performance target: listing page LCP < 2.5s (4G simulation); MCP tool p95 < 500ms
- Compliance constraints: no affiliate / no paid placements / no paid sorting (written into project transparency statement)
- Security constraints: DNS rebinding protection (Express layer `Origin` / `Host` whitelist)
- Privacy constraints: zero third-party cookie / tracker; compliant first-party cookie only for `?ref=share` channel tracking

---

## 11. Embedded known pitfalls

> This project has no historical pitfall library (`pitfalls.jsonl` not yet created; DevOps maintains post-MVP).
> Pitfalls the implementation team must be alert to:

| Pitfall | Signature | Prevention |
|---------|-----------|------------|
| ~~Apify Actor hostname locked at 1024MB~~ | **Decommissioned (v1.1.0)** — PPE mode has no Standby, no idle container size issue | — |
| ~~Standby concurrency >3 pre-spawns new run~~ | **Decommissioned (v1.1.0)** — PPE each request independent run | — |
| PPE cold start 2-4s / request | `apify/ppe-cold-start` | MVP acceptable; high-frequency callers switch to `npx free-and-cheap-tokens` (stdio) |
| MCP client doesn't support Bearer token | `mcp/bearer-required-by-server` | Recommend `npx mcp-remote` bridge; stated in README |
| Actor.charge event undefined | `apify/missing-pricing-events` | CI validates `actor.json`'s `pricingEvents` field completeness |
| TypeScript 7.0.2 major version switch | `ts/7-breaking-changes` | Pin 5.9.3 |
| Express 5 async middleware | `express/5-async-handler-required` | Routes use `express-async-errors` or self-wrap |
| ajv Draft 2020-12 vs draft-07 | `ajv/draft-mismatch` | Unify meta-schema URL |
| Build-time OG generation time blowup | `sharp/cold-start` | CI only, output committed to repo |

---

## 12. End-to-end verification steps (Spec-locked final item)

```bash
# 0. Install
cd MCP-Free-and-Cheap-Tokens
npm ci

# 1. Type check
npx tsc --noEmit
# Assert: 0 errors

# 2. Unit tests
npx vitest run
# Assert: all cases pass; Schema cases cover 12 illegal samples

# 3. P0 redline self-check
node scripts/check-p0.mjs
# Assert: FAIL: 0

# 4. Build curated catalog
node scripts/build-catalog.mjs
# Assert: build/catalog.json generated; sha256 output

# 5. Build static site (now generates both /index.html zh + /en.html)
node scripts/build-site.mjs
# Assert: site/{index.html, en.html, styles.css, app.js, feed.xml, promos.ics, og.png} all present
# Assert: feed.xml contains status=active|expiring_soon entries
# Assert: promos.ics excludes no_fixed_expiry=true entries

# 6. Local MCP server (stdio)
npm run dev
# Assert: stdio transport starts; configured per mcp.json client connects

# 7. Core success flows (caller perspective)
#   - search_promos({query:'free embedding'})
#   - filter_promos({region:['CN'],difficulty:['easy']})
#   - get_promo({id:'siliconflow-free-tier'})
#   - what_can_i_get({region:['CN'],has_credit_card:false,willingness:'easy'})
# Assert: each returns structuredContent + content[0].text

# 8. Critical error flows
#   - get_promo({id:'non-existent'}) → structuredContent.error + text "promo not found"
#   - Missing Authorization → 401
#   - Input zod validation failure → -32602 Invalid params

# 9. Deploy (CI auto)
#   - push to main → .github/workflows/build-site.yml runs → artifact deploys to gh-pages
#   - Apify Actor deploy (manual / apify-cli) → Task hostname 256MB
```

---

## 13. Change log

| Date | Change | Reason | Impact |
|------|--------|--------|--------|
| 2026-09-28 | Initial v1.0 generation (based on approved three-doc output) | Phase 1 research complete | All |
| 2026-09-28 | D9: Monetization route changed to OSS + Hosted Convenience | User ruling (withdrawn affiliate) | §3, §5 (paid), §13.3 |
| 2026-09-28 | Schema `disclosure` marked deprecated | Same as D9 | §6 |
| 2026-09-28 | UIUX §7 changed to "Project Transparency Statement" | Same as D9 | §7, §9 AC-13 |
| 2026-09-28 | **v1.1.0 deployment switch: Apify Standby → Pay-Per-Event + webServer.** Base cost $0; gains Agentic Payments eligibility (x402/Skyfire) | User ruling: "I don't want to pay Apify anything except for the commisions for each sale or pay per event" | §4 deployment row, §9 AC-20/21/22, §11 (C2/C3/C4 retired) |

---

## License

MIT — see [`LICENSE`](LICENSE).
