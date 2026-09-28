# Free & Cheap Tokens — 产品需求文档（PRD v1.0）

| 项 | 内容 |
|---|---|
| 产品名 | Free & Cheap Tokens |
| 文档版本 | v1.0 |
| 作者 | 许清楚（产品经理） |
| 状态 | 待架构师 / 设计师签收 |
| 调研日期 | 2026-09-28 |
| 目标上线形态 | MCP server（Apify Standby + Streamable HTTP） + 同名 Skill + 零依赖静态「每日清单页」 |

---

## 0. 一句话定义

一个**机器可读的 AI 免费额度与低价 token 促销（下称 promo）结构化数据源**，通过 MCP server 供 AI Agent 消费，通过 Skill 与每日清单页供非技术用户消费，并用**强制披露的联盟/返佣链接**驱动自传播。

---

## 1. 问题陈述

### 1.1 谁，在什么场景下，遇到什么痛点

**场景 A：非技术用户想用 AI 但不想花钱**
上海的一位自由职业者，看过别人用 AI 写周报、做翻译、整理表格，自己也想用。搜索「免费 AI API 额度」，跳出来 20 篇公众号文章和 3 个 GitHub 仓库，每篇说的数字都不一样：有人说硅基流动送 2000 万 Token，有人说送 14 元代金券，有人说「9B 以下永久免费」，还有一篇说「对话类小模型免费已取消」。他不知道该信谁，也不知道哪个在自己所在的地区能用、要不要绑信用卡、要不要实名。

**场景 B：一位 AI Agent 被用户问「有没有免费的模型可以用」**
Agent 只能凭训练数据回答。训练数据里 Groq 有 14,400 请求/天的免费额度（实际 2026 年已降到多数模型 1,000 RPD），GitHub Models 还在（实际已于 2026-07-30 关停，返回 HTTP 410），Cerebras 免信用卡（实际已改为需绑卡领 $5 试用金）。Agent 给出的建议是错的，用户照做后会撞到 429 或 404。

**场景 C：独立开发者想持续薅羊毛**
他注册了 8 个平台，每个都有额度、有效期、限速。百炼 90 天、千帆 3 个月、腾讯 1 年、火山每天刷新。没有任何工具提醒他哪一笔快过期。他发现的时候额度已经清零了——「平台不会主动提醒你」。

### 1.2 现在怎么解决，为什么不行

| 现有做法 | 为什么不行 |
|---|---|
| 搜公众号 / 知乎 / 掘金 / Reddit 的薅羊毛文章 | 无结构化、无时间戳、无来源链接；发布即开始腐烂，半年后仍在搜索结果第一位 |
| 看 GitHub awesome 列表 | Markdown README，人读的，不是机器读的；fork 满天飞（santyzenith 的 fork 落后上游 145 个 commit）；无上手难度、无区域、无到期追踪 |
| 问 ChatGPT / Perplexity | 模型训练数据滞后于厂商政策变更；无 provenance（无法回答「你这条是哪天核实的」） |
| 用 LLM 定价对比站（BenchLM、promptibus） | 它们做的是**价格**，不是**促销/免费额度**。价格是长期的，促销是有时效、有门槛、有条款的，数据模型完全不同 |

### 1.3 痛点根因（我们要解决的那一个）

不是「信息不够多」，而是 **promo 这条信息天生带着五个人们没法用现有工具表达的维度**：

1. **条款**（免信用卡？限速多少？限哪些模型？数据会不会被拿去训练？能不能商用？）
2. **上手难度**（注册到跑通第一个请求要几步？要不要实名？要不要等审核？）
3. **区域**（中国大陆直连还是要代理？EU/UK/CH 是否排除？）
4. **时效**（什么时候到期？是固定日期还是滚动窗口？）
5. **可行动性**（具体怎么把它吃下来？）

现有的所有竞品最多覆盖其中 1-2 个维度，而且**没有一个把这些维度做成机器可读的字段**。

---

## 2. 目标用户

### 画像 1（主）：非技术订阅者 —— 「想白嫖但不会装」

| 维度 | 描述 |
|---|---|
| 身份 | 自由职业者、内容创作者、小微企业主、AI 好奇者 |
| 技术能力 | very basic technical skills（用户原话）。能复制粘贴，能点链接，不能配环境变量，不知道 base_url 是什么 |
| 所在地 | 中国上海（首期重点），兼有海外华人 |
| 场景 | 每天早上打开每日清单页 / 收一封简报，看今天有什么能薅的；看到 easy 的就自己动手，看到 hard 的让 Agent 代做 |
| 痛点 | 看不懂术语（RPM / TPM / Neurons / 上下文窗口）；不知道「2000 万 Token」对自己意味着什么；被实名认证和绑卡劝退；不知道哪条过期了 |
| **不做会怎样** | 继续为本来可以免费的能力付费，或者干脆不用 AI，被会用的人拉开效率差 |
| 成功定义 | 从「看到一条 promo」到「跑通第一个请求」≤ 15 分钟，且中途不需要查任何外部资料 |
| 我们必须做的事 | difficulty 分级是**硬需求**，不是装饰。hard 项必须给「让 Agent 帮你做」的降级路径，并且这条路径要是人能照着操作的（一句话复制到对话框里） |

### 画像 2（次）：独立开发者 / 羊毛党 —— 「要全、要新鲜、要能批量」

| 维度 | 描述 |
|---|---|
| 身份 | indie hacker、独立开发者、学生、AI 应用副业者 |
| 技术能力 | 熟练。会写脚本，会接 API，有多个平台的 Key |
| 场景 | 每周扫一遍有没有新羊毛；批量注册；把免费额度当主力，付费当兜底；需要知道哪笔快过期 |
| 痛点 | 手动挨家挨户查太慢；限速比额度更容易卡住（免费档普遍 20 RPM / 并发 2，写个循环就撞 429）；额度过期没人提醒；实名这道关绕不开，同一身份只能领一次 |
| **不做会怎样** | 每月多花几百到几千元 API 费用；或者花大量时间手动维护一张会腐烂的表格 |
| 成功定义 | 一次查询拿到可按「难度 / 区域 / 是否需实名 / 到期日 / 限速」过滤的结构化结果；能订阅到期告警 |
| 我们必须做的事 | 提供可过滤的结构化字段、可导出的 JSON、RSS/ICS；提供「防扣费清单」类的 gotchas 字段 |

### 画像 3（三级）：AI Agent —— 「机器消费方」

| 维度 | 描述 |
|---|---|
| 身份 | Claude / GPT / 各类 MCP 客户端里的 Agent；也包括通过 Skill 调用的系统 |
| 「技术能力」 | 不关心 UI，只关心 **工具返回值是否自解释、是否带 provenance、是否会污染上下文** |
| 场景 | 用户问「帮我找免信用卡、国内能直连、免费额度够跑一个月的模型」；Agent 调 MCP 工具，拿到 N 条结构化结果，自己筛选、排序、复述给用户 |
| 痛点 | 现有信息源给 Agent 的是一大段 Markdown，Agent 要么全部塞进上下文（MCP 工具 schema 本身已吃掉 4 万+ token），要么只能凭记忆猜；拿到的信息没有「核实日期」，Agent 无法判断可信度 |
| **不做会怎样** | Agent 继续给出过期的、错的免费额度建议，用户踩坑后不再信任 |
| 成功定义 | 一次工具调用返回 ≤ 10 条默认结果、每条自带 `last_verified_at` 与 `confidence`、字段命名自解释、无需额外说明文档 |
| 我们必须做的事 | **返回值要精简**（默认不给全字段，给 `detail_level` 参数）；**必须带 provenance**；`agent_pitch` 字段让 Agent 可以直接复述推荐话术 |

### 画像 4（传播侧）：推荐者 —— 「安利给别人的人」

| 维度 | 描述 |
|---|---|
| 身份 | 上面三类用户中愿意分享的那一批；技术博主、社群主理人 |
| 场景 | 把某条 promo 或整个服务分享到群里 / 社交媒体 |
| 痛点 | 分享一个链接过去，对方看不懂；想安利但组织不好语言；自己薅完了没有动力继续推荐 |
| **不做会怎样** | 我们失去唯一的低成本增长通道 |
| 成功定义 | 分享出去的一张卡片，对方打开 10 秒内看懂「这是什么、我能拿到什么、我要做什么」 |
| 我们必须做的事 | 分享卡片 + 一行安装命令 + Agent 可复述话术（详见 6.3 自传播机制） |

---

## 3. 竞品分析

> 调研方法：联网检索中英文一手来源（GitHub 仓库、厂商官方文档、服务商站点）+ 二手评测/对比文章。每条竞品的「缺口」来源于**其自身描述的方法论边界、其自身承认的局限、或第三方评测指出的失效**，不臆造。

### 3.1 直接竞品（AI 免费额度聚合）

