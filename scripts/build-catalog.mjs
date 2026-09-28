#!/usr/bin/env node
/**
 * build-catalog.mjs —— 把 data/promos/*.json + data/providers/*.json 聚合成 build/catalog.json
 *
 * 用法：
 *   node scripts/build-catalog.mjs          # 构建并写 build/catalog.json
 *   node scripts/build-catalog.mjs --check  # 只校验，不写
 *
 * 退出码：
 *   0 — 通过
 *   1 — 校验失败
 *
 * 设计（详见 SPEC §6 / ADR-003）：
 *   - 只读 data/ 目录，按目录扫描
 *   - 严格用 ajv 校验（draft 2020-12）
 *   - 输出包含 sha256 checksum（构建期校验 + 运行时校验两用）
 *   - 不引入数据库；目录即数据库
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const SCHEMA_PATH = join(root, 'schemas', 'promo.schema.json');
const DATA_DIR = join(root, 'data', 'promos');
const BUILD_DIR = join(root, 'build');
const OUT_PATH = join(BUILD_DIR, 'catalog.json');

// 优雅降级：ajv 不可用时用本地最小校验器
let useStrict = true;
let ajvValidate;
try {
  const AjvMod = await import('ajv/dist/2020.js');
  const Ajv = AjvMod.default;
  const addFormatsMod = await import('ajv-formats');
  const addFormats = addFormatsMod.default;
  const ajv = new Ajv({ strict: true, allErrors: true });
  addFormats(ajv);
  ajvValidate = ajv.compile(JSON.parse(readFileSync(SCHEMA_PATH, 'utf8')));
} catch (e) {
  console.warn(`⚠ ajv 不可用（${e?.message ?? e}）；使用本地最小校验器。建议 CI 跑 \`npm test\` 做严格校验。`);
  useStrict = false;
}

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');

function readJsonDir(dir) {
  if (!existsSync(dir)) {
    console.error(`MISSING DIR: ${dir}`);
    process.exit(1);
  }
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => join(dir, f))
    .map((p) => JSON.parse(readFileSync(p, 'utf8')));
}

function compileSchema() {
  if (!useStrict || !ajvValidate) {
    // 本地最小校验器（仅兜底；严格校验请用 ajv）
    const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
    const termTags = schema.$defs.term_tag.enum;
    const categories = schema.$defs.category.enum;
    const difficulties = ['easy', 'medium', 'hard'];
    return (data) => {
      const errs = [];
      if (!data.id) errs.push('/id must be string');
      if (!data.provider?.id) errs.push('/provider/id required');
      if (!data.provider?.country || data.provider.country.length !== 2) errs.push('/provider/country must be ISO 3166-1 alpha-2');
      if (!data.offer?.headline) errs.push('/offer/headline required');
      if (!data.offer?.claim_url) errs.push('/offer/claim_url required');
      if (!difficulties.includes(data.difficulty)) errs.push(`/difficulty must be ${difficulties.join('/')}`);
      if (!data.region?.availability) errs.push('/region/availability required');
      if (data.region?.availability === 'include' && !data.region?.countries) errs.push('/region/countries required when availability=include');
      if (data.region?.availability === 'exclude' && !data.region?.excluded_countries) errs.push('/region/excluded_countries required when availability=exclude');
      if (!Array.isArray(data.categories) || data.categories.length === 0) errs.push('/categories must be non-empty array');
      else for (const c of data.categories) if (!categories.includes(c)) errs.push(`/categories contains invalid: ${c}`);
      if (!Array.isArray(data.terms)) errs.push('/terms must be array');
      else for (const t of data.terms) if (!termTags.includes(t.tag)) errs.push(`/terms contains invalid tag: ${t.tag}`);
      if (!data.verification?.status) errs.push('/verification/status required');
      if (data.verification?.status === 'verified' && !data.verification?.last_verified_at) errs.push('/verification/last_verified_at required when status=verified');
      return { valid: errs.length === 0, errors: errs };
    };
  }
  return ajvValidate;
}

function main() {
  const validate = compileSchema();
  const promos = readJsonDir(DATA_DIR);

  const errors = [];
  for (const p of promos) {
    if (useStrict) {
      if (!validate(p)) {
        errors.push({ id: p?.id ?? '<no-id>', errors: validate.errors });
      }
    } else {
      const r = validate(p);
      if (!r.valid) {
        errors.push({ id: p?.id ?? '<no-id>', errors: r.errors.map((m) => ({ instancePath: '', message: m })) });
      }
    }
  }
  if (errors.length) {
    console.error(`✗ ${errors.length} invalid promo(s):`);
    for (const e of errors) {
      console.error(`  - ${e.id}`);
      for (const err of e.errors ?? []) {
        console.error(`      ${err.instancePath || '/'} ${err.message}`);
      }
    }
    process.exit(1);
  }
  console.log(`✓ ${promos.length} promo(s) pass schema validation${useStrict ? ' (ajv strict)' : ' (local minimal — install ajv for full check)'}`);

  // 构建 provider 索引
  const providerMap = new Map();
  for (const p of promos) {
    providerMap.set(p.provider.id, p.provider);
  }
  const providers = [...providerMap.values()].sort((a, b) =>
    (a.name_zh ?? a.name_en).localeCompare(b.name_zh ?? b.name_en),
  );

  // counts
  const counts = {
    total: promos.length,
    active: promos.filter((p) => p.status === 'active').length,
    expiring_soon: promos.filter((p) => p.status === 'expiring_soon').length,
    no_credit_card: promos.filter(
      (p) => !p.terms.some((t) => t.tag === 'requires_credit_card'),
    ).length,
    verified: promos.filter((p) => p.verification.status === 'verified').length,
  };

  // 排序：到期最近优先，no_fixed_expiry 排最后
  const sortedPromos = [...promos].sort((a, b) => {
    const ax = a.offer.expires_at ? Date.parse(a.offer.expires_at) : Infinity;
    const bx = b.offer.expires_at ? Date.parse(b.offer.expires_at) : Infinity;
    return ax - bx;
  });

  const catalog = {
    generated_at: new Date().toISOString(),
    sha256: '', // 占位，下面填
    providers,
    promos: sortedPromos,
    counts,
  };

  // 重新序列化（去掉 sha256）→ sha256
  const { sha256: _ignored, ...rest } = catalog;
  const canonical = JSON.stringify(rest, null, 2);
  const sha = createHash('sha256').update(canonical).digest('hex');
  catalog.sha256 = sha;

  if (checkOnly) {
    console.log(`✓ catalog OK · sha256=${sha.slice(0, 12)}… · ${counts.total} promos`);
    return;
  }

  if (!existsSync(BUILD_DIR)) mkdirSync(BUILD_DIR, { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(catalog, null, 2));
  console.log(
    `✓ Wrote ${OUT_PATH} · sha256=${sha.slice(0, 12)}… · ${counts.total} promos · ${counts.active} active`,
  );
}

main();