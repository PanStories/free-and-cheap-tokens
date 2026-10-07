/**
 * i18n layer for FaCT MCP human-readable output.
 *
 * Design:
 *   - `lang` is a per-call parameter on every tool (default 'en' = English-first).
 *   - All structural labels (status, region, value, terms, how-to-claim, prompts)
 *     are resolved through `t()` so the three languages stay in one place.
 *   - Free-form data fields fall back gracefully: English callers get the
 *     `*_en` mirror when present, else the original Chinese string.
 *   - Controlled `terms[].tag` (23 enum values) have deterministic translations.
 *
 * Kept dependency-free (no ICU) on purpose — the string set is small and fixed.
 */

export type Lang = 'en' | 'zh' | 'zh_hant';

export const LANGS: Lang[] = ['en', 'zh', 'zh_hant'];

// ── Structural labels ────────────────────────────────────────────────────────
type Dict = Record<string, string>;

const EN: Dict = {
  list_title: 'Results for',
  list_total: 'total',
  all_matches: 'all matches',
  list_none: 'No results.',
  status_verified: 'Verified',
  status_reported: 'Pending review',
  status_stale: 'Stale',
  status_unverified: 'Unverified',
  label_provider: 'Provider',
  label_difficulty: 'Difficulty',
  label_region: 'Region',
  region_global: 'Global',
  label_quota: 'Quota',
  label_expires: 'Expires',
  no_fixed_expiry: 'No fixed expiry',
  label_verified: 'Verified',
  not_filled: 'not filled',
  label_link: 'Link',
  label_terms: 'Terms',
  how_to_claim: 'How to claim',
  providers_found: 'providers',
  updates_since: 'updates since',
  days_to_expire: 'days to expire',
  direct_claim: 'Under your settings you can claim',
  blocked_one_step: 'you are one step away from',
  issue_template: 'Issue template generated',
  promo_not_found: 'Promo not found',
  daily_brief_title: 'Daily deal brief',
  data_note: 'Data verified on',
  data_note_tail: '· curated by the editorial team',
  full_list: 'Full list',
  recommend_top: 'Top recommendations',
  new_today: 'new today',
  expiring_7d: 'expiring within 7 days',
  no_card: 'no credit card required',
  best_for: 'best fit for',
};

const ZH: Dict = {
  list_title: '匹配',
  list_total: '共',
  all_matches: '全部匹配',
  list_none: '暂无结果。',
  status_verified: '已核验',
  status_reported: '待复核',
  status_stale: '已过期',
  status_unverified: '未核验',
  label_provider: '厂商',
  label_difficulty: '上手难度',
  label_region: '区域',
  region_global: '全球',
  label_quota: '额度',
  label_expires: '到期',
  no_fixed_expiry: '长期有效',
  label_verified: '核验',
  not_filled: '未填写',
  label_link: '链接',
  label_terms: '条款',
  how_to_claim: '如何薅',
  providers_found: '家厂商',
  updates_since: '条自',
  days_to_expire: '天内到期',
  direct_claim: '可直接薅',
  blocked_one_step: '想薅但差一步的有',
  issue_template: '已生成 Issue 模板',
  promo_not_found: '找不到该 promo',
  daily_brief_title: '每日羊毛简报',
  data_note: '数据核实于',
  data_note_tail: '· 由策展团队人工收录',
  full_list: '完整清单',
  recommend_top: '推荐 Top',
  new_today: '今日新增',
  expiring_7d: '7 天内到期',
  no_card: '免信用卡',
  best_for: '最适合',
};

// Traditional Chinese — same keys; only the glyph forms differ where applicable.
const ZH_HANT: Dict = {
  list_title: '匹配',
  list_total: '共',
  all_matches: '全部匹配',
  list_none: '暫無結果。',
  status_verified: '已核驗',
  status_reported: '待複核',
  status_stale: '已過期',
  status_unverified: '未核驗',
  label_provider: '廠商',
  label_difficulty: '上手難度',
  label_region: '區域',
  region_global: '全球',
  label_quota: '額度',
  label_expires: '到期',
  no_fixed_expiry: '長期有效',
  label_verified: '核驗',
  not_filled: '未填寫',
  label_link: '連結',
  label_terms: '條款',
  how_to_claim: '如何薅',
  providers_found: '家廠商',
  updates_since: '條自',
  days_to_expire: '天內到期',
  direct_claim: '可直接薅',
  blocked_one_step: '想薅但差一步的有',
  issue_template: '已生成 Issue 範本',
  promo_not_found: '找不到該 promo',
  daily_brief_title: '每日羊毛簡報',
  data_note: '數據核實於',
  data_note_tail: '· 由策展團隊人工收錄',
  full_list: '完整清單',
  recommend_top: '推薦 Top',
  new_today: '今日新增',
  expiring_7d: '7 天內到期',
  no_card: '免信用卡',
  best_for: '最適合',
};

