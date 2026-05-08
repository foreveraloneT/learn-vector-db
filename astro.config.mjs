// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import sitemap from '@astrojs/sitemap';
import { validateTopicsIntegration } from './src/integrations/validate-topics';

export default defineConfig({
  site: 'https://example.github.io',
  base: '/',
  i18n: {
    defaultLocale: 'th',
    locales: ['th', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    svelte(),
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    sitemap({
      i18n: {
        defaultLocale: 'th',
        locales: { th: 'th-TH', en: 'en-US' },
      },
    }),
    validateTopicsIntegration(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
