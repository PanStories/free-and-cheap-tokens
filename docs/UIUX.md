# Free & Cheap Tokens — UI/UX 设计规范

> 生成日期：2026-09-28 ｜ 设计师：颜好看 ｜ 基于：项目需求 v1 + 用户确立的硬约束
> 三轴刻度：**Variance = 3 / Motion = 2 / Density = 7**
> 平台轴：web（唯一可视化产物＝零依赖静态「每日清单页」+ 分享卡片）
> 寄存器：**Product 寄存器**（清单页＝工具，标杆是"赢得熟悉感"）＋ **Brand 寄存器**（分享卡片＝传播物料，标杆是"独特性"）

---

## 0. 设计范围与硬约束（不可协商）

| 约束 | 落地方式 |
|---|---|
| 零外部依赖 | 纯 HTML/CSS/JS。不引 React/Vue、不引任何 CDN、不 `@import` 远程字体、不引外部图标包 |
| 图标方案 | 自建 inline SVG 图标集（24 网格 / 1.5px 描边 / 语义命名 / 统一 style），见 §9 |
| 主题 | Light 为主（IDE/交付环境为浅色）。深色 token 已在 `design-tokens.css` 预留 |
| 信息架构 | stat cards + 分区布局，便于晨会前快速扫读 |
| 质感 | 企业级仪表盘的**克制**版本：信息密度高、可扫读、不花哨 |
| 命名规则 | 中企用中文名，非中企用英文名。Schema 已写死判定：`provider.country === 'CN'` 且 `name_zh !== null` → 中文，否则 `name_en` |
| 字段准绳 | **以 `schemas/promo.schema.json` 为唯一准绳**。本文档的字段名只是设计别名，映射见 §13 |
| 法定标识 | 中文版必须字面渲染「广告」（《互联网广告管理办法》第九条），四处缺一不可，见 §7.5 |
| 唯一可视化产物 | 每日清单页 + 分享卡片（OG 图）。MCP server 与 Skill 无 UI，本文档不涉及 |

### P0 自检结果（前置声明）

- [x] **无 emoji 作功能图标** —— 全部 30 个图标均为 inline SVG 描边图形
- [x] **无紫→粉渐变** —— 全站零渐变；强调色为纯色深石油蓝 `#0B6E8F`
- [x] **无 AI 模板味** —— 首屏无 Hero，第一屏即为真实促销列表；无空洞问候语、无拉丁文假文占位、无空泛的注册号召语
- [x] **无硬编码颜色** —— 全部走 Design Token（例外仅 `#fff` `#000`，且仅在 focus-ring 内环使用）
- [x] **无弹跳缓动** —— 唯一缓动 `cubic-bezier(0.2, 0, 0, 1)`
- [x] **无彩色侧条纹** —— 分区用 2×14px 标记块，卡片用 1px 全边框，无 `border-left: 3px solid accent`

---

## 1. 设计方向：对标品牌与理由

### 1.1 调研结论（2026-09 联网调研）

**竞品 A：free-for.dev / free-for-dev（GitHub 137k stars）**
- 信息架构：单文件 Markdown → 纯分类列表，零筛选、零排序、零元数据
- 做得好：分类体系成熟（60+ 类），社区共同维护新鲜度
- **做得差**：① 无「核验时间」字段，用户无法判断条目是否已过期；② 无区域维度，中国用户点进去才发现不可用；③ 无难度/上手成本标识，"免信用卡"和"要实名认证"在视觉上完全等价；④ 纯文本墙，扫读成本极高

**竞品 B：Smithery / mcp.so / PulseMCP（MCP 目录站）**
- 信息架构：搜索主导 Hero + 分类 chips + 卡片网格（名称 / 一句话描述 / install 数 / 来源标签）
- 做得好：卡片信息密度高；Smithery 在详情页展示「来源归属（官方 / 已验证作者 / 社区）」+ GitHub star + 最后提交时间 —— 三个信任信号
- **做得差**：① 卡片同质化严重（同尺寸 + 图标 + 标题 + 文字的无限重复网格）；② 缺少"这条什么时候失效"的时间维度；③ 无区域/合规维度；④ 列表页无分区，滚动即失焦

**竞品 C：Product Hunt / 各类 deal 聚合站**
- 信息架构：榜单 + 投票数 + 分类 + 每日/每周节奏
- 做得好：「每日」这个时间盒子天然制造回访理由
- **做得差**：① 投票数成为主视觉，掩盖信息本身；② 排行靠热度而非靠"还剩几天"；③ 联盟披露普遍藏在 footer（2026 FTC 新规下已属违规）

**三类竞品的共同缺口（= 本项目的设计机会）：**
1. **没有"新鲜度"字段** —— 用户不知道这条还能不能薅
2. **没有"上手成本"维度** —— 免费额度和要填申请表、绑卡、实名，在 UI 上长得一样
3. **没有"区域"维度** —— 中国大陆用户被无效信息淹没
4. **没有"紧迫度分区"** —— 即将到期的和常年有效的混排

### 1.2 2026 设计趋势（调研后筛掉 AI 味的那一套）

- **Barely-There UI**：极简界面 = 信任与稳定信号，在 SaaS/AI 产品中已成主流 —— 采纳
- **克制色 + 单一强调色**：2026 色彩趋势是"稳定化"，不再追饱和撞色 —— 采纳
- **动效只在有目的时存在**：用途驱动的微交互取代花哨效果 —— 采纳（Motion=2）
- **Human Touch / Anti-UX**：不适用（本项目是工具，不是品牌站）
- **明确不采纳**：液态玻璃、材质混搭、霓虹/Y2K、有机曲线波浪边界、渐变叠加 —— 这些都是"视觉噪音"，与"企业级克制"直接冲突

### 1.3 对标品牌（3 个）

| 对标 | 借什么 | 为什么适合本项目 |
|---|---|---|
| **Stripe Dashboard** | 表格化的克制密度、状态 pill（Paid / Failed / Refunded 一定有文字）、靠 1px 线而非卡片盒子分隔数据 | 本页本质是"价格表 + 状态表"，不是营销页。Stripe 的克制正是"企业级仪表盘"的标准答案 |
| **Linear** | 极窄的视觉噪音预算、hover 只换边框色不换阴影、键盘优先 | 目标用户是 AI 工程师，会键盘扫读、会嫌花哨 |
| **Bloomberg Terminal（浅色版）** | 数字用等宽 tabular-nums 对齐、密度优先、时间字段是头等公民 | "每日清单"的扫读场景与行情终端一致：晨会前 30 秒扫完 |

**一句话设计方向**：*一张可信的、可 30 秒扫完的"额度行情表"，配一张能当天被转发的"情报快照卡"。*

### 1.4 为什么不是紫色 / 靛蓝

Indigo `#6366F1` 是 2026 年 AI 生成物的默认色（业界公认首罪）。紫色系已与"AI 模板"强绑定，会削弱"这是人工策展的可信清单"这一核心信任主张。**深石油蓝 `#0B6E8F`** 既脱离默认色，又保持专业/工程气质，且与语义色（绿/琥珀/红）完全不撞色。

---

## 2. 配色系统

配色来源：`color-palettes.md` 第 22 套「知识库/文档中性」为基底，强调色替换为非默认的深石油蓝，语义色按 AA+ 重新校准。全部对比度已用 WCAG 相对亮度公式实测（见 §2.3）。

### 2.1 主色值（A1-identity）

| Token | 值 | 角色 |
|---|---|---|
| `--bg` | `#F5F6F8` | 页面底色（冷调浅灰，**刻意避开奶油/米色暖中性**） |
| `--surface` | `#FFFFFF` | 卡片 / 面板 / 输入控件 |
| `--surface-sunken` | `#EAECF0` | 表头、代码块、骨架屏 |
| `--fg` | `#15181D` | 主文本（带冷调，**非纯黑**） |
| `--muted` | `#5B6371` | 正文辅助 |
| `--border` | `#DFE3E9` | 默认发丝分隔线 |
| **`--accent`** | **`#0B6E8F`** | **品牌强调色：深石油蓝 Petrol** |
| `--accent-hover` | `#095A76` | Primary 按钮 hover |
| `--accent-on` | `#FFFFFF` | accent 底上的前景 |

### 2.2 语义色（A2）

| Token | 值 | 用途 |
|---|---|---|
| `--success` | `#177245` | 生效中 / 已核验 / 免费额度确认 |
| `--warn` | `#9A5B00` | **即将到期（≤7 天）** / 条款变动 |
| `--danger` | `#B42318` | **已过期 / 已下线** / 条款收紧 |
| `--info` | `var(--accent)` | 与强调色同源 |

**配色配比（四层结构）**：中性色 ~85% / 强调色 ~8% / 语义色 ~6% / 效果色 <1%

**强调色使用规则（每屏 ≤2 类元素）**：
1. Primary CTA 按钮（「去官方页」）
2. 当前选中的筛选 chip / 排序项
除此之外一律中性色 + 图标。标题永不使用强调色。

### 2.3 对比度实测（WCAG 2.2）

| 配对 | 比值 | 判定 |
|---|---|---|
| `--fg` / `--bg` | 16.45:1 | AAA |
| `--fg` / `--surface` | 17.79:1 | AAA |
| `--fg-2` `#383E48` / `--surface` | 10.76:1 | AAA |
| `--muted` `#5B6371` / `--surface` | 6.06:1 | AA |
| `--muted` / `--bg` | 5.60:1 | AA |
| `--meta` `#5E6672` / `--surface` | 5.80:1 | AA |
| `--meta` / `--bg` | 5.37:1 | AA |
| `--meta` / `--surface-sunken` | 4.91:1 | AA |
| `--accent` / `--surface` | 5.77:1 | AA |
| `--accent-on` / `--accent` | 5.77:1 | AA |
| `--success` / `--surface` | 5.95:1 | AA |
| `--warn` / `--surface` | 5.43:1 | AA |
| `--danger` / `--surface` | 6.57:1 | AA |
| 披露文字 `#6B4708` / `#FBF3E4` | **7.53:1** | AAA（合规要求 ≥4.5，刻意超额） |
| 难度徽章文字 / 底 | 6.66 / 7.68 / 8.20:1 | AA |
| `--border-input` `#767E8B` / `#FFFFFF` | 4.10:1 | 满足 WCAG 1.4.11 非文本 3:1 |

### 2.4 圆角 / 间距 / 阴影 / 描边

**圆角（4 级 + pill）**
```
xs 3px   徽章、小标签
sm 6px   按钮、输入框、chip、难度徽章
md 10px  promo 卡片（硬上限，禁止 ≥24px 的"AI 过度圆滑"）
lg 14px  抽屉 / 模态框
pill     9999px  状态 pill
```

**间距（4px 网格，仅取）**：`4 8 12 16 20 24 32 40 48`。禁止 5 / 7 / 13 / 15 / 22 / 30。
- 卡片内边距：`--space-5`(20px) 桌面 / `--space-4`(16px) 移动
- 栅格 gutter：`--space-6`(24px) 桌面 / 16px 平板 / 12px 移动
- 分区间距：`--space-8`(32px) 桌面 / 24px 移动（密度 7：紧凑节奏）

