import { NextResponse } from 'next/server';
import { prisma } from '@leetcast/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string> = {
    web: 'ok',
    database: 'unknown',
    redis: 'unknown',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  try {
    const IORedis = (await import('ioredis')).default;
    const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      connectTimeout: 3000,
    });
    await redis.connect();
    await redis.ping();
    checks.redis = 'ok';
    await redis.quit();
  } catch {
    checks.redis = 'error';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');

  return NextResponse.json(
    { status: allOk ? 'healthy' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