| # | 竞品 | 一句话定位 | 做法 | 优势 | **缺口 / 差评（我们的机会）** |
|---|---|---|---|---|---|
| C1 | **cheahjs/free-llm-api-resources**（GitHub，29.3k stars，3.1k forks） | 社区维护的免费 LLM 推理 API 列表，README 由脚本自动生成 | GitHub Action 每 24 小时 ping 各端点，健康徽章红/绿 | 覆盖率最高的单一事实源之一；速率限制、是否需手机验证、数据是否用于训练都有标注；被做成 MCP server（见 C6） | (a) **只有 Markdown README，没有稳定 schema / 没有 API**——机器消费只能靠爬 HTML；(b) **fork 泛滥导致版本分叉**，第三方 fork 落后上游 145~329 个 commit，用户分不清哪个是准的；(c) **无上手难度分级**；(d) **无区域字段**（只有脚注里写「EU/UK/CH 不可用」）；(e) **无到期追踪**——它只区分 free tier 与 trial credits，不记录 trial 的有效期；(f) **无「怎么领」步骤** |
| C2 | **yangmao.ai（羊茅）** — 中英双语 AI 资源站 | 「87+ AI 厂商免费额度 / 391+ 实时 Deal / 185+ 对比页」，每天 cron 自动抓取 40+ 厂商 | Astro + Cloudflare Pages + D1 + Workers；Deal 评分来自公开的自动打分脚本（GitHub 可查）；区分「真羊毛 / 资讯 / 快到期告警」；提供邮件周报 + RSS + ICS 日历；标注上手难度（绿色圆形「Easy Guide」标记）与中国大陆可用性 | **最接近我们的竞品**。已有：每日刷新、到期告警、上手难度、区域可用性、中英双语、订阅分发 | (a) **没有 MCP server，没有公开 JSON/API**——Agent 无法消费，只能爬页面；(b) 明写「本站不接硬广，不为付费广告修改排序」——**主动放弃商业化**，这是我们做联盟变现的位置；(c) 单人独立开发者运营，深度对比与教程产能受限；(d) 上手难度只有「Easy」一档的标记，**没有 hard 项的降级路径**；(e) 条款是自然语言段落，不是结构化字段 |
| C3 | **rockbenben/free-llm-intel** | 中文，63 家 LLM 厂商免费 API 情报，「全部实时抓自官方页并附直达链接，附防扣费清单」 | 强调可复核性：「无法复核的旧说法一律不予采信」；明确标注哪些第三方说法不予采信（如「学生认证送 200 万 tokens」因官方页已下线而不采信） | **数据可信度方法论最扎实的竞品**；有「防扣费清单」意识（与我们 gotchas 字段同源）；指出「调用方不应把免费 model id 写死，需关注官方下线公告」 | (a) 仍是 **GitHub Markdown 仓库，无 API / 无 MCP**；(b) 无上手难度分级；(c) 无结构化区域字段；(d) 无机器可读的到期日（只有「有效期以券面为准」这类文字） |
| C4 | **KKWANG4444/awesome-free-llm-apis** | 带速率限制表格的免费 LLM API 列表 | 表格化 RPM/RPD/TPM/TPD；脚注标注区域限制（EU/UK/CH 不可用）、实名认证要求、Groq 2026 年限速下调、GitHub Models 退役 | 字段化程度比 C1 高；有变化历史脚注 | (a) 仍是 README；(b) 明确写「Trial credits and time-limited promos **don't count**」——**主动排除促销类条目**，正好是我们主做的那一类；(c) 无难度、无到期追踪 |
| C5 | **free-for.dev** | 通用开发者免费额度大全（CMS / 监控 / 代码质量 / AI 等几十个分类） | 分类目录式，AI 只是其中一个分类 | 覆盖面极广、品牌认知度高 | (a) **不是 AI 垂直**，AI 部分浅；(b) 人工 PR 维护，更新滞后；(c) 无难度 / 区域 / 到期 / 条款结构化 |
| C6 | **free-llm-api-resources MCP Server**（Python） | 把 C1 的列表包装成 MCP server | 工具化分类查询（free providers / trial credits） | 已经存在于 MCP 生态，验证了这个方向有人要 | (a) **只是把 Markdown 列表搬进 MCP**，字段仍是原始分类文本；(b) 无条款结构化、无难度、无区域、无到期；(c) 无 provenance 字段（Agent 不知道数据是哪天的） |
| C7 | **promptibus.com/mcp** | 「Model Intelligence for AI Agents」——80 个生成式模型的**定价** MCP | 7 个工具，匿名 25 calls/天，免费层 10 个模型；付费 $9.99 / $29.99 | 证明「模型信息类 MCP」可以做成生意；有成熟的分层定价 | (a) 做的是**定价（pricing）**，不是**促销/免费额度（promo）**——数据模型本质不同（价格长期稳定，promo 有时效、有门槛、有条款）；(b) 免费层限制严格；(c) 其自述「As of April 2026, no other MCP server provides model intelligence for generative AI」——印证模型信息类 MCP 尚属空白，但**promo 类是更空白的一层** |

### 3.2 间接替代方案

| # | 替代方案 | 一句话定位 | 缺口 |
|---|---|---|---|
| S1 | **带日期核实的评测博客**（klymentiev.com / toolfreebie.com / aicost.tools / benchlm.ai） | 「我们亲自测了 10 家，其中 4 家现在要绑卡了」 | 缺口暴露得最清楚：**toolfreebie 自承**「Lists that still recommend them — including ours before we retested — are out of date. This is the single biggest change in free AI APIs during 2026.」；**klymentiev** 记录 2026 年 6 月到 9 月间的剧变：Cerebras 免费层变 $5 需绑卡、GitHub Models 关停、Groq 从免费计划下架 Llama、Together 停发试用金、OpenRouter 免费模型阵容整体换血。→ **结论：这不是静态列表能解决的问题，必须是带 `last_verified_at` 的活数据源。benchlm 的方法论值得抄：「When a provider stops publishing a number... we do not fill it from a forum post or another tracker.」** |
| S2 | **AI 额度 / Deal 聚合站**（getaiperks.com 追踪 194 家公司 770 万美元额度；findaicredits.com 每周更新 + Approval Index；aiforker.com 月度 roundup；AI 免费内容与权益速递 GitHub 中文周报） | 面向创业者/开发者的 credit 目录 | 全部是**给人看的网页 / 邮件**，无 MCP、无 API、无 schema；无上手难度；无结构化区域；findaicredits 有「Approval Index（获批可能性）」——这个思路我们可以借鉴成 `approval_difficulty` |
| S3 | **GPU / 云额度追踪**（gpuperhour.com） | 「哪些免费 GPU 真的能用，哪些已经关了」 | 方法论可借鉴：它明确区分「credits 值多少钱 / 谁能申请 / 什么时候过期」（GCP 试用金 90 天、Azure 30 天），并指出「cloud credit 只能按该云的费率折算 GPU 小时」。→ 我们可以用同样的思路给 token 额度折算「够跑多少次」的直觉量 |
| S4 | **直接问 ChatGPT / Perplexity / 搜索** | 零门槛获取答案 | 无 provenance、无时效保证、会幻觉；**用户无法验证**；且答案不可分享、不可订阅、不可过滤 |

### 3.3 关键结论：市面上有没有我们要的那个东西？

**没有。**

逐项核过：

| 能力 | 有人做吗 | 谁最接近 |
|---|---|---|
| 机器可读（schema / API / MCP） | 部分。C6 有 MCP 但只搬列表；C7 有 MCP 但做的是定价 | C6 / C7 |
| 结构化条款（免卡/限速/限模型/商用/数据训练） | 无。C1/C4 有速率限制文本，但不是可查询字段 | C4 |
| 上手难度分级（easy/medium/hard） | 无。只有 C2 有单档「Easy」标记 | C2 |
| 区域标注（含中国大陆可用性） | 弱。C2 有「中国大陆可用性」文字，C1/C4 只有脚注 | C2 |
| 到期追踪 | 弱。C2 有「快到期告警」，C3 有文字有效期，**均非结构化日期字段** | C2 |
| 促销 / 拉新 / 返佣类条目 | **被主动排除**。C4 明写「Trial credits and time-limited promos don't count」 | 无 |

**核心差异化 = 上面六项的同时具备 + 全部字段化 + 带 provenance。** 单独任何一项都不构成壁垒，但六项叠加、且每条都带 `last_verified_at`，目前市面上无第二家。

---

## 4. 我们的差异化定位

**一句话**：别人给你一份**列表**，我们给你一份**能直接执行的、带保鲜期的、Agent 能自己读的合约摘要**。

三条不可复制的护城河（按强度排序）：

1. **字段化 + provenance（最强）**。`terms` / `difficulty` / `region` / `expires_at` 全部是可过滤字段，每条带 `source_urls` + `last_verified_at` + `confidence`。这是「策展库（Git 版本化）+ 定时刷新」混合模式的直接产物——纯策展会腐烂（C1 的问题），纯刷新不可信（C3 明确拒绝未复核说法），混合才有可信度。
2. **可行动性（actionability）**。每条 promo 都回答「怎么把它吃下来」：`steps[]` + `estimated_minutes` + `gotchas[]` + `agent_degraded_path`。**这是主用户（非技术订阅者）的唯一刚需**，也是所有竞品都没做的。
3. **Agent 原生 + 自传播闭环**。Agent 不只要能读，还要能**复述推荐**（`agent_pitch` 字段）；人不只要能看，还要能**一键分享**（分享卡片 + 一行安装命令）。推荐者是我们唯一的低成本增长通道，所以传播机制是产品功能，不是运营动作。

**附：两条由技术选型直接带来的、可对外讲的差异化**

- **隐私侧信任状**：每日清单页是**零依赖静态页**——零第三方请求、零广告 SDK、**零第三方 cookie**。联盟 tracking cookie 在 GDPR/ePrivacy 下属非必要 cookie，需事先明示同意（多数联盟站在此处静默违规，cookie 在用户拒绝前就已写入）。我们因为不设任何第三方 cookie 而**天然合规**。这不是我们额外做的功，而是架构选择的副产品，**应在清单页显著位置作为信任状对外讲**——对欧盟访客和反感追踪的开发者，这是实打实的差异点。
- **发现自动、背书人工**：定时刷新（Phase 1 = discovery feed）负责发现新促销，但**所有对外展示的条目都带 `last_verified_at` 且 `unverified` 不对外**。竞品要么全人工（保鲜靠人手，会腐烂），要么全自动（无法解释、无法信任）。我们把这两件事切开：**发现可以自动，背书必须人工**——这句话本身就是最好的产品叙事。
- **RSS + MCP 打通，人读和机读共用一份数据**：MVP 以静态生成的 `feed.xml`（RSS）与 `promos.ics`（到期日历）替代邮箱订阅（见 D4 裁定）。关键在于——**RSS 同时是 Agent 可消费的接口**，与 MCP resources 天然互补。竞品 C2（羊茅）有 RSS + ICS + 邮件周报，但**没有 MCP**；C6/C7 有 MCP 但没有 RSS。我们把两端打通：**同一份策展库，同时产出给人订阅的 RSS/ICS 和给 Agent 调用的 MCP**，人和机器读到的是同一份带 `last_verified_at` 的数据。这在竞品矩阵里是唯一一家。
- **零依赖即合规红利**：不引第三方邮件服务商、不设账号体系、不设第三方 cookie，不只是省事——它同时规避了 ICP 备案与商业邮件发送合规、GDPR/ePrivacy 事先同意、以及用户数据存储三重负担。**架构上的克制直接换成了合规上的自由度。**

