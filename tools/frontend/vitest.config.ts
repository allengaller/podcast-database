import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.ts'],
    exclude: ['src/**/__tests__/**/*.e2e.test.ts', 'e2e/**'],
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.ts',
        'src/**/__tests__/**',
        'src/components/ui/**',
        'src/types/**',
        'src/auth.ts',
        'src/middleware.ts',
        'src/app/**/page.tsx',
        'src/app/**/layout.tsx',
        'src/app/**/error.tsx',
        'src/instrumentation.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});