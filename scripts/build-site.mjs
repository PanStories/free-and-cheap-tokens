#!/usr/bin/env node
/**
 * build-site.mjs —— 从 build/catalog.json 生成：
 *   - site/index.html   单页双语站点（默认英文 · 顶部语言切换 · 零依赖）
 *   - site/en.html      旧链接存根（相对重定向到 ./，防止历史外链 404）
 *   - site/styles.css   站点样式
 *   - site/app.js       语言切换 + 筛选 / 搜索 / 分享 / 纠错
 *   - site/feed.xml     RSS（active + expiring_soon）
 *   - site/promos.ics   ICS（仅 expires_at 存在）
 *
 * 视觉（2026-09-29 改版）：与 mcp-stock-analyst 站点统一设计语言 —— navy 顶栏、
 * #f5f7fa 背景、白卡片、蓝色主按钮、顶部 EN / 中文 切换且默认英文。
 * logo 为本产品专属：价签 + 代币圆片 = 「便宜的 AI token」，不用股票折线图标。
 *
 * OG 图（1200×630 PNG）由 scripts/generate-og.mjs 在 CI 期生成；本脚本不依赖 sharp。
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const CATALOG_PATH = join(root, 'build', 'catalog.json');
const SITE_DIR = join(root, 'site');

// 站点发布根（GitHub Pages 子路径部署友好：页内资源一律用相对路径）
const SITE_ORIGIN = 'https://panstories.github.io/free-and-cheap-tokens';

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
    siteTitle: 'Free and Cheap Tokens · 每日 AI 羊毛清单',
    siteDescription:
      '策展团队每日核实、机器可读的 AI 模型/服务免费与低价 token 促销清单。每条直达厂商官方页。',
    ogDescriptionTpl: (c, d) =>
      `${c.total} 条 promo · ${c.no_credit_card} 条免信用卡 · 数据核实于 ${d}`,
    heroTitle: 'AI 模型与推理服务的免费额度 / 低价 token 清单',
    heroLead:
      '每日人工核实、机器可读的免费额度与低价 token 促销目录。零广告、零联盟链接，每条都直达厂商官方页面。',
    badgeLive: '已上架 Apify Store',
    badgeVersionTpl: (v) => `v${v}`,
    badgePromosTpl: (n) => `${n} 条 promo`,
    badgeVerified: '每日核实',
    ctaStore: 'Apify Store',
    ctaSource: '查看源码',
    ctaConnect: '接入方式',
    navPromos: '今日清单',
    navPricing: '定价',
    navConnect: '接入',
    navSource: '源码',
    updatedTpl: (d) => `数据核实于 ${d}`,
    rssLabel: 'RSS',
    icsLabel: 'ICS 日历',
    shareBtn: '分享今日清单',
    shareCopied: '已复制分享文案',
    shareTextTpl: (d) =>
      `免费 AI 额度清单 · 数据核实于 ${d}\n本站不接硬广、不挂联盟，每条 promo 直达厂商官方页面。\n`,
    introLineTpl: (c, d) =>
      `${c.total} 条 promo · ${c.no_credit_card} 条免信用卡 · ${c.verified} 条已人工核验 · 数据核实于 ${d}`,
    statLabels: ['当前可薅', '14 天内到期', '免信用卡', '已人工核验'],
    sectionPromos: '今日清单',
    sectionPromosSub: '默认只显示当前可领取与即将到期的条目；筛选在客户端完成，不上传任何行为数据。',
    filterRegionLabel: '区域',
    filterDifficultyLabel: '上手难度',
    filterNoCardLabel: '仅看免信用卡',
    resetBtn: '清除全部筛选',
    cta: '去官方页',
    cardMetaTpl: (d) => `数据核实于 ${d}`,
    reportLink: '数据有误？',
    emptyState: '没有符合条件的 promo，试试放宽筛选。',
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
    sectionPricing: '定价',
    sectionPricingSub: '握手（initialize / tools/list）与纠错上报永远免费；只有真正取数据的调用才计费。',
    pricingCols: ['事件', '含义', '单价'],
    pricingRows: [
      { event: 'mcp-search', desc: '关键词搜索 promo', price: '$0.005' },
      { event: 'mcp-filter / mcp-recent-updates / mcp-expiring-soon', desc: '按条件筛选 / 最新 / 即将到期', price: '$0.005' },
      { event: 'mcp-get-promo / mcp-list-providers', desc: '取单条详情 / 厂商列表', price: '$0.002' },
      { event: 'mcp-what-can-i-get', desc: '按你的条件推理「我能薅到什么」', price: '$0.01' },
      { event: 'mcp-initialize / mcp-list-tools / mcp-report-issue', desc: '握手与纠错', price: 'Free' },
    ],
    sectionConnect: '接入',
    sectionConnectSub: '远程端点免部署；本地 stdio 完全免费自托管（MIT）。',
    tabRemote: '远程（推荐）',
    tabLocal: '本地 stdio',
    transparencyTitle: '项目透明度',
    transparency1: '<strong>项目透明度</strong> · 开源协议 MIT · 不接硬广 · 不挂联盟 · 每条数据每日人工核实。',
    transparency2: '本站为策展型工具，<strong>不参与</strong>任何 promo 的注册、申领、代理、托管或转发；所有点击直达厂商官方页面。',
    transparency3: '托管服务（Apify Actor / WorkBuddy Skill）为付费便利层，源码完全免费可自托管。收录标准 / 排序规则 / 纠错流程见 GitHub 仓库 README。',
    metaLineTpl: (sha, gen) =>
      `catalog sha256: <code>${esc(sha)}…</code> · generated_at: <code>${esc(gen)}</code>`,
    promoDataNote:
      '<strong>说明</strong>：promo 标题与摘要以中文为源文录入，每条约附英文翻译；切换英文界面时显示英文（headline_en / summary_en / value_display_en）。',
  },

  en: {
    lang: 'en',
    siteTitle: 'Free and Cheap Tokens · Daily AI Deal List',
    siteDescription:
      'Curated, daily-verified, machine-readable catalog of free tiers and cheap token promos for AI models and inference services. Every entry links to the vendor\'s official page.',
    ogDescriptionTpl: (c, d) =>
      `${c.total} promos · ${c.no_credit_card} no credit card · Verified ${d}`,
    heroTitle: 'Free tiers and cheap token promos for AI models and inference',
    heroLead:
      'A curated, daily-verified, machine-readable catalog of free and cheap AI token offers. No ads, no affiliate links — every entry goes straight to the vendor.',
    badgeLive: 'Live on Apify Store',
    badgeVersionTpl: (v) => `v${v}`,
    badgePromosTpl: (n) => `${n} promos`,
    badgeVerified: 'Verified daily',
    ctaStore: 'Apify Store',
    ctaSource: 'View Source',
    ctaConnect: 'Connect',
    navPromos: 'Promos',
    navPricing: 'Pricing',
    navConnect: 'Connect',
    navSource: 'Source',
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
    sectionPromos: "Today's list",
    sectionPromosSub:
      'Shows what is claimable now or expiring soon. Filtering runs entirely in your browser — nothing is tracked.',
    filterRegionLabel: 'Region',
    filterDifficultyLabel: 'Difficulty',
    filterNoCardLabel: 'No credit card only',
    resetBtn: 'Clear all filters',
    cta: 'Visit vendor',
    cardMetaTpl: (d) => `Verified ${d}`,
    reportLink: 'Report data issue?',
    emptyState: 'No promo matches these filters — try widening them.',
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
    sectionPricing: 'Pricing',
    sectionPricingSub:
      'Handshake (initialize / tools/list) and issue reports are always free. You only pay when data is actually returned.',
    pricingCols: ['Event', 'What it does', 'Price'],
    pricingRows: [
      { event: 'mcp-search', desc: 'Keyword search across promos', price: '$0.005' },
      { event: 'mcp-filter / mcp-recent-updates / mcp-expiring-soon', desc: 'Filter / latest / expiring', price: '$0.005' },
      { event: 'mcp-get-promo / mcp-list-providers', desc: 'Single promo / provider list', price: '$0.002' },
      { event: 'mcp-what-can-i-get', desc: 'Reason about what you can claim', price: '$0.01' },
      { event: 'mcp-initialize / mcp-list-tools / mcp-report-issue', desc: 'Handshake and issue reports', price: 'Free' },
    ],
    sectionConnect: 'Connect',
    sectionConnectSub:
      'The hosted endpoint needs no setup; the local stdio server is free and self-hostable (MIT).',
    tabRemote: 'Remote (recommended)',
    tabLocal: 'Local stdio',
    transparencyTitle: 'Project transparency',
    transparency1:
      '<strong>Project transparency</strong> · MIT license · No paid placements · No affiliate links · Every entry is human-verified daily.',
    transparency2:
      'This site is a curation tool — it <strong>does not</strong> register, claim, proxy, host, or relay any promo. Every click goes straight to the vendor\'s official page.',
    transparency3:
      'Hosted services (Apify Actor / WorkBuddy Skill) are paid convenience layers; the source code is fully free and self-hostable. Inclusion criteria / sort rules / correction flow live in the GitHub repo README.',
    metaLineTpl: (sha, gen) =>
      `catalog sha256: <code>${esc(sha)}…</code> · generated_at: <code>${esc(gen)}</code>`,
    promoDataNote:
      '<strong>Note</strong>: promo headlines and summaries are curated in Chinese at the source, and each entry also carries an English translation. The English UI shows the English text (<code>headline_en</code> / <code>summary_en</code> / <code>value_display_en</code>).',
  },
};

const EN = LOCALES.en;
const ZH = LOCALES['zh-CN'];

// ────────────────────────────────────────────────────────────────────────────
// Helpers

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 双语片段：同一处文案输出两份 span，由 app.js 按当前语言切换显示。 */
function bi(en, zh) {
  if (!zh || en === zh) return esc(en);
  return `<span class="lang-en">${esc(en)}</span><span class="lang-zh hidden">${esc(zh)}</span>`;
}

