# 收录新 promo · CONTRIBUTING

> [🇬🇧 English version →](CONTRIBUTING.en.md) · 策展型项目：欢迎提交新 promo / 修订过期项 / 改写条款。
> 我们不接硬广、不挂联盟、不为付费改排序。所有收录基于用户价值。

---

## 怎么收录一条新 promo

### 1. Fork & branch

```bash
git clone https://github.com/PanStories/free-and-cheap-tokens.git
cd free-and-cheap-tokens
git checkout -b add/<vendor-name>-<offer-name>
```

### 2. 在 `data/promos/` 新建 `<provider_id>-<offer_slug>.json`

最小骨架（中文/英文按目标用户填）：

```json
{
  "id": "provider-offer-slug",
  "provider": {
    "id": "provider",
    "name_en": "Provider English Name",
    "name_zh": "厂商中文名",
    "country": "US",
    "homepage": "https://example.com/"
  },
  "offer": {
    "type": "free_tier",
    "headline": "Free 200M tokens/month",
    "summary": "一句话说清楚怎么领、能拿多少",
    "value_display": "200M tokens/month",
    "no_fixed_expiry": true,
    "claim_url": "https://example.com/signup"
  },
  "terms": [],
  "difficulty": "easy",
  "region": { "availability": "global" },
  "categories": ["llm"],
  "status": "active",
  "verification": {
    "status": "verified",
    "method": "human",
    "confidence": "high",
    "last_verified_at": "2026-09-28T08:00:00Z"
  },
  "disclosure": { "affiliate": false },
  "provenance": {
    "source_urls": ["https://example.com/pricing"],
    "first_seen_at": "2026-09-28T00:00:00Z",
    "review_required": false
  },
  "created_at": "2026-09-28T00:00:00Z",
  "updated_at": "2026-09-28T00:00:00Z"
}
```

完整字段定义见 [`schemas/promo.schema.json`](schemas/promo.schema.json)。

### 3. 跑本地校验

```bash
node scripts/build-catalog.mjs --check
node scripts/check-p0.mjs
```

如果第一行失败，**先读错误信息修 JSON**，不要 disable validator。

### 4. 提交 PR

PR 描述里回答三件事：

1. **为什么这条值得收录？**（用户价值 / 难度 / 区域）
2. **你怎么核实的？**（手动跑了什么命令 / 截图 / 时间戳）
3. **谁可以核对？**（你的 GitHub handle、测试账号是否愿意公开）

模板：

```markdown
## 新增 promo: <headline>

**厂商**: <name>
**区域**: <region>
**上手难度**: <easy / medium / hard>
**核实时间**: <date>
**核实方式**: 手动注册并获取 key；具体步骤见下

### 怎么领
1. ...
2. ...

### 防扣费 / 防骚扰清单
- ...
```

### 5. 等 CI 通过 + 维护者 review

CI 会跑：typecheck / lint / vitest / P0 红线 / build:catalog --check
任一失败 → 自动标红。

---

## 修订已有 promo

任何字段都可以修。重点是 `verification.last_verified_at` 与 `updated_at`：

- 改了 `headline` / `value_display` / `claim_url` / `terms` → `last_verified_at` 必更新
- 改了 `expires_at` → 同步检查 `status` 是否应改为 `expiring_soon` 或 `expired`
- 改了 `region` → 在 PR 描述写明哪个国家/区域的可用性变了

---

## 「覆盖规则」（shua 穿了反噬整个生态）

⚠️ **请遵守**：

- 不要为同一身份反复领同一 promo（厂商会追踪）
- 不要用脚本批量薅（厂商会 ban IP / 关停活动）
- 不要把 promo 用于商业转售（**AWS APN 等条款禁止转售**）

详见 [`SPEC.md`](README.md) §3 Out-of-Scope。

---

## 风格指南

- `id` 用 `<provider>-<offer>-<variant>` 三段小写：`siliconflow-free-tier`
- `headline` **必须含具体数字**（"免费 200 万 tokens" 而不是 "免费 tokens"）
- `summary` ≤ 100 字，直白说人话
- 条款标签只从 22 项受控词里选；不在清单里的就别加
- 日期全部 ISO 8601（带时区）
- URL 必须 https
- 不接联盟 / 不挂 affiliate tag

---

## Code of Conduct

见 [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)。

---

## 版权

提交即视为同意以 MIT 协议发布你的贡献。