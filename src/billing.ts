/**
 * Shared pay-per-event billing for both transports.
 *
 * The Docker image CMD runs `dist/index.js` (own Express server) while
 * `.actor/actor.json` may also be used through the Apify webServer wrapper
 * (`src/handler.ts`). Both must charge identically, so the mapping lives here.
 *
 * Free events are intentionally absent from the Actor pricing table and are
 * never charged — charging an unregistered event only spams run logs.
 * See `.actor/pay_per_event.json` for registered (paid) events.
 */

export const PRICING_EVENTS: Record<string, string> = {
  initialize: 'mcp-initialize',
  'tools/list': 'mcp-list-tools',
  search_promos: 'mcp-search',
  filter_promos: 'mcp-filter',
  get_promo: 'mcp-get-promo',
  list_providers: 'mcp-list-providers',
  get_recent_updates: 'mcp-recent-updates',
  get_expiring_soon: 'mcp-expiring-soon',
  what_can_i_get: 'mcp-what-can-i-get',
  report_promo_issue: 'mcp-report-issue',
};

const FREE_EVENTS = new Set(['mcp-initialize', 'mcp-list-tools', 'mcp-report-issue']);

/**
 * Map an MCP JSON-RPC request to a billable Apify event and charge it.
 * Never throws: a billing failure must not break the MCP response.
 */
export async function chargeForRequest(
  body: unknown,
  actor: { charge: (opts: { eventName: string }) => Promise<unknown> },
): Promise<void> {
  if (!body || typeof body !== 'object') return;
  const b = body as { method?: string; params?: { name?: string } };
  const method = b.method ?? '';

  let eventName: string | undefined;
  if (method === 'tools/call') {
    eventName = PRICING_EVENTS[b.params?.name ?? ''];
  } else {
    eventName = PRICING_EVENTS[method];
  }
  if (!eventName) return; // unknown methods (resources/read, prompts/get) stay free
  if (FREE_EVENTS.has(eventName)) return; // not registered -> never billed

  try {
    await actor.charge({ eventName });
  } catch (err) {
    console.warn(`[PPE charge failed] ${eventName}: ${(err as Error).message}`);
  }
}