/** 双语切换，但不转义：仅用于本脚本内部写死、可信的 HTML（含 <strong>/<code> 标签）字符串。动态插值仍须先 esc()。 */
function biRaw(en, zh) {
  if (!zh || en === zh) return en;
  return `<span class="lang-en">${en}</span><span class="lang-zh hidden">${zh}</span>`;
}

/** 双语属性（placeholder / aria-label 之类，靠 JS 同步，见 APP_JS）。 */
function biAttr(en, zh) {
  return ` data-en="${esc(en)}" data-zh="${esc(zh)}"`;
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

function statusPill(p) {
  const expDays = daysUntil(p.offer.expires_at);
  if (expDays <= 0 && !p.offer.no_fixed_expiry) {
    return `<span class="pill pill-danger">${bi(EN.statusPills.expired, ZH.statusPills.expired)}</span>`;
  }
  if (expDays <= 14 && !p.offer.no_fixed_expiry) {
    return `<span class="pill pill-warn">${bi(EN.statusPills.expiringTpl(expDays), ZH.statusPills.expiringTpl(expDays))}</span>`;
  }
  if (p.verification.status === 'verified') {
    return `<span class="pill pill-success">${bi(EN.statusPills.verified, ZH.statusPills.verified)}</span>`;
  }
  if (p.verification.status === 'reported') {
    return `<span class="pill pill-warn">${bi(EN.statusPills.reported, ZH.statusPills.reported)}</span>`;
  }
  return `<span class="pill pill-muted">${bi(EN.statusPills.unverified, ZH.statusPills.unverified)}</span>`;
}

function regionText(p) {
  const r = p.region;
  if (r.availability === 'global') return { en: EN.regionLabels.global, zh: ZH.regionLabels.global };
  if (r.availability === 'include') {
    return {
      en: EN.regionLabels.includeTpl(r.countries ?? []),
      zh: ZH.regionLabels.includeTpl(r.countries ?? []),
    };
  }
  return {
    en: EN.regionLabels.excludeTpl(r.excluded_countries ?? []),
    zh: ZH.regionLabels.excludeTpl(r.excluded_countries ?? []),
  };
}

function expiryText(p) {
  const expDays = daysUntil(p.offer.expires_at);
  if (p.offer.no_fixed_expiry) return { en: EN.expiryTpl.long, zh: ZH.expiryTpl.long };
  if (expDays <= 0) return { en: EN.expiryTpl.expired, zh: ZH.expiryTpl.expired };
  return { en: EN.expiryTpl.withinTpl(expDays), zh: ZH.expiryTpl.withinTpl(expDays) };
}

function promoCard(p) {
  const expDays = daysUntil(p.offer.expires_at);
  const exp = expiryText(p);
  const region = regionText(p);
  return `
  <article class="card" data-id="${esc(p.id)}" data-provider="${esc(p.provider.id)}" data-difficulty="${esc(p.difficulty)}" data-region-availability="${esc(p.region.availability)}" data-needs-card="${requiresCard(p) ? '1' : '0'}" data-exp-days="${expDays}">
    <div class="card-top">
      <div class="provider-row">
        <span class="provider-name">${bi(p.provider.name_en, p.provider.name_zh || p.provider.name_en)}</span>
        <span class="provider-country">${esc(p.provider.country)}</span>
        ${statusPill(p)}
      </div>
      <h3 class="card-title">${bi(p.offer.headline_en ?? p.offer.headline, p.offer.headline)}</h3>
      ${p.offer.value_display ? `<div class="card-value">${bi(p.offer.value_display_en ?? p.offer.value_display, p.offer.value_display)}</div>` : ''}
    </div>
    ${p.offer.summary ? `<p class="card-summary">${bi(p.offer.summary_en ?? p.offer.summary, p.offer.summary)}</p>` : ''}
    <ul class="terms">
      ${p.terms
        .slice(0, 4)
        .map(
          (t) =>
            `<li class="term term-${esc(t.severity)}">${bi(EN.termLabels[t.tag] ?? t.tag, ZH.termLabels[t.tag] ?? t.tag)}</li>`,
        )
        .join('')}
    </ul>
    <div class="card-foot">
      <span class="difficulty-meter difficulty-${esc(p.difficulty)}" aria-label="${esc(EN.difficultyLabels[p.difficulty] ?? p.difficulty)}">
        <span class="bar"></span><span class="bar"></span><span class="bar"></span>
        <span class="difficulty-text">${bi(EN.difficultyLabels[p.difficulty] ?? p.difficulty, ZH.difficultyLabels[p.difficulty] ?? p.difficulty)}</span>
      </span>
      <span class="region">${bi(region.en, region.zh)}</span>
      <span class="expiry">${bi(exp.en, exp.zh)}</span>
      <a class="btn primary sm" href="${esc(p.offer.claim_url)}" target="_blank" rel="noopener">${bi(EN.cta, ZH.cta)}</a>
    </div>
    <div class="card-meta">
      ${bi(EN.cardMetaTpl((p.verification.last_verified_at ?? '').slice(0, 10)), ZH.cardMetaTpl((p.verification.last_verified_at ?? '').slice(0, 10)))}
      · <a href="#" data-report="${esc(p.id)}" class="report-link">${bi(EN.reportLink, ZH.reportLink)}</a>
    </div>
  </article>`;
}

function statsHtml(cat) {
  const expiringSoonCount = cat.promos.filter(
    (p) => (p.offer.expires_at ? daysUntil(p.offer.expires_at) : Infinity) <= 14 && !p.offer.no_fixed_expiry,
  ).length;
  const values = [cat.counts.active, expiringSoonCount, cat.counts.no_credit_card, cat.counts.verified];
  return values
    .map(
      (n, i) => `
    <div class="stat-card">
      <div class="stat-num">${n}</div>
      <div class="stat-label">${bi(EN.statLabels[i], ZH.statLabels[i])}</div>
    </div>`,
    )
    .join('');
}

function optionsHtml(kind) {
  const pairs = EN[kind].map((o, i) => ({ value: o.value, en: o.label, zh: ZH[kind][i].label }));
  return pairs
    .map((o) => `<option value="${esc(o.value)}"${biAttr(o.en, o.zh)}>${esc(o.en)}</option>`)
    .join('');
}

// ────────────────────────────────────────────────────────────────────────────
// Brand mark —— 价签（cheap）里嵌一枚代币圆片（token）
//
// 与 mcp-stock-analyst 的「折线图」图标刻意不同：FaCT 讲的是「便宜的 AI token」。

const BRAND_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="#f0b429" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/>
        <circle cx="8.2" cy="8.2" r="2.7"/>
        <circle cx="8.2" cy="8.2" r="0.9" fill="#f0b429" stroke="none"/>
      </svg>`;

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='5' fill='%230f2a4a'/%3E%3Cpath d='M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z' fill='none' stroke='%23f0b429' stroke-width='1.9' stroke-linejoin='round'/%3E%3Ccircle cx='8.2' cy='8.2' r='2.7' fill='none' stroke='%23f0b429' stroke-width='1.9'/%3E%3C/svg%3E";

// ────────────────────────────────────────────────────────────────────────────
// HTML page (single page, bilingual, English by default)

function indexHtml(cat) {
  const generatedDate = cat.generated_at.slice(0, 10);
  const activePromos = cat.promos.filter((p) => p.status === 'active' || p.status === 'expiring_soon');
  const version = '1.1';

  const pricingRows = EN.pricingRows
    .map((r, i) => {
      const zh = ZH.pricingRows[i];
      return `      <tr>
        <td><code>${esc(r.event)}</code></td>
        <td>${bi(r.desc, zh.desc)}</td>
        <td><span class="pill${r.price === 'Free' ? ' free' : ''}">${esc(r.price)}</span></td>
      </tr>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="en" data-project="free-and-cheap-tokens" data-license="MIT" data-monetization="oss+hosted">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(EN.siteTitle)}</title>