export function t(lang: Lang, key: string): string {
  const table = lang === 'zh' ? ZH : lang === 'zh_hant' ? ZH_HANT : EN;
  return table[key] ?? EN[key] ?? key;
}

// ── Verification status ────────────────────────────────────────────────────────
export function statusLabel(lang: Lang, status: string): string {
  switch (status) {
    case 'verified':
      return t(lang, 'status_verified');
    case 'reported':
      return t(lang, 'status_reported');
    case 'stale':
      return t(lang, 'status_stale');
    default:
      return t(lang, 'status_unverified');
  }
}

// ── Provider name: English-first, ZH/Hant fall back to name_zh when present ────
export function providerName(
  lang: Lang,
  p: { name_en: string; name_zh?: string | null },
): string {
  if (lang === 'en') return p.name_en;
  return p.name_zh ?? p.name_en;
}

// ── 23 controlled term tags → human-readable phrase ───────────────────────────
const TERM_EN: Record<string, string> = {
  no_credit_card: 'No credit card required',
  credit_card_required: 'Credit card required',
  phone_verification: 'Phone verification',
  identity_verification: 'Identity verification',
  new_users_only: 'New users only',
  one_per_account: 'One per account',
  auto_renew: 'Auto-renew',
  quota_capped: 'Quota capped',
  time_limited: 'Time-limited',
  region_locked: 'Region locked',
  vpn_required: 'VPN required',
  edu_email_required: 'Edu email required',
  business_email_required: 'Business email required',
  oss_project_required: 'OSS project required',
  byok_required: 'Bring-your-own-key required',
  rate_limited: 'Rate limited',
  non_commercial_only: 'Non-commercial only',
  data_used_for_training: 'Data used for training',
  deposit_required: 'Deposit required',
  waitlist_approval: 'Waitlist approval',
  manual_application: 'Manual application',
  stackable: 'Stackable',
  deprecated_service: 'Deprecated service',
};

const TERM_ZH: Record<string, string> = {
  no_credit_card: '无需信用卡',
  credit_card_required: '需要信用卡',
  phone_verification: '手机验证',
  identity_verification: '身份验证',
  new_users_only: '仅限新用户',
  one_per_account: '每账号限一个',
  auto_renew: '自动续费',
  quota_capped: '额度有上限',
  time_limited: '限时',
  region_locked: '区域限制',
  vpn_required: '需要 VPN',
  edu_email_required: '需要教育邮箱',
  business_email_required: '需要企业邮箱',
  oss_project_required: '需开源项目',
  byok_required: '需自带密钥',
  rate_limited: '有速率限制',
  non_commercial_only: '仅限非商业',
  data_used_for_training: '数据用于训练',
  deposit_required: '需押金',
  waitlist_approval: '需候补名单审批',
  manual_application: '需手动申请',
  stackable: '可叠加',
  deprecated_service: '已弃用服务',
};

const TERM_ZH_HANT: Record<string, string> = {
  no_credit_card: '無需信用卡',
  credit_card_required: '需要信用卡',
  phone_verification: '手機驗證',
  identity_verification: '身份驗證',
  new_users_only: '僅限新用戶',
  one_per_account: '每賬號限一個',
  auto_renew: '自動續費',
  quota_capped: '額度有上限',
  time_limited: '限時',
  region_locked: '區域限制',
  vpn_required: '需要 VPN',
  edu_email_required: '需要教育郵箱',
  business_email_required: '需要企業郵箱',
  oss_project_required: '需開源項目',
  byok_required: '需自帶密鑰',
  rate_limited: '有速率限制',
  non_commercial_only: '僅限非商業',
  data_used_for_training: '數據用於訓練',
  deposit_required: '需押金',
  waitlist_approval: '需候補名單審批',
  manual_application: '需手動申請',
  stackable: '可疊加',
  deprecated_service: '已棄用服務',
};

export function termLabel(lang: Lang, tag: string): string {
  const m = lang === 'zh' ? TERM_ZH : lang === 'zh_hant' ? TERM_ZH_HANT : TERM_EN;
  return m[tag] ?? tag;
}

// ── Language-preferred field picker (free-form data with *_en mirror) ──────────
export function pickLang<T>(
  lang: Lang,
  en?: T | null,
  zh?: T | null,
  zhHant?: T | null,
): T | undefined {
  if (lang === 'en') return en ?? zh ?? zhHant ?? undefined;
  if (lang === 'zh_hant') return zhHant ?? zh ?? en ?? undefined;
  return zh ?? zhHant ?? en ?? undefined;
}