---

## 5. promo 数据分类法（Taxonomy 候选字段）

> 这是 PRD 最关键的产出。架构师据此定 JSON Schema，设计师据此定卡片信息层级。字段命名采用 `snake_case`，全部可选性/必填性标注在「必填」列。

### 5.1 身份与分类

| 字段 | 类型 | 必填 | 说明 / 取值域 |
|---|---|---|---|
| `id` | string | 是 | 稳定 slug，如 `siliconflow-signup-2000w-tokens`。一旦发布不再变更 |
| `provider_id` | string | 是 | 如 `siliconflow`、`zhipu`、`volcengine`、`cloudflare` |
| `provider_name` | string | 是 | 官方英文名 |
| `provider_name_local` | string | 否 | 中文名，如「硅基流动」「火山引擎」 |
| `title` | string | 是 | 一句话标题，中英各一份（`title_i18n`） |
| `summary` | string | 是 | ≤ 60 字，给卡片和 Agent 摘要用 |
| `offer_type` | enum | 是 | `free_tier`（长期免费层） / `trial_credit`（试用金） / `signup_bonus`（新用户赠） / `referral_bonus`（邀请奖励） / `promo_code`（优惠码） / `daily_allowance`（每日刷新额度） / `startup_program` / `academic_program` / `limited_event`（限时活动） |
| `category` | enum[] | 是 | `llm_inference` / `embedding` / `image` / `video` / `audio` / `gpu_compute` / `dev_tool` |
| `value_amount` | number | 否 | 额度数值 |
| `value_unit` | enum | 否 | `tokens` / `usd` / `cny` / `neurons` / `requests` / `gpu_hours` |
| `value_display` | string | 是 | 人类可读，如「2000 万 Tokens」「每天 10,000 Neurons」 |
| `value_plain_language` | string | 否 | **给非技术用户的直觉换算**，如「约等于每天写 30 篇 2000 字文章，连续用 3 个月」 |

### 5.2 结构化条款（归类后的 terms）—— 核心差异化

| 字段 | 类型 | 说明 / 取值域 |
|---|---|---|
| `terms.requires_credit_card` | bool | 免信用卡与否（用户点名要的维度） |
| `terms.requires_phone_verification` | bool | 是否需手机号验证 |
| `terms.requires_realname_verification` | enum | `none` / `china_id` / `other` —— 需实名（用户点名） |
| `terms.requires_payment_or_topup` | bool | 是否需先充值/消费才触发奖励 |
| `terms.requires_student_or_edu` | bool | 学生/教育认证 |
| `terms.requires_incorporation` | bool | 需企业主体（创业公司计划） |
| `terms.rate_limits` | object | `{rpm, rpd, tpm, tpd, concurrency}` —— 限速（用户点名） |
| `terms.context_window` | number | 上下文窗口 tokens |
| `terms.model_scope` | object | `{mode: all / whitelist / blacklist, models: [string]}` —— 限模型（用户点名） |
| `terms.data_training_opt_in` | enum | `yes` / `no` / `opt_out_available` / `unknown` —— 数据是否/可被用于训练 |
| `terms.commercial_use_allowed` | enum | `yes` / `no` / `restricted` / `unknown` —— 禁商用与否（用户点名） |
| `terms.expiry_type` | enum | `none`（长期） / `fixed_date` / `rolling_window`（如每日刷新） / `n_days_after_claim`（如领取后 90 天） |
| `terms.expires_at` | date | ISO 日期；`expiry_type=none` 时为 null |
| `terms.claim_window` | object | `{start, end}` 活动有效期（区别于额度有效期） |
| `terms.stackable` | bool | 能否与其他优惠叠加 |
| `terms.one_per_identity` | bool | 同一实名个体/主体是否限领一次 |
| `terms.restricted_regions` | string[] | 排除地区，如 `["EU","UK","CH"]` |
| `terms.region` | string[] | **适用区域**（用户点名），如 `["CN","HK","SG","global"]` |
| `terms.china_access` | enum | `direct`（直连） / `needs_proxy` / `blocked` / `unverified` —— 中国大陆可用性 |
| `terms.promo_code` | string | 优惠码（如有） |
| `terms.other_notes` | string[] | 无法归入上述枚举的条款，自然语言兜底 |

> 设计原则：**每个布尔/枚举字段都能做成一个筛选器**。能用枚举就不要用文本，文本只做兜底。

### 5.3 可行动性（actionability）—— 「如何吃下这个羊毛」

| 字段 | 类型 | 说明 |
|---|---|---|
| `difficulty` | enum | **`easy` / `medium` / `hard`** —— 用户点名的硬需求 |
| `difficulty_reason` | string | 为什么是这个等级（避免黑箱），如「需实名认证 + 需等待 1-5 分钟到账」 |
| `difficulty_criteria` | object | 判定依据（见下方规则表） |
| `estimated_minutes` | number | 从注册到跑通第一个请求的预估分钟数 |
| `prerequisites` | string[] | 前置条件，如「中国大陆手机号」「支付宝账号」 |
| `steps` | object[] | `[{n, text, url}]` —— 逐步操作指引 |
| `gotchas` | string[] | **防扣费清单**：如「限速 20 RPM，批量跑会撞 429」「额度 90 天不用清零，平台不提醒」 |
| `agent_degraded_path` | string | **hard 项必填**。给非技术用户的「让 Agent 帮你做」话术，人可直接复制进对话框 |
| `verification_command` | string | 可选的「跑通验证命令」（一条 curl），给 medium/hard 用户自查 |

**difficulty 判定规则（必须写成可执行的规则，不让策展人凭感觉打）**

| 等级 | 判定条件（满足之一即降级） |
|---|---|
| `easy` | 全部成立：(1) 无需信用卡 (2) 无需实名 (3) 无需等待审核 (4) 复制 Key 即可用 (5) 有 OpenAI 兼容端点 (6) estimated_minutes ≤ 15 |
| `medium` | 需手机号验证 **或** 需实名认证（可自助完成）**或** estimated_minutes 15-60 **或** 需在控制台手动开通模型 |
| `hard` | 需企业主体/学生认证 **或** 需人工审核（>1 个工作日）**或** 需先付费/充值才触发 **或** 需自行部署 **或** 需配置环境变量以外的工程动作 |

### 5.4 可信度与保鲜（provenance）

| 字段 | 类型 | 说明 |
|---|---|---|
| `source_urls` | string[] | 官方来源链接（必须是一手：厂商定价页 / 活动页 / 控制台文档） |
| `last_verified_at` | datetime | **最后人工/脚本核实时间**。所有展示面必须显示 |
| `verified_by` | enum | `human` / `crawler` / `agent` / `community` |
| `confidence` | enum | `high`（有官方页面原文 + 30 天内核实） / `medium`（官方页面但 >30 天） / `low`（仅二手来源） |
| `status` | enum | `active` / `expiring_soon`（≤14 天到期） / `expired` / `unverified`（刷新任务新发现，待复核） / `rumored` |
| `first_seen_at` | datetime | 首次入库 |
| `last_changed_at` | datetime | 最近一次字段变更 |
| `change_log` | object[] | `[{at, field, from, to, by}]` —— Git 版本化天然支持 |

> **规则**：`status=unverified` 的条目**默认不进每日清单页、不进 MCP 默认返回**，只在 Skill 的「今日新发现（待复核）」板块出现，且必须显式标注「未复核」。这条规则直接来自 C3 的方法论（「无法复核的旧说法一律不予采信」），是我们的可信度护城河。

### 5.5 分发与自传播

| 字段 | 类型 | 说明 |
|---|---|---|
| `affiliate_url` | string | 联盟/返佣链接（有则用，无则 null） |
| `is_affiliate` | bool | 该链接是否带返佣属性 —— **驱动披露逻辑** |
| `disclosure_text` | string | 该条的具体披露文案（中英各一份） |
| `share_slug` | string | 分享卡片短链 |
| `agent_pitch` | string | ≤120 字，**Agent 可直接复述的推荐话术** |
| `plain_url` | string | 无返佣的官方直链（给拒绝联盟链接的场景，也用于对不能挂返佣的厂商如 OpenAI/Anthropic） |

---

## 6. 功能清单与 RICE 排序

### 6.1 MVP 范围说明

用户已硬决策 MVP = **MCP server + Skill + 每日清单页**。本节的 RICE 用于在**这个容器内部**排优先级，而不是推翻它。

`Score = (Reach × Impact × Confidence) / Effort`
Reach 1-10（每季度受影响用户数）｜Impact 0.25/0.5/1/2/3｜Confidence 50%/80%/100%｜Effort 1-10（人月）

### 6.2 RICE 表

