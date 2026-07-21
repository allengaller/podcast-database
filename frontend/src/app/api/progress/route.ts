import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@leetcast/database';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { withSentrySpan } from '@/lib/sentry';

const ProgressBodySchema = z.object({
  podcastId: z.string().min(1),
  progress: z.number().int().min(0),
  completed: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  return withSentrySpan('POST /api/progress', async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = rateLimit(`progress:${session.user.id}`, { maxRequests: 30, windowMs: 60_000 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = ProgressBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { podcastId, progress, completed } = parsed.data;

    const history = await prisma.playHistory.upsert({
      where: {
        userId_podcastId: {
          userId: session.user.id,
          podcastId,
        },
      },
      update: {
        progress,
        completed,
      },
      create: {
        userId: session.user.id,
        podcastId,
        progress,
        completed,
      },
    });

    // Check-in logic: if completed, ensure check-in for today
    if (completed) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await prisma.checkIn.upsert({
        where: {
          userId_date: {
            userId: session.user.id,
            date: today,
          },
        },
        update: {},
        create: {
          userId: session.user.id,
          date: today,
        },
      });

      // Update streak
      await updateStreak(session.user.id);
    }

    return NextResponse.json(history);
  });
}

async function updateStreak(userId: string) {
  const progress = await prisma.userProgress.findUnique({
    where: { userId },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastCheckIn = progress?.lastCheckInDate;
  let currentStreak = progress?.currentStreak || 0;

  if (lastCheckIn) {
    const lastDate = new Date(lastCheckIn);
    lastDate.setHours(0, 0, 0, 0);
    if (lastDate.getTime() === yesterday.getTime()) {
      currentStreak += 1;
    } else if (lastDate.getTime() === today.getTime()) {
      // already checked in today, do nothing
    } else {
      currentStreak = 1;
    }
  } else {
    currentStreak = 1;
  }

  await prisma.userProgress.upsert({
    where: { userId },
    update: {
      currentStreak,
      longestStreak: Math.max(currentStreak, progress?.longestStreak || 0),
      lastCheckInDate: today,
      totalCompleted: { increment: 1 },
    },
    create: {
      userId,
      currentStreak,
      longestStreak: currentStreak,
      lastCheckInDate: today,
      totalCompleted: 1,
    },
  });
}
