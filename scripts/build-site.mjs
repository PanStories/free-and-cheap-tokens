#!/usr/bin/env node
/**
 * build-site.mjs —— 从 build/catalog.json 生成：
 *   - site/index.html   静态每日清单页（中文默认 · 零依赖）
 *   - site/en.html      英文版（UI 全量翻译 · promo 正文保留原文并标注）
 *   - site/styles.css   从 design-tokens.css + 站点专属样式生成
 *   - site/app.js       客户端筛选/排序/搜索（自动识别 lang）
 *   - site/feed.xml     RSS（active + expiring_soon）
 *   - site/promos.ics   ICS（仅 expires_at 存在）
 *
 * OG 图（1200×630 PNG）由 scripts/generate-og.mjs 在 CI 期生成；本脚本不依赖 sharp。
 * v1.1.1 起支持双语输出；v1.1.0 之前仅 zh-CN，向后兼容。
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const CATALOG_PATH = join(root, 'build', 'catalog.json');
const SITE_DIR = join(root, 'site');

if (!existsSync(CATALOG_PATH)) {
  console.error(`✗ ${CATALOG_PATH} not found. Run: node scripts/build-catalog.mjs`);
  process.exit(1);
}

const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));

// ────────────────────────────────────────────────────────────────────────────
// Localisation
//
// 所有面向用户可见的字符串都集中在这里。新增语言只需复制一个分支并翻译。

const LOCALES = {
  'zh-CN': {
    lang: 'zh-CN',
    alternatePath: 'en.html',
    alternateLabel: '🇬🇧 English',
    siteTitle: 'Free and Cheap Tokens · 每日 AI 羊毛清单',
    siteDescription:
      '策展团队每日核实、机器可读的 AI 模型/服务免费与低价 token 促销清单。每条直达厂商官方页。',
    ogDescriptionTpl: (c, d) =>
      `${c.total} 条 promo · ${c.no_credit_card} 条免信用卡 · 数据核实于 ${d}`,
    disclosureBar: '开源 · 不接硬广 · 不挂联盟 · 数据每日核实 · MIT',
    updatedTpl: (d) => `数据生成于 ${d}`,
    rssLabel: 'RSS',
    icsLabel: 'ICS 日历',
    shareBtn: '分享今日清单',
    shareCopied: '已复制分享文案',
    shareTextTpl: (d) =>
      `免费 AI 额度清单 · 数据核实于 ${d}\n本站不接硬广、不挂联盟，每条 promo 直达厂商官方页面。\n`,
    introLineTpl: (c, d) =>
      `${c.total} 条 promo · ${c.no_credit_card} 条免信用卡 · ${c.verified} 条已人工核验 · 数据核实于 ${d}`,
    statLabels: ['当前可薅', '14 天内到期', '免信用卡', '已人工核验'],
    filterRegionLabel: '区域',
    filterDifficultyLabel: '上手难度',
    filterNoCardLabel: '仅看免信用卡',
    resetBtn: '清除全部筛选',
    cta: '去官方页',
    cardMetaTpl: (d) => `数据核实于 ${d}`,
    reportLink: '数据有误？',
    regionLabels: {
      global: '全球',
      includeTpl: (cs) => `仅 ${cs.join('/')}`,
      excludeTpl: (cs) => `除 ${cs.join('/')} 外`,
    },
    difficultyLabels: {
      easy: '上手 · 易',
      medium: '上手 · 中',
      hard: '上手 · 难',
    },
    statusPills: {
      verified: '已核验',
      reported: '待复核',
      unverified: '未核验',
      expiringTpl: (n) => `${n} 天内到期`,
      expired: '已过期',
    },
    expiryTpl: {
      long: '长期有效',
      expired: '已过期',
      withinTpl: (n) => `${n} 天内到期`,
    },
    termLabels: {
      no_credit_card: '免信用卡',
      credit_card_required: '需信用卡',
      phone_verification: '需手机验证',
      identity_verification: '需实名认证',
      new_users_only: '仅限新用户',
      one_per_account: '每账号限一次',
      auto_renew: '试用后自动续费',
      quota_capped: '额度受限',
      time_limited: '限时',
      region_locked: '区域受限',
      vpn_required: '需 VPN',
      edu_email_required: '需教育邮箱',
      business_email_required: '需企业邮箱',
      oss_project_required: '需开源项目',
      byok_required: '需自带密钥',
      rate_limited: '限速',
      non_commercial_only: '仅限非商用',
      data_used_for_training: '数据用于训练',
      deposit_required: '需预充值',
      waitlist_approval: '需排队审批',
      manual_application: '需人工申请',
      stackable: '可叠加',
      deprecated_service: '服务已弃用',
    },
    filterbarLabel: '筛选',
    regionOptions: [
      { value: '', label: '全部区域' },
      { value: 'global', label: '全球' },
      { value: 'CN', label: '中国大陆' },
      { value: 'US', label: '美国' },
      { value: 'FR', label: '法国' },
      { value: 'CA', label: '加拿大' },
    ],
    difficultyOptions: [
      { value: '', label: '全部难度' },
      { value: 'easy', label: '易' },
      { value: 'medium', label: '中' },
      { value: 'hard', label: '难' },
    ],
    searchPlaceholder: '按名称、优惠内容搜索…',
    transparencyTitle: '项目透明度',
    transparency1: '<strong>项目透明度</strong> · 开源协议 MIT · 不接硬广 · 不挂联盟 · 每条数据每日人工核实。',
    transparency2: '本站为策展型工具，<strong>不参与</strong>任何 promo 的注册、申领、代理、托管或转发；所有点击直达厂商官方页面。',
    transparency3: '托管服务（Apify Actor / WorkBuddy Skill）为付费便利层，源码完全免费可自托管。收录标准 / 排序规则 / 纠错流程见 GitHub 仓库 README。',
    metaLineTpl: (sha, gen) =>
      `catalog sha256: <code>${sha}…</code> · generated_at: <code>${gen}</code>`,
    promoDataNote: null, // zh-CN 版不显示
  },

  en: {
    lang: 'en',
    alternatePath: 'index.html',
    alternateLabel: '🇨🇳 中文',
    siteTitle: 'Free and Cheap Tokens · Daily AI Deal List',
    siteDescription:
      'Curated, daily-verified, machine-readable catalog of free tiers and cheap token promos for AI models and inference services. Every entry links to the vendor\'s official page.',
    ogDescriptionTpl: (c, d) =>
      `${c.total} promos · ${c.no_credit_card} no credit card · Verified ${d}`,
    disclosureBar: 'Open source · No paid placements · No affiliate links · Daily verified data · MIT',
    updatedTpl: (d) => `Last generated ${d}`,
    rssLabel: 'RSS',
    icsLabel: 'ICS calendar',
    shareBtn: "Share today's list",
    shareCopied: 'Share text copied',
    shareTextTpl: (d) =>
      `Free AI tier catalog · Verified ${d}\nNo paid placements, no affiliate links. Each entry links straight to the vendor.\n`,
    introLineTpl: (c, d) =>
      `${c.total} promos · ${c.no_credit_card} no credit card · ${c.verified} human-verified · Verified ${d}`,
    statLabels: ['Currently claimable', 'Expiring in 14 days', 'No credit card', 'Human-verified'],
    filterRegionLabel: 'Region',
    filterDifficultyLabel: 'Difficulty',
    filterNoCardLabel: 'No credit card only',
    resetBtn: 'Clear all filters',
    cta: 'Visit vendor',
    cardMetaTpl: (d) => `Verified ${d}`,
    reportLink: 'Report data issue?',
    regionLabels: {
      global: 'Global',
      includeTpl: (cs) => `${cs.join('/')} only`,
      excludeTpl: (cs) => `Except ${cs.join('/')}`,
    },
    difficultyLabels: {
      easy: 'Difficulty · Easy',
      medium: 'Difficulty · Medium',
      hard: 'Difficulty · Hard',
    },
    statusPills: {
      verified: 'Verified',
      reported: 'Under review',
      unverified: 'Unverified',
      expiringTpl: (n) => `Expires in ${n} day${n === 1 ? '' : 's'}`,
      expired: 'Expired',
    },
    expiryTpl: {
      long: 'No fixed expiry',
      expired: 'Expired',
      withinTpl: (n) => `Expires in ${n} day${n === 1 ? '' : 's'}`,
    },
    termLabels: {
      no_credit_card: 'No credit card',
      credit_card_required: 'Credit card required',
      phone_verification: 'Phone verification',
      identity_verification: 'Identity verification',
      new_users_only: 'New users only',
      one_per_account: 'One per account',
      auto_renew: 'Auto-renew after trial',
      quota_capped: 'Capped quota',
      time_limited: 'Time limited',
      region_locked: 'Region locked',
      vpn_required: 'VPN required',
      edu_email_required: 'Edu email required',
      business_email_required: 'Business email required',
      oss_project_required: 'OSS project required',
      byok_required: 'BYOK required',
      rate_limited: 'Rate limited',
      non_commercial_only: 'Non-commercial only',
      data_used_for_training: 'Data used for training',
      deposit_required: 'Deposit required',
      waitlist_approval: 'Waitlist approval',
      manual_application: 'Manual application',
      stackable: 'Stackable',
      deprecated_service: 'Deprecated service',
    },
    filterbarLabel: 'Filters',
    regionOptions: [
      { value: '', label: 'All regions' },
      { value: 'global', label: 'Global' },
      { value: 'CN', label: 'China mainland' },
      { value: 'US', label: 'United States' },
      { value: 'FR', label: 'France' },
      { value: 'CA', label: 'Canada' },
    ],
    difficultyOptions: [
      { value: '', label: 'All difficulties' },
      { value: 'easy', label: 'Easy' },
      { value: 'medium', label: 'Medium' },
      { value: 'hard', label: 'Hard' },
    ],
    searchPlaceholder: 'Search by name or offer…',
    transparencyTitle: 'Project transparency',
    transparency1:
      '<strong>Project transparency</strong> · MIT license · No paid placements · No affiliate links · Every entry is human-verified daily.',
    transparency2:
      'This site is a curation tool — it <strong>does not</strong> register, claim, proxy, host, or relay any promo. Every click goes straight to the vendor\'s official page.',
    transparency3:
      'Hosted services (Apify Actor / WorkBuddy Skill) are paid convenience layers; the source code is fully free and self-hostable. Inclusion criteria / sort rules / correction flow live in the GitHub repo README.',
    metaLineTpl: (sha, gen) =>
      `catalog sha256: <code>${sha}…</code> · generated_at: <code>${gen}</code>`,
    // 英文版：当前策展数据正文为中文，UI 已全量翻译，正文保留原文 + 加 banner 说明
    promoDataNote:
      '<p class="lang-note">📝 <strong>Heads-up</strong>: Promo <em>headlines</em> &amp; <em>summaries</em> are currently curated in Chinese (the original source). The full UI is translated. We are working on bilingual <code>headline_en</code> / <code>summary_en</code> fields in v1.2.</p>',
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Helpers (locale-aware)

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function localeName(p) {
  return p.provider.country === 'CN' && p.provider.name_zh ? p.provider.name_zh : p.provider.name_en;
}

function daysUntil(iso) {
  if (!iso) return Infinity;
  const d = Date.parse(iso);
  if (Number.isNaN(d)) return Infinity;
  return Math.round((d - Date.now()) / 86_400_000);
}

function requiresCard(p) {
  return p.terms.some((t) => t.tag === 'credit_card_required');
}

function difficultyLabel(d, L) {
  return L.difficultyLabels[d] ?? d;
}

function difficultyClass(d) {
  return `difficulty-meter difficulty-${d}`;
}

function statusPill(p, L) {
  const expDays = daysUntil(p.offer.expires_at);
  if (expDays <= 0 && !p.offer.no_fixed_expiry) {
    return `<span class="pill pill-danger">${L.statusPills.expired}</span>`;
  }
  if (expDays <= 14 && !p.offer.no_fixed_expiry) {
    return `<span class="pill pill-warn">${L.statusPills.expiringTpl(expDays)}</span>`;
  }
  if (p.verification.status === 'verified') {
    return `<span class="pill pill-success">${L.statusPills.verified}</span>`;
  }
  if (p.verification.status === 'reported') {
    return `<span class="pill pill-warn">${L.statusPills.reported}</span>`;
  }
  return `<span class="pill pill-muted">${L.statusPills.unverified}</span>`;
}

function regionText(r, L) {
  if (r.availability === 'global') return L.regionLabels.global;
  if (r.availability === 'include') return L.regionLabels.includeTpl(r.countries ?? []);
  return L.regionLabels.excludeTpl(r.excluded_countries ?? []);
}

function termLabel(tag, L) {
  return L.termLabels[tag] ?? tag;
}

function promoCard(p, L) {
  const expDays = daysUntil(p.offer.expires_at);
  const expLine = p.offer.no_fixed_expiry
    ? L.expiryTpl.long
    : expDays <= 0
      ? L.expiryTpl.expired
      : L.expiryTpl.withinTpl(expDays);
  return `
  <article class="card" data-id="${esc(p.id)}" data-provider="${esc(p.provider.id)}" data-difficulty="${esc(p.difficulty)}" data-region-availability="${esc(p.region.availability)}" data-needs-card="${requiresCard(p) ? '1' : '0'}" data-exp-days="${expDays}">
    <header class="card-head">
      <div class="provider-row">
        <span class="provider-name">${esc(localeName(p))}</span>
        <span class="provider-country">${esc(p.provider.country)}</span>
        ${statusPill(p, L)}
      </div>
      <h3 class="card-title">${esc(p.offer.headline)}</h3>
      ${p.offer.value_display ? `<div class="card-value">${esc(p.offer.value_display)}</div>` : ''}
    </header>
    ${p.offer.summary ? `<p class="card-summary">${esc(p.offer.summary)}</p>` : ''}
    <ul class="terms">
      ${p.terms.slice(0, 4).map((t) => `<li class="term term-${esc(t.severity)}">${esc(termLabel(t.tag, L))}</li>`).join('')}
    </ul>
    <footer class="card-head-foot">
      <span class="${difficultyClass(p.difficulty)}" aria-label="${difficultyLabel(p.difficulty, L)}">
        <span class="bar"></span><span class="bar"></span><span class="bar"></span>
        <span class="difficulty-text">${difficultyLabel(p.difficulty, L)}</span>
      </span>
      <span class="region">${esc(regionText(p.region, L))}</span>
      <span class="expiry">${esc(expLine)}</span>
      <a class="cta" href="${esc(p.offer.claim_url)}" target="_blank" rel="noopener">${esc(L.cta)}</a>
    </footer>
    <div class="card-meta">
      ${esc(L.cardMetaTpl((p.verification.last_verified_at ?? '').slice(0, 10)))}
      · <a href="#" data-report="${esc(p.id)}" class="report-link">${esc(L.reportLink)}</a>
    </div>
  </article>`;
}

function statsHtml(cat, L) {
  const expiringSoonCount = cat.promos.filter(
    (p) => (p.offer.expires_at ? daysUntil(p.offer.expires_at) : Infinity) <= 14 && !p.offer.no_fixed_expiry,
  ).length;
  return `
    <div class="stat-card">
      <div class="stat-num">${cat.counts.active}</div>
      <div class="stat-label">${L.statLabels[0]}</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${expiringSoonCount}</div>
      <div class="stat-label">${L.statLabels[1]}</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${cat.counts.no_credit_card}</div>
      <div class="stat-label">${L.statLabels[2]}</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${cat.counts.verified}</div>
      <div class="stat-label">${L.statLabels[3]}</div>
    </div>`;
}

// ────────────────────────────────────────────────────────────────────────────
// HTML page (locale-aware)

function indexHtml(cat, lang = 'zh-CN') {
  const L = LOCALES[lang];
  const generatedDate = cat.generated_at.slice(0, 10);
  const activePromos = cat.promos.filter((p) => p.status === 'active' || p.status === 'expiring_soon');

  const regionOptionsHtml = L.regionOptions
    .map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`)
    .join('');
  const difficultyOptionsHtml = L.difficultyOptions
    .map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`)
    .join('');

  return `<!doctype html>
<html lang="${L.lang}" data-project="free-and-cheap-tokens" data-license="MIT" data-monetization="oss+hosted">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(L.siteTitle)}</title>
<meta name="description" content="${esc(L.siteDescription)}">
<meta property="og:title" content="${esc(L.siteTitle)}">
<meta property="og:description" content="${esc(L.ogDescriptionTpl(cat.counts, generatedDate))}">
<meta property="og:image" content="/og.png">
<meta property="og:type" content="website">
<link rel="alternate" type="application/rss+xml" title="RSS" href="/feed.xml">
<link rel="alternate" hreflang="zh-CN" href="/index.html">
<link rel="alternate" hreflang="en" href="/en.html">
<link rel="stylesheet" href="styles.css">
</head>
<body>
<header class="disclosure-bar" role="banner">
  ${esc(L.disclosureBar)}
</header>

<header class="page-head">
  <div class="brand">Free and Cheap Tokens</div>
  <div class="meta">
    <span class="updated">${esc(L.updatedTpl(generatedDate))}</span>
    <a class="lang-toggle" href="/${esc(L.alternatePath)}" hreflang="${L.lang === 'zh-CN' ? 'en' : 'zh-CN'}">${esc(L.alternateLabel)}</a>
    <a class="rss-link" href="/feed.xml" title="RSS">${esc(L.rssLabel)}</a>
    <a class="ics-link" href="/promos.ics" title="${esc(L.icsLabel)}">${esc(L.icsLabel)}</a>
    <button class="share-btn" id="share-btn" type="button">${esc(L.shareBtn)}</button>
  </div>
</header>

<section class="intro">
  <p class="intro-line">
    ${esc(L.introLineTpl(cat.counts, generatedDate))}
  </p>
  ${L.promoDataNote ?? ''}
</section>

<section class="stats">
  ${statsHtml(cat, L)}
</section>

<nav class="filterbar" aria-label="${esc(L.filterbarLabel)}">
  <input class="search" id="search" type="search" placeholder="${esc(L.searchPlaceholder)}">
  <select class="filter-region" id="filter-region" aria-label="${esc(L.filterRegionLabel)}">
    ${regionOptionsHtml}
  </select>
  <select class="filter-difficulty" id="filter-difficulty" aria-label="${esc(L.filterDifficultyLabel)}">
    ${difficultyOptionsHtml}
  </select>
  <label class="checkbox">
    <input type="checkbox" id="filter-no-card"> ${esc(L.filterNoCardLabel)}
  </label>
  <button class="reset-btn" id="reset-btn" type="button">${esc(L.resetBtn)}</button>
</nav>

<main class="card-grid" id="card-grid">
  ${activePromos.map((p) => promoCard(p, L)).join('\n')}
</main>

<footer class="page-foot">
  <p class="transparency">${L.transparency1}</p>
  <p class="transparency">${L.transparency2}</p>
  <p class="transparency">${L.transparency3}</p>
  <p class="meta-line">
    ${L.metaLineTpl(cat.sha256.slice(0, 16), cat.generated_at)}
  </p>
</footer>

<script src="app.js" defer></script>
</body>
</html>`;
}

// ────────────────────────────────────────────────────────────────────────────
// styles.css (zero external dependency)

const SITE_CSS = `/* Free and Cheap Tokens — 站点样式（零外部依赖） */
:root {
  --bg: #F5F6F8;
  --surface: #FFFFFF;
  --fg: #15181D;
  --muted: #5B6371;
  --accent: #0B6E8F;
  --accent-soft: #EAF3F6;
  --accent-deep: #0A4B60;
  --success: #177245;
  --warn: #9A5B00;
  --warn-soft: #FBF3E4;
  --danger: #B42318;
  --line: #E5E7EB;
  --radius: 8px;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "SF Mono", "JetBrains Mono", "Cascadia Mono", Menlo, Consolas, monospace;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg); font-family: var(--font-sans); font-size: 14px; line-height: 1.5; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