**阴影（3 级，默认不用）**
```
flat    none                        卡片默认：靠 1px 边框区分，不靠阴影
raised  0 1px 2px rgba(21,24,29,.04), 0 4px 10px rgba(21,24,29,.05)   sticky 工具栏
overlay 0 8px 28px rgba(21,24,29,.12), 0 2px 6px rgba(21,24,29,.06)   抽屉/模态/下拉
```
> **禁止「幽灵卡片」**：1px 边框与 blur ≥16px 的阴影不得同时出现在同一元素上。卡片有边框则无阴影，浮层有阴影则无边框。

**描边**
- 结构边框唯一宽度：**1px**。
- **禁止** `border-left/right > 1px` 的彩色侧条纹（AI 设计特征）。
- 分区标题用独立的 **2×14px 标记块**（`--accent-subtle` 底或 `--accent` 实色，圆角 1px），不是边框。

---

## 3. 字体方案

零外部依赖，因此**不自托管 woff2、不引 CDN**。做法是：明确指定一条完整的中英混排回退链（而非裸写 `sans-serif`），并用字号/字重/字距/行高的严格阶梯建立层级 —— 层级来自系统，不来自"用了一个特殊字体"。

```css
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
             "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC",
             "Source Han Sans SC", "Helvetica Neue", Arial, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, "SF Mono", "JetBrains Mono",
             "Cascadia Mono", Menlo, Consolas, "Liberation Mono", monospace;
--font-num:  var(--font-mono);   /* 数字专用 */
```

**为什么这条链**：`PingFang SC`（macOS 中文）→ `Microsoft YaHei`（Windows 中文）→ `Noto Sans SC`（Linux/兜底）。中文绝不会掉到默认宋体/衬线，中英混排基线一致。**不要**引入 Noto Sans SC CDN（1MB+ 且违反零依赖）。

### 3.1 字号阶梯（8 级）

| Token | 值 | 用途 |
|---|---|---|
| `--text-xs` | 11px / 16 | 徽章（下限，禁止再小） |
| `--text-sm` | 12px / 18 | 元数据、筛选 chip |
| `--text-base` | 14px / 22 | **中文正文下限** |
| `--text-md` | 16px / 24 | promo 卡片标题 |
| `--text-lg` | 20px / 28 | 分区标题 |
| `--text-xl` | 24px / 32 | 页面标题 |
| `--text-2xl` | 32px / 36 | stat card 次级数字 |
| `--text-3xl` | 40px / 46 | stat card 主数字 / OG 卡数字 |

### 3.2 字重与字距

- **三级字重**：400（Read 正文）/ 500（Emphasize 小标题、chip）/ 600（Announce 页面标题、stat 数字、CTA）
  > 注：规范建议 510/590，但系统字族无可变字重，实际渲染会吸附到 500/600。Token 直接声明 500/600 以保证跨端一致。
- **字距**：正文与 14–18px 中文 = `0`（**中文禁止正字距**）；11–12px 小字 = `0.01em`；≥24px 标题与展示数字 = `-0.015em`；英文全大写标签（如 `REGION`）**必须** `0.08em`。
- **行高**：正文 1.6（中文不低于 1.5）；标题 1.3；≥32px 数字 1.15；按钮/chip 单行 1.0。

### 3.3 数字规则（关键）

所有数字、倒计时、额度、金额必须：
```css
font-family: var(--font-num);
font-variant-numeric: tabular-nums;
font-feature-settings: "tnum" 1;
```
这是"行情表"质感的来源：数字列纵向对齐，扫读时可形成视觉列。

---

## 4. 每日清单页：信息架构

```
┌──────────────────────────────────────────────────────────────┐
│ L1  联盟披露条（sticky，36px / 移动 44px）                     │  ← 合规强制
├──────────────────────────────────────────────────────────────┤
│ 页头：字标 │ 数据更新时间 + refresh │ 搜索框 │ 分享按钮         │  ← sticky
├──────────────────────────────────────────────────────────────┤
│ stat cards（4 张，等宽网格）                                   │
│  今日新增 7  │  7 天内到期 3  │  免信用卡 12  │  已核验 24      │
├──────────────────────────────────────────────────────────────┤
│ 筛选工具栏（sticky）                                           │
│  搜索 │ 区域 chips │ 难度 chips │ 类别 chips │ 更多▾ │ 排序▾ │
├──────────────────────────────────────────────────────────────┤
│ 分区 A  7 天内到期  (3)                        ← 默认最靠前     │
│ 分区 B  今日新增    (7)                                        │
│ 分区 C  免信用卡    (12)                                       │
│ 分区 D  长期有效    (14)                                       │
├──────────────────────────────────────────────────────────────┤
│ 页脚：完整披露 + 数据来源与核验机制 + MCP/Skill 安装入口         │
└──────────────────────────────────────────────────────────────┘
```

**首屏规则**：无 Hero。页头 + 披露条 + stat cards 高度控制在约 320px 内，**第一屏必须露出至少 2 张完整 promo 卡片**。

**分区切换**：默认「按紧急度」；提供 segmented control 切到「按厂商」/「按类别」。同一 promo 可出现在多个分区（用 `data-section` 标记，非复制 DOM）。

### 4.1 stat cards（4 张）

每张结构：
```
┌────────────────────────┐
│ 今日新增                │   ← 12px --meta，标签左
│                        │
│ 7                      │   ← 40px mono tabular-nums，600 字重，-0.015em
│                        │
│ 数据生成于 06:00        │   ← 12px --muted，必须来自 payload
└────────────────────────┘
```

**4 张卡与数据源**（全部由 `build-site.ts` 在构建期从 `build/catalog.json` 算出并写进静态页，契约见 §13.0）

| # | 标签 | 数字来源（Schema 字段） | 次级行（12px `--muted`） |
|---|---|---|---|
| 1 | 今日新增 | `created_at` 落在当天的条目数 | 「数据生成于 {构建时间 HH:MM}」 |
| 2 | 即将到期 | `offer.expires_at` 在 7 天内且未过期的条目数 | 「最早 {N} 天后到期」 |
| 3 | 覆盖厂商 | `provider.id` 去重计数 | 「共 {N} 条额度」 |
| 4 | 已核验 | `verification.status === 'verified'` 的条目数 | 「占全部条目 {pct}%」 |

> **已删除初版的「较昨日 +3」趋势行与右上箭头标记**：`catalog.json` 没有任何 delta 字段，也不保存昨日快照，写出来就是虚构指标（本文档 §1 反模式第 6 条）。要恢复趋势，必须在策展库里留存历史快照 —— 在那之前，次级行只用真实存在的时间戳与计数。
> 这条删除**与数据层无关**：即使页面拿全量 Schema，也没有「昨日」可比。所以本条在两种契约下都成立。

- 卡片：`--surface` 底 + 1px `--border` + `--radius-md` + `--space-5` 内边距 + **无阴影**
- 数字单色（`--fg`），**不用强调色**（强调色留给 CTA 与选中态）
- 卡 2 为 0 时显示「0」+ 次级「近 7 天无到期」，**不隐藏卡片**（隐藏会让整行布局跳动）
- 移动端：2×2 网格；平板 ≥768px：4×1

### 4.2 筛选 / 排序交互

**可见筛选组（≤4 组，符合工作记忆 ≤4 项限制）**
1. **搜索**（input，占位文案：「搜索厂商、模型或条款，如"免信用卡"」）—— 匹配 `provider.name_zh` / `provider.name_en` / `offer.headline` / `models[]` / `terms[].note`
2. **区域**（chip 组，多选）← `region.{availability,countries}`：全球 / 中国大陆 / 美国 / 欧盟 / 其他
3. **难度**（chip 组，多选）← `difficulty`：易 / 中 / 难
4. **类别**（chip 组，多选，取 Schema `categories` 枚举）：文本推理 `llm` / 嵌入向量 `embedding` / 图像 `image` / 视频 `video` / 语音 `audio` / Agent 托管 `agent_hosting` / 向量库 `vector_db` / GPU 算力 `gpu_compute`

> **区域筛选必须用结构化字段匹配，禁止字符串包含判断**。`region` 是 `{availability, countries[]}` 三态对象，正确算法：
> - `global` → 命中所有区域筛选项
> - `include` → 命中 `countries[]` 里列出的项
> - `exclude` → 命中**不在** `countries[]` 里的项
>
> 反过来用文案子串匹配必然出错——「除 US 外可用」这个字符串里含 "US"，但美国恰恰不可用。这条禁令与数据层无关，任何一层都成立。

**收进「更多筛选」popover**
- 厂商（多选，`name_zh` 与 `name_en` 双向匹配）
- `no_credit_card` 条款（switch）
- 到期窗口（7 天内 / 30 天内 / 长期）
- 仅看 `verification.status === 'verified'`（switch）
- 仅看无返佣 `disclosure.affiliate === false`（switch）

**排序**（select，默认第一项）
1. **到期最近优先**（默认）← `offer.expires_at` 升序 → `no_fixed_expiry=true` → 未公布，最后一组沉底
2. **最近新增** ← `created_at` 降序
3. **上手最容易** ← `difficulty` 按 easy → medium → hard

> **已删除「额度最大」排序，此删除与数据层无关**：`offer.amount.value` 的 9 种 `unit` 之间不可比（50 是 `percent_off`，10 000 000 是 `tokens`），跨单位排序出来的顺序没有意义。要恢复必须先定义换算口径，那是产品决策不是前端逻辑。

> **已删除「额度最大」排序**：`amount.value` 的 9 种 `unit` 之间不可比（50 是 `percent_off`，10 000 000 是 `tokens`），跨单位排序出来的顺序没有意义。要恢复必须先定义换算口径，那是产品决策不是前端逻辑。

**交互规范**
- chip：未选 = `--surface` + 1px `--border` + `--fg-2` 文字；选中 = `--accent-tint` 底 + `--accent` 文字 + **无边框**（用底色而非边框区分，避免"边框变粗"的抖动）。
- 每次筛选变化：结果区淡入 150ms；同时更新顶部「共 N 条」计数（`aria-live="polite"`）。
- 全部筛选可清除：结果区上方出现「清除全部筛选（N）」文字按钮。
- 键盘：chip 组 `role="group"`，chip 为 `<button aria-pressed>`，Tab 可达，Enter/Space 切换。

---

## 5. 组件清单

### 5.1 promo 卡片（核心组件）

必须展示的 **12 项**信息（缺一不可）。**字段绑定 `promo.schema.json` 全量路径**（页面由 `build-site.ts` 从 `build/catalog.json` 构建期生成，见 §13.0）：

