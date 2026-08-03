import { NextResponse } from 'next/server';
import { prisma } from '@leetcast/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const podcast = await prisma.podcast.findFirst({
    where: {
      isDaily: true,
      dailyDate: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    include: { problem: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!podcast) {
    return NextResponse.json({ error: 'No daily podcast found' }, { status: 404 });
  }

  return NextResponse.json(podcast);
}
