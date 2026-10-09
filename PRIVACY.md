# Privacy Policy

**Product:** FaCT MCP — Free and Cheap AI Token Promotions (MCP server)
**Operator:** PanStories
**Repository:** https://github.com/PanStories/free-and-cheap-tokens
**Last updated:** 2026-10-09
**Effective date:** 2026-10-09

This policy explains what data the FaCT MCP server ("the Service", "we") processes
when you connect to it as a Model Context Protocol (MCP) server — via the hosted
endpoint or a self-hosted build — and what we deliberately do **not** collect.

---

## 1. Summary (TL;DR)

- The Service is a **read-only** MCP server. Its tools only *read* a curated catalog
  of AI-model token promotions. They never modify, delete, or act on your systems.
- **No accounts, no sign-up, no cookies, no advertising or analytics trackers.**
- We do **not** sell, rent, or share your data with advertisers or data brokers.
- The only input is a **search query / filter** (e.g. a country, provider, or price
  filter) and public promo identifiers. No personal data is required or requested.
- The server is **stateless**: every request is handled independently, with no
  session and no user profile.
- Hosting is provided by **Apify**. Platform-level processing (billing, request
  routing, infrastructure logs) is governed by Apify's own privacy policy.

---

## 2. Data we process

| Data | Source | Why we process it | Retention |
|---|---|---|---|
| Search query / filter terms | You (the calling agent or user) | To return matching promotions | In memory for the duration of the request only |
| Promo identifiers (`promo_id`, `provider_id`) | You | To look up a specific promotion | Request duration only |
| IP address + User-Agent | Your request | Transient rate-limiting only | In-memory LRU window; not persisted, not logged to disk |
| Apify API token | Apify gateway | Authenticates the caller at the platform edge | Not seen or stored by the Service |

## 3. What we do NOT collect

- No names, email addresses, phone numbers, or other personal identifiers.
- No accounts, passwords, or credentials.
- No conversation history or tool-call content retained beyond the live request.
- No cookies. (A first-party `?ref=share` query parameter may be used to attribute a
  share source; it is never sent to third parties and is not tied to any identity.)
- No third-party analytics, pixels, or advertising trackers.

## 4. Third parties / data recipients

| Recipient | Purpose | Notes |
|---|---|---|
| **Apify** (hosting) | Runs the Standby container, terminates TLS, routes requests, meters usage | Subject to Apify's privacy policy |
| **Promotion providers** | The `claim_url` for each promo points to the provider's own official site | Only contacted if *you* click through; their privacy policy then applies |

We do not disclose your inputs to any other third party. We honour lawful requests
only where legally compelled, and will disclose the minimum necessary.

## 5. Hosting and infrastructure

The hosted Service runs on Apify's Standby infrastructure. Apify may process
operational metadata (timestamps, IP, billing records) as an independent controller.
See <https://apify.com/privacy-policy>. The Service itself runs no database and keeps
no persistent store of user data.

## 6. Self-hosted / open-source builds

This repository is open source (MIT). When you self-host, **you** are the data
controller for anything your deployment processes. The code ships with no telemetry
that reports back to us.

## 7. Security

Transport is encrypted (TLS) at the Apify edge. All requests require the Apify
gateway bearer token. The catalog data is schema-validated at build time. See
[`SECURITY.md`](./SECURITY.md) for the threat model and vulnerability reporting.

## 8. Children's privacy

The Service is a developer tool not directed at children, and we do not knowingly
process data from children under 16.

## 9. Your rights

Because we do not maintain user profiles or store personal data, there is generally
no personal data to access, correct, or erase. If you believe we hold data about you,
contact us (Section 11) and we will respond within 30 days.

## 10. Changes to this policy

We may update this policy as the Service evolves. Material changes will be reflected
in the "Last updated" date and, where appropriate, in the repository changelog.

## 11. Contact

Privacy questions or requests:
**Open an issue** at <https://github.com/PanStories/free-and-cheap-tokens/issues>.
For security matters, see [`SECURITY.md`](./SECURITY.md).

---

## 简体中文

**产品：** FaCT MCP — 免费与低成本 AI Token 促销检索（MCP server）
**运营方：** PanStories
**最后更新：** 2026-10-09

### 概要

- 本服务是**只读** MCP server，工具仅*读取*人工策展的 AI 模型 token 促销目录，
  不会修改、删除或操作用户的任何系统。
- **无账号、无注册、无 Cookie、无广告或分析追踪。**
- 我们**不会**向广告商或数据经纪商出售、出租或共享你的数据。
- 唯一输入为**搜索词/筛选条件**与公开的促销标识符，不需要、也不索取任何个人信息。
- 服务**无状态**：每次请求独立处理，无会话、无用户画像。
- 托管由 **Apify** 提供，平台层处理受 Apify 隐私政策约束。

### 我们处理的数据

| 数据 | 来源 | 用途 | 保留 |
|---|---|---|---|
| 搜索词 / 筛选条件 | 调用方 | 返回匹配的促销 | 仅请求期间驻留内存 |
| 促销标识符 | 调用方 | 查询指定促销 | 仅请求期间 |
| IP + User-Agent | 请求 | 仅用于限流 | 内存 LRU 窗口，不落盘 |
| Apify API token | Apify 网关 | 在平台边缘鉴权 | 本服务不接触、不存储 |

### 我们不收集

姓名、邮箱、电话等个人标识；账号/密码/凭据；超出实时请求的对话或工具调用内容；
Cookie；任何第三方分析、像素或广告追踪。

### 第三方

- **Apify**（托管）：运行 Standby 容器、TLS 终止、请求路由与计量。
- **促销提供方**：每个 `claim_url` 指向提供方官网，仅在*你*主动点击时才访问，
  之后适用其隐私政策。

### 自托管

本仓库为开源（MIT）。自托管时**你**即数据处理的控制者；代码不含任何回传遥测。

### 联系方式

在 <https://github.com/PanStories/free-and-cheap-tokens/issues> 提交 issue。
安全事项见 [`SECURITY.md`](./SECURITY.md)。
