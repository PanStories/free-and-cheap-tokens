# Submitting a new promo · CONTRIBUTING

> [🇨🇳 中文版 →](CONTRIBUTING.md) · This is a curation project: new promos / revisions to expired items / rewording of terms are all welcome.
> We accept no paid placements, no affiliate links, no paid ranking. All inclusions are based on user value.

---

## How to submit a new promo

### 1. Fork & branch

```bash
git clone https://github.com/PanStories/free-and-cheap-tokens.git
cd free-and-cheap-tokens
git checkout -b add/<vendor-name>-<offer-name>
```

### 2. Create `<provider_id>-<offer_slug>.json` under `data/promos/`

Minimum skeleton (fill Chinese / English per target user):

```json
{
  "id": "provider-offer-slug",
  "provider": {
    "id": "provider",
    "name_en": "Provider English Name",
    "name_zh": "厂商中文名",
    "country": "US",
    "homepage": "https://example.com/"
  },
  "offer": {
    "type": "free_tier",
    "headline": "Free 200M tokens/month",
    "summary": "One-sentence summary of how to claim and how much you get",
    "value_display": "200M tokens/month",
    "no_fixed_expiry": true,
    "claim_url": "https://example.com/signup"
  },
  "terms": [],
  "difficulty": "easy",
  "region": { "availability": "global" },
  "categories": ["llm"],
  "status": "active",
  "verification": {
    "status": "verified",
    "method": "human",
    "confidence": "high",
    "last_verified_at": "2026-09-28T08:00:00Z"
  },
  "disclosure": { "affiliate": false },
  "provenance": {
    "source_urls": ["https://example.com/pricing"],
    "first_seen_at": "2026-09-28T00:00:00Z",
    "review_required": false
  },
  "created_at": "2026-09-28T00:00:00Z",
  "updated_at": "2026-09-28T00:00:00Z"
}
```

Full field definitions: [`schemas/promo.schema.json`](schemas/promo.schema.json).

### 3. Run local validation

```bash
node scripts/build-catalog.mjs --check
node scripts/check-p0.mjs
```

If the first line fails, **read the error message first and fix the JSON**, do not disable the validator.

### 4. Open the PR

Answer three things in the PR description:

1. **Why is this worth including?** (user value / difficulty / region)
2. **How did you verify?** (commands run manually / screenshots / timestamps)
3. **Who can corroborate?** (your GitHub handle, are you willing to make a test account public)

Template:

```markdown
## New promo: <headline>

**Provider**: <name>
**Region**: <region>
**Onboarding difficulty**: <easy / medium / hard>
**Verified at**: <date>
**Verification method**: Manually registered and obtained key; see steps below

### How to claim
1. ...
2. ...

### Charge-prevention / harassment-prevention checklist
- ...
```

### 5. Wait for CI pass + maintainer review

CI runs: typecheck / lint / vitest / P0 redline / build:catalog --check
Any failure → automatically flagged red.

---

## Editing an existing promo

Any field can be edited. Focus on `verification.last_verified_at` and `updated_at`:

- Changed `headline` / `value_display` / `claim_url` / `terms` → `last_verified_at` must update
- Changed `expires_at` → simultaneously check whether `status` should change to `expiring_soon` or `expired`
- Changed `region` → state in PR description which country / region's availability changed

---

## "Hunting rules" (over-hunting backfires on the ecosystem)

⚠️ **Please follow**:

- Don't repeatedly claim the same promo with the same identity (vendors track this)
- Don't script bulk claiming (vendors will ban IPs / kill promos)
- Don't use promos for commercial resale (**AWS APN and others explicitly forbid resale**)

See [`SPEC.md`](SPEC.md) §3 Out-of-Scope for details.

---

## Style guide

- `id` uses `<provider>-<offer>-<variant>` three lowercase segments: e.g. `siliconflow-free-tier`
- `headline` **must contain concrete numbers** ("Free 2M tokens" not "Free tokens")
- `summary` ≤ 100 chars, plain and direct
- Term tags must come from the 22 controlled words; if not in the list, don't add them
- All dates in ISO 8601 (with timezone)
- URLs must be https
- No affiliate links / no affiliate tags

---

## Code of Conduct

See [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

---

## Copyright

Submitting is considered consent to publish your contribution under the MIT license.
