# FaCT MCP — Nurture Baseline (Stage 0 KPI)

**Captured:** 2026-10-07 (Asia/Shanghai) · **Source of truth:** Apify `actors info` + local repo inspect + live endpoint probe
**Actor:** `U6XrDEcdKjN4YQIZU` (PUBLIC) · **GitHub:** `PanStories/free-and-cheap-tokens` (public) · **Sartbot:** featured ✅

## KPI baseline (the honest starting point)

| KPI | Value | Note |
|---|---|---|
| Total users (lifetime) | **1** | Severe under-adoption |
| Users (30d) | **0** | No recent pull |
| Total runs (lifetime) | **11** | ~11 calls since 2026-09-28 launch |
| Build | 1.1.15 / latest | Healthy |
| Pricing model | Pay-per-event | 8 billable events, correct & verified |
| Avg events/run | unknown | `chargedEventCounts` not exposed by `apify actors info` |
| GitHub stars | 0 (public, untracked) | No marketing push yet |
| GitHub issues | 0 | No feedback channel signal |
| Apify Store reviews | 0 | No social proof |
| Directory presence | 5 already live (free/auto): Apify Store · Sartbot featured · **Glama** (glama.ai/mcp/servers/wxf2ii1cok) · **LobeHub** (lobehub.com/zh/mcp/panstories-free-and-cheap-tokens) · **mcpservers.org** (mcpservers.org/servers/apify-com-neeenja-free-and-cheap-tokens) | **Remaining free/manual:** Smithery (no smithery.yaml) · PulseMCP/official-registry (no server.json) · **mcp.so $39 paid web-form avoided** (free GitHub-issue route optional) |
| README trilingual | ✅ EN→简→繁 | But **no version line** (preflight drift) |
| README Ko-fi/Sponsors link | ❌ missing | Apify description promises it — drift |
| llms.txt | ❌ absent | No B2A discovery hook |
| Server human-readable output | Chinese-only | English-first devs see Chinese cards (adoption blocker) |
| Endpoint health | 401 (alive) | Double-dash URL correct |

## What "good" looks like in 30 days (targets to set after sign-off)

| KPI | Baseline | 30d target (proposed) |
|---|---|---|
| Total users | 1 | ≥ 25 |
| Users (30d) | 0 | ≥ 15 |
| Total runs | 11 | ≥ 200 |
| Directory listings | 5 live (auto-indexed) | ≥ 7 (add Smithery + PulseMCP) |
| GitHub stars | 0 | ≥ 10 |

> These targets are proposals — boss to confirm before Stage 5 execution.
## 2026-10-09 weekly refresh (auto-nurture)
- Apify totalRuns: **~11 (API 返回非 JSON，沿用 10-07 基线)**；isPublic=true；taggedBuilds 含 latest ✅
- GitHub stars: 0（匿名 API 限流，沿用基线）；issues/PR 近 7d = 0
- M8ven: **Verified Publisher / Emerging**；README tokenized 验证行已正确 ✅（无需改）
- 注：FaCT Apify actor API 本次返回控制字符损坏负载，KPI 不可用，下轮复查。


## 2026-10-21 B4 refresh (Apify API now available)

> B4 was previously blocked: APIFY_TOKEN empty in automation sandbox. The token now
> resolves via `~/.apify/auth.json` (Apify `/users/me` → HTTP 200), so KPIs re-verified.

- **Actor:** `U6XrDEcdKjN4YQIZU` · **Apify totalRuns (live):** **17** (re-verified via `GET /v2/acts/U6XrDEcdKjN4YQIZU`)
- **Pricing (live pricingInfos):** PAY_PER_EVENT · 2 pricingInfos (mcp-search $0.005 + promo-catalog events: filter/get_promo/list_providers/recent_updates/expiring_soon $0.002-0.005, what_can_i_get $0.01).
- **M8ven:** README badge tokenized (panstories-free-and-cheap-tokens-10wb16?variant=verified&v=...) ✅ verified.
- GA4 / npm / mcpservers.org / Smithery remain boss-gated (B3/B5/B6) — see fix-attempt report.


## 2026-10-23 (Fri) weekly-light refresh
- **KPI (Apify totalRuns, live):** **20** (Δ +3 vs 2026-10-21 B4=17). Only FaCT & Cheapest moved this week; rest of combo flat.
- **GitHub:** 0 stars / 0 open issues / 0 open PRs (public, unauthenticated API). Flat.
- **M8ven:** README badge tokenized (panstories-free-and-cheap-tokens-10wb16?variant=verified&v=...) ✅ verified via live raw README curl.
- **Pricing:** no change (mcp-search $0.005 + promo events). Iron Law #4 honored — no pricing touched.
- **Discovery:** mcpservers.org FaCT listing now returns **200** (was 404 on 2026-10-16) — new passive listing. Glama probe inconclusive (000/bot-block). Smithery 308 (unchanged).
- GA4 (B5) / npm (B3) / Smithery+mcpservers-submit (B6) remain boss-gated. B2 (Ethics token) now RESOLVED.
