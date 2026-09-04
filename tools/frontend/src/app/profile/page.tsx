import { auth } from '@/auth';
import { prisma } from '@leetcast/database';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Flame, Trophy, Headphones, BookOpen, Calendar } from 'lucide-react';
import Image from 'next/image';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const progress = await prisma.userProgress.findUnique({
    where: { userId: session.user.id },
  });

  const checkIns = await prisma.checkIn.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
    take: 30,
  });

  const histories = await prisma.playHistory.findMany({
    where: { userId: session.user.id },
    include: { podcast: { include: { problem: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
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
              <Link href="/leaderboard">
                <Trophy className="mr-2 h-4 w-4" />
                排行榜
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* 用户信息 */}
        <div className="mb-8 flex items-center gap-4">
          <Image
            src={session.user.image || ''}
            alt=""
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-full ring-2 ring-border"
          />
          <div>
            <h1 className="text-2xl font-bold">{session.user.name}</h1>
            <p className="text-muted-foreground">{session.user.email}</p>
          </div>
        </div>

        {/* 统计 */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
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
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500/10 text-pink-500">
                <Calendar className="h-5 w-5" />
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

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto">
            <TabsTrigger value="history">最近收听</TabsTrigger>
            <TabsTrigger value="checkins">打卡记录</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-4">
            <div className="space-y-3">
              {histories.map((h) => (
                <Card key={h.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-semibold">
                        {h.podcast.problem.id}. {h.podcast.problem.title}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        进度 {Math.floor(h.progress / 60)}:
                        {(h.progress % 60).toString().padStart(2, '0')} /{' '}
                        {h.completed ? (
                          <Badge
                            variant="outline"
                            className="ml-1 border-green-500/30 text-green-400"
                          >
                            已完成
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="ml-1">
                            学习中
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {histories.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">暂无收听记录</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="checkins" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">最近 30 天打卡</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {checkIns.map((c) => (
                    <Badge
                      key={c.id}
                      variant="outline"
                      className="border-green-500/30 text-green-400"
                    >
                      {new Date(c.date).toLocaleDateString('zh-CN')}
                    </Badge>
                  ))}
                  {checkIns.length === 0 && (
                    <span className="text-muted-foreground">暂无打卡记录，快去听今日一题吧！</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
