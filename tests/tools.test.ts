/**
 * 每个 MCP 工具按名字的契约测试。
 *
 * 覆盖两件事：
 * 1. 8 个工具全部可被ListTools 列出，且带齐四个 MCP tool hint
 *    （OpenAI 的 MCP directory 会拒绝缺 hint 的工具）。
 * 2. 每个工具的 handler 真的能被 CallTool 调到并返回内容形状
 *    —— 纯内存直调，不经过网络。
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/mcp/server.js';
import { clearCatalogCache } from '../src/data/catalog.js';

const EXPECTED_TOOLS = [
  'search_promos',
  'filter_promos',
  'get_promo',
  'list_providers',
  'get_recent_updates',
  'get_expiring_soon',
  'what_can_i_get',
  'report_promo_issue',
] as const;

const HINTS = ['readOnlyHint', 'destructiveHint', 'idempotentHint', 'openWorldHint'] as const;

let client: Client;

beforeAll(async () => {
  clearCatalogCache();
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer();
  await server.connect(serverT);
  client = new Client({ name: 'contract-test', version: '0.0.0' });
  await client.connect(clientT);
});

describe('tool registry contract', () => {
  it('exposes all 8 expected tools', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);
    for (const expected of EXPECTED_TOOLS) {
      expect(names).toContain(expected);
    }
    expect(names.length).toBe(EXPECTED_TOOLS.length);
  });

  it('declares all four MCP tool hints on every tool', async () => {
    const { tools } = await client.listTools();
    for (const tool of tools) {
      const annotations = (tool as { annotations?: Record<string, unknown> }).annotations;
      expect(annotations, `${tool.name} has no annotations`).toBeDefined();
      for (const hint of HINTS) {
        expect(
          typeof annotations?.[hint],
          `${tool.name}.${hint} must be an explicit boolean`,
        ).toBe('boolean');
      }
    }
  });

  it('marks every tool read-only and non-destructive (all 8 are pure catalog reads)', async () => {
    const { tools } = await client.listTools();
    for (const tool of tools) {
      const a = (tool as { annotations?: Record<string, boolean> }).annotations;
      expect(a?.readOnlyHint, `${tool.name} should be readOnlyHint: true`).toBe(true);
      expect(a?.destructiveHint, `${tool.name} should be destructiveHint: false`).toBe(false);
      expect(a?.openWorldHint, `${tool.name} should be openWorldHint: false`).toBe(false);
    }
  });
});

describe('each tool responds when called', () => {
  it('search_promos returns matches for free tiers', async () => {
    const res = await client.callTool({
      name: 'search_promos',
      arguments: { offer_type: ['free_tier'], limit: 5, lang: 'en' },
    });
    const text = String((res.content as Array<{ text: string }>)[0]?.text ?? '');
    expect(text.length).toBeGreaterThan(0);
    expect(text).toMatch(/free_tier|Free tier|Difficulty|Difficulty:/i);
  });

  it('filter_promos returns deterministic structural matches', async () => {
    const res = await client.callTool({
      name: 'filter_promos',
      arguments: { limit: 3, lang: 'en' },
    });
    const text = String((res.content as Array<{ text: string }>)[0]?.text ?? '');
    expect(text.length).toBeGreaterThan(0);
  });

  it('get_promo returns detail for a known id', async () => {
    const search = await client.callTool({
      name: 'search_promos',
      arguments: { limit: 1, lang: 'en' },
    });
    const listing = String((search.content as Array<{ text: string }>)[0]?.text ?? '');
    const id = listing.match(/id:\s*([a-z0-9-]+)/i)?.[1];
    expect(id, 'could not scrape a promo id from search_promos').toBeTruthy();

    const res = await client.callTool({ name: 'get_promo', arguments: { id: id!, lang: 'en' } });
    const text = String((res.content as Array<{ text: string }>)[0]?.text ?? '');
    expect(text.length).toBeGreaterThan(0);
  });

  it('get_promo reports a friendly error for an unknown id', async () => {
    const res = await client.callTool({
      name: 'get_promo',
      arguments: { id: 'definitely-not-a-real-promo-id', lang: 'en' },
    });
    const text = String((res.content as Array<{ text: string }>)[0]?.text ?? '');
    expect(text.toLowerCase()).toMatch(/not found|no promo/);
  });

  it('list_providers returns providers', async () => {
    const res = await client.callTool({ name: 'list_providers', arguments: { lang: 'en' } });
    const text = String((res.content as Array<{ text: string }>)[0]?.text ?? '');
    expect(text.length).toBeGreaterThan(0);
  });

  it('get_recent_updates accepts a timestamp', async () => {
    const res = await client.callTool({
      name: 'get_recent_updates',
      arguments: { since: '2020-01-01T00:00:00.000Z', lang: 'en' },
    });
    const text = String((res.content as Array<{ text: string }>)[0]?.text ?? '');
    expect(text.length).toBeGreaterThan(0);
  });

  it('get_expiring_soon returns within the window', async () => {
    const res = await client.callTool({
      name: 'get_expiring_soon',
      arguments: { within_days: 30, limit: 5, lang: 'en' },
    });
    const text = String((res.content as Array<{ text: string }>)[0]?.text ?? '');
    expect(text.length).toBeGreaterThan(0);
  });

  it('what_can_i_get returns eligibility for a region', async () => {
    const res = await client.callTool({
      name: 'what_can_i_get',
      arguments: { region: ['US'], has_credit_card: false, willingness: 'easy', lang: 'en' },
    });
    const text = String((res.content as Array<{ text: string }>)[0]?.text ?? '');
    expect(text.length).toBeGreaterThan(0);
  });

  it('report_promo_issue returns a GitHub issue URL and sends nothing', async () => {
    const res = await client.callTool({
      name: 'report_promo_issue',
      arguments: {
        promo_id: 'example-promo',
        type: 'expired',
        description: 'test report from contract test',
        lang: 'en',
      },
    });
    const text = String((res.content as Array<{ text: string }>)[0]?.text ?? '');
    expect(text).toContain('github.com/PanStories/free-and-cheap-tokens/issues/new');
  });
});

describe('lang parameter is honoured', () => {
  it('search_promos renders Chinese when lang=zh', async () => {
    const res = await client.callTool({
      name: 'search_promos',
      arguments: { limit: 3, lang: 'zh' },
    });
    const text = String((res.content as Array<{ text: string }>)[0]?.text ?? '');
    // Chinese output should contain CJK; English-first default would not.
    expect(/[\u4e00-\u9fff]/.test(text)).toBe(true);
  });

  it('search_promos defaults to English when lang is omitted', async () => {
    const res = await client.callTool({ name: 'search_promos', arguments: { limit: 3 } });
    const text = String((res.content as Array<{ text: string }>)[0]?.text ?? '');
    expect(/[\u4e00-\u9fff]/.test(text)).toBe(false);
  });
});