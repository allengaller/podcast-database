import { auth } from '@/auth';
import { prisma } from '@leetcast/database';
import { Player } from '@/components/player';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Headphones, Trophy, BookOpen } from 'lucide-react';
import Image from 'next/image';

export default async function HomePage() {
  const session = await auth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyPodcast = await prisma.podcast.findFirst({
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

  let initialProgress = 0;
  if (session?.user?.id && dailyPodcast) {
    const history = await prisma.playHistory.findUnique({
      where: {
        userId_podcastId: {
          userId: session.user.id,
          podcastId: dailyPodcast.id,
        },
      },
    });
    if (history) initialProgress = history.progress;
  }

  const progress = session?.user?.id
    ? await prisma.userProgress.findUnique({ where: { userId: session.user.id } })
    : null;

  return (
    <main className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white">
              L
            </div>
            <span className="text-lg font-bold tracking-tight">LeetCast</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-3">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/problems">
                <BookOpen className="mr-2 h-4 w-4" />
                题单
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/leaderboard">
                <Trophy className="mr-2 h-4 w-4" />
                排行榜
              </Link>
            </Button>
            {session?.user ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/profile">
                    <Image
                      src={session.user.image || ''}
                      alt=""
                      width={28}
                      height={28}
                      className="mr-2 h-7 w-7 rounded-full ring-1 ring-border"
                    />
                    {session.user.name}
                  </Link>
                </Button>
                <form
                  action={async () => {
                    'use server';
                    const { signOut } = await import('@/auth');
                    await signOut({ redirectTo: '/login' });
                  }}
                >
                  <Button variant="ghost" size="sm" type="submit">
                    退出
                  </Button>
                </form>
              </div>
            ) : (
              <Button size="sm" asChild>
                <Link href="/login">登录</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        {/* 欢迎语 */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {session?.user ? `欢迎回来，${session.user.name}` : '欢迎来到 LeetCast'}
          </h1>
          <p className="mt-2 text-muted-foreground">每天五分钟，听懂一道 LeetCode</p>
        </div>

        {/* 统计卡片 */}
        {session?.user && (
          <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{progress?.currentStreak || 0}</div>
                  <div className="text-xs text-muted-foreground">连续打卡</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{progress?.totalCompleted || 0}</div>
                  <div className="text-xs text-muted-foreground">已完成</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{progress?.longestStreak || 0}</div>
                  <div className="text-xs text-muted-foreground">最长连续</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500/10 text-pink-500">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {progress?.totalListenTime ? Math.floor(progress.totalListenTime / 60) : 0}
                  </div>
                  <div className="text-xs text-muted-foreground">学习分钟</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 今日一题 */}
        <section>
          <div className="mb-6 flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
            >
              <Flame className="mr-1 h-3 w-3" />
              今日一题
            </Badge>
            <span className="text-sm text-muted-foreground">
              {today.toLocaleDateString('zh-CN')}
            </span>
          </div>

          {dailyPodcast ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold sm:text-3xl">
                    {dailyPodcast.problem.id}. {dailyPodcast.problem.title}
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        dailyPodcast.problem.difficulty === 'Easy'
                          ? 'border-green-500/30 text-green-400'
                          : dailyPodcast.problem.difficulty === 'Medium'
                            ? 'border-yellow-500/30 text-yellow-400'
                            : 'border-red-500/30 text-red-400'
                      }
                    >
                      {dailyPodcast.problem.difficulty}
                    </Badge>
                    {dailyPodcast.problem.topics.slice(0, 4).map((t) => (
                      <Badge key={t} variant="secondary" className="font-normal">
                        {t}
                      </Badge>
                    ))}
                    <span className="text-sm text-muted-foreground">
                      通过率 {dailyPodcast.problem.acceptanceRate}
                    </span>
                  </div>
                </div>

                {!session?.user && (
                  <Button asChild variant="outline">
                    <Link href="/login">登录保存进度</Link>
                  </Button>
                )}
              </div>

              <Player
                src={dailyPodcast.audioUrl}
                podcastId={dailyPodcast.id}
                transcript={dailyPodcast.transcript}
                initialProgress={initialProgress}
              />
            </div>
          ) : (
            <Card className="py-16 text-center">
              <CardContent>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Headphones className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">今日播客尚未发布</h3>
                <p className="mt-2 text-muted-foreground">管理员正在准备精彩内容，请稍后再来~</p>
                <Button asChild className="mt-6">
                  <Link href="/problems">先逛逛题单</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
