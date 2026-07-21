'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Rocket, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminPage() {
  const [strategy, setStrategy] = useState('progressive');
  const [problemId, setProblemId] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    jobId?: string;
    problemId?: string;
    error?: string;
  } | null>(null);

  const publishDaily = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({
          strategy,
          problemId: problemId || undefined,
        }),
      });
      const data = (await res.json()) as { jobId?: string; problemId?: string; error?: string };
      if (res.ok) {
        setResult({ success: true, jobId: data.jobId, problemId: data.problemId });
      } else {
        setResult({ success: false, error: data.error || '发布失败' });
      }
    } catch {
      setResult({ success: false, error: '网络错误' });
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
            <Rocket className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">LeetCast Admin</h1>
          <p className="text-muted-foreground">发布今日一题 & 选题策略配置</p>
        </div>

        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-base">发布设置</CardTitle>
            <CardDescription>选择策略或指定题目 ID 来发布今日播客</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Admin Token
              </Label>
              <Input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="请输入 Admin Token"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>选题策略</Label>
              <Select value={strategy} onValueChange={(v) => setStrategy(v ?? 'progressive')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="progressive">难度渐进</SelectItem>
                  <SelectItem value="classic">经典题单</SelectItem>
                  <SelectItem value="weakspot">弱项强化</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {strategy === 'progressive' && '根据用户完成数量自动从 Easy → Medium → Hard 递进'}
                {strategy === 'classic' && '按照题号顺序推进，类似 NeetCode 150 经典路线'}
                {strategy === 'weakspot' && '根据用户薄弱标签推荐相关题目'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>指定题目 ID（可选）</Label>
              <Input
                value={problemId}
                onChange={(e) => setProblemId(e.target.value)}
                placeholder="例如：1、2、3… 留空则按策略自动选题"
              />
            </div>

            <Button
              onClick={() => {
                void publishDaily();
              }}
              disabled={loading || !token}
              className="w-full gap-2"
              size="lg"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  发布中…
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  发布今日一题
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card
            className={`mt-6 border-l-4 ${result.success ? 'border-l-green-500' : 'border-l-red-500'}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
                )}
                <div className="flex-1">
                  <div className="font-semibold">{result.success ? '发布成功' : '发布失败'}</div>
                  {result.success ? (
                    <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                      <div>
                        Job ID: <Badge variant="secondary">{result.jobId}</Badge>
                      </div>
                      <div>
                        Problem ID: <Badge variant="secondary">{result.problemId}</Badge>
                      </div>
                      <div className="pt-1 text-green-500">
                        Worker 正在后台生成播客，请稍后刷新首页查看。
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 text-sm text-muted-foreground">{result.error}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
