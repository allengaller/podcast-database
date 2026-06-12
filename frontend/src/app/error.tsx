'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <span className="text-2xl">!</span>
        </div>
        <h2 className="text-xl font-semibold">页面加载失败</h2>
        <p className="mt-2 text-muted-foreground">
          {error.message || '遇到了未知错误，请稍后重试'}
        </p>
        <button
          className="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          onClick={reset}
        >
          重新加载
        </button>
      </div>
    </div>
  );
}
