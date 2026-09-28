# ADR-002: Streamable HTTP 采用无状态（stateless）+ JSON 响应模式

## Status

Accepted (2026-09-28)

## Background

MCP Streamable HTTP 传输既支持有状态会话（服务端下发 `MCP-Session-Id`，客户端后续请求带回），也支持无状态（`sessionIdGenerator: undefined`）。需要在 Apify Standby 上二选一。

Standby 的三个平台事实决定了答案：

1. **容器会被回收**：run 空闲超过 `idleTimeoutSecs` 即被终止，内存中的 session 表随之消失。
2. **容器会扩容**：并发超过 `desiredRequestsPerActorRun`（默认 3）时平台会**预先启动新的 run**，同一客户端的连续请求完全可能被路由到不同容器。
3. **平台不做粘性**：文档没有任何"同一 session 固定路由到同一 run"的承诺。

## Decision Drivers

- 有状态会话在上述任一情况下都会断，客户端收到 404 后必须重新 initialize——表现为随机掉线，属于最难排查的一类故障。
- 本 MCP server 是**纯只读数据服务**，没有任何需要跨请求保留的服务端状态。保留 session 没有任何收益。
- SSE 长流会占用连接直到响应结束；Apify 对"收到首个响应"的总超时是 5 分钟，长流没有好处只有风险。

## Decision

采用无状态模式，并关闭 SSE 流：

```ts
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,   // 无 session，响应不带 MCP-Session-Id
  enableJsonResponse: true,        // 每个 POST 直接回一个 JSON 对象，不开 SSE 流
});
```

（以上两个选项在 `@modelcontextprotocol/sdk@1.30.1` 的 `dist/esm/server/webStandardStreamableHttp.d.ts` 中实测存在，见证据 E2。）

每个请求独立建 `McpServer` 实例并在响应后释放，不复用——复用实例在 stateless 模式下没有意义，且会累积内存。

## Consequences

正面：

- 请求可被任意容器处理，扩缩容与冷启动对正确性零影响。
- 不持有长连接，容器内存稳定，256 MB 即可跑。
- 客户端实现简单，不必处理 session 过期重连。

负面：

- 失去服务端主动推送（server-initiated notifications）与断点续传（resumability / `Last-Event-ID`）。本 server 无此需求。
- 失去跨请求的采样（sampling）与引导（elicitation）会话上下文。MVP 阶段的 tools 全部是一次性只读查询，不需要。若将来要做"需要追问用户"的交互，需重新评估。

## DNS rebinding 防护（必须显式做）

MCP 规范 `Streamable HTTP` 章节要求：**服务端 MUST 校验所有入站连接的 `Origin` 头**，存在且非法时返回 403。

`StreamableHTTPServerTransportOptions` 里原有的 `enableDnsRebindingProtection` / `allowedHosts` / `allowedOrigins` 三个选项在 **1.30.1 中已被标记 `@deprecated`**，注释明确要求改用外部中间件。因此本项目在 Express 层自己实现：

- 校验 `Origin`：白名单内放行，缺失（非浏览器客户端）放行，不在白名单返回 403。
- 校验 `Host`：白名单内放行，否则 403。
- 只允许 `POST` / `GET` / `DELETE` 三个方法命中 `/mcp`，其余返回 405。

相关 CVE：CVE-2025-66414（CVSS 7.6）——1.24.0 之前的 SDK 默认关闭该防护。本项目锁 1.30.1，已过该版本线，但仍按规范显式实现，不依赖 SDK 默认值。

## Related ADRs

- ADR-001（运行时与分发形态）
- ADR-003（数据层）
