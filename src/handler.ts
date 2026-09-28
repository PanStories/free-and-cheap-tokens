/**
 * Apify webServer request handler for Free & Cheap Tokens.
 *
 * Architecture (v1.1.0):
 *   - Hosted as Apify Pay-Per-Event Actor (no Standby)
 *   - Each incoming HTTP request triggers an Actor run
 *   - This handler is invoked by Apify's webServer wrapper
 *   - After routing to an MCP tool, we call Actor.charge() with the
 *     matching event from .actor/actor.json pricingEvents
 *   - No idle cost: $0 when no requests arrive
 *
 * IMPORTANT:
 *   - Do NOT call app.listen() — Apify wraps this file
 *   - Do NOT set usesStandbyMode in actor.json (breaks Agentic Payments)
 *   - Each Actor.charge() call corresponds to a billable event
 */

import express from 'express';
import type { Request, Response } from 'express';
import { Actor } from 'apify';
import { createMcpServer } from './mcp/server.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { loadCatalog } from './data/catalog.js';
import { requireTier, setTierIsPaid } from './tier/quota.js';

const PRICING_EVENTS: Record<string, string> = {
  initialize: 'mcp-initialize',
  'tools/list': 'mcp-list-tools',
  'tools/call': undefined as never, // resolved per-tool below
  'search_promos': 'mcp-search',
  'filter_promos': 'mcp-filter',
  'get_promo': 'mcp-get-promo',
  'list_providers': 'mcp-list-providers',
  'get_recent_updates': 'mcp-recent-updates',
  'get_expiring_soon': 'mcp-expiring-soon',
  'what_can_i_get': 'mcp-what-can-i-get',
  'report_promo_issue': 'mcp-report-issue',
};

/**
 * Apify webServer wraps this module: it imports the default export as
 * an Express-compatible handler. We export an Express app instance.
 */
const app = express();
app.use(express.json({ limit: '1mb' }));

// Readiness probe (Apify may send during run startup, mostly handled by
// the webServer wrapper itself; included for safety).
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ready', pricingModel: 'PAY_PER_EVENT' });
});

app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, catalog_loaded: catalog !== null });
});

// Lazily-initialized MCP server + transport
let mcpServerInstance: ReturnType<typeof createMcpServer> | null = null;
let transport: StreamableHTTPServerTransport | null = null;
let catalog: Awaited<ReturnType<typeof loadCatalog>> | null = null;

async function ensureInitialized(): Promise<void> {
  if (mcpServerInstance && transport && catalog) return;
  await Actor.init();
  const loadedCatalog = await loadCatalog();
  const server = createMcpServer();
  const t = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — required for PPE (ADR-002)
    enableJsonResponse: true,
  });
  await server.connect(t);
  mcpServerInstance = server;
  transport = t;
  catalog = loadedCatalog;
}

// DNS rebinding protection (M2) — Express layer whitelist
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '').split(',').filter(Boolean);
const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS ?? 'apify.com,localhost').split(',').filter(Boolean);

app.use((req: Request, res: Response, next) => {
  const origin = req.headers.origin;
  const host = req.headers.host?.split(':')[0];
  if (origin && ALLOWED_ORIGINS.length && !ALLOWED_ORIGINS.includes(origin)) {
    res.status(403).json({ error: 'Origin not allowed' });
    return;
  }
  if (host && !ALLOWED_HOSTS.includes(host)) {
    res.status(403).json({ error: 'Host not allowed' });
    return;
  }
  next();
});

// Main MCP endpoint — receives Streamable HTTP POST + GET + DELETE
app.all('/mcp', async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
  } catch (err) {
    res.status(500).json({
      jsonrpc: '2.0',
      error: { code: -32603, message: `Init failed: ${(err as Error).message}` },
      id: null,
    });
    return;
  }

  // Tier enforcement (free quota) — AC-20/AC-21 from SPEC.md
  const tierResult = await requireTier({
    method: req.method,
    body: req.body,
    headers: req.headers as Record<string, string | string[] | undefined>,
    catalog: catalog!,
  });
  // Propagate tier to tool handlers (scrubbing logic reads it via isPaidCaller()).
  setTierIsPaid(tierResult.tier === 'paid');
  if (!tierResult.allowed) {
    res.status(tierResult.status).json(tierResult.payload);
    return;
  }

  // Charge the PPE event for this request before handling.
  // Apify SDK tracks events; if the handler throws, the event is still
  // recorded (this matches Apify docs: events are counted regardless of outcome).
  await chargeForRequest(req.body);

  // Delegate to MCP Streamable HTTP transport
  await transport!.handleRequest(req, res, req.body);
});

/**
 * Map an MCP JSON-RPC request to a billable Apify event and charge it.
 *
 * Pricing rationale (see .actor/actor.json, market-calibrated 2026-09-28):
 *   Apify Store MCP reference points: $0.03-$0.035/tool call (travel-tools-mcp,
 *   enterprise-mcp-gateway), $0.045-$0.50 for intelligence MCPs. We position
 *   3-7x below that band since our catalog is read-only with zero upstream cost.
 *   - initialize / tools/list: free, so agents can discover cheaply
 *   - get_promo / list_providers: $0.002 (single-item reads)
 *   - search/filter/updates/expiring: $0.005 each (queries)
 *   - what_can_i_get: $0.01 (premium reasoning path)
 *   - report_promo_issue: free (encourage corrections)
 */
async function chargeForRequest(body: unknown): Promise<void> {
  if (!body || typeof body !== 'object') return;
  const b = body as { method?: string; params?: { name?: string } };
  const method = b.method ?? '';
  let eventName: string | undefined;

  if (method === 'initialize') eventName = 'mcp-initialize';
  else if (method === 'tools/list') eventName = 'mcp-list-tools';
  else if (method === 'tools/call') {
    const toolName = b.params?.name ?? '';
    eventName = PRICING_EVENTS[toolName];
  }

  if (!eventName) return; // unknown methods (resources/read, prompts/get) are free

  try {
    await Actor.charge({ eventName });
  } catch (err) {
    // Don't fail the request on charge error — log and continue.
    // Apify warns but doesn't block on missing events for free-tier events.
    console.warn(`[PPE charge failed] ${eventName}: ${(err as Error).message}`);
  }
}

// Apify webServer expects a default-exported Express app
export default app;