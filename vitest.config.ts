import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      // Browser-side: Svelte components and pure-JS lib tests run in jsdom
      {
        plugins: [svelte({ hot: false })],
        resolve: { conditions: ['browser'] },
        test: {
          name: 'browser',
          environment: 'jsdom',
          globals: true,
          include: ['src/components/**/*.test.ts', 'src/lib/**/*.test.ts'],
          setupFiles: ['./vitest.setup.ts'],
        },
      },
      // Node-side: integrations and scripts run in node
      {
        test: {
          name: 'node',
          environment: 'node',
          globals: true,
          include: ['src/integrations/**/*.test.ts', 'scripts/**/*.test.ts'],
        },
      },
    ],
  },
});
