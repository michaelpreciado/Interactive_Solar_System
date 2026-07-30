import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Forks rather than threads, with `--expose-gc`, so the allocation test in
    // `src/test/world.test.ts` can force a collection before measuring. Without
    // it, `heapUsed` reports whatever the young generation happens to be
    // holding -- including the test runner's own garbage -- and the assertion
    // measures V8 scheduling rather than allocation.
    pool: 'forks',
    poolOptions: {
      forks: { execArgv: ['--expose-gc'] },
    },

    // Engine and maths tests run in node (much faster); anything touching the
    // DOM opts into jsdom via the glob below.
    environment: 'node',
    environmentMatchGlobs: [
      ['src/ui/**', 'jsdom'],
      ['src/**/*.dom.test.{ts,tsx}', 'jsdom'],
    ],
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
});
