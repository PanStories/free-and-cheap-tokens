/**
 * Catalog loader：读 `build/catalog.json`，提供 search / filter / get。
 *
 * 设计原则（详见 SPEC §6）：
 *   - 不持有可变状态；catalog 一旦构建即只读
 *   - 不在请求路径上抓网页（Apify C3 约束）
 *   - 失败时返回结构化错误，不抛
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import type {
  Catalog,
  Promo,
  PromoSummary,
  PromoFull,
  Difficulty,
  Category,
  CountryCode,
  OfferType,
} from './types.js';
import { validatePromo } from './validate.js';

const here = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = join(here, '..', '..', 'build', 'catalog.json');

export class CatalogLoadError extends Error {
  constructor(message: string, public readonly path: string) {
    super(`${message} (path=${path})`);
    this.name = 'CatalogLoadError';
  }
}

let _catalog: Catalog | null = null;

export function loadCatalog(): Catalog {
  if (_catalog) return _catalog;

  if (!existsSync(CATALOG_PATH)) {
    throw new CatalogLoadError('catalog.json not found — run `npm run build:catalog` first', CATALOG_PATH);
  }

  const raw = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  if (!raw || typeof raw !== 'object') {
    throw new CatalogLoadError('catalog.json is not a JSON object', CATALOG_PATH);
  }

  // 重新校验每条 promo（构建期已校验，这里兜底防中间人篡改）
  const errors: string[] = [];
  for (const p of raw.promos ?? []) {
    const v = validatePromo(p);
    if (!v.ok) errors.push(`${p?.id ?? '<no-id>'}: ${v.errors.join('; ')}`);
  }
  if (errors.length) {
    throw new CatalogLoadError(
      `catalog.json contains ${errors.length} invalid promo(s): ${errors.slice(0, 3).join(' | ')}`,
      CATALOG_PATH,
    );
  }

  _catalog = raw as Catalog;
  return _catalog;
}

export function clearCatalogCache(): void {
  _catalog = null;
}

// ────────────────────────────────────────────────────────────────────────────
// sha256 helper for build verification

export function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

// ────────────────────────────────────────────────────────────────────────────
// View projections（agent 友好：返回 Summary/Full，不返回完整 Promo 的内部字段）

export function toSummary(p: Promo): PromoSummary {
  return {
    id: p.id,
    provider: {
      id: p.provider.id,
      name_en: p.provider.name_en,
      name_zh: p.provider.name_zh ?? null,
      country: p.provider.country,
    },
    offer: {
      type: p.offer.type,
      headline: p.offer.headline,
      headline_en: p.offer.headline_en ?? null,
      summary: p.offer.summary ?? null,
      summary_en: p.offer.summary_en ?? null,
      value_display: p.offer.value_display ?? null,
      value_display_en: p.offer.value_display_en ?? null,
      expires_at: p.offer.expires_at ?? null,
      no_fixed_expiry: p.offer.no_fixed_expiry ?? false,
      claim_url: p.offer.claim_url,
    },
    difficulty: p.difficulty,
    region: p.region,
    categories: p.categories,
    status: p.status,
    verification: {
      status: p.verification.status,
      last_verified_at: p.verification.last_verified_at ?? null,
    },
  };
}

export function toFull(p: Promo): PromoFull {
  return {
    ...toSummary(p),
    terms: p.terms,
    estimated_setup_minutes: p.estimated_setup_minutes ?? null,
    difficulty_reasons: p.difficulty_reasons ?? [],
    actionability: p.actionability,
    provenance: {
      source_urls: p.provenance.source_urls,
      first_seen_at: p.provenance.first_seen_at,
      last_changed_at: p.provenance.last_changed_at ?? null,
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Filters

export interface SearchFilter {
  /** 自由文本 query，匹配 title / summary / provider name */
  query?: string;
  /** 区域过滤：availability=include 时返回 countries 含任一项；availability=exclude 时返回 excluded_countries 不含任一项 */
  region?: CountryCode[];
  difficulty?: Difficulty[];
  requires_credit_card?: boolean;
  provider_id?: string;
  /** 仅返回 expires_at 在未来 N 天内的条目；忽略已过期与 no_fixed_expiry */
  expires_within_days?: number;
  categories?: Category[];
  /** 默认排除 status=expired 与 status=unverified；除非显式 include */
  include_status?: Promo['status'][];
  /** 按 offer 类型过滤（如 ['free_tier'] 只看持久免费额度） */
  offer_type?: OfferType[];
  /** 默认 10；最大 50 */
  limit?: number;
}

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function withinExpiryWindow(p: Promo, withinDays: number): boolean {
  if (p.offer.no_fixed_expiry) return false;
  if (!p.offer.expires_at) return false;
  const exp = Date.parse(p.offer.expires_at);
  if (Number.isNaN(exp)) return false;
  const now = Date.now();
  return exp > now && exp - now <= withinDays * 86_400_000;
}

