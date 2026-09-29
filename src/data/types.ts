/**
 * promo.schema.json 映射出的 TypeScript 类型。
 * 严格匹配 Draft 2020-12 schema（详见 `schemas/promo.schema.json`）。
 *
 * 该文件是 source of truth，运行时 ajv 校验由 `src/data/validate.ts` 完成。
 * 任何字段新增必须先改 schema，再改这里，最后改 UI 绑定。
 */

// ────────────────────────────────────────────────────────────────────────────
// Difficulty & verification status

export type Difficulty = 'easy' | 'medium' | 'hard';
export type VerificationStatus = 'verified' | 'reported' | 'stale' | 'unverified';
export type VerificationMethod = 'human' | 'crawler' | 'agent' | 'community';
export type VerificationConfidence = 'high' | 'medium' | 'low';
export type PromoStatus = 'active' | 'expiring_soon' | 'expired' | 'unverified' | 'rumored';
export type CountryCode = string; // ISO 3166-1 alpha-2

export type OfferType =
  | 'free_tier'
  | 'trial_credit'
  | 'signup_bonus'
  | 'referral_bonus'
  | 'promo_code'
  | 'daily_allowance'
  | 'startup_program'
  | 'academic_program'
  | 'limited_event';

export type Category =
  | 'llm'
  | 'embedding'
  | 'image'
  | 'video'
  | 'audio'
  | 'agent_hosting'
  | 'vector_db'
  | 'gpu_compute'
  | 'other';

// 23 项受控术语标签（与 schema enum 严格一致；CI 校验枚举长度 = 23）
export type TermTag =
  | 'no_credit_card'
  | 'credit_card_required'
  | 'phone_verification'
  | 'identity_verification'
  | 'new_users_only'
  | 'one_per_account'
  | 'auto_renew'
  | 'quota_capped'
  | 'time_limited'
  | 'region_locked'
  | 'vpn_required'
  | 'edu_email_required'
  | 'business_email_required'
  | 'oss_project_required'
  | 'byok_required'
  | 'rate_limited'
  | 'non_commercial_only'
  | 'data_used_for_training'
  | 'deposit_required'
  | 'waitlist_approval'
  | 'manual_application'
  | 'stackable'
  | 'deprecated_service';

export type TermSeverity = 'blocker' | 'friction' | 'note';

// ────────────────────────────────────────────────────────────────────────────
// Region

export type RegionAvailability = 'global' | 'include' | 'exclude';