| # | 功能 | Reach | Impact | Conf. | Effort | **Score** | 优先级 | MVP |
|---|---|---|---|---|---|---|---|---|
| F1 | **上手难度分级 + Agent 降级路径**（`difficulty` / `difficulty_reason` / `agent_degraded_path`） | 8 | 3 | 100% | 2 | **12.00** | P0 | 是 |
| F2 | **结构化条款字段化**（5.2 全部 terms 字段 + 筛选器） | 9 | 3 | 100% | 3 | **9.00** | P0 | 是 |
| F3 | **实时查询**（MCP `search_promos` / Skill 自然语言查询） | 8 | 2 | 100% | 2 | **8.00** | P0 | 是 |
| F4 | **区域披露**（`region` / `china_access` / `restricted_regions`） | 7 | 2 | 100% | 2 | **7.00** | P0 | 是 |
| F5 | **MCP server 工具集**（Apify Standby + Streamable HTTP；4 个核心工具） | 9 | 3 | 100% | 4 | **6.75** | P0 | 是 |
| F6 | **promo 数据模型 + 策展库**（Git 版本化 YAML/JSON + JSON Schema 校验 + CI） | 10 | 3 | 100% | 5 | **6.00** | P0 | 是（地基） |
| F7 | **Skill：每日简报 + 实时查询** | 7 | 2 | 80% | 2 | **5.60** | P0 | 是 |
| F8 | **自传播机制**（分享卡片 + 一行安装命令 + Agent 话术 + 邀请闭环） | 7 | 3 | 80% | 3 | **5.60** | P0 | 是 |
| F9 | **到期追踪**（`expires_at` + `status=expiring_soon` + 清单页告警位） | 8 | 2 | 100% | 3 | **5.33** | P0 | 是 |
| F10 | **数据埋点**（见第 9 节） | 5 | 1 | 100% | 1 | **5.00** | P0 | 是（上线前必须） |
| F11 | **每日清单页**（零依赖静态页 + 分享卡片 + **RSS `feed.xml`** + **到期日历 `promos.ics`**） | 9 | 2 | 80% | 4 | **3.60** | P0 | 是 |
| F12 | **联盟/返佣链接 + 强制披露** | 6 | 2 | 80% | 3 | **3.20** | P1 | 是（合规硬要求，不可省） |
| F13 | **中英双语**（`title_i18n` / `disclosure_text_i18n` / 清单页语言切换） | 6 | 2 | 80% | 3 | **3.20** | P1 | 部分（标题 + 披露双语先上） |
| F14 | **社区投稿 / 纠错**（GitHub PR 模板 + Issue 模板） | 4 | 2 | 80% | 2 | **3.20** | P1 | 否 → Backlog |
| F15 | **定时刷新任务（Phase 1 = discovery feed）**（抓取 → 去重 → 标 `unverified` → 待复核队列，**不做自动入库**） | 8 | 2 | 80% | 3 | **4.27** | P0 | 是（范围已降级，见下） |

> **F15 裁决记录（总监 2026-09-28）**：我原建议延后到 Phase 2（RICE 2.56 / Effort 5），**总监驳回「延后」，改裁定为「保留在 MVP，但降级范围」**。理由：用户 Phase 0 的硬需求是 "needs to be able to find new sources for AI model promotions"，把 discovery 整块推到 Phase 2 等于交付一个纯静态库，正中 C1/C2 的短板（竞品全是静态库、保鲜靠人手）。
>
> 降级后 Effort 由 5 降至 3（只抓 + 去重 + 标 unverified，不做置信度判定与自动发布），**RICE 重算为 4.27**。优先级标 P0：RICE 分数本身落在 P1 区间，但「发现新促销源」是立项理由，属范围强制项，不由 RICE 单独决定。

#### F15 两阶段切分（必须在 PRD 中明确切开）

| 阶段 | 范围 | Effort | 本期？ |
|---|---|---|---|
| **Phase 1 — discovery feed（发现源）** | 定时抓取候选 → URL / 标题去重 → 生成 `status: unverified` 候选条目 → 进待复核队列。**不做**置信度判定、**不做**自动发布、**不做**字段自动填充 | 3 | **是（MVP）** |
| **Phase 2 — auto-publish（自动入库）** | 自动判定 `confidence`、自动填充条款字段、通过复核后自动转 `status: active` 并进清单页与 MCP 默认返回 | 另行评估 | 否 |

**Phase 1 的四条硬约束（沿用 PRD 已有规则，不因降级而放宽）**
1. 刷新任务产出的候选条目，**一律** `status: unverified`，不得例外。
2. `unverified` 条目**不进每日清单页、不进 MCP 默认返回**。
3. 只在 Skill 的「今日新发现（待复核）」区块出现，且**必须显式标注「未复核」**。
4. `unverified → active` 的状态跃迁**只能由人工复核触发**（Phase 2 再评估自动化）。

> 这样既守住「发现新促销源」的硬需求，又让可信度壁垒不被爬虫误报污染——**发现可以自动，背书必须人工**。

> **RSS / ICS 不单独立项（总监 2026-09-28 指示）**：二者均为**静态生成**产物，Effort 极低，作为 F11 每日清单页的**产出物**挂在 F11 下，不单独占一个 F 编号。理由：它们没有独立的用户价值主张，价值依附于清单页的数据与到期追踪能力；单独立项会把 RICE 表稀释成产出物清单。
>
> 但要注意它们的**战略权重高于其 Effort**：RSS 是 Agent 可消费的第二个入口（与 MCP 并列），ICS 是到期追踪（F9）唯一的订阅化交付形态。因此虽不单独立项，**必须写进验收标准**（AC-11.4 / AC-11.5）与差异化叙事（第 4 节），不能因为 Effort 低就在评审时被漏掉。

### 6.3 自传播机制设计（用户明确要求，单列）

用户对「自传播」的要求是：**驱动 Agent 和订阅者主动推荐他人**。四个触点：

**T1. 分享卡片（人 → 人）**
- 每条 promo 生成一张静态 OG 卡片（1200×630），卡片上只有四行：`provider_name` / `value_display` / `difficulty` 徽章 / 「免信用卡 · 国内直连」这类 2 个最高价值条款标签。
- 卡片右下角固定一行小字：「via Free & Cheap Tokens · 数据核实于 {last_verified_at}」——**provenance 本身就是信任状，也是我们的品牌曝光**。
- **卡片上必须有可识别的披露**：若该条 `is_affiliate=true`，1200×630 卡片**版面内**必须带披露标识（中文面显著标明「广告」，英文面标「Ad」）。**不能只在网页正文里披露**——卡片会被截图、转发到群里和社交平台，脱离页面上下文后正文披露就失效了。这是《互联网广告管理办法》第九条「具有可识别性」与 FTC「clear and conspicuous」在脱离页面场景下的必然推论。
- 分享按钮输出：卡片图 + 短链 + 一段可直接粘贴的文案（见 T4）；**若该条含返佣，可复制文案内也必须自带披露**（理由同上：文案会被粘贴到任何地方）。

**T2. 一行安装命令（人 → 人 / 人 → Agent）**
- 清单页顶部固定一条可复制命令，复制按钮点击后埋点 `install_command_copied`。
- 同时提供 MCP JSON 配置片段（给 Claude Desktop / Cursor / Cline）。

**T3. Agent 可复述的推荐话术（`agent_pitch` 字段）**
- 每条 promo 自带 `agent_pitch`（≤120 字）。Agent 在推荐时**不需要自己组织语言**，直接复述即可，且话术内容由我们策展（保证准确、保证带披露）。
- 例：「智谱 GLM-4-Flash 永久免费层，新用户注册再送 2000 万 Tokens。免信用卡、国内直连、OpenAI 格式兼容，约 10 分钟可跑通。需要实名，但可自助完成。— Free & Cheap Tokens，数据核实于 2026-09-20（含推广链接）」
- **关键**：`agent_pitch` 末尾必须带披露（因为 Agent 复述时不会自己加）。这是 FTC 与《互联网广告管理办法》的双重要求。

**T4. 邀请 / 返佣闭环（推荐者 → 我们）**
- 清单页与简报里嵌入「把这个服务推荐给朋友」的入口，给出**本服务自身**的一行安装命令 + 卡片（而非单条 promo 的卡片）。
- 推荐者的动机来源：(1) 单条 promo 的返佣（他分享某条 promo，有人通过他的链接注册，他得平台代金券——注意：**代金券是厂商发给他的，不是我们发给他的**，我们只是提供了发现与分享工具）；(2) 声誉动机（分享一个准确、有保鲜期、别人照着做不会踩坑的清单）。
- **MVP 不做**：多级分销、现金结算、推荐排行榜。理由见第 10 节 Out-of-Scope。

---

## 7. 验收标准（Given / When / Then）

### F1 上手难度分级 + Agent 降级路径
- **AC-1.1** Given 策展人新增一条 `difficulty=hard` 的 promo，When 提交 PR，Then CI 校验失败并提示「hard 项必须填写 `agent_degraded_path`」，除非该字段非空。
- **AC-1.2** Given 非技术用户打开清单页，When 页面渲染完成，Then 每条 promo 必须显示难度徽章（文字，非 emoji），且 `hard` 徽章旁必须可见「让 Agent 帮你做」按钮。
- **AC-1.3** Given 用户点击「让 Agent 帮你做」，When 弹层展开，Then 显示一段可一键复制的完整话术，用户无需任何编辑即可粘贴进任意 AI 对话框。
- **AC-1.4** Given 任意 promo，When 系统判定其 `difficulty`，Then 判定结果必须与 5.3 判定规则表一致（CI 中跑规则回归用例）。

### F2 结构化条款字段化
- **AC-2.1** Given 用户（人或 Agent）查询「免信用卡 + 国内直连 + 允许商用」，When 调用 `search_promos`，Then 返回的每一条都必须满足 `terms.requires_credit_card=false` 且 `terms.china_access=direct` 且 `terms.commercial_use_allowed=yes`，不得有 `unknown` 混入（除非显式传 `include_unknown=true`）。
- **AC-2.2** Given 某字段值无法从官方页面确认，When 策展人填写，Then 必须填 `unknown` 而非猜测值，且 CI 不拦截（`unknown` 是合法值）。

### F3 实时查询（MCP）
- **AC-3.1** Given Agent 未传任何参数，When 调用 `search_promos`，Then 返回 ≤ 10 条，按 `last_verified_at` 倒序 + `difficulty` 升序（easy 优先），且每条包含 `id / provider_name / value_display / difficulty / region / last_verified_at / confidence`。
- **AC-3.2** Given Agent 请求 `detail_level=full`，When 调用，Then 返回全部字段含 `steps[]` 与 `gotchas[]`。
- **AC-3.3** Given 查询无结果，When 调用，Then 返回结构化空结果 + `suggestion` 字段（放宽了哪个条件会有结果），而不是纯空数组。
- **AC-3.4** Given 任一返回值，When Agent 拿到结果，Then 必须包含 `last_verified_at` 与 `confidence`（provenance 不可省略）。

