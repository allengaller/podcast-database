import { prisma } from '@leetcast/database';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, BookOpen, User, Medal } from 'lucide-react';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const topUsers = await prisma.userProgress.findMany({
    orderBy: { currentStreak: 'desc' },
    take: 20,
    include: { user: true },
  });

  const rankBadge = (idx: number) => {
    if (idx === 0) return <Badge className="bg-yellow-500 text-yellow-950">冠军</Badge>;
    if (idx === 1) return <Badge className="bg-slate-300 text-slate-900">亚军</Badge>;
    if (idx === 2) return <Badge className="bg-orange-400 text-orange-950">季军</Badge>;
    return <Badge variant="secondary">第 {idx + 1} 名</Badge>;
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white">
              L
            </div>
            <span className="text-lg font-bold tracking-tight">LeetCast</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/problems">
                <BookOpen className="mr-2 h-4 w-4" />
                题单
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                个人中心
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-extrabold tracking-tight">连续打卡排行榜</h1>
        </div>

        <div className="space-y-3">
          {topUsers.map((u, idx) => (
            <Card key={u.id} className={idx < 3 ? 'border-yellow-500/20' : ''}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                      idx === 0
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : idx === 1
                          ? 'bg-slate-400/20 text-slate-300'
                          : idx === 2
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {idx < 3 ? <Medal className="h-5 w-5" /> : idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-semibold">
                      {u.user.name || '匿名用户'}
                      {rankBadge(idx)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      已完成 {u.totalCompleted} 题 · 最长连续 {u.longestStreak} 天
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-indigo-500">{u.currentStreak}</div>
                  <div className="text-xs text-muted-foreground">连续打卡</div>
                </div>
              </CardContent>
            </Card>
          ))}
          {topUsers.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">暂无排行榜数据</div>
          )}
        </div>
      </div>
    </main>
  );
}