| # | 字段（Schema 路径，详见 §13） | 呈现 | 图标 |
|---|---|---|---|
| 1 | 厂商名 ← `provider.name_zh` / `provider.name_en` | 16px / 600 / `--fg-2`。**渲染规则已由 Schema 写死**：`provider.country === 'CN'` 且 `name_zh !== null` → 中文，否则 `name_en`。厂商名是 `provider.homepage` 的链接 | `fct-logo-*` |
| 2 | 核验状态 ← `verification.status` | 12px pill，见 §13.5 四态 | `shield-check` / `alert-triangle` |
| 3 | 优惠标题 ← `offer.headline` | 16px / 600 / `--fg`，**必须具体到数字**（如「GLM-4.6 每天 100 万 tokens 免费额度」） | — |
| 4 | 额度 ← `offer.amount` | 14px / `--muted`，mono tabular-nums；**渲染格式按 `amount.unit` 九选一，见 §13.8**；`raw_text` 作 `title` | — |
| 5 | 条款标签 ← `terms[].tag` | chip 组，**按 `severity` 分权重**，见 §13.2 | 见 §13.2 |
| 6 | **上手难度徽章** ← `difficulty` | 条形计量图 + 文字，见 §6 | `difficulty-meter` |
| 7 | 区域 ← `region.{availability,countries}` | 12px + `globe`。**结构化三态对象**，见 §13.3 | `globe` |
| 8 | **到期倒计时** ← `offer.expires_at` + `offer.no_fixed_expiry` | 12px + `clock`，见 §5.3 | `clock` |
| 9 | **返佣披露标记** ← `disclosure.affiliate` | **仅 true 时渲染**。CTA 旁 `coin-stack` + 「已核实」+「广告」，见 §7 | `coin-stack` |
| 10 | **核验时间** ← `verification.last_verified_at` | 12px `--meta`，如「09-28 06:00 核验」。**PM 定的核心差异化：所有展示面强制显示** | `refresh` |
| 11 | 「如何薅」入口 ← `actionability.next_steps[]` | `<details>` 展开，**最多 5 步**，见 §5.4 | `book-open` + `chevron-down` |
| 12 | 领取 CTA ← `offer.claim_url` / `disclosure.affiliate_url` | Primary 按钮（`--accent` 底）。href 与 `rel` 由 `disclosure.affiliate` 决定，见 §7.1.1 | `external-link` |

> **第 10 项「核验时间」不可省略**：这是 PM 定的核心差异化（所有展示面强制显示 `last_verified_at`），我们对外讲的可信度就靠它。页面走 `build/catalog.json` 全量 Schema，拿得到这个字段 —— 中间曾因误判「页面只能用 `DailyItem` 12 个字段」而删掉，现已恢复（见 §13.0 的裁定记录）。

**卡片版式**
```
┌─────────────────────────────────────────────────────┐
│ 智谱 GLM    [shield-check 已核验]  [◷ 剩 3 天]      │  头部行
│                                                     │
│ GLM-4.6 每天 100 万 tokens 免费额度                  │  16/600 标题（offer.headline）
│ 10M tokens/月                                       │  14/muted mono（offer.amount，见 §13.8）
│                                                     │
│ [免信用卡] [限新用户] [需实名] [限速]                │  条款标签（按 severity 分权重）
│                                                     │
│ ─────────────────────────────────────────────────── │  border-soft 分隔
│ [▁▃▅ 上手难度 · 中]  [限 CN]   [◷ 剩 3 天]          │  元数据行
│                                                     │
│ [book-open] 如何薅 ▾                    09-28 06:00 核验 │  操作行（44px 高）
│ [ 去官方页 [i-external-link] 已核实 ]                │
└─────────────────────────────────────────────────────┘
```
- **不设摘要行**：Schema 没有摘要字段，`human_summary` 是 MCP 的运行时文案、不进 `catalog.json`。摘要语义由 `offer.headline` + `offer.amount` 两行承担。**禁令：前端不得拼接 `terms[].note` 冒充摘要。**
- 底：`--surface`，1px `--border`，`--radius-md`(10px)，内边距 20px，最小高 132px
- hover：**仅** `border-color → --border-strong` + `background → --surface-hover`，150ms。**不加阴影、不上移、不缩放**
- 已过期卡片：整卡 `opacity: 0.62`（保留可读对比度 ≥4.5:1）+ 标题加删除线 + CTA 变 Ghost 且文案改「查看归档」，自动沉到所在分区末尾
- 网格：桌面 3 列 / 平板 2 列 / 移动 1 列

### 5.2 状态 pill（条款与状态）

- 形状：胶囊（`--radius-pill`），前导 6px 圆点 + 文字
- **默认中性**：`severity: friction` 与 `note` 的条款标签用 `--term-tag-bg` + `--term-tag-fg` + 图标，不染色
- **两套染色规则（互不冲突，因为管的是不同语义轴）**：
  - **条款轴**：仅 `severity: blocker` 染 `--danger` 系（`--tint-danger` 底）——「不满足就完全拿不到」，扫读时必须看见
  - **状态轴**：即将到期 → `--warn` 系；已过期 → `--danger` 系
- 这样"一片中性标签里跳出的颜色"= 真正的阻断/紧迫信号，而不是五颜六色的噪音

**条款标签是 Schema 的 22 项受控枚举 `term_tag`，禁止就地发明**。完整枚举 → 中文标签 → 图标 → 严重度映射见 **§13.2**。

### 5.3 到期倒计时

数据源是 `offer.expires_at`（ISO8601 \| null）配合 `offer.no_fixed_expiry`（两者互斥，见 §13.4）。**构建期**由 `build-site.ts` 算成天数并写进静态页 —— 页面本身是静态 HTML，运行时不做日期运算。

| 情况 | 文案 | 颜色 |
|---|---|---|
| ≤24 小时 | 「剩 11 小时」 | `--warn`（文字 5.43:1） |
| ≤7 天 | 「剩 3 天」 | `--warn` |
| \>7 天且有到期日 | 「2026-10-15 到期」 | `--meta` |
| `no_fixed_expiry: true` | 「长期有效」 | `--meta` |
| `status: expired` / `withdrawn` | 「已于 09-26 过期」/「已下线」 | `--danger` + pill 底 |
| 两者皆 null | 「到期日未公布」 | `--meta`（**显式写出，不省略**） |

- 数字一律 `tabular-nums`
- `status` 为 `expiring` 时由构建期按 `expires_at` 距今天数自动置位，前端不自行计算
- 因为页面是构建期生成的静态 HTML，「剩 N 天」在两次构建之间不会跳动 —— 这是零依赖静态方案的固有取舍，页面顶部标注生成时间即可（见 §4.1）

### 5.4 「如何薅」展开区

数据源 `actionability.next_steps[]` —— **是数组**（Schema 里就是数组；页面走全量 `catalog.json`，拿得到全部步骤）。用原生 `<details>/<summary>`（零 JS 即可工作）：

- summary：20px 高，`book-open` 图标 + 「如何薅」，右侧 `chevron-down`（展开时旋转 180°，150ms）
- 内容：最多 **5 步**，编号圆点（1/2/3/4/5，`--accent-tint` 底 + `--accent` 数字）+ 14px 正文
- 若含命令/代码：`<pre>` + 右上角 `copy` 按钮（28×28，复制成功变 `check-circle` 并 1.5s 后复原）
- 无障碍：`summary` 原生可键盘操作；复制按钮 `aria-label="复制安装命令"`，结果用 `aria-live="polite"` 播报

> **折叠而非平铺的理由**：步骤最多 5 条，平铺会把卡片撑成两倍高，破坏三列网格的扫读节奏。默认折叠、需要时展开，卡片高度才可控。
> `offer.claim_steps[]`（厂商侧领取步骤）与 `actionability.next_steps[]`（我们给的下一步）并存时：**面板显示 `next_steps`，`claim_steps` 作面板内的折叠详情**，不混排。

### 5.5 5 态覆盖（列表区必须全部实现）

| 状态 | 设计 |
|---|---|
| **Loading** | 骨架屏：6 张卡片占位，条宽模拟真实结构（标题 70% / 摘要 100%+60% / 标签 3 个 40px 条）。底 `--skeleton`，微光层 `--skeleton-sheen` 以 1.2s 从左扫过（`prefers-reduced-motion` 下静止） |
| **Empty** | 分区级空态：`search` 图标（24px，`--meta`）+ 「当前筛选下没有匹配的额度活动」+ 次级说明「试试放宽区域或难度」+ 「清除全部筛选」按钮（Ghost）。**全站空态**：`gift` 图标 + 「今天还没有新增额度活动，数据每 6 小时刷新一次」 |
| **Error** | 「数据加载失败（可能是网络或上游源不可达）」+ 「重试」按钮 + 降级提示「你可以先查看 09-27 的缓存快照」+ 缓存快照链接 |
| **Populated** | 正常分区列表 |
| **Edge** | ① 超长厂商名/标题：`text-overflow: ellipsis` + `title` 属性；② 单分区 >50 条：折叠为「展开其余 N 条」；③ 到期日缺失：显式显示「到期日未公布」而非省略；④ 数字为 0：stat card 显示「0」并附「暂无」次级文案 |

### 5.6 按钮

