import { signIn } from '@/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

/**
 * Dev-only login page. The route is mounted at /login/dev but the
 * Credentials provider only exists when NODE_ENV !== 'production', so this
 * page intentionally returns 404 in production builds (see
 * src/app/login/dev/not-found.tsx for the matching response shape).
 */
export default async function DevLoginPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  void headers(); // ensure this is a server component (no static prerender)
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-950 p-4">
      <Card className="w-full max-w-sm border-border/40 bg-card/80 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Dev Login (E2E only)</CardTitle>
          <CardDescription>仅在 NODE_ENV !== production 下可用</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              'use server';
              const username = String(formData.get('username') ?? '').trim();
              if (!username) return;
              await signIn('dev', { username, redirectTo: '/' });
            }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="e2e-user"
                required
                defaultValue="e2e-user"
                data-testid="dev-username"
              />
            </div>
            <Button type="submit" className="w-full" data-testid="dev-submit">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