<meta name="description" content="${esc(EN.siteDescription)}">
<link rel="canonical" href="${SITE_ORIGIN}/">
<meta property="og:title" content="${esc(EN.siteTitle)}">
<meta property="og:description" content="${esc(EN.ogDescriptionTpl(cat.counts, generatedDate))}">
<meta property="og:image" content="og.png">
<meta property="og:type" content="website">
<link rel="alternate" type="application/rss+xml" title="RSS" href="feed.xml">
<link rel="icon" href="${FAVICON}">
<link rel="stylesheet" href="styles.css">
</head>
<body>
<header class="top">
  <div class="wrap">
    <div class="brand">
      ${BRAND_SVG}
      Free and Cheap Tokens
    </div>
    <nav class="main">
      <a href="#promos">${bi(EN.navPromos, ZH.navPromos)}</a>
      <a href="#pricing">${bi(EN.navPricing, ZH.navPricing)}</a>
      <a href="#connect">${bi(EN.navConnect, ZH.navConnect)}</a>
      <a href="https://github.com/PanStories/free-and-cheap-tokens" target="_blank" rel="noopener">${bi(EN.navSource, ZH.navSource)}</a>
      <span class="lang">
        <button id="enBtn" class="active" type="button" onclick="setLang('en')">EN</button>
        <button id="zhBtn" type="button" onclick="setLang('zh')">中文</button>
      </span>
    </nav>
  </div>