### F4 区域披露
- **AC-4.1** Given 用户在清单页，When 页面加载，Then 必须有一个「地区」筛选器，默认选中用户的语言/地区（首期默认 CN）。
- **AC-4.2** Given 一条 `china_access=needs_proxy` 的 promo，When 在 CN 视图下展示，Then 必须显示显式提示（文字），不得静默展示。

### F5 MCP server
- **AC-5.1** Given 一个标准 MCP 客户端，When 配置 Streamable HTTP 端点（无 API Key），Then 可完成 `tools/list` 并在 3 秒内拿到 4 个工具的 schema。
- **AC-5.2** Given 免费层用户，When 单日调用超过限额，Then 返回明确的限额提示（不是系统错误），并说明如何升级。
- **AC-5.3** Given Apify Standby 冷启动，When 首次请求到达，Then p95 < 3s。

### F9 到期追踪
- **AC-9.1** Given 一条 promo 的 `expires_at` 距今天 ≤ 14 天，When 清单页渲染，Then 该条进入页面顶部「7 天内到期 / 14 天内到期」告警区，并显示剩余天数。
- **AC-9.2** Given 一条 promo 已过期，When 清单页渲染，Then 从主列表移除，进「已过期（归档）」折叠区，保留 30 天后下线。

### F11 每日清单页
- **AC-11.1** Given 任意网络环境（含中国大陆），When 打开清单页，Then 在 3G 模拟下首屏 < 3s，且**零第三方请求**（无 tracker、无广告 SDK、无第三方 cookie）。
- **AC-11.2** Given 用户点击分享，When 生成卡片，Then 输出 1200×630 静态图 + 短链 + 可复制文案三件套。
- **AC-11.3** Given 页面无 JS 或 JS 加载失败，When 打开，Then 核心清单内容仍可读（渐进增强）。
- **AC-11.4（RSS 替代邮箱订阅）** Given 每次清单页构建，When 构建完成，Then 同时产出 `feed.xml`：包含当日 `status=active` 与 `expiring_soon` 的全部条目，**不含 `unverified` 条目**；每条含 `title` / `value_display` / `difficulty` / `expires_at` / `last_verified_at` / `share_slug`。
- **AC-11.5（ICS 到期日历）** Given 每次清单页构建，When 构建完成，Then 同时产出 `promos.ics`：为**每一条有 `expires_at` 的 promo** 生成一个 VEVENT，事件日期 = 到期日，提前 7 天设 VALARM 提醒；`expiry_type=none`（长期有效）的条目不生成事件。
- **AC-11.6** Given 上述两个产物，When 任一构建失败，Then 清单页仍正常发布（RSS/ICS 是附加产物，**不得阻断主构建**）。

### F12 联盟链接与披露
- **AC-12.1** Given 一条 `is_affiliate=true` 的 promo，When 在**任何**展示面（清单页 / 分享卡片 / MCP 返回 / `agent_pitch`）渲染，Then 必须同时渲染披露文案，且披露与链接在同一视口内（不可折叠、不可需滚动）。
- **AC-12.2** Given 中文展示面，When 渲染含返佣链接的内容，Then 必须**显著标明「广告」**（《互联网广告管理办法》第九条）。
- **AC-12.3** Given 一条 promo 属于 C 类（OpenAI / Anthropic / AWS，见 8.5），When 策展人填写 `affiliate_url` 或令 `is_affiliate=true`，Then CI 校验失败并硬拦截。
- **AC-12.4** Given 存在联盟链接，When 页面加载，Then 不得设置任何第三方 tracking cookie（规避 GDPR/ePrivacy 事先同意要求）。
- **AC-12.5（分享卡片脱离上下文的场景）** Given 一条 `is_affiliate=true` 的 promo，When 生成 1200×630 分享卡片或可复制文案，Then **卡片版面内与文案内**必须各自带可识别披露（中文面显著标明「广告」，英文面标「Ad」），不得依赖网页正文的披露。
- **AC-12.6（落地页复核 / 第十八条）** Given 一条 `is_affiliate=true` 的 promo，When 触发 8.6 门禁 #4 的任一条件（活动期距今 ≤30 天 / 超复核周期 / 落地页非 200 或已下线 / 落地页内容与记录不符），Then 系统强制标记待复核；复核未通过时**自动降级为 `plain_url` 且 `is_affiliate=false`**，不得保留原返佣链接。
- **AC-12.7（降级后的披露一致性）** Given 一条 promo 因复核失败降级为 `plain_url`，When 任意展示面渲染，Then 原披露文案同步撤回，且**不得残留空的披露标记**。
- **AC-12.8（Q4 集中到期）** Given 当前日期距 2026-12-31 ≤ 30 天，When CI 运行，Then 硅基流动与火山引擎方舟的 A 类条目必须出现在待复核清单顶部并标记为「集中到期风险」，不得静默通过。

---

## 8. 商业化模型（OSS + Hosted Convenience）

> **2026-09-28 重写**：原 §8「联盟 / 返佣合规：初步结论」**整体撤销**，原 §8.1–§8.6 章节保留作为历史档案供查阅，不作为现行规范。

### 8.0 模型总览

| 层 | 形态 | 价格 | 分发渠道 |
|---|---|---|---|
| **MCP 源码** | GitHub 公共仓库，MIT | **$0** | GitHub Releases / npm public |
| **Skill 源码** | GitHub 公共仓库，MIT | **$0** | GitHub Releases / WorkBuddy 技能市场（免费版） |
| **每日清单页 + RSS + ICS** | 零依赖静态站 + `feed.xml` + `promos.ics` | **$0** | GitHub Pages |
| **托管 MCP 端点**（Apify Standby + Streamable HTTP） | Apify **付费 Actor**，按调用/订阅计费 | **收费**（定价见 §8.3） | Apify Store |
| **托管 Skill / 每日简报服务**（WorkBuddy） | **付费订阅**，含每日精读 + 提前到期告警 | **收费**（定价见 §8.3） | WorkBuddy 技能市场 |

**核心契约**：**产品代码完全开源免费，谁都能自己部署**；变现的是「替你跑着」的便利层。代码与托管 API 返回的数据完全一致，差别只在配额与附加能力。

### 8.1 为什么这条路

| 维度 | 评估 |
|---|---|
| **变现空间** | 海外（Apify Stripe + 提现到 PayPal / US Bank）+ 中国大陆（WorkBuddy 微信支付）两个原生付费渠道，**不打架** |
| **合规负担** | 不挂任何联盟/返佣链接，不涉及推广内容与购物链接，**FTC 16 CFR 255 / 中国《互联网广告管理办法》第九条第十八条 / 《广告法》绝对化用语均不适用** |
| **可信度壁垒** | 每条 promo 的 `claim_url` 仍是官方直链，无任何联盟关系，「数据核实于 X 月 X 日」从相对优势升级为**唯一卖点** |
| **退路** | 平台政策变化时仍可自托管 + 社区贡献（PR / issue / 第三方数据校对） |
| **架构影响** | 几乎为零：Apify Standby 已规划，从自用 → 付费 Actor 只差**一道定价开关**；数据层 / 刷新 / Schema / MCP 原语全部不动 |

### 8.2 免费 vs 付费边界（按 D10 裁定）

**免费版**（开源自托管 / Apify Free tier / WorkBuddy Skill 默认）：
- 单次 MCP tool 调用返回 **≤ 10 条**结果
- 每日 ≤ **100 次**调用（IP 维度，未认证）
- 不暴露 `verification.confidence` 数字（隐藏策展内部信号，用户不懂如何解读）
- 不提供「提前 30 天到期告警」

**付费版**（Apify 付费 Actor / WorkBuddy 付费 Skill）：
- 单次调用返回**全量结果**（按结构化过滤条件，无 10 条上限）
- **不限频次**（Apify 由平台计费、WorkBuddy 由平台订阅）
- 暴露 `verification.confidence`（Agent 可用于自动权重）
- 提供**提前 30 天到期告警**（每日 06:00 推送至 Skill / 通过 MCP `get_expiring_soon` 工具）
- 提供**早鸟访问**：新发现 promo 提前 24h 可见（其他用户次日清单页才看得到）

**数据本身完全一样**，只差配额与附加项。**不卖数据、不卖链接、不卖排序**。

### 8.3 支付通道（按 D11 裁定）

| 市场 | 平台 | 收款方式 | 开发者结算 | 覆盖 |
|---|---|---|---|---|
| 海外 | **Apify Store** 付费 Actor | Apify 平台 Stripe 处理 | Stripe Connect → **PayPal / US Bank** | 海外开发者 |
| 中国大陆 | **WorkBuddy 技能市场** | 腾讯内建支付 | **微信支付** 直接到开发者账户 | 中国大陆用户 |

定价不在 PRD 锁定，由 Phase 3 商业化细则会议确认。建议初始档位：Apify Actor $9/月 或 $0.005/调用、WorkBuddy Skill ¥19/月。

### 8.4 反锁死的护栏

| 风险 | 护栏 |
|---|---|
| 付费墙把免费版体验压到无法使用 | 免费版每日 100 次 + 单次 10 条已**足以覆盖个人/小团队日常查询**；限速按 `actorId + IP` 双维度，避免共享 IP 误封 |
| 付费动机被绕过 | confidence / 提前告警 / 早鸟 三项差异化**必须确实有用**，不能成为伪价值墙。Phase 4 上线后看留存与转化率，转化 < 3% 触发回流设计 |
| 平台政策变化（Apify / WorkBuddy） | 任何一边出问题，源代码 + 自托管 + 静态页依然完整可用 |
| 数据被付费层污染 | 付费版与免费版读**同一份 `build/catalog.json`**，无数据差异；架构层面禁止分叉 |

### 8.5 原 §8 联盟 / 返佣合规：已撤销

