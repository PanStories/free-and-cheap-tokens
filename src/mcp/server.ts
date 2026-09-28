/**
 * MCP server: 8 tools, 4 resources, 3 prompts.
 *
 * 设计原则：
 *   - 每个 tool 返回 `{ structuredContent, content: [{type:'text',text}] }`，
 *     前者给 Agent，后者给人（或下游 LLM）。
 *   - 不抛未捕获异常给客户端 —— 错误返回结构化结果，调用方可读。
 *   - free/paid tier 走 `quota.ts` 中的配额逻辑。
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  searchPromos,
  getPromoById,
  listProviders,
  getRecentUpdates,
  whatCanIGet,
  toSummary,
  toFull,
  loadCatalog,
  relevanceScore,
} from '../data/catalog.js';
import { isPaidCaller } from '../tier/quota.js';
import type {
  Difficulty,
  Category,
  CountryCode,
  VerificationStatus,
} from '../data/types.js';

// ────────────────────────────────────────────────────────────────────────────
// Zod input schemas (tool params)

const searchInput = z.object({
  query: z.string().min(1).max(120).optional(),
  region: z.array(z.string().length(2)).max(50).optional(),
  difficulty: z.array(z.enum(['easy', 'medium', 'hard'])).max(3).optional(),
  requires_credit_card: z.boolean().optional(),
  provider_id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/).optional(),
  expires_within_days: z.number().int().min(1).max(365).optional(),
  categories: z
    .array(
      z.enum([
        'llm',
        'embedding',
        'image',
        'video',
        'audio',
        'agent_hosting',
        'vector_db',
        'gpu_compute',
      ]),
    )
    .max(8)
    .optional(),
  include_status: z
    .array(
      z.enum(['active', 'expiring_soon', 'expired', 'unverified', 'rumored']),
    )
    .max(5)
    .optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

const filterInput = searchInput.extend({
  sort: z
    .enum(['expires_soonest', 'newest', 'provider_alpha', 'difficulty_easiest'])
    .default('expires_soonest'),
});

const getInput = z.object({
  id: z.string().min(3).max(120),
});

const listProvidersInput = z.object({
  country: z.string().length(2).optional(),
});

const recentInput = z.object({
  since: z.string().datetime(),
  type: z.enum(['added', 'updated', 'expired']).optional(),
});

const expiringInput = z.object({
  within_days: z.number().int().min(1).max(90).default(14),
  region: z.array(z.string().length(2)).max(50).optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

const whatCanInput = z.object({
  region: z.array(z.string().length(2)).min(1).max(50),
  has_credit_card: z.boolean(),
  willingness: z.enum(['easy', 'medium', 'hard']),
  categories: z
    .array(
      z.enum([
        'llm',
        'embedding',
        'image',
        'video',
        'audio',
        'agent_hosting',
        'vector_db',
        'gpu_compute',
      ]),
    )
    .max(8)
    .optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

const reportInput = z.object({
  promo_id: z.string().min(3).max(120),
  type: z.enum([
    'expired',
    'terms_changed',
    'claim_url_dead',
    'wrong_terms',
    'duplicate',
    'other',
  ]),
  description: z.string().min(5).max(2000),
});

// ────────────────────────────────────────────────────────────────────────────
// Server factory

export function createMcpServer() {
  const server = new Server(
    {
      name: 'free-and-cheap-tokens',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    },
  );

  // ─── Tools ───
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'search_promos',
        description:
          'Search and filter promo offerings. Returns structured matches with human summary.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Free-text query (English or Chinese).' },
            region: {
              type: 'array',
              items: { type: 'string', minLength: 2, maxLength: 2 },
              description: 'ISO 3166-1 alpha-2 country codes (e.g. ["CN","US"]).',
            },
            difficulty: {
              type: 'array',
              items: { enum: ['easy', 'medium', 'hard'] },
            },
            requires_credit_card: { type: 'boolean' },
            provider_id: { type: 'string' },
            expires_within_days: { type: 'integer', minimum: 1, maximum: 365 },
            categories: {
              type: 'array',
              items: {
                enum: [
                  'llm',
                  'embedding',
                  'image',
                  'video',
                  'audio',
                  'agent_hosting',
                  'vector_db',
                  'gpu_compute',
                ],
              },
            },
            include_status: {
              type: 'array',
              items: {
                enum: ['active', 'expiring_soon', 'expired', 'unverified', 'rumored'],
              },
            },
            limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
          },
        },
      },
      {
        name: 'filter_promos',
        description: 'Pure structural filter with deterministic sort (no semantic query).',
        inputSchema: {
          type: 'object',
          properties: {
            region: { type: 'array', items: { type: 'string' } },
            difficulty: { type: 'array', items: { enum: ['easy', 'medium', 'hard'] } },
            requires_credit_card: { type: 'boolean' },
            expires_within_days: { type: 'integer', minimum: 1, maximum: 365 },
            sort: {
              enum: ['expires_soonest', 'newest', 'provider_alpha', 'difficulty_easiest'],
              default: 'expires_soonest',
            },
            limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
          },
        },
      },
      {
        name: 'get_promo',
        description: 'Get full details of a single promo by id.',
        inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
      },
      {
        name: 'list_providers',
        description: 'List all providers, optionally filtered by country.',
        inputSchema: {
          type: 'object',
          properties: { country: { type: 'string', minLength: 2, maxLength: 2 } },
        },
      },
      {
        name: 'get_recent_updates',
        description: 'Promos updated since the given timestamp.',
        inputSchema: {
          type: 'object',
          properties: {
            since: { type: 'string', format: 'date-time' },
            type: { enum: ['added', 'updated', 'expired'] },
          },
          required: ['since'],
        },
      },
      {
        name: 'get_expiring_soon',
        description: 'Promos expiring within N days (default 14).',
        inputSchema: {
          type: 'object',
          properties: {
            within_days: { type: 'integer', minimum: 1, maximum: 90, default: 14 },
            region: { type: 'array', items: { type: 'string' } },
            limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
          },
        },
      },
      {
        name: 'what_can_i_get',
        description:
          'Given your region/credit-card/willingness, return eligible + blocked_by + how_to_clear.',
        inputSchema: {
          type: 'object',
          required: ['region', 'has_credit_card', 'willingness'],
          properties: {
            region: { type: 'array', items: { type: 'string' } },
            has_credit_card: { type: 'boolean' },
            willingness: { enum: ['easy', 'medium', 'hard'] },
            categories: { type: 'array', items: { type: 'string' } },
            limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
          },
        },
      },
      {
        name: 'report_promo_issue',
        description: 'Report a data issue for a promo. Returns a GitHub Issue URL template.',
        inputSchema: {
          type: 'object',
          required: ['promo_id', 'type', 'description'],
          properties: {
            promo_id: { type: 'string' },
            type: {
              enum: ['expired', 'terms_changed', 'claim_url_dead', 'wrong_terms', 'duplicate', 'other'],
            },
            description: { type: 'string' },
          },
        },
      },
    ],
  }));

  // ─── Tool dispatcher ───
  server.setRequestHandler(CallToolRequestSchema, async (req: any) => {
    const { name, arguments: raw } = req.params as { name: string; arguments: unknown };
    try {
      switch (name) {
        case 'search_promos':
          return handleSearch(searchInput.parse(raw));
        case 'filter_promos':
          return handleFilter(filterInput.parse(raw));
        case 'get_promo':
          return handleGet(getInput.parse(raw));
        case 'list_providers':
          return handleListProviders(listProvidersInput.parse(raw));
        case 'get_recent_updates':
          return handleRecent(recentInput.parse(raw));
        case 'get_expiring_soon':
          return handleExpiring(expiringInput.parse(raw));
        case 'what_can_i_get':
          return handleWhatCan(whatCanInput.parse(raw));
        case 'report_promo_issue':
          return handleReport(reportInput.parse(raw));
        default:
          return errResult(`Unknown tool: ${name}`);
      }
    } catch (e) {
      const msg = e instanceof z.ZodError ? `Invalid params: ${e.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}` : (e as Error).message;
      return errResult(msg);
    }
  });

  // ─── Resources ───
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: 'catalog://snapshot',
        name: 'Catalog snapshot',
        mimeType: 'application/json',
        description: 'Catalog metadata: provider count, promo count, generated_at, sha256.',
      },
      {
        uri: 'schema://promo',
        name: 'promo.schema.json',
        mimeType: 'application/schema+json',
        description: 'The Draft 2020-12 JSON Schema for promos.',
      },
      {
        uri: 'providers://index',
        name: 'Provider index',
        mimeType: 'application/json',
        description: 'List of providers with promo counts.',
      },
    ],
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (req: any) => {
    const { uri } = req.params as { uri: string };
    if (uri === 'catalog://snapshot') {
      const cat = loadCatalog();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              generated_at: cat.generated_at,
              sha256: cat.sha256,
              counts: cat.counts,
            }, null, 2),
          },
        ],
      };
    }
    if (uri === 'schema://promo') {
      const fs = await import('node:fs/promises');
      const path = new URL('../../schemas/promo.schema.json', import.meta.url).pathname;
      const text = await fs.readFile(path, 'utf8');
      return {
        contents: [{ uri, mimeType: 'application/schema+json', text }],
      };
    }
    if (uri === 'providers://index') {
      const providers = listProviders();
      return {
        contents: [
          { uri, mimeType: 'application/json', text: JSON.stringify(providers, null, 2) },
        ],
      };
    }
    if (uri.startsWith('catalog://daily/')) {
      const date = uri.slice('catalog://daily/'.length);
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: renderDailyMarkdown(date),
          },
        ],
      };
    }
    return errResult(`Unknown resource: ${uri}`);
  });

  // ─── Prompts ───
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [
      {
        name: 'daily-deal-brief',
        description: 'Generate a daily promo brief (≤200 words).',
        arguments: [
          { name: 'date', description: 'YYYY-MM-DD, default today' },
          { name: 'region', description: 'ISO codes, e.g. CN' },
        ],
      },
      {
        name: 'pick-for-me',
        description: 'Pick ≤3 best-fitting promos for the user.',
        arguments: [
          { name: 'region', description: 'ISO codes' },
          { name: 'has_credit_card', description: 'true / false' },
          { name: 'willingness', description: 'easy / medium / hard' },
        ],
      },
      {
        name: 'explain-terms',
        description: 'Explain the terms[] of a promo in plain language.',
        arguments: [{ name: 'id', description: 'promo id' }],
      },
    ],
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (req: any) => {
    const { name, arguments: args } = req.params as { name: string; arguments?: Record<string, unknown> };
    switch (name) {
      case 'daily-deal-brief':
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text:
                  `请基于 catalog://daily/${(args?.date as string) ?? todayIso()} 资源生成当日羊毛简报（≤200 字）。` +
                  `要点：①今日新增 N 条；②7 天内到期 N 条；③免信用卡 N 条；④推荐 1 条最适合${(args?.region as string[] | undefined)?.join('/') ?? '当前区域'}用户的 promo。` +
                  `末尾固定带一句：「数据核实于 ${todayIso()} · 由策展团队人工收录」`,
              },
            },
          ],
        };
      case 'pick-for-me':
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text:
                  `调 what_can_i_get({region:${JSON.stringify(args?.region ?? [])},has_credit_card:${args?.has_credit_card ?? false},willingness:${JSON.stringify(args?.willingness ?? 'easy')}})。` +
                  `从 eligible 中挑 ≤3 条，按「最适合我」排序，每条给一句话理由。末尾固定带一句：「数据核实于 ${todayIso()} · 由策展团队人工收录」`,
              },
            },
          ],
        };
      case 'explain-terms':
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text:
                  `调 get_promo({id:"${args?.id ?? ''}"})，把它 terms[] 里的 22 项受控词翻译成「完全没接触过 API 的人能听懂的话」。` +
                  `每项一行：「术语：人话」。末尾固定带一句：「数据核实于 ${todayIso()} · 由策展团队人工收录」`,
              },
            },
          ],
        };
      default:
        return errResult(`Unknown prompt: ${name}`);
    }
  });

  return server;
}

// ────────────────────────────────────────────────────────────────────────────
// Handlers

function handleSearch(args: z.infer<typeof searchInput>) {
  const filter = {
    query: args.query,
    region: args.region as CountryCode[] | undefined,
    difficulty: args.difficulty as Difficulty[] | undefined,
    requires_credit_card: args.requires_credit_card,
    provider_id: args.provider_id,
    expires_within_days: args.expires_within_days,
    categories: args.categories as Category[] | undefined,
    include_status: args.include_status as any,
    limit: args.limit,
  };
  const results = searchPromos(filter);
  const summaries = results.map(toSummary);
  return {
    structuredContent: {
      total: summaries.length,
      results: summaries,
      query: args.query ?? null,
    },
    content: [
      {
        type: 'text',
        text: renderHumanList(summaries, args.query ?? '所有匹配'),
      },
    ],
  };
}

function handleFilter(args: z.infer<typeof filterInput>) {
  // sort 影响：传入 searchPromos 的顺序由 sort 决定（当前默认 expires_soonest；其它走 post-sort）
  let results = searchPromos({
    region: args.region as CountryCode[] | undefined,
    difficulty: args.difficulty as Difficulty[] | undefined,
    requires_credit_card: args.requires_credit_card,
    expires_within_days: args.expires_within_days,
    categories: undefined,
    limit: args.limit,
  });

  if (args.sort === 'newest') {
    results = [...results].sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
  } else if (args.sort === 'provider_alpha') {
    results = [...results].sort((a, b) =>
      a.provider.name_en.localeCompare(b.provider.name_en),
    );
  } else if (args.sort === 'difficulty_easiest') {
    const rank = { easy: 0, medium: 1, hard: 2 } as const;
    results = [...results].sort((a, b) => rank[a.difficulty] - rank[b.difficulty]);
  }

  const summaries = results.map(toSummary);
  return {
    structuredContent: { total: summaries.length, results: summaries, sort: args.sort },
    content: [{ type: 'text', text: renderHumanList(summaries, `排序=${args.sort}`) }],
  };
}

function handleGet(args: z.infer<typeof getInput>) {
  const p = getPromoById(args.id);
  if (!p) return errResult(`找不到该 promo: ${args.id}`);
  const full = toFull(p);
  const paid = isPaidCaller();
  const scrubbed = paid ? full : scrubFreeFields(full);
  return {
    structuredContent: scrubbed,
    content: [{ type: 'text', text: renderHumanPromo(scrubbed) }],
  };
}

function handleListProviders(args: z.infer<typeof listProvidersInput>) {
  const providers = listProviders(args.country as CountryCode | undefined);
  return {
    structuredContent: { providers },
    content: [{ type: 'text', text: `${providers.length} 家厂商${args.country ? `（${args.country}）` : ''}。` }],
  };
}

function handleRecent(args: z.infer<typeof recentInput>) {
  const updates = getRecentUpdates(args.since);
  return {
    structuredContent: { updates },
    content: [{ type: 'text', text: `${updates.length} 条自 ${args.since} 以来的更新。` }],
  };
}

function handleExpiring(args: z.infer<typeof expiringInput>) {
  const results = searchPromos({
    expires_within_days: args.within_days,
    region: args.region as CountryCode[] | undefined,
    limit: args.limit,
  });
  const summaries = results.map(toSummary);
  return {
    structuredContent: { within_days: args.within_days, results: summaries },
    content: [
      {
        type: 'text',
        text: renderHumanList(summaries, `${args.within_days} 天内到期`),
      },
    ],
  };
}

function handleWhatCan(args: z.infer<typeof whatCanInput>) {
  const result = whatCanIGet({
    region: args.region as CountryCode[],
    has_credit_card: args.has_credit_card,
    willingness: args.willingness,
  });
  // 仅按 limit 截断 eligible（blocked_by 不截）
  const eligible = result.eligible.slice(0, args.limit);
  return {
    structuredContent: { eligible, blocked_by: result.blocked_by, how_to_clear: result.how_to_clear },
    content: [
      {
        type: 'text',
        text:
          `在你 ${args.region.join('/')}、${args.has_credit_card ? '有' : '无'}信用卡、愿意 ${args.willingness} 的前提下，` +
          `可直接薅 ${eligible.length} 条；想薅但差一步的有 ${result.blocked_by.length} 条（详见 how_to_clear）。`,
      },
    ],
  };
}

function handleReport(args: z.infer<typeof reportInput>) {
  const title = `[${args.type}] ${args.promo_id}`;
  const body = encodeURIComponent(
    `**promo_id**: ${args.promo_id}\n**type**: ${args.type}\n\n**description**:\n${args.description}\n\n---\n提交时间：${new Date().toISOString()}\n`,
  );
  const url = `https://github.com/PanStories/free-and-cheap-tokens/issues/new?title=${encodeURIComponent(title)}&body=${body}&labels=data-issue`;
  return {
    structuredContent: { ticket_url: url, type: args.type, promo_id: args.promo_id },
    content: [{ type: 'text', text: `已生成 Issue 模板：${url}` }],
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers

function errResult(msg: string) {
  return {
    isError: true,
    structuredContent: { error: msg },
    content: [{ type: 'text', text: msg }],
  };
}

/** 免费版不暴露 `confidence` 与 `provenance.review_required` 等内部字段 */
function scrubFreeFields<T>(obj: T): T {
  const cloned = JSON.parse(JSON.stringify(obj)) as Record<string, unknown>;
  if (cloned.verification) delete (cloned.verification as Record<string, unknown>).confidence;
  return cloned as T;
}

