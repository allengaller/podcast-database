import { NextRequest, NextResponse } from 'next/server';
import { StrategyEngine, StrategyType } from '@leetcast/database';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { z } from 'zod';
import { timingSafeEqual } from 'crypto';
import { rateLimit } from '@/lib/rate-limit';

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const podcastQueue = new Queue('podcast-generation', { connection: redis });

const AdminBodySchema = z.object({
  strategy: z.enum(['progressive', 'classic', 'weakspot']).default('progressive'),
  userId: z.string().optional(),
  problemId: z.string().optional(),
});

function verifyAdminToken(token: string): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limit = rateLimit(`admin:${ip}`, { maxRequests: 5, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  const token = req.headers.get('x-admin-token');
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = AdminBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { strategy, userId, problemId } = parsed.data;

  const selectedProblemId =
    problemId || (await StrategyEngine.selectDailyProblem(strategy as StrategyType, userId));

  if (!selectedProblemId) {
    return NextResponse.json({ error: 'No problem found' }, { status: 404 });
  }

  const today = new Date().toISOString().split('T')[0];

  const job = await podcastQueue.add('generate-daily-podcast', {
    problemId: selectedProblemId,
    isDaily: true,
    dailyDate: today,
  });

  return NextResponse.json({ jobId: job.id, problemId: selectedProblemId });
}
