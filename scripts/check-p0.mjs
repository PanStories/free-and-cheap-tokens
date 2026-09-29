#!/usr/bin/env node
/**
 * check-p0.mjs —— P0 红线脚本化自查
 *
 * 由来：设计师肉眼自查连续三次与门禁复扫不一致（22/23 计数、✅❌⚠ 漏改、↗ 漏改）。
 * 结论：P0 自查必须让脚本跑，不能靠肉眼断言。
 *
 * 用法：node scripts/check-p0.mjs
 * 退出码：0 = 通过；1 = 存在 FAIL 项
 *
 * 判定分三档：
 *   FAIL  —— 硬违规，必须改
 *   WARN  —— 需人工判读（箭头字符在散文语境下合法，在 UI 稿里当图标用则违规）
 *   INFO  —— 仅提示
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** 扫描目标：设计交付物。新增产出请加进这里。 */
const TARGETS = [
  'docs/UIUX.md',
  'design/design-tokens.json',
  'design/design-tokens.css',
];

/* ------------------------------------------------------------------ *
 * 规则 1（P0-1）：禁止 emoji 作为功能图标
 * 正则由 team-lead 提供，覆盖 emoji 各区段 + 变体选择符 + ZWJ
 * ------------------------------------------------------------------ */
/* eslint-disable no-misleading-character-class -- 故意匹配组合字符/ZWJ/变体选择符序列，它们是 emoji 的组成部分 */
const EMOJI_RE = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/gu;

/**
 * 规则 1b：会当图标用的箭头 / 勾叉字符
 * 判定口径（team-lead 裁定）：`↑` `→` 在散文语境下合法，只在非散文语境下判违规。
 *   ICON_GLYPHS —— 从来不当散文用，出现即需判读（↗ 在 UI 稿里就是外链图标）
 *   PROSE_ARROW —— `→` 基本都是「映射到」的意思，默认 INFO；只在 UI 稿里才升级
 */
const ICON_GLYPHS = /[↗↘↖✔✗↑]/g;
const PROSE_ARROW = /→/g;

/* ------------------------------------------------------------------ *
 * 规则 2（P0-2）：禁止紫→粉渐变主视觉
 * ------------------------------------------------------------------ */
const PURPLE_HEX = ['#7C3AED', '#A855F7', '#9333EA', '#EC4899', '#D946EF', '#C026D3'];
const GRADIENT_RE = /linear-gradient|radial-gradient/gi;

/* ------------------------------------------------------------------ *
 * 规则 3：禁止回弹 / overshoot 缓动
 * ------------------------------------------------------------------ */
