/**
 * Entry point. Two transports:
 *   - HTTP (Apify Standby): Express + StreamableHTTPServerTransport (stateless, /mcp POST)
 *   - stdio: for local CLI / desktop clients
 *
 * Detection:
 *   - If `APIFY_CONTAINER_PORT` is set → HTTP mode (default for Apify Standby)
 *   - Else stdio mode (developer machine)
 *
 * 注意：
 *   - Standby C1 要求 stateless —— `sessionIdGenerator: undefined` 强制无 session
 *   - C2 要求 Task hostname 256MB（不是 Actor 级 hostname）
 *   - C3 必须用 Actor.init() 而非 Actor.main()
 *   - C5 每请求都要求 Bearer token（Apify 网关注入）
 */

import { Actor } from 'apify';
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './mcp/server.js';
import { chargeForRequest } from './billing.js';
import { parseCallerContext, callerHash, isPaidCaller, setTierIsPaid } from './tier/quota.js';
import { checkLimit } from './tier/rate-limit.js';

const PORT = Number(process.env.APIFY_CONTAINER_PORT ?? process.env.PORT ?? 3000);

async function main() {
  // Apify Standby 必须用 init() —— 否则回调返回即自杀
  if (process.env.APIFY_CONTAINER_PORT) {
    await runHttpMode();
  } else {
    await runStdioMode();
  }
}

async function runHttpMode() {
  await Actor.init();

  // Apify 健康探针：返回 200 让容器标 ready
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/', (_req, res) => {
    res.json({
      service: 'free-and-cheap-tokens',
      version: '1.0.0',
      transports: ['streamable-http'],
      endpoints: ['/mcp'],
    });
  });

  // Origin / Host 白名单（DNS rebinding 防护 —— SDK 1.30.1 已标 deprecated 必须自己实现）
  // 在 Apify 平台上无需此检查：网关已做 Bearer 鉴权，且 hostname 是平台动态分配的。
  app.use((req, res, next) => {
    if (process.env.APIFY_IS_AT_HOME) {
      next();
      return;
    }
    const allowedHosts = new Set([
      'localhost',
      '127.0.0.1',
      process.env.APIFY_CONTAINER_HOSTNAME ?? '',
      'freeandcheaptokens.dev',
      'www.freeandcheaptokens.dev',
    ]);
    const host = req.headers.host?.split(':')[0];
    if (host && !allowedHosts.has(host) && !host.endsWith('.apify.actor') && !host.endsWith('.apify.com')) {
      res.status(403).json({ error: 'Forbidden host' });
      return;
    }
    next();
  });

  // Apify 容器 readiness 探针
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  // /mcp POST 入口
  app.post('/mcp', async (req, res) => {
    const ctx = parseCallerContext(req);
    setTierIsPaid(ctx.isPaid);
    const decision = checkLimit(ctx.ip, ctx.userAgent, isPaidCaller());
    if (!decision.allowed) {
      res.status(429).json({
        error: 'Free tier limit exceeded (100 calls / 24h). Upgrade to Apify paid Actor or WorkBuddy Pro Skill.',
        reset_at: new Date(decision.resetAt).toISOString(),
      });
      return;
    }

    // Charge the PPE event before serving (free events are skipped internally).
    await chargeForRequest(req.body, Actor);

    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // C1 stateless
      enableJsonResponse: true,
    });
    await server.connect(transport);
    try {
      await transport.handleRequest(req, res, req.body);
    } finally {
      // 关闭连接以释放资源（Stateless 模式：每个请求都建新连接）
      void callerHash(ctx); // 占位：埋点 hook
    }
  });

  // SSE GET 与 DELETE 由 transport 内部处理
  app.get('/mcp', (_req, res) => {
    res.status(405).json({ error: 'Use POST /mcp for Streamable HTTP requests' });
  });
  app.delete('/mcp', (_req, res) => {
    res.status(405).json({ error: 'DELETE not supported in stateless mode' });
  });

  // 进程级别致命错误兜底
  process.on('uncaughtException', (err) => {
    console.error('uncaughtException:', err);
    process.exit(1);
  });

  app.listen(PORT, () => {
    console.log(`[fct-mcp] Streamable HTTP listening on :${PORT} (stateless)`);
  });
}

async function runStdioMode() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[fct-mcp] stdio transport ready');
}

main().catch((err) => {
  console.error('[fct-mcp] fatal:', err);
  process.exit(1);
});