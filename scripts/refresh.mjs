#!/usr/bin/env node
/**
 * refresh.mjs —— F15 Phase 1: discovery feed
 *
 * 范围（详见 SPEC §2 F15）：
 *   - 抓取候选 promo 列表（可插拔源，本 MVP 默认不抓，仅占位生成空结果）
 *   - 去重 + 标 verification.status === 'unverified'
 *   - 不自动填充条款 / 难度 / 区域
 *   - 产物写入 .refresh/discovery.jsonl（不进 catalog.json）
 *   - 不主动入库（unverified → active 只能人工触发）
 *
 * 用法：
 *   node scripts/refresh.mjs            # 跑一次
 *   GH Actions: .github/workflows/refresh.yml 每 6 小时跑
 *
 * 设计意图：保留 F15 的"发现可以自动，背书必须人工"叙事。
 * Phase 2（auto-publish）待人工评估后另立。
 */

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const OUT_DIR = join(root, '.refresh');
const OUT_PATH = join(OUT_DIR, 'discovery.jsonl');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// 占位实现：MVP 阶段策展团队人工从公开 RSS / GitHub Issues 提交候选
// Phase 2 接入：
//   - 抓 https://raw.githubusercontent.com/cheahjs/free-llm-api-resources/main/README.md
//   - 解析表格
//   - 与现有 catalog 去重
//   - 标 unverified + 写 JSONL

const discoveries = [
  // { id, provider_name, source_url, raw_text, candidate_at }
  // 示例占位：
  // {
  //   "id": "candidate-llmfoo-2026-09-28",
  //   "provider_name": "LLMFoo",
  //   "source_url": "https://example.com/pricing",
  //   "raw_text": "Free tier: 1M tokens/month, no credit card",
  //   "candidate_at": new Date().toISOString(),
  // },
];

const lines = discoveries.map((d) => JSON.stringify(d)).join('\n');
writeFileSync(OUT_PATH, lines ? lines + '\n' : '');

console.log(`✓ 候选条目 ${discoveries.length} 条 → ${OUT_PATH}`);
console.log(`  全部标 verification.status === 'unverified'，需人工评审才能进入主 catalog`);

process.exit(0);