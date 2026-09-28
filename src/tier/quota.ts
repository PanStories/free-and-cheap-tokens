/**
 * Tier/quota logic: free vs paid.
 *
 * Source of truth (v1.1.0):
 *   - FREE: ≤ 10 results / 100 calls / 24h per IP+UA hash
 *     - For PPE Actor: "free" means the Agent didn't bring an Apify user token
 *       → return a degraded result (≤ 10 hits, no confidence field, no expiring
 *         alerts past 7 days) AND trigger Actor.charge() with eventName (we
 *         still bill events, but at lower prices — TBD by paid-tier policy)
 *   - PAID: valid Apify user token OR WorkBuddy Pro subscription header
 *
 * Implementation principle: All authentication lives in platform layer (Apify /
 * WorkBuddy). This module only recognizes "paid status", never stores tokens.
 *
 * Note on v1.1.0 PPE shift:
 *   - In PPE mode, Apify already authenticated the request before reaching us
 *     (via the Authorization: Bearer header). The "free vs paid" distinction
 *     here becomes "tier-aware response shaping" — both tiers still pay per
 *     event via Actor.charge().
 */

import type { IncomingMessage } from 'node:http';
import { createHash } from 'node:crypto';
import type { Catalog } from '../data/types.js';

const APIFY_TOKEN_RE = /^Bearer\s+(.+)$/i;

/**
 * Current request tier, set by the platform layer (handler.ts / index.ts)
 * right after authentication and before tool dispatch. `isPaidCaller()` is
 * consumed deep inside tool handlers that have no access to the HTTP request.
 * Per-process mutable state is acceptable: stateless per request, and the
 * platform layer always sets it before dispatch.
 */
let _tierIsPaid = false;

export function setTierIsPaid(v: boolean): void {
  _tierIsPaid = v;
}

export function isPaidCaller(): boolean {
  return _tierIsPaid;
}

export interface CallerContext {
  ip: string;
  userAgent: string;
  /** Bearer token from Authorization header (if present) */
  apifyToken?: string;
  /** X-WorkBuddy-Subscription header value (if present) */
  workbuddySubscription?: 'free' | 'pro';
  /** True if any paid-tier signal is present */
  isPaid: boolean;
}

export interface TaxRequestInput {
  method: string;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
  catalog: Catalog;
}

export interface TaxRequestResult {
  allowed: boolean;
  status: number;
  payload: unknown;
  tier: 'free' | 'paid';
}

/**
 * Parse caller identity from an HTTP request. Stateless — no global state.
 */
export function parseCallerContext(req: IncomingMessage): CallerContext {
  const headers = req.headers;
  const ip =
    (headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  const userAgent = (headers['user-agent'] as string | undefined) ?? 'unknown';

  const auth = headers['authorization'] as string | undefined;
  const apifyToken = auth ? APIFY_TOKEN_RE.exec(auth)?.[1] : undefined;

  const subHeader = headers['x-workbuddy-subscription'] as string | undefined;
  const workbuddySubscription =
    subHeader === 'pro' || subHeader === 'free' ? subHeader : undefined;

  const isPaid = Boolean(apifyToken) || workbuddySubscription === 'pro';

  return { ip, userAgent, apifyToken, workbuddySubscription, isPaid };
}

/**
 * SHA-256 caller hash (first 16 hex chars) — for rate-limit bucketing.
 * First-party only; never persisted.
 */
export function callerHash(ctx: CallerContext): string {
  return createHash('sha256')
    .update(`${ctx.ip}|${ctx.userAgent}|${ctx.apifyToken ?? ''}|${ctx.workbuddySubscription ?? ''}`)
    .digest('hex')
    .slice(0, 16);
}

/**
 * Tier decision for an MCP request.
 *
 * Returns:
 *   - allowed=true → proceed to handler
 *   - allowed=false → return payload to client (status + body)
 *
 * In v1.1.0 PPE mode, free tier is NOT rejected — it's **shaped** (≤ 10 hits).
 * Paid tier gets full data including `verification.confidence` and 30-day alerts.
 */
export function requireTier(input: TaxRequestInput): TaxRequestResult {
  const auth = input.headers['authorization'] as string | undefined;
  const sub = input.headers['x-workbuddy-subscription'] as string | undefined;
  const isPaid = Boolean(auth && APIFY_TOKEN_RE.test(auth)) || sub === 'pro';

  // Always allowed; tier only shapes the response.
  return {
    allowed: true,
    status: 200,
    payload: null,
    tier: isPaid ? 'paid' : 'free',
  };
}