</header>

<div class="hero">
  <div class="wrap">
    <h1 class="lang-en">${esc(EN.heroTitle)}</h1>
    <h1 class="lang-zh hidden">${esc(ZH.heroTitle)}</h1>
    <p class="lead lang-en">${esc(EN.heroLead)}</p>
    <p class="lead lang-zh hidden">${esc(ZH.heroLead)}</p>
    <div class="badges">
      <span class="badge"><span class="dot"></span> ${bi(EN.badgeLive, ZH.badgeLive)}</span>
      <span class="badge">MIT</span>
      <span class="badge">${esc(EN.badgeVersionTpl(version))}</span>
      <span class="badge">${esc(EN.badgePromosTpl(cat.counts.total))}</span>
      <span class="badge">${bi(EN.badgeVerified, ZH.badgeVerified)}</span>
    </div>
    <div class="cta">
      <a class="btn primary" href="https://apify.com/neeenja/free-and-cheap-tokens" target="_blank" rel="noopener">${esc(EN.ctaStore)}</a>
      <a class="btn ghost" href="https://github.com/PanStories/free-and-cheap-tokens" target="_blank" rel="noopener">${esc(EN.ctaSource)}</a>
      <a class="btn ghost" href="#connect">${bi(EN.ctaConnect, ZH.ctaConnect)}</a>
    </div>
  </div>
</div>

<section id="promos">
  <div class="wrap">
    <h2>${bi(EN.sectionPromos, ZH.sectionPromos)}</h2>
    <p class="sub">${bi(EN.sectionPromosSub, ZH.sectionPromosSub)}</p>

    <div class="stats">
      ${statsHtml(cat)}
    </div>

    <div class="list-head">
      <p class="intro-line lang-en">${esc(EN.introLineTpl(cat.counts, generatedDate))}</p>
      <p class="intro-line lang-zh hidden">${esc(ZH.introLineTpl(cat.counts, generatedDate))}</p>
      <div class="list-actions">
        <a class="rss-link" href="feed.xml">${esc(EN.rssLabel)}</a>
        <a class="rss-link" href="promos.ics">${bi(EN.icsLabel, ZH.icsLabel)}</a>
        <button class="share-btn" id="share-btn" type="button">${bi(EN.shareBtn, ZH.shareBtn)}</button>
      </div>
    </div>

    <p class="note lang-en">${EN.promoDataNote}</p>
    <p class="note lang-zh hidden">${ZH.promoDataNote}</p>

    <div class="filterbar" role="group" aria-label="${esc(EN.filterbarLabel)}">
      <input class="search" id="search" type="search" placeholder="${esc(EN.searchPlaceholder)}"${biAttr(EN.searchPlaceholder, ZH.searchPlaceholder)} aria-label="${esc(EN.filterbarLabel)}">
      <select class="filter-region" id="filter-region" aria-label="${esc(EN.filterRegionLabel)}">
