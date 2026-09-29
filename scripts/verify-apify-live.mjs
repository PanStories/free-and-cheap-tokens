#!/usr/bin/env node
/**
 * Live verification for the deployed Apify Actor (free-and-cheap-tokens).
 *
 * Checks:
 *   1. Actor config  -> isPublic / usesStandbyMode / standbyUrl / pricingModel
 *   2. Pricing       -> effective PPE record + every registered paid event
 *   3. Latest run    -> chargedEventCounts / accountedChargedEventCounts
 *   4. Endpoint      -> unauthenticated GET on the standby URL
 *
 * Usage:  node scripts/verify-apify-live.mjs
 * Requires APIFY_TOKEN (or ~/.apify/auth.json written by `apify login`).
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ApifyClient } from 'apify-client';

const ACTOR_ID = process.env.APIFY_ACTOR_ID ?? 'U6XrDEcdKjN4YQIZU';

function tokenFromCliAuth() {
  try {
    const p = path.join(os.homedir(), '.apify', 'auth.json');
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    return j.token ?? j?.auth?.token ?? null;
  } catch {
    return null;
  }
}

const token = process.env.APIFY_TOKEN ?? tokenFromCliAuth();
if (!token) {
  console.error('No APIFY_TOKEN and no ~/.apify/auth.json. Run: apify login --token <token>');
  process.exit(1);
}

const client = new ApifyClient({ token });
const fmt = (o) => JSON.stringify(o, null, 2);

const actor = await client.actor(ACTOR_ID).get();
console.log('== 1. Actor config ==');
console.log(
  fmt({
    name: actor.name,
    username: actor.username,
    title: actor.title,
    isPublic: actor.isPublic,
    isDeprecated: actor.isDeprecated,
    pricingModel: actor.pricingModel,
    usesStandbyMode: actor.actorStandby?.isEnabled ?? actor.usesStandbyMode ?? null,
    // NOTE: the usable endpoint lives on the TOP-LEVEL `standbyUrl` field.
    // `actorStandby.url` is always null — do not fall back to it first.
    standbyUrl: actor.standbyUrl ?? null,
    desiredPrPPEventTitle: actor.pricingInfos?.at(-1)?.pricingPerEvent?.actorChargeEvents
      ? Object.values(actor.pricingInfos.at(-1).pricingPerEvent.actorChargeEvents).find((e) => e.isPrimaryEvent)?.eventTitle
      : null,
  }),
);

console.log('\n== 2. Pricing records ==');
const infos = actor.pricingInfos ?? [];
console.log(`records: ${infos.length}`);
for (const info of infos) {
  const events = info.pricingPerEvent?.actorChargeEvents ?? {};
  console.log(
    fmt({
      pricingModel: info.pricingModel,
      startedAt: info.startedAt,
      createdAt: info.createdAt ?? null,
      minimalMaxTotalChargeUsd: info.minimalMaxTotalChargeUsd ?? null,
      events: Object.entries(events).map(([k, v]) => ({
        name: k,
        priceUsd: v.eventPriceUsd,
        primary: !!v.isPrimaryEvent,
        title: v.eventTitle,
      })),
    }),
  );
}

console.log('\n== 3. Latest runs (charged events) ==');
const { items: runs } = await client.actor(ACTOR_ID).runs().list({ limit: 5, desc: true });
for (const r of runs) {
  const detail = await client.run(r.id).get();
  console.log(
    fmt({
      id: r.id,
      status: r.status,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt ?? null,
      chargedEventCounts: detail?.chargedEventCounts ?? null,
      accountedChargedEventCounts: detail?.accountedChargedEventCounts ?? null,
      usageTotalUsd: detail?.usageTotalUsd ?? detail?.usage?.totalChargeUsd ?? null,
    }),
  );
}

console.log('\n== 4. Endpoint reachability ==');
const url = actor.standbyUrl ?? `https://${actor.username}--${actor.name}.apify.actor`;
try {
  const res = await fetch(url, { method: 'GET' });
  const body = (await res.text()).slice(0, 200);
  console.log(fmt({ url, status: res.status, bodySnippet: body }));
} catch (err) {
  console.log(fmt({ url, error: String(err) }));
}
