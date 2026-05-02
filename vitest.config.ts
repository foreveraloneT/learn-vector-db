import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte({ hot: false })],
  resolve: {
    alias: {
      'astro:content': path.resolve('./src/__mocks__/astro-content.ts'),
      'astro/zod': path.resolve('./src/__mocks__/astro-zod.ts'),
      'astro/loaders': path.resolve('./src/__mocks__/astro-loaders.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    passWithNoTests: true,
  },
});