export interface PromoRegion {
  availability: RegionAvailability;
  /** 当 availability === 'include' 时必填，列出可用国家 */
  countries?: CountryCode[];
  /** 当 availability === 'exclude' 时必填，列出排除国家 */
  excluded_countries?: CountryCode[];
  /** 自由文本补充（如"需企业邮箱"） */
  notes?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Provider

export interface Provider {
  id: string; // slug, ≥1 段小写字母数字
  name_en: string;
  /** 中企展示中文名，非中企保留 null */
  name_zh?: string | null;
  /** ISO 3166-1 alpha-2 */
  country: string;
  homepage: string;
  /** inline SVG symbol id，如 i-logo-openai */
  logo_asset?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Offer amount & claim

/**
 * 数值+单位组合。注意：**9 种 unit 之间不可比较**。
 *   percent_off: 1..100
 *   tokens: 整数
 *   usd / cny: 货币
 *   seats: 整数席位
 *   calls: 调用次数
 *   hours / days / months: 时长
 */
export interface OfferAmount {
  value: number;
  unit: 'percent_off' | 'tokens' | 'usd' | 'cny' | 'seats' | 'calls' | 'hours' | 'days' | 'months';
}

export interface OfferClaimStep {
  n: number;
  text: string;
  url?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Disclosure（**deprecated** —— 见 SPEC §13 D9）

export interface Disclosure {
  /** deprecated 字段保留 nullable；MVP 不消费 */
  affiliate: boolean;
  affiliate_url?: string | null;
  disclosure_text?: string | null;
  relationship_note?: string | null;
}

// ────────────────────────────────────────────────────────────────────────────
// Verification & provenance

export interface Verification {
  status: VerificationStatus;
  method?: VerificationMethod;
  confidence?: VerificationConfidence;
  /** status === 'verified' 时必填 */
  last_verified_at?: string | null; // ISO 8601
  next_review_at?: string | null;
}

export interface Provenance {
  source_urls: string[];
  first_seen_at: string;
  last_changed_at?: string;
  /** 不可信源时为 true → verification.status 强制降级为 reported */
  review_required?: boolean;
  change_log?: ChangeLogEntry[];
}

export interface ChangeLogEntry {
  at: string;
  field: string;
  old_value?: unknown;
  new_value?: unknown;
  reason: string;
  actor: string; // GitHub handle / bot name
}

// ────────────────────────────────────────────────────────────────────────────
// Actionability

export interface Actionability {
  /** 0..100，越高越值得薅 */
  score?: number;
  blockers?: string[];
  /** hard 难度必填，给 Agent 帮人做的降级路径 */
  agent_degraded_path?: string | null;
  next_steps?: OfferClaimStep[];
  gotchas?: string[];
}

// ────────────────────────────────────────────────────────────────────────────
// Terms

export interface Term {
  tag: TermTag;
  severity: TermSeverity;
  note?: string;
  source_url?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Promo (top-level)

export interface Promo {
  id: string;
  provider: Provider;
  offer: {
    type: OfferType;
    /** 人类可读标题，必须具体到数字，如 "免费 200 万 tokens/月" */
    headline: string;
    /** 英文标题（可选），镜像 headline */
    headline_en?: string;
    /** 一句话摘要 */
    summary?: string;
    /** 英文摘要（可选），镜像 summary */
    summary_en?: string;
    amount?: OfferAmount;
    /** amount 的展示形态，如 "200万 tokens" / "$5 / 200万 tokens" */
    value_display?: string;
    /** 英文额度展示（可选），镜像 value_display */
    value_display_en?: string;
    /** 与 expires_at 互斥 */
    expires_at?: string | null;
    no_fixed_expiry?: boolean;
    claim_url: string; // 厂商官方直链
    claim_steps?: OfferClaimStep[];
  };
  terms: Term[];
  difficulty: Difficulty;
  /** 上手难度判定理由，hard 项必填 */
  difficulty_reasons?: string[];
  /** 完成预计耗时（分钟） */
  estimated_setup_minutes?: number;
  region: PromoRegion;
  categories: Category[];
  status: PromoStatus;
  verification: Verification;
  disclosure: Disclosure;
  provenance: Provenance;
  actionability?: Actionability;
  created_at: string;
  updated_at: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Catalog (built in container)

export interface Catalog {
  generated_at: string;
  sha256: string;
  providers: Provider[];
  promos: Promo[];
  counts: {
    total: number;
    active: number;
    expiring_soon: number;
    no_credit_card: number;
    verified: number;
  };
}

// ────────────────────────────────────────────────────────────────────────────
// MCP-facing views (smaller than full Promo)

export interface PromoSummary {
  id: string;
  provider: { id: string; name_en: string; name_zh: string | null; country: string };
    offer: {
      type: OfferType;
      headline: string;
      headline_en?: string | null;
      summary?: string | null;
      summary_en?: string | null;
      value_display?: string | null;
      value_display_en?: string | null;
      expires_at: string | null;
      no_fixed_expiry: boolean;
      claim_url: string;
    };
  difficulty: Difficulty;
  region: PromoRegion;
  categories: Category[];
  status: PromoStatus;
  verification: { status: VerificationStatus; last_verified_at: string | null };
}

export interface PromoFull extends PromoSummary {
  terms: Term[];
  estimated_setup_minutes?: number | null;
  difficulty_reasons: string[];
  actionability?: Actionability;
  provenance: { source_urls: string[]; first_seen_at: string; last_changed_at?: string | null };
}