const BOUNCE_RE = /cubic-bezier\(\s*-?0?\.68|cubic-bezier\([^)]*-\s*0\.55/g;

/* ------------------------------------------------------------------ *
 * 规则 4：禁止空洞占位文案
 * ------------------------------------------------------------------ */
const PLACEHOLDER_RE = /Welcome to|Lorem ipsum|Sign up today|Get started today/gi;

/* ------------------------------------------------------------------ */

let fail = 0;
let warn = 0;
const report = [];

for (const rel of TARGETS) {
  const abs = join(root, rel);
  if (!existsSync(abs)) {
    report.push(`FAIL  ${rel}  <文件不存在>`);
    fail++;
    continue;
  }
  const text = readFileSync(abs, 'utf8');
  const lines = text.split('\n');
  const hits = [];

  // --- emoji（硬违规）---
  lines.forEach((line, i) => {
    const m = line.match(EMOJI_RE);
    if (m) {
      hits.push({
        sev: 'FAIL',
        rule: 'P0-1 emoji',
        line: i + 1,
        text: line.trim().slice(0, 100),
        why: `匹配到 ${[...new Set(m)].join(' ')}`,
      });
    }
  });

  // --- 箭头 / 勾叉字符 ---
  // UI 稿语境特征：制表符框线字符 │ ┌ └ ─ ，或方括号包裹的按钮文案
  const isUiMock = (line) =>
    /[│┌└─]/.test(line) ||
    /\[\s*[^\]]*(去官方页|含返佣|如何薅|清除全部筛选)/.test(line);

  lines.forEach((line, i) => {
    const glyphs = line.match(ICON_GLYPHS);
    if (glyphs) {
      const sev = isUiMock(line) ? 'FAIL' : 'WARN';
      hits.push({
        sev,
        rule: sev === 'FAIL' ? 'P0-1 箭头当图标' : 'P0-1 图标字形(需确认语境)',
        line: i + 1,
        text: line.trim().slice(0, 100),
        why: `匹配到 ${[...new Set(glyphs)].join(' ')}${
          sev === 'FAIL'
            ? ' —— 在 UI 稿里当图标用，须换成图标语义名（如 i-external-link）'
            : ' —— 非 UI 稿语境，人工确认一次'
        }`,
      });
    }
    // 散文箭头 `→`：只在 UI 稿语境下才提示，其余视为合法散文
    if (PROSE_ARROW.test(line) && isUiMock(line)) {
      hits.push({
        sev: 'WARN',
        rule: 'P0-1 散文箭头出现在 UI 稿',
        line: i + 1,
        text: line.trim().slice(0, 100),
        why: 'UI 稿里出现 →，确认它不是在当图标用',
      });
    }
  });

  // --- 紫粉渐变 ---
  lines.forEach((line, i) => {
    if (!GRADIENT_RE.test(line)) return;
    const found = PURPLE_HEX.filter((h) => line.toUpperCase().includes(h));
    if (found.length) {
      hits.push({
        sev: 'FAIL',
        rule: 'P0-2 紫粉渐变',
        line: i + 1,
        text: line.trim().slice(0, 100),
        why: `渐变中出现 ${found.join(', ')}`,
      });
    }
  });
  // 单个紫粉 hex（非渐变）也要列出供判读
  lines.forEach((line, i) => {
    if (GRADIENT_RE.test(line)) return;
    const found = PURPLE_HEX.filter((h) => line.toUpperCase().includes(h));
    if (found.length) {
      hits.push({
        sev: 'WARN',
        rule: 'P0-2 紫粉色值(非渐变)',
        line: i + 1,
        text: line.trim().slice(0, 100),
        why: `出现 ${found.join(', ')} —— 若是禁令示例文本则豁免，否则需改`,
      });
    }
  });

  // --- 回弹缓动 ---
  lines.forEach((line, i) => {
    if (BOUNCE_RE.test(line)) {
      hits.push({
        sev: 'FAIL',
        rule: '动效 回弹缓动',
        line: i + 1,
        text: line.trim().slice(0, 100),
        why: 'overshoot 型 cubic-bezier',
      });
    }
  });

  // --- 空洞占位 ---
  lines.forEach((line, i) => {
    const m = line.match(PLACEHOLDER_RE);
    if (m) {
      hits.push({
        sev: 'FAIL',
        rule: 'P0-3 空洞占位',
        line: i + 1,
        text: line.trim().slice(0, 100),
        why: `匹配到 ${[...new Set(m)].join(', ')}`,
      });
    }
  });

  // --- JSON 合法性（仅 json 文件）---
  if (rel.endsWith('.json')) {
    try {
      JSON.parse(text);
      report.push(`OK    ${rel}  JSON 合法`);
    } catch (e) {
      report.push(`FAIL  ${rel}  JSON 非法: ${e.message}`);
      fail++;
    }
  }

  if (hits.length === 0) {
    report.push(`OK    ${rel}  (${lines.length} 行，0 命中)`);
  } else {
    for (const h of hits) {
      report.push(`${h.sev}  ${rel}:${h.line}  [${h.rule}] ${h.why}`);
      report.push(`        ${h.text}`);
      if (h.sev === 'FAIL') fail++;
      else warn++;
    }
  }
}

console.log('===== P0 自查（脚本化）=====');
console.log(`扫描目标: ${TARGETS.join(', ')}`);
console.log('-'.repeat(60));
for (const r of report) console.log(r);
console.log('-'.repeat(60));
console.log(`FAIL: ${fail}    WARN: ${warn}`);
console.log(fail === 0 ? '结论: PASS（WARN 需人工确认后放行）' : '结论: FAIL —— 存在硬违规，禁止放行');
process.exit(fail === 0 ? 0 : 1);