function regionMatches(p: Promo, regionFilter?: CountryCode[]): boolean {
  if (!regionFilter || regionFilter.length === 0) return true;
  const r = p.region;
  if (r.availability === 'global') return true;
  if (r.availability === 'include') {
    return regionFilter.some((c) => (r.countries ?? []).includes(c));
  }
  // 'exclude'
  return !regionFilter.some((c) => (r.excluded_countries ?? []).includes(c));
}

function requiresCreditCard(p: Promo): boolean {
  return p.terms.some((t) => t.tag === 'credit_card_required');
}

function matchesQuery(p: Promo, q: string): boolean {
  const ql = q.toLowerCase();
  const haystack = [
    p.offer.headline,
    p.offer.summary ?? '',
    p.provider.name_en,
    p.provider.name_zh ?? '',
    p.offer.value_display ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(ql);
}

const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'to', 'for', 'in', 'on', 'at', 'with', 'is', 'are',
  '免费', '试用', '额度', '赠送',
]);

/** 极简文本相关性：去掉停用词后剩余词的命中数 */
export function relevanceScore(p: Promo, q: string): number {
  if (!q) return 1;
  const tokens = q
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
  if (tokens.length === 0) return 1;
  const text = [
    p.offer.headline,
    p.offer.summary ?? '',
    p.provider.name_en,
    p.provider.name_zh ?? '',
    ...p.terms.map((t) => t.tag),
    ...p.categories,
  ]
    .join(' ')
    .toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (text.includes(t)) score += 1;
    // 标题命中权重
    if (p.offer.headline.toLowerCase().includes(t)) score += 2;
  }
  return score;
}

