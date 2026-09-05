import type { Metadata, Viewport } from 'next';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

// We previously used `next/font/google` to self-host Inter, but the
// build-time fetch fails in sandboxed CI environments without outbound
// network. Tailwind's `font-sans` already resolves to a system stack
// (`ui-sans-serif, system-ui, ...`), so the visual result is similar.
// Set NEXT_USE_NEXT_FONT=1 in environments that can reach Google Fonts
// to opt back into self-hosted Inter (then re-add the import here).
const fontClass = '';

export const metadata: Metadata = {
  title: 'LeetCast - 每日一题播客',
  description: '程序员每天登录，听一集 LeetCode 解题讲解播客',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LeetCast',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={cn('dark', fontClass)} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
