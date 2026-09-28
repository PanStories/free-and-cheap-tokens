/**
 * Rate limit: 内存 LRU（演示用；生产应换 Redis/Apify KVS）。
 *
 * 规则：
 *   - free: 100 calls / 24h per IP+UA hash
 *   - paid: 不限
 *
 * 注意：本服务无数据库 / 无 session，本实现是**足够好**的兜底。
 * Apify Standby 进程随时可能被回收 —— 数据会丢，符合"不持久化用户数据"立场。
 */

import { createHash } from 'node:crypto';

const WINDOW_MS = 24 * 60 * 60 * 1000;
const FREE_DAILY_LIMIT = 100;

interface Counter {
  count: number;
  resetAt: number; // epoch ms
}

const counters = new Map<string, Counter>();

function callerKey(req: { ip: string; userAgent: string }): string {
  return createHash('sha256')
    .update(`${req.ip}|${req.userAgent}`)
    .digest('hex')
    .slice(0, 16);
}

function pruneExpired(now: number) {
  for (const [k, v] of counters.entries()) {
    if (v.resetAt <= now) counters.delete(k);
  }
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  isPaid: boolean;
}

export function checkLimit(
  ip: string,
  userAgent: string,
  isPaid: boolean,
): RateLimitDecision {
  const now = Date.now();
  pruneExpired(now);

  if (isPaid) {
    return { allowed: true, remaining: Infinity, resetAt: now + WINDOW_MS, isPaid: true };
  }

  const key = callerKey({ ip, userAgent });
  const existing = counters.get(key);
  if (!existing) {
    counters.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return {
      allowed: true,
      remaining: FREE_DAILY_LIMIT - 1,
      resetAt: now + WINDOW_MS,
      isPaid: false,
    };
  }
  existing.count += 1;
  const allowed = existing.count <= FREE_DAILY_LIMIT;
  return {
      allowed,
      remaining: Math.max(0, FREE_DAILY_LIMIT - existing.count),
      resetAt: existing.resetAt,
      isPaid: false,
    };
}

export function resetLimitsForTest(): void {
  counters.clear();
}