# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | ✅ Active          |

## Reporting a Vulnerability

If you discover a security vulnerability, **please do not open a public Issue**. Instead:

1. Email: `security@freeandcheaptokens.dev` (placeholder — replace with real address once configured)
2. Or open a [GitHub Security Advisory](https://github.com/PanStories/free-and-cheap-tokens/security/advisories/new) (private)

We will acknowledge within 48 hours and provide a remediation plan within 7 days.

## Threat Model

This service has a **minimal attack surface**:

- **Read-only data** — promos are static curated JSON, no user input is stored
- **Stateless transport** — every MCP request is independent; no session, no cookies, no IP+UA storage beyond the 24h rate-limit window (memory only)
- **No third-party trackers** — first-party only, GDPR/ePrivacy clean by design
- **Origin / Host whitelist** — DNS rebinding protection at the Express layer (SDK 1.30.1 marked `enableDnsRebindingProtection` deprecated, so we implement our own)
- **Bearer token required** — every Apify Standby request goes through Apify's gateway with mandatory Authorization header
- **No user accounts** — we don't hold credentials, don't store PII, don't run a database

## Privacy

We collect **nothing** about end users:

- No analytics
- No cookies (only first-party `?ref=share` query param for share-source tracking, never sent to third parties)
- No IP storage (used transiently for rate limiting, then dropped)
- No User-Agent storage (used transiently for rate limiting)

Each promo's `claim_url` is the provider's own official URL — when a user clicks through, they leave our service and the provider's privacy policy applies.

## Compliance

- **Open source (MIT)** — code auditable
- **No hard-coded secrets** — all deployment config via env vars / KVS
- **Schema-locked data** — ajv strict validation rejects malformed promos at build time
- **P0 self-check on CI** — emoji / purple-pink gradient / bounce easing / placeholder text blocked from design deliverables

## Acknowledgments

We credit reporters of valid security issues in `CHANGELOG.md` (with permission).