> 本节内容已**整体撤销**，原 A 类 / B 类 / C 类 / D 类厂商分类、A 类首期仅 3 家、C 类硬禁 OpenAI/Anthropic/AWS、第 9.1 节 CI 门禁 #4（落地页与到期复核）、AC-12.1 ~ AC-12.8 等所有相关内容**全部失效**。保留本节文本作为决策档案供查阅，不作为现行规范。

---

> **重要**：以下是**联网检索得到的初步结论**，不是法律意见。凡标注「需人工复核」的，**MVP 上线前必须由人逐个打开官方页面确认**。本表不编造任何未检索到的政策。

### 8.1 A 类：首期可挂返佣的厂商（裁定后仅 3 家）

> **总监裁定（2026-09-28）**：A 类首期只保留下表 3 家。**阿里云已从 A 类剔除**——我检索到的实例活动期是 2026-02-14 至 2026-03-31，当前日期 2026-09-28，该活动已过期，属死链，不能进首期。阿里云改按 **D 类**处理：若要启用，必须先按当前活动页重新核实，核实前一律 `is_affiliate=false` + 官方直链。

| 厂商 | 机制 | 检索到的关键条款 | 有效期 / 限制 | 可信度 |
|---|---|---|---|---|
| **硅基流动 SiliconFlow** | 「推荐官」计划（邀请链接 / 邀请码） | 实名认证后，邀请人与被邀请人**各得 16 元全平台通用代金券**；邀请人数不设上限；代金券可用于 API、批量推理、微调、含 Pro 模型 | 活动至 **2026-12-31**；代金券自发券日起 **180 天**有效；同一身份重复认证不发奖励 | 高（官方站点原文） |
| **智谱 BigModel** | 官方邀请（`bigmodel.cn/invite?icode=`） | 邀好友**实名注册**，双方各得 2000 万 Tokens 资源包；**每月可邀 10 人，上限 2 亿 Tokens**；无需付费/充值 | 页面无截止日期，按月滚动（第三方情报库复核自官方前端 bundle） | 中高 |
| **火山引擎（方舟）** | Agent Plan 限时邀请活动 | 邀请人得被邀人首单实付 **5%** 代金券；被邀人首单 **9.5 折** | 活动期 **2026-07-24 至 2026-12-31**；代金券不可提现、不可转让。Coding Plan 的 10% 活动**已于 2026-04-29 下线**（历史活动，不可再挂） | 高（官方 docs 原文） |

**注（火山引擎）**：同一厂商可同时落在 A 类与 B 类——Agent Plan **邀请**活动个人可参与（A 类），但**分销伙伴**资质门槛不满足（B 类，注册资金 ≥100 万、≥50 人、成立 >1 年）。二者不可混淆，CI 按 `promo_id` 粒度校验而非按 `provider_id`。

### 8.2 检索到「明确没有 / 不可挂」的厂商

| 厂商 | 结论 | 证据 |
|---|---|---|
| **OpenAI** | **无面向个人创作者的公开联盟计划**。有多篇独立信源交叉印证（开发者实测 + 邮件询问合作团队得到「暂不接受联盟申请」类回复）。Codex  referral 是**邀请制**（仅收到账户内邀请的用户可参与），奖励为**促销性 credits**（有使用限制与到期日、不可转现金、不可交易），且 OpenAI 可随时更改/暂停/终止 | 多个独立信源一致；**不可挂返佣，只能挂官方直链（不带任何 tag）** |
| **Anthropic** | **无面向个人创作者的公开联盟计划**，重心在企业合作与直销 | 同上；**不可挂返佣** |
| **AWS** | APN 条款原文：**「获接纳参与计划并不表示我们授权您转售或分许可 AWS 服务」**；且福利不得挪作他用 | 官方 APN 条款；**不可挂返佣、不可转售** |

### 8.3 D 类：「未检索到公开政策」+「已过期待复核」的厂商

> **总监裁定（2026-09-28）**：D 类全部 `is_affiliate=false` + 官方直链；**如需开通返佣必须走人工复核开白**。阿里云归入此类（原因见 8.1）。

**未检索到公开联盟/返佣政策**：Google / Google Cloud、Cloudflare、腾讯云、百度千帆、月之暗面 Kimi、讯飞星火、商汤、美团 LongCat、小米 MiMo、NVIDIA、Groq、Cerebras、SambaNova、Together、Fireworks、Hugging Face、OpenRouter、Mistral、Cohere、GitHub Models（已退役）

**已检索到但活动期已过，需按当前活动页重新核实**：**阿里云**（实例活动期 2026-02-14 至 2026-03-31，已过期）

→ **处置规则（MVP 阶段）**：以上全部 `is_affiliate=false`，只挂 `plain_url`（官方直链），并标记 `affiliate_policy_status=unverified` 进入人工复核队列。**宁可少赚，不可违规。**
→ 上述每一条已在 `docs/decisions/OPEN-DECISIONS.md` 逐条登记（见 OD-02 及其子条目）。

### 8.4 披露的法定要求（两个司法辖区）

**美国 — FTC Endorsement Guides（16 CFR Part 255）**
- 有「material connection」（包括佣金、免费产品、亲属/雇佣/股权关系）就必须**清晰且显著（clear and conspicuous）**披露。
- 必须**贴近**其所适用的推荐主张，不能埋在页脚、折叠区、长串 hashtag 里；移动端必须同样可见。
- 语言要**大白话**：「I earn a commission if you buy through this link」合格；仅写「This page contains affiliate links」**不合格**（未说明报酬关系）。
- **品牌方与推广方承担连带责任**——我们不能把合规义务全推给分享者，必须在产品里**默认带上披露**。
- 2026 年每次违规民事罚款上限约 **$53,088**（每条不合规内容可单独计罚）。
- *注：有二手来源声称 2026 年 3 月有新一轮修订（涉及「affiliate」一词对大众不够清晰、AI 生成内容需单独披露、视频需在 30 秒内含口播披露、9 月 1 日截止等）。该来源为 SEO 型二手站点，**未获一手来源交叉印证，标记为需法务复核**，不作为 MVP 硬约束，但我们在设计上已按更严标准执行（大白话 + 贴近链接 + AI 内容可识别）。*

**中国 — 《互联网广告管理办法》（市场监管总局令第 72 号，2023-05-01 施行）**
- **第九条**：互联网广告应当具有可识别性。通过知识介绍、体验分享、消费测评等形式推销商品或者服务，**并附加购物链接等购买方式的，广告发布者应当显著标明「广告」**。
- **第十八条**：发布含有链接的互联网广告，广告主、广告经营者、广告发布者**应当核对下一级链接中与前端广告相关的广告内容**。→ 意味着我们必须定期核对联盟链接落地页与我们描述的是否一致。
- 同时受《广告法》约束：**禁用绝对化用语**（「最」「第一」等）、禁止虚假对比与数据造假。→ 直接影响文案：我们写「国内推理速度快」可以，写「国内最快」不行。

**欧盟 — GDPR / ePrivacy**
- 联盟 tracking cookie 属非必要 cookie，需**事先明示同意**；若用户拒绝，不得写入。
- → **我们的零依赖静态页设计天然规避**：不设任何第三方 cookie、不埋第三方 tracker。这是**技术选型带来的合规红利**，应在清单页显著位置作为信任状说明（同时也是差异化卖点）。

### 8.5 处置矩阵（给架构师落库用）

| 分类 | 处置 | 字段表现 |
|---|---|---|
| **A 类：官方邀请计划，个人可参与**（首期仅硅基流动 / 智谱 / 火山 Agent Plan 3 家） | 可挂返佣 + 强制披露 | `is_affiliate=true`，`disclosure_text` 必填，CI 强校验 |
| **B 类：官方分销/伙伴计划，个人不可参与**（如火山分销伙伴需注册资金 ≥100 万、≥50 人、成立 >1 年） | 只挂官方直链，或在活动中挂官方**邀请**链接（非分销） | `is_affiliate=false`，`plain_url` 必填 |
| **C 类：明确无联盟计划**（OpenAI、Anthropic、AWS） | **禁止**任何返佣链接 | `affiliate_url` 必须为 null，**`is_affiliate: false` 写死，任何 tag 都不许带**，CI 硬拦截 |
| **D 类：未检索到公开政策 / 活动期已过期**（含阿里云） | 默认不挂，仅官方直链；需开白必须走人工复核 | `is_affiliate=false`，标记 `affiliate_policy_status=unverified`，列入人工复核队列 |

**校验粒度**：A/B/C/D 分类挂在**单条 promo**（`promo_id`）上，不是挂在厂商（`provider_id`）上。同一厂商的不同 promo 可以分属不同类别（火山引擎即是最典型的例子）。

### 8.6 集中到期风险 + 落地页复核（总监追加裁定，CI 门禁 #4）

> 两条裁定合并为**同一套机制**实现，因为它们本质是同一件事：**挂出去的链接不能不管它后来变成什么。**

#### R-1 · Q4 2026 返佣集中到期风险（新增风险条目）

| 项 | 内容 |
|---|---|
| 风险 | A 类 3 家中，**有两家的活动期在同一天截止**：硅基流动「推荐官」至 **2026-12-31**，火山引擎方舟 Agent Plan 至 **2026-12-31**。智谱 BigModel 为按月滚动、无截止日期。 |
| 后果 | Q4 末可能出现**两家返佣同时失效**。若未提前发现，清单页与分享卡片会持续挂出已失效的返佣链接——既损失收入，又构成对用户的误导（同时触碰 FTC 与《互联网广告管理办法》）。 |
| 缓解 | (1) 到期前 **30 天**触发强制复核（写入 CI 门禁 #4）；(2) 复核未通过的条目**自动降级为 `is_affiliate=false` + `plain_url`**，而不是保留死链；(3) 智谱虽无截止日期，仍需按 `last_verified_at` 同周期复核（厂商可随时改规则）。 |
| 责任人 | 策展人（人工复核），CI 负责提醒与自动降级 |

#### R-2 · 落地页内容复核（《互联网广告管理办法》第十八条）

