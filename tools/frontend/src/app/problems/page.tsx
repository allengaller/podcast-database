import Link from 'next/link';
import { prisma } from '@leetcast/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Trophy, User } from 'lucide-react';

export const revalidate = 60;

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: { q?: string; difficulty?: string; topic?: string };
}) {
  const q = searchParams.q || '';
  const difficulty = searchParams.difficulty;
  const topic = searchParams.topic;

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { id: { contains: q } }];
  }
  if (difficulty) where.difficulty = difficulty;
  if (topic) where.topics = { has: topic };

  const problems = await prisma.problem.findMany({
    where,
    orderBy: { id: 'asc' },
    take: 50,
  });

  const allTopics = Array.from(
    new Set((await prisma.problem.findMany({ select: { topics: true } })).flatMap((p) => p.topics))
  ).slice(0, 30);

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
              <Link href="/leaderboard">
                <Trophy className="mr-2 h-4 w-4" />
                排行榜
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

      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-extrabold tracking-tight">题单浏览</h1>

        <form className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="搜索题目" className="pl-9" />
          </div>
          <Select name="difficulty" defaultValue={difficulty || 'all'}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="全部难度" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部难度</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select name="topic" defaultValue={topic || 'all'}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="全部标签" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部标签</SelectItem>
              {allTopics.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit">筛选</Button>
        </form>

        <div className="grid gap-3">
          {problems.map((p) => (
            <Card key={p.id} className="transition hover:border-indigo-500/30">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="font-semibold">
                    {p.id}. {p.title}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        p.difficulty === 'Easy'
                          ? 'border-green-500/30 text-green-400'
                          : p.difficulty === 'Medium'
                            ? 'border-yellow-500/30 text-yellow-400'
                            : 'border-red-500/30 text-red-400'
                      }
                    >
                      {p.difficulty}
                    </Badge>
                    {p.topics.slice(0, 4).map((t) => (
                      <Badge key={t} variant="secondary" className="font-normal">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {problems.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">没有找到匹配的题目</div>
          )}
        </div>
      </div>
    </main>
  );
}