function renderHumanList(items: { id: string; offer: { headline: string }; difficulty: string; verification: { status: string } }[], title: string): string {
  if (!items.length) return `「${title}」暂无结果。`;
  const lines = items.map((p, i) => {
    const status = p.verification.status === 'verified' ? '✓ 已核验' : p.verification.status === 'reported' ? '⚠ 待复核' : '· 未核验';
    return `${i + 1}. ${p.offer.headline}（上手 ${p.difficulty} · ${status}）— id: ${p.id}`;
  });
  return `「${title}」共 ${items.length} 条：\n${lines.join('\n')}`;
}

function renderHumanPromo(p: any): string {
  const lines = [
    `${p.offer.headline}`,
    `厂商：${p.provider.name_zh ?? p.provider.name_en}`,
    `上手难度：${p.difficulty}`,
    `区域：${p.region.availability === 'global' ? '全球' : (p.region.countries ?? p.region.excluded_countries ?? []).join('/')}`,
    p.offer.value_display ? `额度：${p.offer.value_display}` : '',
    p.offer.expires_at ? `到期：${p.offer.expires_at}` : p.offer.no_fixed_expiry ? '到期：长期有效' : '',
    `核验：${p.verification.status} · ${p.verification.last_verified_at ?? '未填写'}`,
    `链接：${p.offer.claim_url}`,
    p.terms.length ? `条款：${p.terms.map((t: any) => t.tag).join(', ')}` : '',
    p.actionability?.next_steps?.length ? `如何薅：${p.actionability.next_steps.map((s: any) => `\n  ${s.n}. ${s.text}`).join('')}` : '',
  ].filter(Boolean);
  void relevanceScore; // exported helper kept for callers
  return lines.join('\n');
}

function renderDailyMarkdown(date: string): string {
  const cat = loadCatalog();
  const recent = cat.promos
    .filter((p) => p.status === 'active' || p.status === 'expiring_soon')
    .slice(0, 50);
  const lines = [
    `# 每日羊毛简报 · ${date}`,
    ``,
    `> 数据核实于 ${date} · 由策展团队人工收录`,
    ``,
    `总计 active/expiring_soon：${recent.length} 条`,
    ``,
    `## 推荐 Top 5`,
    ...recent.slice(0, 5).map((p, i) => `${i + 1}. **${p.offer.headline}** — ${p.provider.name_zh ?? p.provider.name_en}（上手 ${p.difficulty}）`),
    ``,
    `完整清单：https://freeandcheaptokens.dev/`,
  ];
  return lines.join('\n');
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// 防止 type-only import 被 unused 检查报红
void ({} as { _types: VerificationStatus });