${optionsHtml('regionOptions')}
      </select>
      <select class="filter-difficulty" id="filter-difficulty" aria-label="${esc(EN.filterDifficultyLabel)}">
${optionsHtml('difficultyOptions')}
      </select>
      <label class="checkbox">
        <input type="checkbox" id="filter-no-card"> ${bi(EN.filterNoCardLabel, ZH.filterNoCardLabel)}
      </label>
      <button class="reset-btn" id="reset-btn" type="button">${bi(EN.resetBtn, ZH.resetBtn)}</button>
    </div>

    <div class="card-grid" id="card-grid">
${activePromos.map((p) => promoCard(p)).join('\n')}
    </div>
    <p class="empty-state hidden" id="empty-state">${bi(EN.emptyState, ZH.emptyState)}</p>
  </div>
</section>

<section id="pricing">
  <div class="wrap">
    <h2>${bi(EN.sectionPricing, ZH.sectionPricing)}</h2>
    <p class="sub">${bi(EN.sectionPricingSub, ZH.sectionPricingSub)}</p>
    <table class="price-table">
      <thead>
        <tr>
          <th>${esc(EN.pricingCols[0])}</th>
          <th>${esc(EN.pricingCols[1])}</th>
          <th>${esc(EN.pricingCols[2])}</th>
        </tr>
      </thead>
      <tbody>
${pricingRows}
      </tbody>
    </table>
  </div>
</section>

<section id="connect">
  <div class="wrap">
    <h2>${bi(EN.sectionConnect, ZH.sectionConnect)}</h2>
    <p class="sub">${bi(EN.sectionConnectSub, ZH.sectionConnectSub)}</p>
    <div class="tabs">
      <button class="tab active" type="button" data-panel="remote">${bi(EN.tabRemote, ZH.tabRemote)}</button>
      <button class="tab" type="button" data-panel="local">${bi(EN.tabLocal, ZH.tabLocal)}</button>
    </div>
    <div class="code panel active" id="panel-remote">
      <button class="copy" type="button" data-copy="panel-remote">Copy</button>
      <pre>npx mcp-remote https://neeenja--free-and-cheap-tokens.apify.actor/mcp \\
  --header "Authorization: Bearer $APIFY_TOKEN"</pre>
    </div>
    <div class="code panel" id="panel-local">
      <button class="copy" type="button" data-copy="panel-local">Copy</button>
      <pre>git clone https://github.com/PanStories/free-and-cheap-tokens.git
cd free-and-cheap-tokens
npm ci && npm run build
node dist/index.js          # stdio transport, free forever (MIT)</pre>
    </div>
  </div>
</section>

<footer>
  <div class="wrap">
    <div class="fcols">
      <p class="transparency">${biRaw(EN.transparency1, ZH.transparency1)}</p>
      <p class="transparency">${biRaw(EN.transparency2, ZH.transparency2)}</p>
      <p class="transparency">${biRaw(EN.transparency3, ZH.transparency3)}</p>
      <p class="meta-line">${biRaw(EN.metaLineTpl(cat.sha256.slice(0, 16), cat.generated_at), ZH.metaLineTpl(cat.sha256.slice(0, 16), cat.generated_at))}</p>
    </div>
    <div class="fcols links">
      <a href="https://apify.com/neeenja/free-and-cheap-tokens" target="_blank" rel="noopener">Apify Store</a>
      <a href="https://github.com/PanStories/free-and-cheap-tokens" target="_blank" rel="noopener">GitHub</a>
      <a href="https://sartbot.com/mcp/free-and-cheap-tokens/" target="_blank" rel="noopener">Sartbot Featured</a>
      <a href="feed.xml">RSS</a>
      <a href="promos.ics">ICS</a>
      <span class="updated">${bi(EN.updatedTpl(generatedDate), ZH.updatedTpl(generatedDate))}</span>
    </div>
  </div>
</footer>

<script src="app.js" defer></script>
</body>
</html>`;
}

/** 旧外链 /en.html 的存根：保持历史链接不 404（相对路径，适配 Pages 子路径）。 */
function enStubHtml() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Free and Cheap Tokens</title>
<meta http-equiv="refresh" content="0; url=./">
<link rel="canonical" href="${SITE_ORIGIN}/">
</head>
<body>
<p>Redirecting to <a href="./">Free and Cheap Tokens</a>…</p>
</body>
</html>`;
}

// ────────────────────────────────────────────────────────────────────────────
// styles.css —— 与 mcp-stock-analyst 同一套设计语言（navy 顶栏 / 浅灰蓝背景 / 白卡片）

