import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@leetcast/database';

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const progress = await prisma.userProgress.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });

  const streak = progress?.currentStreak || 0;
  const name = progress?.user.name || 'LeetCaster';

  // Return an SVG share card
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e1b4b;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#bg)" rx="20"/>
  <text x="300" y="80" font-size="32" fill="#fff" text-anchor="middle" font-family="sans-serif" font-weight="bold">LeetCast</text>
  <text x="300" y="130" font-size="18" fill="#94a3b8" text-anchor="middle" font-family="sans-serif">每日一题播客</text>
  <text x="300" y="220" font-size="72" fill="#6366f1" text-anchor="middle" font-family="sans-serif" font-weight="bold">${streak}</text>
  <text x="300" y="270" font-size="24" fill="#cbd5e1" text-anchor="middle" font-family="sans-serif">连续打卡天数</text>
  <text x="300" y="330" font-size="16" fill="#64748b" text-anchor="middle" font-family="sans-serif">— ${name}</text>
</svg>
  `.trim();

  return new NextResponse(svg, {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
}
