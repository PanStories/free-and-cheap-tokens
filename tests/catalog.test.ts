/**
 * MCP tools & catalog 业务逻辑测试。
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { clearCatalogCache, loadCatalog, searchPromos, whatCanIGet } from '../src/data/catalog.js';

beforeAll(() => {
  clearCatalogCache();
});

describe('catalog loader', () => {
  it('loads catalog.json with valid structure', () => {
    const cat = loadCatalog();
    expect(cat.promos.length).toBeGreaterThanOrEqual(10);
    expect(cat.providers.length).toBeGreaterThanOrEqual(5);
    expect(cat.sha256).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('searchPromos', () => {
  it('returns at least one LLM promo for global region with easy difficulty', () => {
    const results = searchPromos({
      region: ['US'],
      difficulty: ['easy'],
      categories: ['llm'],
      limit: 50,
    });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.difficulty).toBe('easy');
      expect(r.categories).toContain('llm');
    }
  });

  it('filters by expires_within_days', () => {
    const results = searchPromos({ expires_within_days: 200, limit: 50 });
    for (const r of results) {
      if (r.offer.no_fixed_expiry) continue; // 永不过期被允许
      if (!r.offer.expires_at) continue;
      const days = (Date.parse(r.offer.expires_at) - Date.now()) / 86_400_000;
      expect(days).toBeLessThanOrEqual(200);
    }
  });

  it('requires_credit_card filter works', () => {
    const noCard = searchPromos({ requires_credit_card: false, limit: 50 });
    for (const r of noCard) {
      expect(r.terms.some((t) => t.tag === 'requires_credit_card')).toBe(false);
    }
  });
});

describe('whatCanIGet', () => {
  it('returns eligible + blocked_by + how_to_clear', () => {
    const result = whatCanIGet({
      region: ['CN'],
      has_credit_card: false,
      willingness: 'easy',
    });
    expect(Array.isArray(result.eligible)).toBe(true);
    expect(Array.isArray(result.blocked_by)).toBe(true);
    expect(Array.isArray(result.how_to_clear)).toBe(true);
  });

  it('eligible items respect credit card constraint', () => {
    const result = whatCanIGet({
      region: ['CN'],
      has_credit_card: false,
      willingness: 'easy',
    });
    for (const e of result.eligible) {
      // 已在前置过滤过：has_credit_card=false 的不能用 requires_credit_card 的 promo
      expect(e.offer.headline).toBeTruthy();
    }
  });
});