/* 项目透明度条（替代原联盟披露条） */
.disclosure-bar {
  position: sticky; top: 0; z-index: 50;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
  padding: 8px 16px;
  font-size: 13px; font-weight: 500; letter-spacing: 0.01em;
  text-align: center;
}

/* 页头 */
.page-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px;
  max-width: 1200px; margin: 0 auto;
}
.brand { font-size: 20px; font-weight: 600; letter-spacing: -0.01em; }
.page-head .meta { display: flex; gap: 12px; align-items: center; font-size: 13px; color: var(--muted); }
.page-head .updated { font-variant-numeric: tabular-nums; }
.page-head .share-btn, .page-head .rss-link, .page-head .ics-link, .page-head .lang-toggle {
  padding: 6px 12px; border: 1px solid var(--line); border-radius: var(--radius);
  background: var(--surface); color: var(--fg); font-size: 13px; cursor: pointer;
  text-decoration: none;
}
.page-head .share-btn:hover, .page-head .lang-toggle:hover { border-color: var(--accent); text-decoration: none; }
.page-head .lang-toggle { font-weight: 500; }

/* intro */
.intro { max-width: 1200px; margin: 0 auto; padding: 0 24px 16px; color: var(--muted); font-size: 13px; }
.lang-note {
  background: var(--accent-soft); border-left: 3px solid var(--accent);
  padding: 8px 12px; border-radius: 4px; margin-top: 8px;
  color: var(--accent-deep); font-size: 13px;
}

