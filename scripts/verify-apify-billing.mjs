#!/usr/bin/env node
/**
 * End-to-end billing proof for the deployed Actor.
 *
 * 1. POST a real MCP `tools/call` (search_promos) to the standby endpoint
 * 2. Read back the run that served it and print chargedEventCounts
 *
 * Usage:  node scripts/verify-apify-billing.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ApifyClient } from 'apify-client';

const ACTOR_ID = process.env.APIFY_ACTOR_ID ?? 'U6XrDEcdKjN4YQIZU';

function tokenFromCliAuth() {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.apify', 'auth.json'), 'utf8'));
    return j.token ?? j?.auth?.token ?? null;
  } catch {
    return null;
  }
}
const token = process.env.APIFY_TOKEN ?? tokenFromCliAuth();
if (!token) {
  console.error('No APIFY_TOKEN / ~/.apify/auth.json');
  process.exit(1);
}

const client = new ApifyClient({ token });
const actor = await client.actor(ACTOR_ID).get();

console.log('actor.actorStandby =', JSON.stringify(actor.actorStandby, null, 2));

// standby url: prefer the platform value, otherwise derive it
// NOTE: prefer the top-level `standbyUrl`; `actorStandby.url` is always null.
const standbyUrl =
  actor.standbyUrl ||
  `https://${actor.username}--${actor.name}.apify.actor`;
console.log('standby url =', standbyUrl);

const rpc = async (body) => {
  const res = await fetch(`${standbyUrl}/mcp`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, ...body }),
  });
  const text = await res.text();
  return { status: res.status, text };
};

const init = await rpc({ method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'billing-check', version: '1.0.0' } } });
console.log('initialize ->', init.status, init.text.slice(0, 120));

const call = await rpc({ method: 'tools/call', params: { name: 'search_promos', arguments: { query: 'free credits', limit: 3 } } });
console.log('tools/call  ->', call.status, call.text.slice(0, 200));

// give the platform a moment to attribute the charge to the run
await new Promise((r) => setTimeout(r, 8000));

const { items } = await client.actor(ACTOR_ID).runs().list({ limit: 3, desc: true });
for (const r of items) {
  const d = await client.run(r.id).get();
  console.log(
    JSON.stringify(
      {
        id: r.id,
        status: r.status,
        startedAt: r.startedAt,
        chargedEventCounts: d?.chargedEventCounts ?? null,
        accountedChargedEventCounts: d?.accountedChargedEventCounts ?? null,
      },
      null,
      2,
    ),
  );
}
