import { NextRequest, NextResponse } from 'next/server';
import { StrategyEngine, StrategyType } from '@leetcast/database';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { z } from 'zod';

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const podcastQueue = new Queue('podcast-generation', { connection: redis });

const AdminBodySchema = z.object({
  strategy: z.enum(['progressive', 'classic', 'weakspot']).default('progressive'),
  userId: z.string().optional(),
  problemId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Admin token check
  const token = req.headers.get('x-admin-token');
  if (!token || token !== process.env.ADMIN_TOKEN) {
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
