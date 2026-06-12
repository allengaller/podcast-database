'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'frontend_error',
        message: error.message,
        componentStack: info.componentStack,
      })
    );
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-border/40 bg-muted/30 p-8 text-center">
          <div>
            <p className="text-lg font-semibold">出了点问题</p>
            <p className="mt-2 text-sm text-muted-foreground">
              页面渲染出错，请刷新页面重试。
            </p>
            <button
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              onClick={() => this.setState({ hasError: false })}
            >
              重试
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