/* stat cards */
.stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  max-width: 1200px; margin: 0 auto; padding: 0 24px 24px;
}
.stat-card {
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
  padding: 16px;
}
.stat-num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-size: 32px; font-weight: 600; color: var(--fg); }
.stat-label { font-size: 12px; color: var(--muted); margin-top: 4px; }

@media (max-width: 768px) { .stats { grid-template-columns: repeat(2, 1fr); } }

/* 筛选条 */
.filterbar {
  position: sticky; top: 41px; z-index: 40;
  background: var(--bg); padding: 12px 24px;
  display: flex; gap: 8px; flex-wrap: wrap;
  border-bottom: 1px solid var(--line);
  max-width: 1200px; margin: 0 auto;
}
.filterbar input, .filterbar select {
  padding: 6px 10px; border: 1px solid var(--line); border-radius: var(--radius);
  background: var(--surface); font-family: inherit; font-size: 13px;
}
.filterbar .search { min-width: 240px; }
.filterbar .checkbox { display: flex; align-items: center; gap: 4px; font-size: 13px; }
.filterbar .reset-btn {
  padding: 6px 12px; border: 1px solid var(--line); border-radius: var(--radius);
  background: var(--surface); cursor: pointer; font-size: 13px;
}

/* 卡片网格 */
.card-grid {
  display: grid; gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  max-width: 1200px; margin: 0 auto; padding: 24px;
}
.card {
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
  padding: 16px; display: flex; flex-direction: column; gap: 12px;
  transition: border-color 120ms ease;
}
.card:hover { border-color: var(--accent); }
.card-head { display: flex; flex-direction: column; gap: 6px; }
.provider-row { display: flex; gap: 8px; align-items: center; font-size: 13px; color: var(--muted); }
.provider-name { font-weight: 500; color: var(--fg); }
.provider-country { font-size: 11px; padding: 1px 6px; border: 1px solid var(--line); border-radius: 4px; }
.card-title { font-size: 16px; font-weight: 600; margin: 0; line-height: 1.35; }
.card-value { font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-size: 13px; color: var(--accent-deep); }
.card-summary { font-size: 13px; color: var(--muted); margin: 0; line-height: 1.5; }
.terms { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; padding: 0; margin: 0; }
.term { font-size: 11px; padding: 2px 8px; border-radius: 4px; border: 1px solid var(--line); color: var(--muted); }
.term-blocker { background: #FDF2F2; border-color: #F4C0BC; color: var(--danger); }
.term-friction { background: var(--warn-soft); border-color: #EBD9B0; color: var(--warn); }
.card-head-foot { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 12px; padding-top: 8px; border-top: 1px solid var(--line); }
.card-head-foot .region, .card-head-foot .expiry { color: var(--muted); }
.card-head-foot .cta {
  margin-left: auto; padding: 4px 10px;
  background: var(--accent); color: white; border-radius: 4px; font-weight: 500;
}
.card-head-foot .cta:hover { text-decoration: none; opacity: 0.9; }
.card-meta { font-size: 11px; color: var(--muted); }
.report-link { color: var(--muted); text-decoration: underline dotted; }

/* Pill */
.pill { font-size: 11px; padding: 1px 8px; border-radius: 999px; font-weight: 500; }
.pill-success { background: #E8F4EE; color: var(--success); }
.pill-warn { background: var(--warn-soft); color: var(--warn); }
.pill-danger { background: #FDF2F2; color: var(--danger); }
.pill-muted { background: #F3F4F6; color: var(--muted); }

/* 上手难度徽章（三重视觉编码） */
.difficulty-meter { display: inline-flex; gap: 2px; align-items: center; padding: 4px 8px; border-radius: 4px; font-size: 11px; }
.difficulty-meter .bar { width: 4px; height: 12px; background: var(--line); border-radius: 1px; }
.difficulty-easy .bar:nth-child(1) { background: var(--accent); }
.difficulty-medium .bar:nth-child(1), .difficulty-medium .bar:nth-child(2) { background: var(--accent-deep); }
.difficulty-hard .bar { background: var(--accent-deep); }
.difficulty-easy { background: var(--accent-soft); color: var(--accent); }
.difficulty-medium { background: #D8E9EE; color: var(--accent-deep); }
.difficulty-hard { background: #C3DCE4; color: #073D4F; }
.difficulty-text { margin-left: 6px; font-weight: 500; }

/* 页脚 */
.page-foot {
  max-width: 1200px; margin: 24px auto 0; padding: 24px;
  border-top: 1px solid var(--line);
  font-size: 13px; color: var(--muted);
}
.transparency { margin: 6px 0; line-height: 1.6; }
.meta-line { font-size: 12px; }

/* 隐藏 */
.is-hidden { display: none !important; }

/* 响应式 */
@media (max-width: 640px) {
  .filterbar { flex-direction: column; align-items: stretch; }
  .filterbar .search { min-width: 0; width: 100%; }
  .page-head { flex-direction: column; align-items: flex-start; gap: 12px; }
  .page-head .meta { flex-wrap: wrap; }
}
`;

// ────────────────────────────────────────────────────────────────────────────
// app.js (locale-aware: text comes from data attributes that the page builder
// emits in the right language; behavior is identical)

const APP_JS = `// Free and Cheap Tokens — 客户端脚本
// 零外部依赖；渐进增强；离线可用
// Bilingual: 文案由生成器决定，client 仅做筛选 / 分享 / 错误上报
(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const search = $('#search');
  const regionSel = $('#filter-region');
  const diffSel = $('#filter-difficulty');
  const noCard = $('#filter-no-card');
  const reset = $('#reset-btn');
  const cards = $$('.card');
  const shareBtn = $('#share-btn');

  function applyFilters() {
    const q = (search.value || '').trim().toLowerCase();
    const region = regionSel.value;
    const diff = diffSel.value;
    const noCardOnly = noCard.checked;

    let visible = 0;
    for (const card of cards) {
      const haystack = (card.textContent || '').toLowerCase();
      const matchQ = !q || haystack.includes(q);
      const matchRegion =
        !region ||
        (region === 'global' && card.dataset.regionAvailability === 'global') ||
        card.dataset.provider === '' ||
        card.textContent.includes(region);
      const matchDiff = !diff || card.dataset.difficulty === diff;
      const matchNoCard = !noCardOnly || card.dataset.needsCard === '0';
      const show = matchQ && matchRegion && matchDiff && matchNoCard;
      card.classList.toggle('is-hidden', !show);
      if (show) visible++;
    }
    return visible;
  }

  if (search) search.addEventListener('input', applyFilters);
  if (regionSel) regionSel.addEventListener('change', applyFilters);
  if (diffSel) diffSel.addEventListener('change', applyFilters);
  if (noCard) noCard.addEventListener('change', applyFilters);
  if (reset)
    reset.addEventListener('click', () => {
      search.value = '';
      regionSel.value = '';
      diffSel.value = '';
      noCard.checked = false;
      applyFilters();
    });

  // 分享（含项目透明度声明 + 日期戳）
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const isEn = document.documentElement.lang === 'en';
      const today = new Date().toISOString().slice(0, 10);
      const text = isEn
        ? 'Free AI tier catalog · Verified ' + today +
          '\\nNo paid placements, no affiliate links. Each entry links straight to the vendor.\\n'
        : '免费 AI 额度清单 · 数据核实于 ' + today +
          '\\n本站不接硬广、不挂联盟，每条 promo 直达厂商官方页面。\\n';
      const shareUrl = location.href.split('?')[0] + '?ref=share&d=' + today;

      try {
        if (navigator.share) {
          await navigator.share({ title: 'Free and Cheap Tokens', text: text + shareUrl, url: location.href });
        } else {
          await navigator.clipboard.writeText(text + shareUrl);
          shareBtn.textContent = isEn ? 'Share text copied' : '已复制分享文案';
          setTimeout(() => {
            shareBtn.textContent = isEn ? "Share today's list" : '分享今日清单';
          }, 1500);
        }
      } catch (_) {
        /* 用户取消 */
      }
    });
  }

  // 报告数据错误
  for (const link of $$('.report-link')) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.dataset.report;
      const url =
        'https://github.com/PanStories/free-and-cheap-tokens/issues/new?title=' +
        encodeURIComponent('[data-issue] ' + id) +
        '&labels=data-issue';
      window.open(url, '_blank', 'noopener');
    });
  }
})();
`;

// ────────────────────────────────────────────────────────────────────────────
// RSS (currently Chinese-primary; consumers can use lang discriminator)

function rssXml(cat) {
  const items = cat.promos
    .filter((p) => p.status === 'active' || p.status === 'expiring_soon')
    .map((p) => {
      const date = p.verification.last_verified_at ?? p.updated_at;
      return `    <item>
      <title>${esc(p.offer.headline)} · ${esc(localeName(p))}</title>
      <link>${esc(p.offer.claim_url)}</link>
      <guid isPermaLink="false">${esc(p.id)}</guid>
      <pubDate>${new Date(date).toUTCString()}</pubDate>
      <description><![CDATA[${esc(p.offer.summary ?? p.offer.headline)} · 额度: ${esc(p.offer.value_display ?? '')} · 难度: ${p.difficulty} · 到期: ${esc(p.offer.expires_at ?? '长期')} · 核验于 ${esc((p.verification.last_verified_at ?? '').slice(0, 10))}]]></description>
    </item>`;
    })
    .join('\n');
  const today = new Date().toUTCString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Free and Cheap Tokens</title>
    <link>https://freeandcheaptokens.dev/</link>
    <atom:link href="https://freeandcheaptokens.dev/feed.xml" rel="self" type="application/rss+xml" />
    <description>每日核实的 AI 模型/服务免费额度与低价 token 促销清单。开源 · 不接硬广 · 不挂联盟 · MIT</description>
    <language>zh-CN</language>
    <lastBuildDate>${today}</lastBuildDate>
    <generator>fct build-site.mjs</generator>
${items}
  </channel>
</rss>`;
}