export function searchPromos(filter: SearchFilter): Promo[] {
  const cat = loadCatalog();
  const now = Date.now();
  const limit = Math.min(Math.max(filter.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

  const results: Array<{ p: Promo; score: number }> = [];

  for (const p of cat.promos) {
    // 默认排除 expired / unverified
    if (!filter.include_status?.length) {
      if (p.status === 'expired' || p.status === 'unverified') continue;
    } else if (!filter.include_status.includes(p.status)) {
      continue;
    }

    if (filter.query && !matchesQuery(p, filter.query)) continue;
    if (filter.provider_id && p.provider.id !== filter.provider_id) continue;
    if (filter.categories?.length && !filter.categories.some((c) => p.categories.includes(c))) continue;
    if (filter.offer_type?.length && !filter.offer_type.includes(p.offer.type)) continue;
    if (filter.difficulty?.length && !filter.difficulty.includes(p.difficulty)) continue;
    if (!regionMatches(p, filter.region)) continue;
    if (typeof filter.requires_credit_card === 'boolean') {
      if (filter.requires_credit_card !== requiresCreditCard(p)) continue;
    }
    if (typeof filter.expires_within_days === 'number') {
      if (!withinExpiryWindow(p, filter.expires_within_days)) continue;
    }

    // 已经过 expires_at 但 status 仍为 active 的条目：压低排序
    const exp = p.offer.expires_at ? Date.parse(p.offer.expires_at) : NaN;
    const expiredButFlagged = !Number.isNaN(exp) && exp < now && p.status !== 'expired';

    const score = (filter.query ? relevanceScore(p, filter.query) : 1) - (expiredButFlagged ? 100 : 0);
    results.push({ p, score });
  }

  // 默认排序：到期最近优先（no_fixed_expiry 排最后），其次按 status
  results.sort((a, b) => {
    const ax = a.p.offer.expires_at ? Date.parse(a.p.offer.expires_at) : Infinity;
    const bx = b.p.offer.expires_at ? Date.parse(b.p.offer.expires_at) : Infinity;
    return ax - bx || b.score - a.score;
  });

  return results.slice(0, limit).map((r) => r.p);
}

export function getPromoById(id: string): Promo | null {
  const cat = loadCatalog();
  return cat.promos.find((p) => p.id === id) ?? null;
}

export function listProviders(country?: CountryCode) {
  const cat = loadCatalog();
  const providers = country
    ? cat.providers.filter((p) => p.country === country)
    : cat.providers;
  return providers.map((pr) => ({
    ...pr,
    promo_count: cat.promos.filter((p) => p.provider.id === pr.id).length,
  }));
}

export function getRecentUpdates(since: string) {
  const cat = loadCatalog();
  const sinceMs = Date.parse(since);
  return cat.promos
    .filter((p) => {
      const t = Date.parse(p.updated_at);
      return !Number.isNaN(t) && t >= sinceMs;
    })
    .map((p) => ({
      id: p.id,
      provider: p.provider.name_en,
      updated_at: p.updated_at,
      status: p.status,
      headline: p.offer.headline,
    }));
}

// ────────────────────────────────────────────────────────────────────────────
// Actionability: what_can_i_get

export interface WhatCanEligibility {
  promo_id: string;
  headline: string;
  region_ok: boolean;
  no_card_ok: boolean;
  difficulty_ok: boolean;
  difficulty: Difficulty;
  claim_url: string;
}

export interface WhatCanResult {
  eligible: PromoSummary[];
  blocked_by: Array<{
    promo_id: string;
    headline: string;
    reasons: Array<{ kind: 'region' | 'credit_card' | 'difficulty' | 'other'; label: string; term_tag?: string }>;
  }>;
  how_to_clear: Array<{ promo_id: string; headline: string; unblock_steps: string[] }>;
}

export function whatCanIGet(opts: {
  region: CountryCode[];
  has_credit_card: boolean;
  willingness: Difficulty;
}): WhatCanResult {
  const eligible: PromoSummary[] = [];
  const blocked_by: WhatCanResult['blocked_by'] = [];
  const how_to_clear: WhatCanResult['how_to_clear'] = [];

  const willingnessRank: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
  const maxRank = willingnessRank[opts.willingness];

  for (const p of loadCatalog().promos) {
    if (p.status === 'expired' || p.status === 'unverified') continue;

    const reasons: WhatCanResult['blocked_by'][number]['reasons'] = [];
    let regionOk = false;
    let noCardOk = true;
    let diffOk = false;

    // 区域
    if (p.region.availability === 'global') regionOk = true;
    else if (p.region.availability === 'include') {
      regionOk = (p.region.countries ?? []).some((c) => opts.region.includes(c));
      if (!regionOk) reasons.push({ kind: 'region', label: `仅 ${(p.region.countries ?? []).join('/')} 可用` });
    } else {
      const excluded = p.region.excluded_countries ?? [];
      regionOk = !opts.region.some((c) => excluded.includes(c));
      if (!regionOk) reasons.push({ kind: 'region', label: `在 ${opts.region.join('/')} 不可用` });
    }

    // 信用卡
    const needsCard = p.terms.some((t) => t.tag === 'credit_card_required');
    noCardOk = !needsCard || opts.has_credit_card;
    if (!noCardOk) reasons.push({ kind: 'credit_card', label: '需要信用卡' });

    // 难度
    diffOk = willingnessRank[p.difficulty] <= maxRank;
    if (!diffOk) {
      reasons.push({
        kind: 'difficulty',
        label: `难度 ${p.difficulty} 超出你愿意的 ${opts.willingness}`,
        term_tag: undefined,
      });
    }

    const promoRank = willingnessRank[p.difficulty];
    const promotionPromo = p.difficulty === 'hard' && maxRank < promoRank;

    if (regionOk && noCardOk && diffOk) {
      eligible.push(toSummary(p));
    } else {
      blocked_by.push({
        promo_id: p.id,
        headline: p.offer.headline,
        reasons,
      });
      // 如何消除门槛
      const unblock: string[] = [];
      if (!regionOk && p.region.availability === 'include') {
        unblock.push('切换到列出的国家 IP');
      }
      if (!noCardOk) {
        unblock.push('开通一张虚拟信用卡（如 Wise / 招行全币种）');
      }
      if (!diffOk && p.actionability?.agent_degraded_path) {
        unblock.push(p.actionability.agent_degraded_path);
      }
      if (unblock.length) {
        how_to_clear.push({ promo_id: p.id, headline: p.offer.headline, unblock_steps: unblock });
      }
      // 给上层用的标记，TS 5.9 strict 需要"使用"以避免 unused 警告
      void promotionPromo;
    }
  }

  return { eligible, blocked_by, how_to_clear };
}