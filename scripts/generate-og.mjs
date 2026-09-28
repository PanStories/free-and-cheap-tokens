#!/usr/bin/env node
/**
 * generate-og.mjs —— 生成 site/og.png（1200×630 PNG）
 *
 * 仅在 CI 期跑（不在容器、不在站点运行时跑）。依赖 `sharp`（devDependency）。
 *
 * 设计要点：
 *   - 数字是"今天的"，制造每日可重复的分享仪式
 *   - 三段统计：当前可薅 / 14 天内到期 / 免信用卡
 *   - 厂商证据行 4 家
 *   - 域名水印固定位置建立识别
 *   - 72px 数字缩到 200px 宽仍可读（硬验收项）
 *   - 浅色背景 + 极淡网格线（无渐变无 3D 无发光）
 */

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const CATALOG_PATH = join(root, 'build', 'catalog.json');
const SITE_DIR = join(root, 'site');
const OG_PATH = join(SITE_DIR, 'og.png');

if (!existsSync(CATALOG_PATH)) {
  console.error(`✗ ${CATALOG_PATH} not found. Run: node scripts/build-catalog.mjs first.`);
  process.exit(1);
}

if (!existsSync(SITE_DIR)) mkdirSync(SITE_DIR, { recursive: true });

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (e) {
  console.error('✗ sharp not installed. Install devDependencies: npm install');
  process.exit(1);
}

const cat = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
const generatedDate = cat.generated_at.slice(0, 10);

const active = cat.counts.active;
const expiringSoon = cat.promos.filter((p) => {
  if (p.offer.no_fixed_expiry || !p.offer.expires_at) return false;
  const days = (Date.parse(p.offer.expires_at) - Date.now()) / 86_400_000;
  return days >= 0 && days <= 14;
}).length;
const noCard = cat.counts.no_credit_card;

// 厂商证据行（前 4 家）
const evidence = cat.promos
  .filter((p) => p.status === 'active' || p.status === 'expiring_soon')
  .slice(0, 4)
  .map((p) => (p.provider.country === 'CN' && p.provider.name_zh ? p.provider.name_zh : p.provider.name_en))
  .join(' · ');

// 用 SVG 生成 PNG（sharp 直接吃 SVG buffer）
const W = 1200;
const H = 630;
const SAFE_X = 100;
const SAFE_Y = 90;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#F5F6F8"/>
  <!-- 极淡网格线 -->
  <g stroke="#E5E7EB" stroke-width="1" opacity="0.4">
    ${Array.from({ length: 30 }, (_, i) => `<line x1="0" y1="${i * 25}" x2="${W}" y2="${i * 25}"/>`).join('')}
    ${Array.from({ length: 48 }, (_, i) => `<line x1="${i * 25}" y1="0" x2="${i * 25}" y2="${H}"/>`).join('')}
  </g>

  <!-- 字标 + 日期 -->
  <text x="${SAFE_X}" y="${SAFE_Y}" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, sans-serif" font-size="32" font-weight="600" fill="#15181D" letter-spacing="-0.5">Free &amp; Cheap Tokens</text>
  <text x="${SAFE_X}" y="${SAFE_Y + 32}" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, sans-serif" font-size="16" fill="#5B6371">每日 AI 羊毛清单 · ${generatedDate}</text>

  <!-- 2px accent 规则线 -->
  <line x1="${SAFE_X}" y1="${SAFE_Y + 64}" x2="${W - SAFE_X}" y2="${SAFE_Y + 64}" stroke="#0B6E8F" stroke-width="2"/>

  <!-- 三个统计数字 -->
  <g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="600" fill="#0A4B60">
    <text x="${SAFE_X}" y="${SAFE_Y + 200}" font-size="88">${active}</text>
    <text x="${SAFE_X}" y="${SAFE_Y + 232}" font-family="-apple-system, BlinkMacSystemFont, PingFang SC, sans-serif" font-size="14" font-weight="500" fill="#5B6371" letter-spacing="0.04em">当前可薅</text>

    <text x="${SAFE_X + 320}" y="${SAFE_Y + 200}" font-size="88">${expiringSoon}</text>
    <text x="${SAFE_X + 320}" y="${SAFE_Y + 232}" font-family="-apple-system, BlinkMacSystemFont, PingFang SC, sans-serif" font-size="14" font-weight="500" fill="#5B6371" letter-spacing="0.04em">14 天内到期</text>

    <text x="${SAFE_X + 640}" y="${SAFE_Y + 200}" font-size="88">${noCard}</text>
    <text x="${SAFE_X + 640}" y="${SAFE_Y + 232}" font-family="-apple-system, BlinkMacSystemFont, PingFang SC, sans-serif" font-size="14" font-weight="500" fill="#5B6371" letter-spacing="0.04em">免信用卡</text>
  </g>

  <!-- 分隔线 -->
  <line x1="${SAFE_X}" y1="${SAFE_Y + 280}" x2="${W - SAFE_X}" y2="${SAFE_Y + 280}" stroke="#E5E7EB" stroke-width="1"/>

  <!-- 厂商证据行 -->
  <text x="${SAFE_X}" y="${SAFE_Y + 320}" font-family="-apple-system, BlinkMacSystemFont, PingFang SC, sans-serif" font-size="18" fill="#15181D">${evidence || ''}</text>
  <text x="${SAFE_X}" y="${SAFE_Y + 350}" font-family="-apple-system, BlinkMacSystemFont, PingFang SC, sans-serif" font-size="13" fill="#5B6371"> ... 等 ${cat.counts.total} 家厂商 · 数据每日人工核实</text>

  <!-- 域名水印 -->
  <text x="${SAFE_X}" y="${H - SAFE_Y + 20}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14" fill="#5B6371">freeandcheaptokens.dev</text>

  <!-- 透明度小字 -->
  <text x="${W - SAFE_X}" y="${H - SAFE_Y + 20}" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, PingFang SC, sans-serif" font-size="12" fill="#5B6371">开源 · MIT · 不接硬广 · 不挂联盟</text>
</svg>`;

try {
  const buf = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(OG_PATH, buf);
  console.log(`✓ ${OG_PATH} · ${buf.length / 1024} KB`);
} catch (e) {
  console.error(`✗ OG 生成失败: ${e.message}`);
  process.exit(1);
}