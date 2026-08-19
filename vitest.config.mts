import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/**',
        'src/components/ui/**', // primitive shadcn
        '**/*.d.ts',
        '**/*.config.*',
        '.next/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve('./src'),
    },
  },
});