const SITE_CSS = `/* Free and Cheap Tokens — 站点样式（零外部依赖）
   设计语言与 mcp-stock-analyst 一致：navy 顶栏 + #f5f7fa 背景 + 白卡片 + 蓝色主按钮 */
:root{
  --navy:#0f2a4a; --navy2:#163a63; --blue:#2563eb; --blue-d:#1d4ed8;
  --bg:#f5f7fa; --card:#ffffff; --ink:#1f2937; --muted:#5b6b7e;
  --line:#e3e8ef; --green:#16a34a; --green-bg:#e8f6ee; --amber:#b45309; --amber-bg:#fdf3e0;
  --gold:#f0b429; --danger:#b42318; --danger-bg:#fdf2f2;
  --shadow:0 1px 3px rgba(15,42,74,.08),0 8px 24px rgba(15,42,74,.06);
  --radius:12px;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",Helvetica,Arial,sans-serif;
  background:var(--bg); color:var(--ink); line-height:1.6; font-size:14px; -webkit-font-smoothing:antialiased;
}
a{color:var(--blue);text-decoration:none}
a:hover{text-decoration:underline}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
.hidden{display:none!important}

/* Header */
header.top{background:var(--navy);color:#fff;position:sticky;top:0;z-index:30;
  box-shadow:0 1px 0 rgba(255,255,255,.06)}
.top .wrap{display:flex;align-items:center;gap:16px;height:60px}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:17px;color:#fff}
.brand svg{width:26px;height:26px;flex:none}
nav.main{margin-left:auto;display:flex;gap:20px;align-items:center}
nav.main a{color:#cdd9e8;font-size:14px}
nav.main a:hover{color:#fff;text-decoration:none}
.lang{display:inline-flex;border:1px solid rgba(255,255,255,.25);border-radius:8px;overflow:hidden}
.lang button{background:transparent;color:#cdd9e8;border:0;padding:6px 12px;font-size:13px;cursor:pointer;font-family:inherit}
.lang button.active{background:#fff;color:var(--navy);font-weight:600}

/* Hero */
.hero{background:linear-gradient(160deg,var(--navy2),var(--navy));color:#fff;padding:54px 0 46px}
.hero h1{font-size:34px;margin:0 0 10px;line-height:1.2}
.hero p.lead{font-size:17px;color:#cfe0f3;max-width:680px;margin:0 0 22px}
.badges{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:26px}
.badge{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:6px 13px;font-size:13px;color:#eaf2fb}
.dot{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 0 3px rgba(22,163,74,.25)}
.cta{display:flex;flex-wrap:wrap;gap:12px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:10px;font-weight:600;font-size:14px;border:1px solid transparent}
.btn.primary{background:var(--blue);color:#fff}
.btn.primary:hover{background:var(--blue-d);text-decoration:none}
.btn.ghost{border-color:rgba(255,255,255,.35);color:#fff;background:transparent}
.btn.ghost:hover{background:rgba(255,255,255,.12);text-decoration:none}
.btn.sm{padding:4px 11px;font-size:12px;border-radius:7px}

/* Sections */
section{padding:44px 0}
section h2{font-size:24px;margin:0 0 6px;color:var(--navy)}
section .sub{color:var(--muted);margin:0 0 22px;font-size:15px}
.note{background:var(--amber-bg);border:1px solid #f0dcb4;border-radius:10px;padding:12px 14px;font-size:13px;color:#7a5a12;margin:0 0 16px}

/* Stats */
.stats{display:grid;gap:14px;grid-template-columns:repeat(4,1fr);margin-bottom:24px}
.stat-card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:16px;box-shadow:var(--shadow)}
.stat-num{font-size:30px;font-weight:700;color:var(--navy);font-variant-numeric:tabular-nums;line-height:1.1}
.stat-label{font-size:12px;color:var(--muted);margin-top:4px}
@media(max-width:760px){.stats{grid-template-columns:1fr 1fr}}

/* List head + filters */
.list-head{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-bottom:14px}
.intro-line{margin:0;font-size:13px;color:var(--muted)}
.list-actions{display:flex;gap:8px;align-items:center}
.rss-link,.share-btn{border:1px solid var(--line);background:var(--card);color:var(--ink);
  border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer;font-family:inherit;text-decoration:none}
.rss-link:hover,.share-btn:hover{border-color:var(--blue);color:var(--blue);text-decoration:none}
.filterbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;background:var(--card);
  border:1px solid var(--line);border-radius:var(--radius);padding:12px;margin-bottom:18px;box-shadow:var(--shadow)}
.filterbar input,.filterbar select{padding:7px 10px;border:1px solid var(--line);border-radius:8px;
  background:#fff;font-family:inherit;font-size:13px;color:var(--ink)}
.filterbar .search{min-width:230px;flex:1 1 230px}
.filterbar .checkbox{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted)}
.filterbar .reset-btn{padding:7px 12px;border:1px solid var(--line);border-radius:8px;background:#fff;cursor:pointer;font-family:inherit;font-size:13px}
.filterbar .reset-btn:hover{border-color:var(--blue);color:var(--blue)}

/* Promo cards */
.card-grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(330px,1fr))}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:18px;
  display:flex;flex-direction:column;gap:10px;box-shadow:var(--shadow)}
.card:hover{border-color:var(--blue)}
.card-top{display:flex;flex-direction:column;gap:6px}
.provider-row{display:flex;gap:8px;align-items:center;font-size:13px;color:var(--muted);flex-wrap:wrap}
.provider-name{font-weight:600;color:var(--ink)}
.provider-country{font-size:11px;padding:1px 7px;border:1px solid var(--line);border-radius:999px}
.card-title{font-size:16px;font-weight:600;margin:0;line-height:1.35;color:var(--navy)}
.card-value{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;color:var(--amber)}
.card-summary{font-size:13px;color:var(--muted);margin:0}
.terms{display:flex;flex-wrap:wrap;gap:6px;list-style:none;padding:0;margin:0}
.term{font-size:11px;padding:2px 9px;border-radius:6px;border:1px solid var(--line);color:var(--muted);background:#f7f9fc}
.term-blocker{background:var(--danger-bg);border-color:#f3c6c2;color:var(--danger)}
.term-friction{background:var(--amber-bg);border-color:#f0dcb4;color:var(--amber)}
.card-foot{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:12px;
  padding-top:10px;border-top:1px solid var(--line)}
.card-foot .region,.card-foot .expiry{color:var(--muted)}
.card-foot .btn.sm{margin-left:auto}
.card-meta{font-size:11px;color:var(--muted)}
.report-link{color:var(--muted);text-decoration:underline dotted}
.empty-state{color:var(--muted);font-size:14px;padding:24px 0}

/* Pills + difficulty */
.pill{font-size:12px;padding:2px 9px;border-radius:6px;font-weight:600;background:var(--green-bg);color:var(--green)}
.pill.free{background:#eef2f7;color:var(--muted)}
.pill-success{background:var(--green-bg);color:var(--green)}
.pill-warn{background:var(--amber-bg);color:var(--amber)}
.pill-danger{background:var(--danger-bg);color:var(--danger)}
.pill-muted{background:#eef2f7;color:var(--muted)}
.difficulty-meter{display:inline-flex;gap:2px;align-items:center;padding:3px 8px;border-radius:6px;font-size:11px;background:#eef2f7;color:var(--muted)}
.difficulty-meter .bar{width:4px;height:11px;background:#cfd8e3;border-radius:1px}
.difficulty-easy .bar:nth-child(1){background:var(--green)}
.difficulty-medium .bar:nth-child(1),.difficulty-medium .bar:nth-child(2){background:var(--amber)}
.difficulty-hard .bar{background:var(--danger)}
.difficulty-text{margin-left:6px;font-weight:600}

/* Pricing */
.price-table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);
  border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow)}
.price-table th,.price-table td{padding:13px 16px;text-align:left;font-size:14px;border-bottom:1px solid var(--line)}
.price-table th{background:#f0f4f9;color:var(--navy);font-weight:600}
.price-table tr:last-child td{border-bottom:0}
.price-table code{background:#eef2f7;border-radius:6px;padding:1px 6px;font-size:13px;color:var(--navy2);
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}

/* Connect */
.tabs{display:flex;gap:8px;margin-bottom:-1px}
.tab{background:#eef2f7;border:1px solid var(--line);border-bottom:0;border-radius:8px 8px 0 0;
  padding:8px 14px;font-size:13px;cursor:pointer;color:var(--muted);font-family:inherit}
.tab.active{background:var(--card);color:var(--navy);font-weight:600;border-color:var(--line)}
.code{position:relative;background:#0f1b2d;color:#d6e2f1;border-radius:0 12px 12px 12px;padding:18px;overflow:auto;font-size:13px;line-height:1.5}
.code pre{margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre}
.panel{display:none}
.panel.active{display:block}
.copy{position:absolute;top:10px;right:10px;background:#1d3a5f;color:#cfe0f3;border:1px solid #2c507f;
  border-radius:7px;padding:5px 10px;font-size:12px;cursor:pointer;font-family:inherit}
.copy:hover{background:#244a78}

/* Footer */
footer{background:var(--navy);color:#aebfd2;padding:28px 0;font-size:13px}
footer a{color:#cfe0f3}
footer .wrap{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start;justify-content:space-between}
footer .fcols{display:flex;flex-direction:column;gap:6px;max-width:760px}
footer .fcols.links{flex-direction:row;gap:18px;align-items:center;flex-wrap:wrap}
footer .transparency{margin:0;line-height:1.6}
footer .meta-line{font-size:12px;color:#8fa3ba}
footer code{background:rgba(255,255,255,.08);border-radius:5px;padding:1px 5px}

@media(max-width:700px){
  .hero{padding:38px 0 32px}
  .hero h1{font-size:27px}
  .top .wrap{height:auto;padding:10px 20px;flex-wrap:wrap}
  nav.main{margin-left:0;gap:14px;flex-wrap:wrap}
  .card-grid{grid-template-columns:1fr}
}
`;