**第十八条比第九条更狠**：它意味着我们**挂了链接就不能不管落地页变成什么**。厂商改了活动规则、下了活动页、甚至落地页出现违规内容，我们要连带。

**CI 门禁 #4（硬门禁，与 R-1 同一套机制）**

| 触发条件（满足任一即触发复核） | 动作 |
|---|---|
| `affiliate_url` 对应活动的 `claim_window.end` 距今 ≤ 30 天 | 强制复核；未通过 → 自动降级为 `plain_url` |
| 距上次 `last_verified_at` 超过既定复核周期 | 强制复核；未通过 → 自动降级为 `plain_url` |
| 落地页 HTTP 状态非 200 / 活动页已下线 / 重定向异常 | **立即**自动降级为 `plain_url` 并置 `status=unverified` |
| 落地页内容与本条 promo 记录不一致（金额、条款、有效期任一不符） | 强制复核；未通过 → 自动降级为 `plain_url` |

**复核失败一律降级为直链，绝不保留原返佣链接。** 降级后该条 `is_affiliate=false`，披露文案同步撤回（无返佣即无披露义务，但**不得留下空的披露标记**）。

---

## 9. 非功能需求与数据埋点

### 9.1 非功能需求

| 类别 | 要求 | 优先级 |
|---|---|---|
| 性能 | 清单页首屏 < 3s（3G 模拟）；MCP API p95 < 500ms；Standby 冷启动 p95 < 3s | P0 |
| 可用性 | MCP 不可用时，Skill 与清单页**降级可用**（读 Git 策展库的静态快照），核心流程不中断 | P0 |
| 安全 | HTTPS 全站；MCP 端点输入校验 + 速率限制；**不存储、不代理用户 API Key**；联盟链接 `rel="nofollow sponsored"` | P0 |
| 兼容性 | Chrome / Safari / Firefox 最新 2 版；iOS / Android 微信内置浏览器最新版；MCP 客户端：Claude Desktop / Cursor / Cline / n8n | P0 |
| 可访问性 | WCAG 2.1 AA 基本合规（键盘可达 + 对比度 ≥ 4.5:1）；难度徽章**必须同时有文字，不能只靠颜色或图形**（色盲用户） | P1 |
| 国际化 | 中英双语（首期 `title` / `summary` / `steps` / `disclosure_text` 双语；区域默认 CN） | P1 |
| 合规 | 见第 8 节；披露不可折叠、与链接同视口；零第三方 cookie | P0 |
| 数据保鲜 | 所有展示面必须显示 `last_verified_at`；`confidence=low` 或 `status=unverified` 的条目必须有显式标识 | P0 |
| 可维护性 | 策展库 PR 必须过**四项 CI 门禁**：(1) JSON Schema 校验 (2) `difficulty` 规则回归 + `hard` 项 `agent_degraded_path` 必填 (3) 联盟白名单校验（C 类硬拦截 / D 类未开白拦截）(4) **affiliate 条目落地页与到期复核**（8.6 门禁 #4，含 Q4 集中到期检查） | P0 |

### 9.2 数据埋点（MVP 必须，不埋则上线后无法验证假设）

> 约束：只用**自建轻量 `trackEvent()` 封装**，不引入第三方 tracker（合规 + 零依赖要求）；不采集 IP、不存用户原始输入内容。

| 事件类别 | 事件名 | 关键属性 | 验证什么假设 |
|---|---|---|---|
| 获客 | `page_view` | `referrer_source`, `region`, `lang` | 流量从哪来 |
| 获客 | `install_command_copied` | `surface`（清单页/卡片/简报） | 一行安装命令的转化效率 |
| 激活 | `first_query_sent` | `surface`（mcp/skill/web） | 用户是否真的开始查 |
| 激活 | `claim_guide_opened` | `promo_id`, `difficulty` | **核心假设 A**：difficulty 分级是否被用（hard 项是否触发降级路径查看） |
| 激活 | `agent_degraded_path_copied` | `promo_id` | **核心假设 B**：非技术用户是否真的走「让 Agent 帮我做」 |
| 留存 | `daily_page_view` / `session_start` | `days_since_first` | DAU / 回访频次 |
| 传播 | `share_card_generated` | `promo_id`, `channel` | 分享意愿 |
| 传播 | `referral_link_clicked` | `promo_id`, `is_affiliate` | **核心假设 C**：自传播闭环是否成立（这是商业模式的前提） |
| 转化 | `affiliate_link_clicked` | `promo_id`, `provider_id` | 联盟漏斗（唯一商业指标） |
| 异常 | `error_occurred` | `surface`, `error_type` | 前端错误 + API 错误 |
| 异常 | `stale_data_reported` | `promo_id` | **数据保鲜的众包信号**（用户报「这条过期了」= 最高价值 feedback） |

事件命名规范 `{对象}_{动作}`；每个事件附 `timestamp` / `surface` / `version` / `region`（**不带 user_id —— MVP 无账号体系，用匿名会话 ID，且不上报 IP**）。

---

## 10. 明确不做（Out-of-Scope）

| # | 不做的事 | 理由 |
|---|---|---|
| O1 | **代用户注册 / 代领额度 / 托管 API Key / 代充值** | 安全与合规红线。需要用户实名信息与支付凭证，一旦泄露或违规，项目直接终结 |
| O2 | **代理转发推理请求（不做 API 网关、不做 token 转售、不做共享 Key / 共享额度池）** | AWS APN 条款明确禁止转售/分许可；几乎所有厂商 ToS 禁止共享账号；会被封号，且法律风险极高 |
| O3 | **自建「共享免费额度」的公共 Key** | 同上，且会被薅穿、被滥用，反过来伤害整个生态（C1 README 第一句就是「Please don't abuse these services, else we might lose them」） |
| O4 | **模型定价对比 / 性能基准测试** | promptibus MCP（C7）与 BenchLM 已做，且是长期稳定数据，与 promo 的时效数据模型不同。我们只在 promo 里引用价格作为辅助信息 |
| O5 | **多级分销 / 现金结算 / 推荐排行榜 / 积分体系** | 中国《禁止传销条例》风险 + 合规成本远超 MVP 收益。推荐者的激励由**厂商代金券**承担，我们不做资金流转 |
| O6 | ~~付费订阅墙 / 会员制~~（**已被 D10 替代**，原裁定失效） | 改为「按返回条数限速」：免费版每日 ≤100 次、单次 ≤10 条；付费版不限频次 + confidence 可见 + 提前到期告警。详见 §8 商业化模型 |
| O7 | **用户账号体系 / 登录注册** | MVP 无登录。订阅走邮箱/RSS（不存密码、不做个人数据沉淀），同时规避 GDPR 合规负担 |
| O8 | **移动端原生 App / 小程序** | 零依赖静态页 + 渐进增强已覆盖移动端；App 的投入产出比在验证期不成立 |
| **O12** | **邮箱订阅 / 邮件周报**（总监 2026-09-28 裁定，见 13.1 D4） | (1) 需引第三方邮件服务商，**破坏零后端约束**；(2) 涉及 **ICP 备案与商业邮件发送合规**，MVP 阶段不值得为此背书；(3) 收益可替代——竞品 C2 有 RSS + ICS + 邮件周报，我们做 **RSS + ICS 即可覆盖大部分订阅需求**。替代方案：`feed.xml` + `promos.ics` 静态生成，零后端（见 AC-11.4 / AC-11.5） |
| O9 | **UGC 评论 / 社区打分 / 论坛** |  moderation 成本极高；MVP 用 GitHub Issue 做纠错入口即可（F14 也已进 Backlog） |
| O10 | **覆盖所有 AI 工具（IDE / Agent 框架 / 课程）** | C2 已覆盖 75 个开发工具 + 36 门课程，是它的强项。我们**只做「额度与促销」**，不横向扩张成 AI 工具目录 |
| O11 | **实时可用性探测（ping 各端点验证是否活着）** | C1 已做（每 24h ping + 健康徽章）。我们做**条款与时效**的可信度，不做端点存活性——职责分离，也避免重复造轮子 |

---

## 11. 边界条件（5 态 + 边界值）

| 状态 | 处理要求 |
|---|---|
| **空状态** | 清单页：「今天没有新促销。上次更新：{last_verified_at}。{订阅入口}——有新羊毛时第一时间通知你。」**禁止**「Welcome to...」类空洞文案。MCP 空结果必须返回 `suggestion`（放宽哪个条件会有结果） |
| **加载状态** | 清单页骨架屏；MCP 请求 > 3s 时返回进度提示（Skill 侧显示「正在检索 {n} 个数据源」） |
| **错误状态** | 分三类：数据错误（策展库 CI 失败 → 展示上一版快照 + 横幅提示）/ 服务错误（MCP 不可用 → Skill 降级读静态快照）/ 用户错误（筛选项互斥 → 提示哪个条件冲突）。**每类都必须给下一步动作，不能只报错** |
| **已填充状态** | 见 AC-11.x；每屏强调色 ≤ 2 处 |
| **边界值** | `expires_at = 今天`：显示「今天到期」而非「0 天后到期」；`value_amount` 为空但 `value_display` 非空（如「不定量，按需审批」）时，`value_display` 必须写明不确定；`rate_limits` 全空时显示「厂商未公布，以控制台为准」（**不得填猜测值**——抄 BenchLM 的方法论） |
| **并发 / 离线** | 清单页为静态，天然支持离线（首屏可 service worker 缓存，可选）；MCP 无状态设计（Apify Standby 可水平扩展） |
| **权限拒绝** | MCP 免费层超限时返回明确限额提示 + 升级路径，**不得表现为系统错误**（抄 Apify 的 graceful exit 规范） |
| **数据冲突** | 同一 promo 的官方页面与策展库记录不一致时：**以官方页面为准**，自动置 `status=unverified` 并进复核队列，**不得静默保留旧值** |

---

## 12. 设计方向（给设计师的输入，不含视觉方案）

> 视觉方案的最终决定权在设计师。以下是 PRD 侧的**约束与信息层级要求**，不是配色稿。

