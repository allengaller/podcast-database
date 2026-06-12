import 'dotenv/config';
import http from 'http';
import { podcastQueue, podcastWorker } from './lib/queue';

async function healthCheck(): Promise<{ status: string; checks: Record<string, string> }> {
  const checks: Record<string, string> = { worker: 'ok', redis: 'unknown' };
  try {
    await podcastQueue.client.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }
  const allOk = Object.values(checks).every((v) => v === 'ok');
  return { status: allOk ? 'healthy' : 'degraded', checks };
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/health' || req.url === '/') {
    const result = await healthCheck();
    res.writeHead(result.status === 'healthy' ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } else {
    res.writeHead(404);
    res.end();
  }
});

async function main() {
  const port = parseInt(process.env.PORT || '3001', 10);
  server.listen(port, () => {
    console.log(`[Worker] LeetCast worker started, health check on :${port}/health`);
  });

  const shutdown = async () => {
    console.log('[Worker] Shutting down...');
    await podcastWorker.close();
    server.close();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch(console.error);