// ────────────────────────────────────────────────────────────────────────────
// app.js —— 语言切换（默认英文）+ 筛选 / 搜索 / 分享 / 纠错

const APP_JS = `// Free and Cheap Tokens — 客户端脚本
// 零外部依赖；渐进增强；语言默认英文，切换状态记在 localStorage
(function () {
  'use strict';

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  var STORE_KEY = 'fact-lang';

  function applyLangTexts(lang) {
    var key = lang === 'zh' ? 'zh' : 'en';
    $$('[data-en][data-zh]').forEach(function (el) {
      var v = el.getAttribute('data-' + key);
      if (!v) return;
      if (el.tagName === 'OPTION') { el.textContent = v; return; }
      if (el.tagName === 'INPUT' && (el.type === 'search' || el.type === 'text')) { el.placeholder = v; return; }
      el.setAttribute('aria-label', v);
    });
  }

  window.setLang = function (lang) {
    var isZh = lang === 'zh';
    document.documentElement.lang = isZh ? 'zh-CN' : 'en';
    $$('.lang-en').forEach(function (el) { el.classList.toggle('hidden', isZh); });
    $$('.lang-zh').forEach(function (el) { el.classList.toggle('hidden', !isZh); });
    var enBtn = $('#enBtn');
    var zhBtn = $('#zhBtn');
    if (enBtn) enBtn.classList.toggle('active', !isZh);
    if (zhBtn) zhBtn.classList.toggle('active', isZh);
    applyLangTexts(isZh ? 'zh' : 'en');
    try { localStorage.setItem(STORE_KEY, isZh ? 'zh' : 'en'); } catch (e) { /* private mode */ }
  };

  // 默认英文；只有显式选过中文才切过去
  var saved = null;
  try { saved = localStorage.getItem(STORE_KEY); } catch (e) { /* ignore */ }
  if (saved === 'zh') { window.setLang('zh'); } else { applyLangTexts('en'); }

  // Tabs (remote / local)
  $$('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.getAttribute('data-panel');
      $$('.tab').forEach(function (t) { t.classList.toggle('active', t === tab); });
      $$('.panel').forEach(function (p) { p.classList.toggle('active', p.id === 'panel-' + target); });
    });
  });

  // Copy buttons
  $$('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = document.getElementById(btn.getAttribute('data-copy'));
      if (!panel) return;
      var text = (panel.querySelector('pre') || panel).textContent || '';
      var original = btn.textContent;
      var done = function () {
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = original; }, 1200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { /* ignore */ });
      }
    });
  });

  // Filters
  var search = $('#search');
  var regionSel = $('#filter-region');
  var diffSel = $('#filter-difficulty');
  var noCard = $('#filter-no-card');
  var reset = $('#reset-btn');
  var cards = $$('.card');
  var emptyState = $('#empty-state');

  function applyFilters() {
    var q = (search && search.value ? search.value : '').trim().toLowerCase();
    var region = regionSel ? regionSel.value : '';
    var diff = diffSel ? diffSel.value : '';
    var noCardOnly = noCard ? noCard.checked : false;
    var visible = 0;
    cards.forEach(function (card) {
      var text = (card.textContent || '').toLowerCase();
      var matchQ = !q || text.indexOf(q) !== -1;
      var matchRegion = !region || (region === 'global' && card.dataset.regionAvailability === 'global') || text.indexOf(region.toLowerCase()) !== -1;
      var matchDiff = !diff || card.dataset.difficulty === diff;
      var matchNoCard = !noCardOnly || card.dataset.needsCard === '0';
      var show = matchQ && matchRegion && matchDiff && matchNoCard;
      card.classList.toggle('hidden', !show);
      if (show) visible++;
    });
    if (emptyState) emptyState.classList.toggle('hidden', visible !== 0);
  }

  if (search) search.addEventListener('input', applyFilters);
  if (regionSel) regionSel.addEventListener('change', applyFilters);
  if (diffSel) diffSel.addEventListener('change', applyFilters);
  if (noCard) noCard.addEventListener('change', applyFilters);
  if (reset) {
    reset.addEventListener('click', function () {
      if (search) search.value = '';
      if (regionSel) regionSel.value = '';
      if (diffSel) diffSel.value = '';
      if (noCard) noCard.checked = false;
      applyFilters();
    });
  }

  // Share
  var shareBtn = $('#share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', function () {
      var isEn = document.documentElement.lang !== 'zh-CN';
      var today = new Date().toISOString().slice(0, 10);
      var text = isEn
        ? 'Free AI tier catalog · Verified ' + today + '\\nNo paid placements, no affiliate links. Each entry links straight to the vendor.\\n'
        : '免费 AI 额度清单 · 数据核实于 ' + today + '\\n本站不接硬广、不挂联盟，每条 promo 直达厂商官方页面。\\n';
      var shareUrl = location.href.split('?')[0] + '?ref=share&d=' + today;
      var restore = function () {
        shareBtn.textContent = isEn ? "Share today's list" : '分享今日清单';
      };
      if (navigator.share) {
        navigator.share({ title: 'Free and Cheap Tokens', text: text + shareUrl, url: location.href }).catch(function () { /* user cancelled */ });
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text + shareUrl).then(function () {
          shareBtn.textContent = isEn ? 'Share text copied' : '已复制分享文案';
          setTimeout(restore, 1500);
        }, function () { /* ignore */ });
      }
    });
  }

  // Report data issue
  $$('.report-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var id = link.getAttribute('data-report');
      var url = 'https://github.com/PanStories/free-and-cheap-tokens/issues/new?title=' +
        encodeURIComponent('[data-issue] ' + id) + '&labels=data-issue';
      window.open(url, '_blank', 'noopener');
    });
  });
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
    <link>${SITE_ORIGIN}/</link>
    <atom:link href="${SITE_ORIGIN}/feed.xml" rel="self" type="application/rss+xml" />
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
// Write

if (!existsSync(SITE_DIR)) mkdirSync(SITE_DIR, { recursive: true });

const indexOut = join(SITE_DIR, 'index.html');
const enOut = join(SITE_DIR, 'en.html');
const stylesOut = join(SITE_DIR, 'styles.css');
const jsOut = join(SITE_DIR, 'app.js');
const rssOut = join(SITE_DIR, 'feed.xml');
const icsOut = join(SITE_DIR, 'promos.ics');

writeFileSync(indexOut, indexHtml(catalog));
console.log(`✓ ${indexOut} (bilingual, EN default)`);
writeFileSync(enOut, enStubHtml());
console.log(`✓ ${enOut} (redirect stub)`);
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
console.log(`\n→ 站点已生成（单页双语 · 默认英文），共 ${activeCount} 条 promo`);