// ────────────────────────────────────────────────────────────────────────────
// ICS

function icsText(cat) {
  const events = cat.promos
    .filter((p) => !p.offer.no_fixed_expiry && p.offer.expires_at)
    .map((p) => {
      const exp = new Date(p.offer.expires_at);
      const dtStart = exp.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
      return [
        'BEGIN:VEVENT',
        `UID:${p.id}@freeandcheaptokens.dev`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`,
        `DTSTART:${dtStart}`,
        `SUMMARY:${esc(p.offer.headline)} · ${esc(localeName(p))}`,
        `DESCRIPTION:${esc(p.offer.summary ?? '').replace(/\n/g, '\\n')}`,
        `URL:${p.offer.claim_url}`,
        'BEGIN:VALARM',
        'TRIGGER:-P7D',
        `DESCRIPTION:${esc(p.offer.headline)} · 7 天内到期`,
        'ACTION:DISPLAY',
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n');
    })
    .join('\r\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Free and Cheap Tokens//Daily AI Promos//ZH',
    'CALSCALE:GREGORIAN',
    events,
    'END:VCALENDAR',
  ].join('\r\n');
}

// ────────────────────────────────────────────────────────────────────────────
// Write (bilingual)

if (!existsSync(SITE_DIR)) mkdirSync(SITE_DIR, { recursive: true });

const zhOut = join(SITE_DIR, 'index.html');
const enOut = join(SITE_DIR, 'en.html');
const stylesOut = join(SITE_DIR, 'styles.css');
const jsOut = join(SITE_DIR, 'app.js');
const rssOut = join(SITE_DIR, 'feed.xml');
const icsOut = join(SITE_DIR, 'promos.ics');

writeFileSync(zhOut, indexHtml(catalog, 'zh-CN'));
console.log(`✓ ${zhOut} (zh-CN)`);
writeFileSync(enOut, indexHtml(catalog, 'en'));
console.log(`✓ ${enOut} (en)`);
writeFileSync(stylesOut, SITE_CSS);
console.log(`✓ ${stylesOut}`);
writeFileSync(jsOut, APP_JS);
console.log(`✓ ${jsOut}`);

try {
  writeFileSync(rssOut, rssXml(catalog));
  console.log(`✓ ${rssOut}`);
} catch (e) {
  console.error(`✗ RSS 生成失败（不阻断）: ${e.message}`);
}

try {
  writeFileSync(icsOut, icsText(catalog));
  console.log(`✓ ${icsOut}`);
} catch (e) {
  console.error(`✗ ICS 生成失败（不阻断）: ${e.message}`);
}

const activeCount = catalog.promos.filter(
  (p) => p.status === 'active' || p.status === 'expiring_soon',
).length;
console.log(`\n→ 站点已生成（zh-CN + en），共 ${activeCount} 条 promo`);