| 变体 | 底 | 文字 | 边框 |
|---|---|---|---|
| Primary | `--accent` | `--accent-on` (#fff) | 无 |
| Secondary | `--surface` | `--accent` | 1px `--accent` |
| Ghost | 透明 | `--fg-2` | 1px `--border` |
| Destructive | `--danger` | #fff | 无 |

内边距 `10px 16px`，`--radius-sm`(6px)，最小高 36px（桌面）/ 44px（移动，WCAG 2.5.5）。
状态：Default / Hover（150ms 换底）/ Focus-visible（2px accent outline，offset 2px）/ Active（80ms）/ Disabled（`--fg-disabled` + `cursor: not-allowed`）/ Loading（Primary 内换 14px spinner，文案改「打开中…」）。

**CTA 文案规则**：动词 + 具体对象。用「去官方页」「查看条款」「复制安装命令」。**禁止**无信息量的通用动词（如「Submit」）与空泛的注册号召语 —— CTA 必须写出用户点下去会发生什么。

### 5.7 输入框 / chip / 开关

- **输入框**：`--surface` 底，1px `--border-input`，`--radius-sm`，高 36px，focus 时边框 → `--accent` 并显示 focus-ring；错误态边框 → `--danger` + 下方 12px 错误文案（`aria-describedby` 关联）
- **搜索框**：前置 `search` 图标（20px，`--meta`），右侧清空 `x` 按钮（仅当有输入时出现）
- **开关（switch）**：轨道 40×22，滑块位移即状态（**不靠颜色单独表意**），开启时轨道 `--accent`，滑块 #fff；`role="switch"` + `aria-checked`

---

## 6. 上手难度徽章：三重视觉编码

> 要求：不能只靠颜色（WCAG 1.4.1 Level A）。采用 **形状 + 文字 + 颜色深度** 三重编码，且三条通道任一单独失效时仍可读。

### 6.1 三条通道

| 通道 | 编码 | 灰度下是否可辨 |
|---|---|---|
| **形状（主）** | 3 段递增条形计量图，填充段数 = 难度级数 | 是 |
| **文字（主）** | 明确写出「上手难度 · 易 / 中 / 难」 | 是 |
| **颜色（辅）** | accent 同族三阶，深度随难度递增 | 否（仅作强化） |

### 6.2 条形计量图 SVG（14×14，随徽章缩放）

```svg
<svg class="diff-meter" width="14" height="14" viewBox="0 0 14 14"
     aria-hidden="true" focusable="false">
  <rect x="1"    y="8"   width="3" height="5"    rx="1" fill="currentColor" fill-opacity="var(--d1)"/>
  <rect x="5.5"  y="5"   width="3" height="8"    rx="1" fill="currentColor" fill-opacity="var(--d2)"/>
  <rect x="10"   y="1.5" width="3" height="11.5" rx="1" fill="currentColor" fill-opacity="var(--d3)"/>
</svg>
```

| 级别 | 填充段 | `--d1/--d2/--d3` | 徽章底 | 徽章文字 | 对比度 |
|---|---|---|---|---|---|
| **易** | 1 段 | 1 / .28 / .28 | `#EAF3F6` | `#0E5C74` | 6.66:1 |
| **中** | 2 段 | 1 / 1 / .28 | `#D8E9EE` | `#0A4B60` | 7.68:1 |
| **难** | 3 段 | 1 / 1 / 1 | `#C3DCE4` | `#073D4F` | 8.20:1 |

### 6.3 为什么用 accent 同族而不是绿/黄/红

绿/琥珀/红已被**到期状态**占用（§5.2、§5.3）。若难度也用红黄绿，屏幕上会出现两组语义相同、含义不同的颜色 —— 这是配色最常见的失败模式。难度改用 accent 同族三阶后：
- 状态轴（绿/琥珀/红）= 「这条还能不能薅」
- 难度轴（石油蓝三阶）= 「薅它要花多大力气」
两条轴在色相上完全分离，扫读时不会误读。

### 6.4 完整标记（无障碍）

```html
<span class="badge badge--difficulty badge--difficulty-medium"
      role="img" aria-label="上手难度：中">
  <svg class="diff-meter" ...>…</svg>
  <span aria-hidden="true">上手难度 · 中</span>
</span>
```
- 徽章：`--radius-sm`(6px)，内边距 `3px 8px`，高 22px，图标与文字间距 `--space-1`(4px)
- 徽章本身不可聚焦（非交互）；若后续做成筛选器，则外层改 `<button aria-pressed>`
- `tooltip`（title 属性）补充：「中：需要注册账号并申请 API Key，约 10 分钟」

### 6.5 难度判定口径（供内容与后端对齐）

| 级别 | 判定标准 | 示例 |
|---|---|---|
| **易** | 注册即得，无需信用卡、无需申请、无需实名 | 注册送额度，控制台直接拿 Key |
| **中** | 需注册 + 至少一项额外动作（绑卡试用 / 实名 / 提交申请 / 教育邮箱验证） | 绑卡后 30 天内享免费额度 |
| **难** | 需审批 / 需排队 / 需开源项目证明 / 需企业资质 / 需命令行自建 | 需提交项目链接人工审核 |

---

## 7. 项目透明度声明（Trust Stance，**已替代原 §7 返佣披露章节**）

> **2026-09-28 重写**：原 §7「返佣披露：合规呈现方案」**整体撤销**，因变现路线已从联盟返佣改为 OSS + Hosted Convenience（详见 `docs/PRD.md` §8 与 §13.3 D9）。本页**没有任何联盟链接**，因此 FTC 16 CFR 255、《互联网广告管理办法》第九条/第十八条、《广告法》绝对化用语均**不适用**。

### 7.0 核心立场

| 主张 | 含义 |
|---|---|
| **开源 MIT** | 代码完全开源，谁都能自部署、自托管、自审查 |
| **不接硬广** | 不接受厂商付费收录，不为付费修改排序 —— 收录与排序**只**看用户价值（到期/难度/区域/核实时间） |
| **不挂联盟** | 每条 promo 的 `claim_url` 一律为厂商官方直链，**不带任何返佣 tag** |
| **可核验** | 每条 promo 显示 `last_verified_at`（数据核实于 X 月 X 日），点击可看到完整审计链 |
| **可纠错** | 任何用户可经 GitHub Issue / MCP `report_promo_issue` 工具纠错，人工回复 |

### 7.1 站点级披露条（替代原 L1 sticky 联盟披露条）

**位置**：页面顶部 sticky，高度 32px / 移动 40px（**比原联盟披露条矮 4px**，因为不需要警示）

**中文版**（`lang="zh-CN"`）：
```
开源 · 不接硬广 · 不挂联盟 · 数据每日核实 · MIT
```

**英文版**：
```
Open source · No paid placements · No affiliate links · Daily verified · MIT
```

**视觉规范**：
- 底 `--disclosure-bg` `#F5F6F8`（页面主底色，不喧宾夺主）
- 文字 `--disclosure-fg` `#15181D`（主文本色，对比度 17.79:1）
- 不带感叹号、不带警示色、**不带任何 emoji**
- 字号 13px 字重 500 字距 0.01em
- **不可关闭**（固定品牌锚点，不是法律要求）

### 7.2 卡片级标识（替代原 L2 卡片可信度三件套）

**不再需要**「已核实」「广告」标记 —— 没有任何返佣关系。

改为显示**「可信度三件套」**（位于卡片底部次级行）：

| 元素 | 数据来源 | 视觉 |
|---|---|---|
| **核验状态 pill** | `verification.status` | 「已核验」/「待复核」/「已过期」三态 pill |
| **核验时间** | `verification.last_verified_at` | 13px 等宽字体：「核实于 2 天前」 |
| **修正入口** | MCP `report_promo_issue` 工具 | 16px `alert-triangle` 图标 + 12px「数据有误？」 |

### 7.3 数据层（替代原 L3 JSON-LD affiliateDisclosure）

**不再需要 JSON-LD affiliateDisclosure**。

改为更轻量的**项目透明度标记**：
```html
<html lang="zh-CN" data-project="free-and-cheap-tokens" data-license="MIT" data-monetization="oss+hosted">
```

并提供 `/.well-known/security.txt` 与 `/humans.txt`，说明项目治理与联系入口。

### 7.4 页脚完整声明（替代原 §7.4）

```
项目透明度 · 开源协议 MIT · 不接硬广 · 不挂联盟 · 每条数据每日人工核实
本站为策展型工具，**不参与**任何 promo 的注册、申领、代理、托管或转发；所有点击直达厂商官方页面。
托管服务（Apify Actor / WorkBuddy Skill）为付费便利层，源码完全免费可自托管。
收录标准 / 排序规则 / 纠错流程见 GitHub 仓库 README。
```

### 7.5 移除的章节（原 §7.5 法定「广告」标识）

**整体移除**。联盟返佣不适用，「广告」标识不再出现在任何渲染面。`--ad-label-*` 三个 token 从 `design/design-tokens.{json,css}` 中删除（待 §13 字段映射同步清理）。

## 8. 分享卡片（OG 图 / 分享快照）

### 8.1 规格

| 项 | 值 |
|---|---|
| 画布 | **1200 × 630 px（1.91:1）** —— 通吃 X / Facebook / LinkedIn / Slack / Discord |
| 安全区 | 居中 **1000 × 500**；距任意边缘 60px 内不放关键内容 |
| 格式 | PNG（文字密集，避免 JPG 压缩artifact）；< 5MB，理想 < 1MB |
| 缩略图验证 | **缩到 200px 宽时数字必须可读**，否则重做 |

### 8.2 版式构成

```
┌────────────────────────────────────────────────────────────┐
│ 60px margin                                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ FREE & CHEAP TOKENS                    2026-09-28     │  │ 顶部身份行
│  │ ── 2px accent 规则线（宽 96px）──                      │  │
│  │                                                       │  │
│  │   7          3          12                            │  │ ← 72px mono 数字
│  │ 今日新增   7天到期    免信用卡                          │  │ ← 28px 标签
│  │                                                       │  │
│  │ ──────────────── border-soft 分隔线 ─────────────────  │  │
│  │ 智谱 GLM · Cerebras · 硅基流动 · Groq                  │  │ ← 32px 厂商证据行
│  │                                                       │  │
│  │ freeandcheaptokens.dev   [广告] 含联盟链接（可能返佣）  │  │ ← 底部：域名 + 披露
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

**元素规格**
| 元素 | 字号 | 字重 | 颜色 |
|---|---|---|---|
| 字标 `FREE & CHEAP TOKENS` | 32px | 600 | `--fg`，`tracking-caps` 0.08em |
| 日期 | 28px | 500 | `--meta`，mono tabular-nums |
| **统计数字** | **72–88px** | 600 | `--fg`，mono tabular-nums，`tracking-tight` |
| 统计标签 | 28px | 500 | `--muted` |
| 厂商证据行 | 32px | 500 | `--fg-2` |
| 域名水印 | 24px | 500 | `--meta` || 披露小字 | 22px | 400 | `--disclosure-fg` |

**背景**：纯 `--bg` `#F5F6F8` + 极淡 1px 网格线（8% 不透明度，`--border`），**无渐变、无 3D、无发光**。右上角可放一张 2px accent 规则线作唯一强调色使用。

> **「广告」标识是 OG 卡的强制元素**（§7.5 第 3 处）。中文场景渲染 `广告`，英文场景渲染 `Ad`。它在页底 `#F5F6F8` 上的对比度为 **7.68:1**，且带描边框 —— 即使在纯背景上也不依赖底色即显著。

### 8.3 为什么能驱动传播

1. **数字是"今天的"** —— 时效性数字（今日新增 7 / 7 天到期 3）制造每日可重复的分享仪式，契合"晨会前扫一眼"场景。这是**日报型传播**，不像营销图一次就腻。
2. **具体厂商名 = 信息价值** —— 「智谱 GLM · Cerebras · 硅基流动」是情报，不是口号。人们转发"有用的清单"，不转发"我们的产品很棒"。
3. **看起来像情报卡，不像广告** —— 无渐变、无 3D 抽象图形、无空泛的注册号召语，在信息流里反而因"克制"而突出（反差即辨识度）。
4. **域名水印固定右下角** —— 同一人在信息流里多次看到同位置水印，建立识别。
5. **含披露小字** —— 合规且诚实，避免"点进去发现是推广"的信任崩塌。
6. **缩略图可读** —— 72px 数字在 200px 宽下仍清晰；验证方法：导出后缩到 25% 再读。

### 8.4 页面内「分享」按钮行为

点击「分享」→
1. 优先 `navigator.share({ title, text, url })`（移动端原生分享面板）
2. 不支持则复制到剪贴板 + Toast「链接已复制，附今日快照图」（`aria-live="polite"`）
3. 提供「下载今日快照 PNG」次级按钮（导出 1200×630，纯前端 Canvas 绘制，零依赖）

### 8.5 必须的 meta 标签

```html
<meta property="og:type"        content="website">
<meta property="og:title"       content="Free & Cheap Tokens · 2026-09-28 每日清单">
<meta property="og:description" content="今日新增 7 条，7 天内到期 3 条，免信用卡 12 条。">
<meta property="og:image"       content="https://<domain>/og/2026-09-28.png">
<meta property="og:image:width"  content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt"   content="2026-09-28 每日免费额度清单：今日新增 7 条，7 天内到期 3 条，免信用卡 12 条。">
<meta name="twitter:card"       content="summary_large_image">
```
> 图片 URL 必须是 HTTPS 绝对路径、登出状态可抓取、无 cookie 依赖。OG 图上的数字必须与 `og:title` 一致 —— 不一致会被判为误导。

### 8.6 可复制文案自带项目透明度声明（已替代原「必须内嵌披露」）
> **2026-09-28 重写**：联盟返佣路线撤回，复制文案不再需要「广告」内嵌披露。改为自带**项目透明度声明 + 数据核实水印**，与 §7 立场一致。

复制进剪贴板的默认文案格式：

```
免费 AI 额度清单 · 数据核实于 2026-09-28
本站不接硬广、不挂联盟，每条 promo 直达厂商官方页面。
https://freeandcheaptokens.dev/?ref=share&d=2026-09-28
```

- `?ref=share` 用于追踪分享渠道（**第一方 cookie** / 不写第三方）
- `d=` 为日期戳，便于发现过时分享
- **不内嵌任何 emoji / 不内嵌任何联盟 / 不内嵌任何广告标识**
- 用户可手动编辑产品不干预，**默认值**必须带透明度声明 + 日期戳

## 9. inline SVG 图标清单

**统一规范**：`viewBox="0 0 24 24"` ｜ `fill="none"` ｜ `stroke="currentColor"` ｜ `stroke-width="1.5"` ｜ `stroke-linecap="round"` ｜ `stroke-linejoin="round"` ｜ 尺寸三档 16 / 20 / 24px ｜ 全部内联，禁止外部图标包 ｜ **禁止任何 emoji**

| # | 语义名 | 用途 | 档位 | path / 元素 |
|---|---|---|---|---|
| 1 | `search` | 搜索框前置、空状态 | 20 / 24 | `<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>` |
| 2 | `filter` | 「更多筛选」按钮（漏斗形） | 20 | `<path d="M3.5 5.5h17l-6.5 7.6v6.2l-4-2.3v-3.9Z"/>` |
| 3 | `sort` | 排序下拉 | 20 | `<path d="M7 4.5v15M7 4.5 3.6 8M7 4.5 10.4 8"/><path d="M17 19.5v-15M17 19.5l3.4-3.5M17 19.5l-3.4-3.5"/>` |
| 4 | `external-link` | CTA「去官方页」 | 16 / 20 | `<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h4.5"/>` |
| 5 | `clock` | 到期倒计时 | 16 | `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.5 2.2"/>` |
| 6 | `calendar` | 到期日 / 数据日期 | 16 | `<rect x="3.75" y="5.25" width="16.5" height="15" rx="1.5"/><path d="M3.75 10h16.5M8.5 3.5v3.5M15.5 3.5v3.5"/>` |
| 7 | `shield-check` | 已核验标记 | 16 | `<path d="M12 3 4.5 5.8v5.5c0 4.3 3.1 8.2 7.5 9.7 4.4-1.5 7.5-5.4 7.5-9.7V5.8Z"/><path d="M8.6 11.9l2.3 2.3 4.4-4.9"/>` |
| 8 | `globe` | 区域 / 可用地区 | 16 / 20 | `<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.4 2.3 3.7 5.3 3.7 8.5S14.4 18.2 12 20.5c-2.4-2.3-3.7-5.3-3.7-8.5S9.6 5.8 12 3.5Z"/>` |
| 9 | `credit-card` | 条款「需信用卡」 | 16 | `<rect x="2.75" y="5.25" width="18.5" height="13.5" rx="2"/><path d="M2.75 9.75h18.5M6.5 14.5h3.5"/>` |
| 10 | `credit-card-off` | 条款「免信用卡」 | 16 | `<rect x="2.75" y="5.25" width="18.5" height="13.5" rx="2"/><path d="M2.75 9.75h18.5"/><path d="M4 20 20 4"/>` |
| 11 | `gift` | 免费额度 / 全站空态 | 16 / 24 | `<rect x="3.25" y="8.25" width="17.5" height="4" rx="1"/><path d="M4.75 12.25h14.5V20a1 1 0 0 1-1 1H5.75a1 1 0 0 1-1-1Z"/><path d="M12 8.25v12.75"/><path d="M12 8.25S10.5 3.2 8 3.2a2.4 2.4 0 0 0 0 5.05Z"/><path d="M12 8.25S13.5 3.2 16 3.2a2.4 2.4 0 0 1 0 5.05Z"/>` |
| 12 | `tag` | 条款归类标签 | 16 | `<path d="M20.5 12.8 12.8 20.5a1.6 1.6 0 0 1-2.3 0l-6.8-6.8a1.6 1.6 0 0 1-.5-1.1V4.4c0-.9.7-1.6 1.6-1.6h8.2c.4 0 .8.2 1.1.5l6.4 6.4a1.6 1.6 0 0 1 0 2.3Z"/><circle cx="8.2" cy="8.2" r="1.4"/>` |
| 13 | `percent` | 折扣类 promo | 16 | `<path d="M19 5 5 19"/><circle cx="7.5" cy="7.5" r="2.75"/><circle cx="16.5" cy="16.5" r="2.75"/>` |
| 14 | `coin-stack` | **返佣披露标记**（L1 + L2） | 16 / 20 | `<ellipse cx="12" cy="6.5" rx="7.5" ry="3"/><path d="M4.5 6.5v5c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-5"/><path d="M4.5 11.5v5c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-5"/>` |
| 15 | `info` | 披露详情 / 说明 | 16 / 20 | `<circle cx="12" cy="12" r="8.5"/><path d="M12 11.2v5.3"/><circle cx="12" cy="7.9" r=".95" fill="currentColor" stroke="none"/>` |
| 16 | `alert-triangle` | 条款收紧 / 即将到期警示 | 16 | `<path d="M12 4.5 21 19.5H3Z"/><path d="M12 10v4"/><circle cx="12" cy="16.6" r=".95" fill="currentColor" stroke="none"/>` |
| 17 | `x-circle` | 已过期 / 已下线 | 16 | `<circle cx="12" cy="12" r="8.5"/><path d="M9 9l6 6M15 9l-6 6"/>` |
| 18 | `check-circle` | 生效中 / 复制成功 | 16 | `<circle cx="12" cy="12" r="8.5"/><path d="M8.3 12.3l2.6 2.6 4.8-5.4"/>` |
| 19 | `zap` | 一键上手 / 秒级开通 | 16 | `<path d="M13.5 3 5.5 13.5h5.2L10 21l8-10.5h-5.2Z"/>` |
| 20 | `terminal` | 需命令行（难度·难） | 16 / 20 | `<rect x="3.25" y="4.25" width="17.5" height="15.5" rx="2"/><path d="M7 9.5l2.5 2.5L7 14.5M12.5 15h4.5"/>` |
| 21 | `key` | 需申请 API Key | 16 | `<circle cx="8" cy="12" r="3.75"/><path d="M11.5 14.5 20 20"/><path d="M17.4 17.4l1.9-1.9M15.2 15.2l1.9-1.9"/>` |
| 22 | `book-open` | 「如何薅」入口 | 20 | `<path d="M12 6.5C10.5 5 8.5 4.25 4.5 4.25v13c4 0 6 .75 7.5 2.25 1.5-1.5 3.5-2.25 7.5-2.25v-13c-4 0-6 .75-7.5 2.25Z"/><path d="M12 6.5v13"/>` |
| 23 | `copy` | 复制命令 / 复制链接 | 16 / 20 | `<rect x="8.75" y="8.75" width="11.5" height="11.5" rx="2"/><path d="M15.25 8.75v-3a2 2 0 0 0-2-2H5.25a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>` |
| 24 | `share` | 分享按钮 | 20 | `<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/>` |
| 25 | `refresh` | 数据更新时间 / 重试 | 16 / 20 | `<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4.5V10h-5.5"/>` |
| 26 | `chevron-down` | 展开「如何薅」/ 下拉 | 16 / 20 | `<path d="M6 9.5 12 15.5 18 9.5"/>` |
| 27 | `chevron-right` | 次级导航 / 面包屑 | 16 | `<path d="M9.5 6 15.5 12 9.5 18"/>` |
| 28 | `code` | MCP / Skill 安装入口 | 16 / 20 | `<path d="M8.5 8 4.5 12l4 4M15.5 8l4 4-4 4"/>` |
| 29 | `cpu` | 模型 / 推理服务类别 | 16 / 20 | `<rect x="7.25" y="7.25" width="9.5" height="9.5" rx="1.5"/><rect x="10.4" y="10.4" width="3.2" height="3.2" rx=".6"/><path d="M10 7.25V4.5M14 7.25V4.5M10 16.75v2.75M14 16.75v2.75M7.25 10H4.5M7.25 14H4.5M16.75 10h2.75M16.75 14h2.75"/>` |
| 30 | `building` | 厂商（企业主体）标识 | 16 | `<rect x="4.5" y="3.25" width="15" height="17.5" rx="1.5"/><path d="M8.5 7.5h2M13.5 7.5h2M8.5 11h2M13.5 11h2M11 20.75v-4h2v4"/>` |
| 31 | `link` | 复制页面链接 | 16 / 20 | `<path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.54 3.54 0 0 0-5-5l-1.5 1.5"/><path d="M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.54 3.54 0 0 0 5 5l1.5-1.5"/>` |
| 32 | `x` | 关闭 / 清除输入 | 16 / 20 | `<path d="M6 6l12 12M18 6 6 18"/>` |
| 33 | `difficulty-meter` | **上手难度徽章**（组件，非独立图标） | 14×14 | 见 §6.2（fill 而非 stroke） |

**尺寸档位规则**
- **16px** — 行内、徽章内、元数据行（clock / globe / shield-check / tag / coin-stack）
- **20px** — 按钮内、chip 内、搜索框前置（search / external-link / book-open / filter）
- **24px** — 独立图标、空状态、分区标题（gift / search / cpu）

**实现约定**：所有图标以 `<svg>` 内联写入同一份 `icons.html` 片段或 JS 常量表，通过 `<use href="#i-clock">` 复用 `<symbol>`，避免重复 path。**不得**用 CSS `background-image` 引外部文件（零依赖）。

---

## 10. 页面设计提示词（给前端工程师）

### 10.0 全局

- 引入 `design/design-tokens.css` 作为**唯一**样式源。任何组件样式中出现裸 hex（除 `#fff` `#000`）＝ 退回重做。
- 无框架、无构建。单页 `index.html` + `app.css` + `app.js`，数据以 `data/deals-YYYY-MM-DD.json` 静态加载。
- 移动优先：断点 640 / 768 / 1024 / 1280。
- 所有交互元素键盘可达；`:focus-visible` 用 tokens 里定义的 focus ring。
- `\<details\>` 用于「如何薅」与披露详情 —— 零 JS 即可用，JS 失败时页面仍完整。

---

### 10.1 页面：每日清单页

**路由**：`/` 与 `/daily/2026-09-28`（同一模板，日期由数据决定）

**布局**
```
body: background var(--bg)
  .disclosure-bar   position sticky, top 0, z var(--z-sticky), h 36px (移动 44px)
  .site-header      position sticky, top var(--disclosure-bar-h), z var(--z-sticky)
  main.container     max-width var(--container-max), padding 0 var(--gutter-desktop)
    .stats           display grid, grid-template-columns repeat(4, 1fr), gap var(--space-4)
    .toolbar         position sticky, z var(--z-toolbar)
    .sections        display flex column, gap var(--space-8)
      .section × N
        .section__head
        .card-grid   display grid, gap var(--space-4)
                     grid-template-columns: 1fr (<640) / repeat(2,1fr) (≥768) / repeat(3,1fr) (≥1024)
  footer
```

**组件清单**
`DisclosureBar` · `SiteHeader` · `StatCard` ×4 · `SearchInput` · `FilterChipGroup` ×3 · `MoreFiltersPopover` · `SortSelect` · `ResultCount` · `SectionHeader` · `PromoCard` · `StatusPill` · `DifficultyBadge` · `TermTag` · `ExpiryChip` · `HowToPanel(details)` · `AffiliateMark` · `EmptyState` · `ErrorState` · `SkeletonCard` · `Toast` · `Icon`

**交互**
| 操作 | 反馈 |
|---|---|
| 输入搜索 | 150ms 防抖，结果区淡入 150ms，计数 `aria-live` 播报 |
| 点击 chip | chip 底色 → `--accent-tint`，文字 → `--accent`（150ms）；结果区淡入 |
| 打开「更多筛选」 | popover 从按钮下方展开，`--elev-overlay`，200ms；Esc 关闭，焦点返回触发按钮 |
| 切换排序 | 分区内重排，150ms 淡入；当前项在 select 内标记 |
| hover 卡片 | 边框 → `--border-strong`，底 → `--surface-hover`，150ms |
| 点击「如何薅」 | `<details>` 展开，chevron 旋转 180°（150ms） |
| 点击复制 | 图标 → `check-circle` 1.5s，Toast「已复制」 |
| 点击分享 | `navigator.share` → 降级剪贴板 + Toast |
| 数据加载 | 骨架屏 6 张；失败显示 ErrorState + 重试 |

**文案骨架（真实文案，禁止占位符）**
```html
<!-- L1 披露条：中文版。「广告」标识必须首个出现（互联网广告管理办法第九条） -->
<div class="disclosure-bar" lang="zh-CN">
  <svg class="icon" width="16" height="16"><use href="#i-coin-stack"/></svg>
  <p>本页部分链接为联盟链接。你通过这些链接注册或购买，我们可能获得返佣，你无需支付额外费用。所有额度条款以厂商官方页面为准。</p>
</div>

<!-- L1 披露条：英文版 -->
<div class="disclosure-bar" lang="en">
  <svg class="icon" width="16" height="16"><use href="#i-coin-stack"/></svg>
  <p>Some links on this page are affiliate links. If you register or buy through them, we may earn a commission at no extra cost to you. Terms are governed by the provider's official page.</p>
</div>

<!-- 页头 -->
<header class="site-header">
  <div class="wordmark">Free &amp; Cheap Tokens</div>
  <p class="updated"><svg …#i-refresh/> 数据更新于 09-28 06:00 · 每 6 小时核验一次</p>
  <input class="search" type="search" placeholder="搜索厂商、模型或条款，如「免信用卡」" aria-label="搜索额度活动">
  <button class="btn btn--secondary"><svg …#i-share/> 分享今日清单</button>
</header>

<!-- stat cards -->
<div class="stats">
  <div class="stat"><p class="stat__label">今日新增</p><p class="stat__num num">7</p><p class="stat__delta">较昨日 +3</p></div>
  <div class="stat"><p class="stat__label">7 天内到期</p><p class="stat__num num">3</p><p class="stat__delta">最近一条剩 2 天</p></div>
  <div class="stat"><p class="stat__label">免信用卡</p><p class="stat__num num">12</p><p class="stat__delta">占全部 41%</p></div>
  <div class="stat"><p class="stat__label">已核验</p><p class="stat__num num">24</p><p class="stat__delta">最近核验 2 小时前</p></div>
</div>

<!-- 工具栏 -->
<div class="toolbar">
  <div class="chips" role="group" aria-label="按区域筛选">
    <button class="chip" aria-pressed="false">全球</button>
    <button class="chip" aria-pressed="true">中国大陆</button>
    …
  </div>
  <div class="chips" role="group" aria-label="按上手难度筛选">易 / 中 / 难</div>
  <div class="chips" role="group" aria-label="按类别筛选">文本推理 / 微调 / 嵌入向量 / 图像生成 / 语音 / 存储与托管</div>
  <button class="btn btn--ghost"><svg …#i-filter/> 更多筛选</button>
  <label class="sort"><span class="caps">排序</span>
    <select><option>到期最近优先</option><option>最近新增</option><option>上手最容易</option><option>额度最大</option></select>
  </label>
</div>

<!-- 分区 -->
<section class="section">
  <div class="section__head">
    <span class="section__marker" aria-hidden="true"></span>
    <h2>7 天内到期</h2><span class="count num">3</span>
    <p class="section__hint">按剩余天数升序</p>
  </div>
  <div class="card-grid"><!-- PromoCard × N --></div>
</section>
```

**PromoCard 参考标记**（含披露标记与难度徽章）
```html
<!-- 字段全部按 DailyItem 绑定（§13.0）。data-* 用 DailyItem 路径，不用 promo.schema.json 的嵌套别名 -->
<article class="card"
         data-promo-id="zhipu-glm-free-tier-10m-tokens-monthly"
         data-difficulty="medium"
         data-verification="verified"
         data-affiliate="true">

  <div class="card__top">
    <svg class="vendor-logo" width="20" height="20"><use href="#fct-logo-zhipu"/></svg>
    <h3 class="card__vendor">智谱 GLM</h3>          <!-- provider.name，上游已解析好，前端不判断 country -->
    <span class="pill pill--ok"><svg …#i-shield-check/> 已核验</span>
    <span class="pill pill--warn"><svg …#i-clock/> 剩 3 天</span>   <!-- days_to_expiry = 3 -->
  </div>

  <h4 class="card__title">GLM-4.6 每月 1000 万 tokens 免费额度</h4>   <!-- headline -->
  <!-- amount.unit = tokens_per_month，格式见 §13.8：主数字 24px mono，后缀 13px muted -->
  <p class="card__amount" title="官网原文：10,000,000 tokens / month">
    <span class="num card__amount-value">10M</span><span class="card__amount-unit"> tokens/月</span>
  </p>

  <!-- terms[] 是对象数组。severity=blocker 染色，friction/note 中性 -->
  <div class="card__terms">
    <span class="tag"><svg …#i-credit-card-off/> 免信用卡</span>          <!-- no_credit_card / note -->
    <span class="tag"><svg …#i-tag/> 限新用户</span>                        <!-- new_users_only / friction -->
    <span class="tag"><svg …#i-shield-check/> 需实名</span>                <!-- identity_verification / friction -->
    <span class="tag tag--blocker"><svg …#i-alert-triangle/> 限区域</span> <!-- region_locked / blocker -->
  </div>

  <div class="card__meta">
    <span class="badge badge--difficulty badge--difficulty-medium" role="img" aria-label="上手难度：中">
      <svg class="diff-meter" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">…</svg>
      <span aria-hidden="true">上手难度 · 中</span>
    </span>
    <!-- region_summary 是上游渲染好的字符串，直接输出 -->
    <span class="meta-item"><svg …#i-globe/> 仅中国大陆</span>
  </div>

  <!-- next_step 是单条字符串，不是步骤数组（§5.4） -->
  <p class="card__next">
    <svg …#i-book-open/>
    <span class="card__next-label">下一步：</span>注册后在控制台创建 API Key
  </p>

  <div class="card__actions">
    <!-- disclosure.affiliate === true 才走这一支：
         href 用 claim_url（上游已选好联盟链接），rel=sponsored noopener，显示「广告」+「已核实」 -->
    <a class="btn btn--primary" href="{claim_url}" target="_blank" rel="sponsored noopener">
      <svg …#i-external-link/> 去官方页
      <span class="affiliate-mark" title="{disclosure.disclosure_text}">
        <svg …#i-coin-stack/> 已核实
      </span>
    </a>
  </div>
</article>
```

**`disclosure.affiliate === false` 时的对照（D 类官方直链）** —— 这是最容易写错的一支：

```html
<!-- 无 ad-label、无 affiliate-mark、无 sponsored —— MVP 不挂任何联盟链接（详见 §7） -->
<a class="btn btn--primary" href="{claim_url}" target="_blank" rel="noopener">
  <svg …#i-external-link/> 去官方页
</a>
```

> 两张卡的差异**完全是数据驱动的**：前端只有一份模板，用 `disclosure.affiliate` 三元分支控制 `href`、`rel` 与两个标记的存在性。不要写两套模板，也不要用 CSS 隐藏。

> **注意**：上方的数字与厂商名是**版式验证样例**，用于确认排版与截断行为。上线时必须绑定 `catalog.json`；**禁止**保留任何无来源的营销数字。

**响应式**
| 断点 | 行为 |
|---|---|
| <640 | 单列；披露条 44px 且文案截断 + 「详情」；stat 2×2；工具栏横向滚动（chip 不换行）；CTA 全宽 44px 高；筛选 popover 改底部 ActionSheet |
| 640–1023 | 双列；stat 4×1；工具栏换行 |
| ≥1024 | 三列；完整布局；hover 生效 |

**5 态**：见 §5.5。骨架屏、空态、错误态、正常态、边界态必须全部实现并可用假数据切换验证。

---

### 10.2 页面：分享卡片（OG 图）

**产物**：`/og/YYYY-MM-DD.png`，1200×630，PNG，<1MB
**实现**：纯前端 Canvas 绘制（零依赖），或构建期生成静态 PNG（推荐，避免运行时开销）

**绘制顺序**
1. 填充 `--bg` `#F5F6F8`
2. 画极淡网格线（1px，`--border`，8% alpha，间距 60px）
3. 顶部安全区内：字标（32px/600，caps 0.08em）左对齐；日期（28px mono）右对齐
4. 字标下方 24px：2px accent 规则线，宽 96px
5. 中部：三个统计数字（72–88px mono tabular-nums，600，`-0.015em`），水平三等分；每个数字下方 16px 处标签（28px/500 `--muted`）
6. 分隔线（`--border-soft`，1px，距数字底 48px）
7. 厂商证据行（32px/500 `--fg-2`，最多 4 个，超出加「等 N 家」）
8. 底部左：域名水印（24px `--meta`）；底部右：披露小字（22px `--disclosure-fg`）
9. 导出后**必须**缩到 200px 宽验证数字可读

**必须同步的 meta**：见 §8.5。`og:image:alt` 必须描述图像传达的信息（不是堆关键词）。

---

### 10.3 页面：MCP / Skill 安装入口（页脚区块，非独立页）

- 位置：页脚上方独立区块，标题「把这个清单接进你的 Agent」
- 内容：两个 `<pre>` 代码块（MCP 配置 JSON / Skill 安装命令），各带 `copy` 按钮
- 图标：`code`（MCP）、`terminal`（Skill CLI）
- 文案：「安装 MCP server 后，你的 Agent 可以直接查询今日额度清单，无需打开网页。」
- **不设独立落地页、不做 Hero、不做注册表单** —— 用户已在主页面，这里是顺手的下游动作

---

## 11. 无障碍与质量自检清单

**合规（强制性，一票否决）**
- [ ] 项目透明度声明四处处一致：L1 站点条 / 卡片底部可信度三件套 / 分享卡片 / 复制文案（§7）
- [ ] `disclosure.affiliate === false` 的条目：**无**返佣标记、**无** `rel="sponsored"`；href 与 true 一样走 `claim_url`（上游此时给的是官方直链）
- [ ] `disclosure.affiliate === true` 的条目：渲染「广告」+「已核实」，披露文案取 `disclosure.disclosure_text`（非硬编码）
- [ ] 「广告」标识对比度 ≥4.5:1（实测 7.53 / 7.68 / 8.30:1，见 §7.5.1）

**数据契约（绑错层会整体返工，先查这一组）**
- [ ] 前端绑定的是 **`DailyItem`（`GET /api/v1/daily`）**，**不是** `promo.schema.json` 的嵌套路径（§13.0）
- [ ] 卡片 11 项全部有数据；**没有**凭空出现的「核验时间」「摘要行」「类型标记」（§5.1）
- [ ] 到期渲染的是 `days_to_expiry` 整数天，前端**不做日期运算**（§5.3）
- [ ] 区域渲染的是 `region_summary` 字符串，前端**不拼装**国家码（§13.3）
- [ ] 下一步是 `next_step` 单条字符串，**没有**渲染成编号步骤列表（§5.4）
- [ ] 卡片主数字按 `amount.unit` 九选一格式渲染，金额类不缩写、`percent_off` 不缩写（§13.8）
- [ ] stat card 无「较昨日 +N」之类 payload 里不存在的同比数字（§4.1）
- [ ] 筛选只基于 `DailyItem` 现有字段；**没有**区域/类别/模型的伪筛选（§4.2）

**无障碍（优先级 1）**
- [ ] 正文对比度 ≥4.5:1（已实测，见 §2.3）
- [ ] 所有图标按钮有 `aria-label`；装饰性图标 `aria-hidden="true"`
- [ ] 键盘可达：Tab 顺序 = 视觉顺序；Esc 关闭 popover 并归还焦点
- [ ] `:focus-visible` 全局可见，无 `outline: none` 裸用
- [ ] 难度徽章：形状 + 文字 + 颜色三重编码（§6）
- [ ] 到期状态：颜色 + 文字双编码
- [ ] 筛选结果变化 `aria-live="polite"` 播报
- [ ] 支持 `prefers-reduced-motion` 与 `prefers-contrast: more`

**触摸与交互（优先级 2）**
- [ ] 移动端点击区 ≥44×44px
- [ ] 相邻可点元素间距 ≥8px
- [ ] hover 效果在触屏上有等价的 active/focus 表现（不依赖 hover 唯一表意）

**性能（优先级 3）**
- [ ] 零外部请求（字体/图标/框架全部内联）
- [ ] 骨架屏占位避免 CLS；卡片固定 `min-height`
- [ ] OG 图 <1MB；页面 HTML 内联 critical CSS

**反模式自查（优先级 4）**
- [ ] 无 emoji 作图标（正则 `[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]` 扫描应为 0）
- [ ] 无紫→粉渐变
- [ ] 无彩色侧条纹、无 `background-clip: text` 渐变文字
- [ ] 无「1px 边框 + blur≥16px 阴影」的幽灵卡片
- [ ] 卡片圆角 ≤10px
- [ ] 无「每节小型大写追踪标签」「01 · 关于」这类 AI 脚手架
- [ ] 无重复结构的入场动画（不同内容用不同揭示方式或干脆不用）
- [ ] 背景非奶油/米色暖中性

---

## 12. 落盘文件

| 路径 | 说明 |
|---|---|
| `docs/UIUX.md` | 本文档：设计方向 + 系统 + 组件 + 图标 + 页面提示词 |
| `design/design-tokens.json` | 机器可读 Token（前端 `import` 引用） |
| `design/design-tokens.css` | CSS 变量（A1/A2/B-slot/C-extension 四层 + 基础重置 + 深色预留） |

**给前端的一句话**：先 `import` `design-tokens.css`，再照 §10 的标记搭；任何颜色/间距/圆角/时长拿不准，回查 token，**不要自己写数值**。

**字段命名的唯一准绳**：以 `schemas/promo.schema.json` 为准。本节下表仅作设计文档的阅读辅助，**前端按 Schema 绑定，不要按本文档的字段名绑定**。

---

## 13. 设计字段 → 数据契约映射表

### 13.0 两层契约 —— 前端绑哪一层（先看这一节）

同一份策展库的**两种投影**。`promo.schema.json` 是唯一权威结构，两条下游各自取用：

```
                    schemas/promo.schema.json  （唯一权威，全量字段）
                              │
              ┌───────────────┴───────────────┐
              │                               │
   build-catalog.ts                    MCP / HTTP 端点
              │                               │
   build/catalog.json                  openapi.yaml 的 DailyItem
              │                               │
      build-site.ts                     （精简，12 字段）
              │                               │
   site/index.html                      给 AI Agent 消费
   site/daily/<date>.html
      （构建期生成，零运行时请求）
        ↑
   本文档设计的就是这一支
```

| 投影 | 产物 | 服务对象 | 字段范围 |
|---|---|---|---|
| **页面投影** | `build/catalog.json` → `site/*.html` | 人（浏览器） | **`promo.schema.json` 全量** |
| **Agent 投影** | `GET /api/v1/daily` → `DailyItem` | AI Agent（上下文预算受限） | 精简 12 字段 |

**本文档（每日清单页 + 分享卡）绑定的是页面投影，即 `promo.schema.json` 全量字段。**

依据（`docs/ARCHITECTURE.md` 原文）：
- `scripts/build-site.ts` — 从 `build/catalog.json` 生成 `site/index.html` 与 `site/daily/<YYYY-MM-DD>.html`
- `scripts/build-catalog.ts` — `data/` → `build/catalog.json`
- `scripts/validate.ts` — ajv 校验 `data/` 与 `build/catalog.json`
- §9.1「`site/` 下全是纯 HTML/CSS/JS，运行时**零外部依赖**……不发任何网络请求」

也就是说：页面是**构建期**生成，数据源是编译后的 catalog（遵循 `promo.schema.json` 全量字段），**根本不走 HTTP API**。`DailyItem` 那 12 个字段约束的是 MCP / HTTP 端点的返回值，服务对象是**被上下文预算卡着的 AI Agent**，与页面无关。

> **裁定记录**：本轮初稿曾误判「页面只能拿到 `DailyItem` 12 个字段」，据此砍掉了核验时间、多步引导、区域三态三项。team-lead 依据上列架构原文裁定为误判，三项已全部恢复（见 §5.1 / §5.3 / §5.4）。`DailyItem` 的精简是 Agent 侧的取舍，不是页面的限制。

**两种投影的一致性**由 `build-catalog.ts` 与 `build-site.ts` 保证，不在本文档职责内。

### 13.1 核心 12 项（页面绑定 `promo.schema.json` 全量路径）

| # | 设计用名 | **页面绑定路径（`promo.schema.json`）** | 类型 | 渲染要点 |
|---|---|---|---|---|
| 1 | 厂商名 | `provider.name_zh` / `provider.name_en` | string / string\|null | **渲染规则已由 Schema 写死**：`provider.country === 'CN'` 且 `name_zh !== null` → 中文，否则 `name_en` |
| 2 | 优惠标题 | `offer.headline` | string | 16/600，必须含具体数字 |
| 3 | 额度 | `offer.amount` | object | 渲染格式按 `amount.unit` 九选一，**见 §13.8** |
| 4 | 条款 | `terms[]` | object[] | `{tag, severity, note, source_url}`。见 §13.2 |
| 5 | 难度 | `difficulty` | enum `easy\|medium\|hard` | 见 §6。`difficulty_reasons[]` 作 tooltip |
| 6 | 区域 | `region.{availability,countries[],notes}` | object | **三态对象**。见 §13.3 |
| 7 | 到期 | `offer.expires_at` + `offer.no_fixed_expiry` | ISO8601 \| null | 两者互斥。见 §13.4 |
| 8 | 核验状态 | `verification.status` | enum(4) | 见 §13.5 |
| 9 | 核验时间 | `verification.last_verified_at` | ISO8601 \| null | **PM 核心差异化，所有展示面强制显示**。见 §13.5 |
| 10 | 是否返佣 | `disclosure.affiliate` | boolean | 严格按此值渲染，见 §7.1.1（总监口径里的 `is_affiliate` 即此字段） |
| 11 | 下一步 | `actionability.next_steps[]` | string[] (1–5) | **数组**。见 §5.4 |
| 12 | 领取入口 | `offer.claim_url` / `disclosure.affiliate_url` | uri | `affiliate=true` 用后者 + `rel="sponsored noopener"`；否则用前者 |

> 附：`disclosure.disclosure_text`（`affiliate===true` 时必填）是卡片级披露文案的来源，见 §7.1.1。
>
> **页面拿得到但 `DailyItem` 拿不到的字段**（这些正是本轮误判中被错砍的）：`verification.last_verified_at`、`actionability.next_steps[]`（数组）、`region` 对象、`offer.claim_steps[]`、`categories[]`、`models[]`、`offer.type`、`offer.estimated_setup_minutes`、`difficulty_reasons[]`、`verification.confidence` / `.method` / `.verified_by`、`provenance.*`、`provider.homepage`、`provider.logo_asset`。完整清单见 §13.6。

### 13.2 `terms[]` —— 对象结构 + 受控词表 + 严重度

`term_tag` 是 **22 项受控枚举**，禁止就地发明。本文档 §5.2 的中文标签与图标映射如下：

> **页面层 `Term` 只有 `{tag, severity, note}` 三个字段** —— 上游 `promo.schema.json` 的 `term.source_url` 没有暴露给 `DailyItem`，因此 v1 **不渲染条款出处链接**。`note` 本身就是「这条条款对用户意味着什么」的人话，作为 chip 的 `title` 属性即可。

| `tag` | 中文标签 | 图标 | `severity` 典型值 |
|---|---|---|---|
| `no_credit_card` | 免信用卡 | `credit-card-off` | note |
| `credit_card_required` | 需信用卡 | `credit-card` | friction |
| `deposit_required` | 需充值 | `credit-card` | friction |
| `phone_verification` | 需手机号验证 | `key` | friction |
| `identity_verification` | 需实名 | `shield-check` | friction |
| `new_users_only` | 限新用户 | `tag` | friction |
| `one_per_account` | 每账号一次 | `tag` | note |
| `edu_email_required` | 教育邮箱专属 | `tag` | blocker |
| `business_email_required` | 企业邮箱专属 | `building` | blocker |
| `oss_project_required` | 开源项目专属 | `code` | blocker |
| `manual_application` | 需人工申请 | `book-open` | blocker |
| `waitlist_approval` | 需排队审批 | `clock` | blocker |
| `quota_capped` | 额度封顶 | `percent` | note |
| `rate_limited` | 限速 | `zap` | note |
| `time_limited` | 限时 | `clock` | note |
| `region_locked` | 限区域 | `globe` | friction |
| `vpn_required` | 需 VPN | `globe` | blocker |
| `byok_required` | 需自备 Key | `key` | friction |
| `auto_renew` | 自动续费 | `refresh` | friction |
| `non_commercial_only` | 仅限非商用 | `tag` | note |
| `data_used_for_training` | 数据用于训练 | `alert-triangle` | note |
| `stackable` | 可叠加 | `check-circle` | note |
| `deprecated_service` | 服务已弃用 | `x-circle` | blocker |

**严重度的视觉权重**：
- `blocker` → 标签用 `--danger` 系（底 `--tint-danger`，文字 `--danger`），前置 `alert-triangle`
- `friction` → 标签用默认中性（`--term-tag-bg` / `--term-tag-fg`）
- `note` → 标签用默认中性，且**默认折叠**进「+N 条说明」

> 这修正了本文档初版 §5.2 把 terms 当字符串数组的设计。Severity 提供了比"统一中性"更好的扫读梯度 —— blocker 是"不满足就完全拿不到"，必须在扫读时就能看见。

### 13.3 区域 —— 页面层是字符串，不是对象

**页面绑定的是 `region_summary`（string）**，上游已把区域对象渲染成一句话。前端直接显示，**不做任何拼装或判断**。

上游 `promo.schema.json` 的 `region` 对象 → `region_summary` 字符串的对应关系（**这是上游规则，不是前端逻辑**，列出供校对与文案一致性检查）：

| `availability` | `countries` | 期望的 `region_summary` 文案 | 图标 |
|---|---|---|---|
| `global` | 必须空数组 | 「全球可用」 | `globe` |
| `include` | ≥1 个 ISO 3166-1 alpha-2 | 「仅 CN、US」 | `globe` |
| `exclude` | ≥1 个 | 「除 US 外可用」 | `globe` |

- 卡片上：`globe` 16px + `region_summary` 原文 + 12px `--muted`
- 文案过长时 `text-overflow: ellipsis` + `title` 属性挂完整串
- 上游 `region.notes`（如「需境外手机号」）**未暴露到页面层**；若上游把它并入 `region_summary` 文案，前端照显即可

> **注意：区域筛选在 v1 无法可靠实现**。页面层拿不到结构化的 `region` 对象，只有 `region_summary` 字符串和 `provider.country`。用字符串子串匹配判断区域会误判（「除 US 外可用」含 "US" 但美国不可用）。
> **处理**：§4.2 的第 2 组筛选器改绑 `provider.country`，标签由「区域」改为**「厂商国别」**并如实标注含义；真正的「可用区域」筛选需上游在 `DailyItem` 补 `region_codes[]` 后再启用。

### 13.4 到期 —— 页面层是 `days_to_expiry` 整数天

上游 `promo.schema.json` 用 `offer.expires_at` + `offer.no_fixed_expiry`（**两者互斥**：`no_fixed_expiry=true` 时 `expires_at` 必须为 null）存储；到页面层已经折算成**一个整数**：

| 上游组合 | → `days_to_expiry` | 页面渲染 |
|---|---|---|
| `expires_at` 有值 | 距今天的整数天（已过期为负） | 按 §5.3 六档文案 |
| `no_fixed_expiry: true` | `null` | 「长期有效」 |

- 前端**不做日期运算、不解析 ISO 字符串**：上游给的就是天数
- 排序：`days_to_expiry` 升序，`null` 沉底（§4.2 排序第 1 项）
- 上游没有「到期日未公布」这一态，页面层 `null` 统一表示常驻额度。初版写的「到期日未公布」分支已删除

### 13.5 `verification_status` —— 页面层扁平枚举，四态

**页面绑定 `verification_status`（string），不是 `verification.status` 对象。**

| `verification_status` | 渲染文案 | 图标 | 颜色 |
|---|---|---|---|
| `verified` | 「已核验」 | `shield-check` | `--success` |
| `reported` | 「社区上报 · 待核验」 | `alert-triangle` | `--warn` |
| `stale` | 「信息可能已过期」 | `clock` | `--warn` |
| `unverified` | 「未核验」 | `alert-triangle` | `--meta` |

> **文案里的相对时间已全部删除**：页面层没有 `verification.last_verified_at`，渲染不出「N 小时前」。初版的「已核验 · N 小时前」和「核验已过期 30+ 天」都在凭空造时间。卡片级新鲜度改由页面级 `daily.generated_at` 承担（§4.1 卡 1）。
> `verification.confidence` 同样未暴露，v1 不做置信度 tooltip。

- 上游 `provenance.review_required === true` 的条目，`verification.status` **在上游就被强制降级为 `reported`** —— 这是数据侧自带的降级机制，页面直接渲染 `reported` 即可。**不要**靠把 `disclosure.affiliate` 改成 `true` 来表达"不确定"（见 §7.1.1）
- stat card「已核验」计数：客户端统计 `verification_status === 'verified'` 的条目数（§4.1 卡 4）

### 13.6 其余可用字段（设计侧已预留位置）

| Schema 字段 | 本文档位置 |
|---|---|
**页面层（`DailyItem`）其余字段**

| 字段 | 设计侧位置 |
|---|---|
| `id` | 卡片 `data-promo-id`，用于锚点与去重 |
| `provider.id` | logo symbol 匹配键：`fct-logo-{provider.id}`，见 §13.7 |
| `provider.country` | §4.2 筛选第 4 组「厂商国别」 |
| `disclosure.disclosure_text` | 卡片级披露文案来源，见 §7.1.1 |
| `disclosure.affiliate_url` | **前端不直接用** —— `claim_url` 已由上游按 `affiliate` 选好。此字段仅供核对 |

**上游专属字段（`promo.schema.json` 有，`DailyItem` 没有 —— v1 不得设计依赖）**

| 上游字段 | 对页面的实际影响 | 若要用需向架构师申请 |
|---|---|---|
| `offer.type`（9 种） | 未暴露 → **卡片不渲染 promo 类型标记** | `DailyItem.type` |
| `categories[]`（9 类） | 未暴露 → 类别筛选已移除（§4.2） | `DailyItem.categories[]` |
| `models[]` | 未暴露 → 搜索占位文案已去掉「模型」（§4.2） | `DailyItem.models[]` |
| `offer.claim_steps[]` / `actionability.next_steps[]` | 页面层只有 `next_step` 单条 → §5.4 已改为单行展示 | `DailyItem.next_steps[]` |
| `offer.estimated_setup_minutes` | 未暴露 → 难度徽章 tooltip 不显示预估时长 | `DailyItem.estimated_setup_minutes` |
| `difficulty_reasons[]` | 未暴露 → 难度 tooltip 只有 §6.5 判定口径文案 | `DailyItem.difficulty_reasons[]` |
| `verification.confidence` / `.method` / `.verified_by` / `.last_verified_at` | 页面层只有 `verification_status` 一个枚举（§13.5） | `DailyItem.verification{}` |
| `provenance.*`（含 `curation_review` 人工复核结论） | 未暴露 → 卡片不显示来源与复核结论 | `DailyItem.provenance{}` |
| `region` 对象 / `region.notes` | 页面层只有 `region_summary` 字符串（§13.3） | `DailyItem.region_codes[]` |
| `provider.homepage` | **未暴露** → 厂商名**不做成链接**（页面层无 URL 可跳），只显示文字 | `DailyItem.provider.homepage` |
| `provider.logo_asset` | 未暴露 → logo 改用 `provider.id` 拼 symbol，见 §13.7 | — |
| `status`（生命周期 6 态） | 未暴露；已过期由 `days_to_expiry` 负值或分区归属表达（§5.3） | — |
| `actionability.score` / `.blockers[]` | 未暴露；blocker 标签改由 `terms[].severity` 驱动（§13.2） | — |
| `tags[]` | 未暴露；本就不渲染，仅上游搜索用 | — |
| `created_at` / `updated_at` / `deleted_at` | 内部字段。`deleted_at` 非 null 即软删除，**上游输出前必须过滤**，页面不处理墓碑数据 | — |

### 13.7 图标系统与 provider logo 的约定

- 本文档 §9 的功能图标：`<symbol id="i-xxx">`，24 网格 / 1.5px 描边 / `stroke="currentColor"`
- 厂商 logo：**`fct-logo-{provider.id}`**，24 网格。因为 `DailyItem` 不返回 `provider.logo_asset`（那是上游字段），页面只能拿 `provider.id` 去拼 symbol id —— 拼不到就走下面的兜底
- 两套 symbol 用**不同前缀**（`i-` vs `fct-logo-`）避免冲突；logo 通常为填充图形（`fill` 而非 `stroke`），不套用 1.5px 描边规则
- **兜底**：symbol 不存在时，卡片头部只显示厂商名文字，**不渲染占位灰块**（灰块在高密度列表里是纯噪音）

### 13.8 `amount.unit` 九选一渲染格式（卡片主数字）

`amount` 是 `{value, currency, unit, raw_text}`，**`unit` 决定怎么渲染**。这是卡片上唯一的「数字」，也是扫读的第一落点，格式必须锁死。

**数字缩写规则**（等宽对齐友好，AI 工具页面通用）

| 量级 | 格式 | 例 |
|---|---|---|
| `< 1 000` | 原样 | `500` |
| `1 000 – 999 999` | `N.NK`，去掉尾随零 | `1 500 → 1.5K`，`500 000 → 500K` |
| `≥ 1 000 000` | `N.NM` | `1 000 000 → 1M`，`10 500 000 → 10.5M` |
| `≥ 1 000 000 000` | `N.NB` | `2 000 000 000 → 2B` |

金额类（`usd_credit` / `cny_credit`）**不缩写**，用千分位。整数不补小数（`10M` 不是 `10.0M`）。

**九种 `unit` → 渲染格式**

| `unit` | `value` 含义 | `currency` | 中文渲染 | 英文渲染 | 示例 |
|---|---|---|---|---|---|
| `usd_credit` | 美元额度 | 必填 `USD` | `$` + 千分位 | 同左 | `5` → 「$5」 |
| `cny_credit` | 人民币额度 | 必填 `CNY` | `¥` + 千分位 | 同左 | `100` → 「¥100」 |
| `tokens` | 一次性 token 总量 | null | 缩写 + ` tokens` | 同左 | `1 000 000` → 「1M tokens」 |
| `tokens_per_month` | 每月 token | null | 缩写 + ` tokens/月` | ` tokens/mo` | `10 000 000` → 「10M tokens/月」 |
| `requests_per_month` | 每月请求数 | null | 缩写 + ` 次/月` | ` req/mo` | `500 000` → 「500K 次/月」 |
| `seats` | 席位 | null | `{n} 席位` | `{n} seats` | `3` → 「3 席位」 |
| `percent_off` | 折扣百分比（0–100） | null | `{n}% off` | `{n}% off` | `50` → 「50% off」 |
| `days` | 天数 | null | `{n} 天` | `{n} days` | `30` → 「30 天」 |
| `other` | 固定 `0` | null | **直接渲染 `raw_text`** | 同左 | `0` → 「官网原文表述」 |

**排版**

```
10M tokens/月
^^^ 24px mono tabular-nums，weight 590，--fg
    ^^^^^^^^^ 13px --muted，weight 400
```
- 主数字 `--text-2xl`(24px) mono + `tabular-nums` + 590 字重 + `--fg`
- 单位后缀 `--text-sm`(13px) + `--muted` + 400 字重 —— **不与主数字同色同重**，形成层次
- `raw_text` 挂 `title` 属性（官网原文，争议追溯用）；`unit === 'other'` 时它是唯一渲染内容
- `currency` 为 null 时**不显示任何货币符号**，不要猜默认值

> **注意 `percent_off` 不缩写**：50 就是 50，不能走 K/M 规则变成别的值。