**必须遵守的团队级 P0 规则**
1. **禁止 emoji 作为功能图标**。难度徽章、条款标签、分享按钮等一律用**文字 + 统一 SVG 图标库**描述（具体图标库由架构师按项目选型锁定，PRD 不预设）。例：写「火箭图标」而非 emoji 字符。
2. **禁止紫色 → 粉色渐变主视觉**。
3. **禁止空洞占位文案**（「Welcome to Our App」/「Lorem ipsum」/「Sign up today」）。所有示例文案必须是可直接上线的真实文案。

**信息层级建议（按主用户的阅读顺序）**
1. 这条我能拿到什么（`value_display` + `value_plain_language`）
2. 我要付出什么代价（`difficulty` 徽章 + `estimated_minutes`）
3. 有没有拦路条款（2-3 个最高价值标签：免信用卡 / 国内直连 / 允许商用）
4. 什么时候过期（`expires_at` 或「长期有效」）
5. 数据核实于何时（`last_verified_at`）—— 信任状，必须可见但不能抢主信息
6. 披露（如 `is_appearance=true` 则与链接同视口）

**难度徽章**：三档，必须**文字 + 形状/颜色双重编码**（不能只靠颜色，WCAG + 色盲）。文字为「易 / 中 / 难」或「Easy / Medium / Hard」，`hard` 档必须自带「让 Agent 帮你做」入口。

**可引用的行业基线**（来自 `references/industries/ai-native.md` 与 `saas-b2b.md`）：主色方向深蓝/靛蓝（#1a56db / #3b82f6 / #4F46E5），强调色翠绿 #10b981（用于「已核实」状态与成功态），中性色浅灰白 #f8fafc；每屏强调色 ≤ 2 处；字体 Inter + Noto Sans SC，代码用 JetBrains Mono。**最终配色由设计师决定，此处仅为行业基线参考。**

---

## 13. 裁决记录

### 13.1 已裁决（总监 2026-09-28）

| # | 事项 | 裁决结果 | 落地位置 |
|---|---|---|---|
| **D1** | F15 定时刷新任务是否延后到 Phase 2 | **驳回「延后」，改裁定为「保留在 MVP，但降级范围」**。Phase 1 = discovery feed（只抓 + 去重 + 标 `unverified`），**不做自动入库**；Phase 2 再评估 auto-publish。Effort 5→3，RICE 重算 **2.56 → 4.27**，优先级 **P0**（范围强制项，不由 RICE 单独决定） | 6.2 RICE 表 + F15 两阶段切分 |
| **D2** | ~~F12 联盟链接首期只接 A 类~~（**已被 D9 整体替代**，原裁定失效） | 联盟返佣变现路线撤回（2026-09-28）。A/B/C/D 分类不再适用，每条 promo 的 `claim_url` 一律官方直链，无联盟关系。Schema 的 `disclosure` 字段保留为 deprecated | 8 节标"已撤销"；`schemas/promo.schema.json` `disclosure` 标 deprecated |
| **D3** | FTC 2026 新规需法务复核 | **同意登记为未决项，不阻塞 MVP**。按更严标准设计（大白话 + 贴近链接 + AI 内容可识别），同时落 `docs/decisions/OPEN-DECISIONS.md`，slug `waiting-on-external-condition`，Blocked By「法务复核」 | `OPEN-DECISIONS.md` OD-01 |

### 13.2 总监追加裁定

| # | 裁定 | 落地位置 |
|---|---|---|
| **D5** | ~~《互联网广告管理办法》第十八条落成 CI 门禁~~ | **已闭环（2026-09-28）**：联盟返佣路线撤回，第十八条不适用，CI 门禁 #4 同步退役。原 R-2 风险关闭 | — |
| **D6** | ~~Q4 2026 返佣集中到期风险~~ | **已闭环（2026-09-28）**：联盟返佣路线撤回，硅基流动 / 火山引擎 2026-12-31 截止与我们无关。原 R-1 风险关闭 | — |
| **D7** | ~~分享卡片与可复制文案内嵌披露~~ | **已闭环（2026-09-28）**：联盟返佣路线撤回，分享卡片与可复制文案不再需要「广告」标识。**改为项目透明度声明**：卡片上保留「项目透明度 / 开源 / 不接硬广」三行小字作为定位标识（非披露） | — |
| **D8** | 静态页零第三方 cookie/tracker 天然过 GDPR/ePrivacy，**写进差异化对外讲成信任状** | 第 4 节差异化 | 保留 |
| **D4** | **MVP 是否需要邮箱订阅** | **裁定：不做。改 RSS（`feed.xml`）+ ICS（`promos.ics`）静态生成，零后端。** 理由：(1) 引第三方邮件服务商会破坏零后端约束；(2) 涉及 ICP 备案与商业邮件发送合规，MVP 不值得背；(3) 收益可替代——竞品 C2 有 RSS + ICS + 邮件周报，我们做 RSS + ICS 即覆盖大部分订阅需求。**RSS/ICS 不单独立项**，挂在 F11 下作为产出物（Effort 极低） | 第 10 节 O12；AC-11.4 / AC-11.5 / AC-11.6；第 4 节差异化 |

### 13.3 总监新裁定（2026-09-28 变现路线变更）

> 用户撤回联盟返佣变现路线，改走 **OSS + Hosted Convenience**。本节为新增裁定，原 §8 联盟 / 返佣合规章节整体标"已撤销"。

| # | 裁定 | 落地位置 |
|---|---|---|
| **D9** | **变现路线改为 OSS + Hosted Convenience**：MCP 源码 + Skill 源码 + 静态清单页 + RSS/ICS **全部 MIT 开源免费**；**托管便利层付费**——Apify 付费 Actor（海外）+ WorkBuddy 付费 Skill（中国大陆）。代码开源、便利层收费，是 GitLab/Supabase/Sentry/Cal.com 的经典打法 | 第 4 节差异化；§8 新章「商业化模型」；AC-FREE/PAID |
| **D10** | **免费/付费边界按返回条数限速**：免费版每日 ≤100 次调用、单次 ≤10 条、不含 `verification.confidence` 数字、不含提前到期告警；付费版**不限频次、单次可返回全量、可见 confidence、含 30 天提前到期告警**。**数据本身完全一样，只差配额与附加项** | §8 商业化模型；AC-FREE/PAID；架构 §9 配额层 |
| **D11** | **支付通道**：海外 Apify Store 通过平台 Stripe 处理收款，开发者走 Stripe Connect 提现到 **PayPal / US Bank**；中国大陆 WorkBuddy 技能市场内建**微信支付**。两个市场独立结算，分别覆盖海外开发者与中国大陆用户 | §8 商业化模型；架构 §9.5 |

### 13.4 旧条目状态

| # | 事项 | 状态 |
|---|---|---|
| — | 无未决。D1–D8 全部已裁决 / 已闭环；D9–D11 为新变现路线裁定。 | OPEN-DECISIONS.md 的 OD-01/02/03 同步关闭（联盟返佣路线不适用） |

---

## 附：调研来源清单（可核验）

**竞品与替代方案**
- cheahjs/free-llm-api-resources（GitHub，29.3k stars）及多个第三方 fork / MCP 包装：github.com/cheahjs/free-llm-api-resources；model-context-protocol.com 的 MCP server 条目
- yangmao.ai（羊茅）about / free-map / providers 页
- rockbenben/free-llm-intel（GitHub，63 家厂商中文情报）
- KKWANG4444/awesome-free-llm-apis（GitHub）
- free-for.dev
- promptibus.com/mcp（模型定价 MCP）
- klymentiev.com/blog/free-llm-api（2026-09-25 核实）
- toolfreebie.com/best-free-ai-apis-2026（2026-08-31 实测）
- benchlm.ai/free-tier（2026-09-14 核实）
- aicost.tools/blog/best-llm-apis-with-a-free-tier
- getaiperks.com（194 家公司 / 770 万美元额度）
- findaicredits.com（周更 + Approval Index）
- gpuperhour.com/blog/free-cloud-gpus-and-credits（2026-09-21 核实）
- aiforker.com/free-ai-creditst-free-tokens-2026（月度 roundup）
- Lavie-purple/ai-free-content-digest（GitHub 中文周报，第 003 期 2026-09-15）

**厂商官方 / 一手政策**
- Cloudflare Workers AI Pricing（10,000 Neurons/天，每日 00:00 UTC 重置）
- 硅基流动「推荐官」计划官方公告（活动至 2026-12-31，代金券 180 天有效）
- 火山引擎方舟 Agent Plan 邀请活动官方 docs（2026-07-24 至 2026-12-31）；Coding Plan 邀请活动下线公告（2026-04-29）
- 火山引擎合作伙伴站（分销伙伴准入条件）
- AWS Partner Network Terms and Conditions（「获接纳参与计划并不表示我们授权您转售或分许可 AWS 服务」）
- 阿里云开发者社区「邀客得好礼」活动规则（实例活动期 2026-02-14 至 03-31）
- 智谱 BigModel 邀请活动（第三方情报库复核自官方前端 bundle）

**合规**
- FTC Endorsement Guides（16 CFR Part 255），含 2023 修订版「clear and conspicuous」标准；2026 年民事罚款上限 $53,088
- 中国《互联网广告管理办法》（市场监管总局令第 72 号，2023-05-01 施行）第九条、第十八条；多地市场监管局官方解读（无锡、遵化、汉中、达州、铜川）
- GDPR / ePrivacy 联盟 tracking cookie 事先同意要求（二手综述）
- Apify：Actor 变现 / Standby / 免费用户 graceful exit 规范

**未检索到公开政策，已列入人工复核队列**：Google / Google Cloud、Cloudflare、腾讯云、百度千帆、Kimi、讯飞星火、商汤、美团 LongCat、小米 MiMo、NVIDIA、Groq、Cerebras、SambaNova、Together、Fireworks、Hugging Face、OpenRouter、Mistral、Cohere 的联盟/返佣政策。
