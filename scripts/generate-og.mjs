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
} catch {
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

// 厂商证据行（前 4 家）—— 用英文名：GitHub runner 没有 CJK 字体，中文名会渲染成方框
const evidence = cat.promos
  .filter((p) => p.status === 'active' || p.status === 'expiring_soon')
  .slice(0, 4)
  .map((p) => p.provider.name_en)
  .join(' · ');

// 用 SVG 生成 PNG（sharp 直接吃 SVG buffer）
const W = 1200;
const H = 630;
const SAFE_X = 100;
const SAFE_Y = 90;

// 与站点同一套设计语言（navy / #f5f7fa / 蓝）· 品牌标记为「价签 + 代币圆片」
const BRAND_MARK = `<g transform="translate(${SAFE_X - 2} ${SAFE_Y - 40}) scale(1.6)" fill="none" stroke="#b45309" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/>
    <circle cx="8.2" cy="8.2" r="2.7"/>
    <circle cx="8.2" cy="8.2" r="0.9" fill="#b45309" stroke="none"/>
  </g>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#f5f7fa"/>
  <!-- 极淡网格线 -->
  <g stroke="#e3e8ef" stroke-width="1" opacity="0.5">
    ${Array.from({ length: 30 }, (_, i) => `<line x1="0" y1="${i * 25}" x2="${W}" y2="${i * 25}"/>`).join('')}
    ${Array.from({ length: 48 }, (_, i) => `<line x1="${i * 25}" y1="0" x2="${i * 25}" y2="${H}"/>`).join('')}
  </g>

  <!-- 品牌标记 + 字标 + 日期 -->
  ${BRAND_MARK}
  <text x="${SAFE_X + 52}" y="${SAFE_Y}" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, sans-serif" font-size="32" font-weight="700" fill="#0f2a4a" letter-spacing="-0.5">Free and Cheap Tokens</text>
  <text x="${SAFE_X + 52}" y="${SAFE_Y + 32}" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, sans-serif" font-size="16" fill="#5b6b7e">Daily AI deal list · Verified ${generatedDate}</text>

  <!-- 2px accent 规则线 -->
  <line x1="${SAFE_X}" y1="${SAFE_Y + 64}" x2="${W - SAFE_X}" y2="${SAFE_Y + 64}" stroke="#2563eb" stroke-width="2"/>

  <!-- 三个统计数字 -->
  <g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="700" fill="#0f2a4a">
    <text x="${SAFE_X}" y="${SAFE_Y + 200}" font-size="88">${active}</text>
    <text x="${SAFE_X}" y="${SAFE_Y + 232}" font-family="-apple-system, BlinkMacSystemFont, PingFang SC, sans-serif" font-size="14" font-weight="500" fill="#5b6b7e" letter-spacing="0.04em">Currently claimable</text>

    <text x="${SAFE_X + 320}" y="${SAFE_Y + 200}" font-size="88">${expiringSoon}</text>
    <text x="${SAFE_X + 340}" y="${SAFE_Y + 232}" font-family="-apple-system, BlinkMacSystemFont, PingFang SC, sans-serif" font-size="14" font-weight="500" fill="#5b6b7e" letter-spacing="0.04em">Expiring in 14 days</text>

    <text x="${SAFE_X + 640}" y="${SAFE_Y + 200}" font-size="88">${noCard}</text>
    <text x="${SAFE_X + 640}" y="${SAFE_Y + 232}" font-family="-apple-system, BlinkMacSystemFont, PingFang SC, sans-serif" font-size="14" font-weight="500" fill="#5b6b7e" letter-spacing="0.04em">No credit card</text>
  </g>

  <!-- 分隔线 -->
  <line x1="${SAFE_X}" y1="${SAFE_Y + 280}" x2="${W - SAFE_X}" y2="${SAFE_Y + 280}" stroke="#e3e8ef" stroke-width="1"/>

  <!-- 厂商证据行 -->
  <text x="${SAFE_X}" y="${SAFE_Y + 320}" font-family="-apple-system, BlinkMacSystemFont, PingFang SC, sans-serif" font-size="18" fill="#1f2937">${evidence || ''}</text>
  <text x="${SAFE_X}" y="${SAFE_Y + 350}" font-family="-apple-system, BlinkMacSystemFont, PingFang SC, sans-serif" font-size="13" fill="#5b6b7e">... and ${cat.counts.total} vendors in total · human-verified daily</text>

  <!-- 域名水印 -->
  <text x="${SAFE_X}" y="${H - SAFE_Y + 20}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14" fill="#5b6b7e">panstories.github.io/free-and-cheap-tokens</text>

  <!-- 透明度小字 -->
  <text x="${W - SAFE_X}" y="${H - SAFE_Y + 20}" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, PingFang SC, sans-serif" font-size="12" fill="#5b6b7e">Open source · MIT · No paid placements · No affiliate links</text>
</svg>`;

try {
  const buf = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(OG_PATH, buf);
  console.log(`✓ ${OG_PATH} · ${buf.length / 1024} KB`);
} catch (e) {
  console.error(`✗ OG 生成失败: ${e.message}`);
  process.exit(1);
}