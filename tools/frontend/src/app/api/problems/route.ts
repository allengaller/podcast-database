import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@leetcast/database';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const difficulty = searchParams.get('difficulty') || undefined;
  const topic = searchParams.get('topic') || undefined;
  const page = Number(searchParams.get('page') || '1');
  const pageSize = 20;

  const where: Record<string, unknown> = {};

  if (query) {
    where.OR = [{ title: { contains: query, mode: 'insensitive' } }, { id: { contains: query } }];
  }

  if (difficulty) {
    where.difficulty = difficulty;
  }

  if (topic) {
    where.topics = { has: topic };
  }

  const [problems, total] = await Promise.all([
    prisma.problem.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { id: 'asc' },
    }),
    prisma.problem.count({ where }),
  ]);

  return NextResponse.json({ problems, total, page, pageSize });
}
