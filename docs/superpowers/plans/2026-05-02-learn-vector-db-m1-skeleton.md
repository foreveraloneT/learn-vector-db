# Learn Vector DB — M1 (Skeleton) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a deployed bilingual (TH default + EN) Astro site with sidebar nav, theme toggle, prev/next, language switch, content collections, MDX + KaTeX, and a CI/CD pipeline. One placeholder topic ("Vector") in both locales is enough — no interactive demos yet.

**Architecture:** Astro 5 static site. Tailwind v4 via Vite plugin (CSS-first config). Svelte 5 islands (only the theme toggle in M1). MDX + remark-math + rehype-katex. Astro Content Collections drive the sidebar, prev/next, and pages. Astro built-in i18n with `defaultLocale: "th"` and `prefixDefaultLocale: false` (TH at root, EN under `/en`). Build-time integration hook validates translation parity. Deployed to GitHub Pages via Actions.

**Tech Stack:** Astro 5, Tailwind v4, Svelte 5, MDX, KaTeX (via remark-math + rehype-katex), TypeScript strict, Vitest + @testing-library/svelte, pnpm, Node 20.

**Spec reference:** `docs/superpowers/specs/2026-05-02-learn-vector-db-design.md` (M1 corresponds to §14, Milestone M1).

---

## Out of scope for M1

The following are deferred to later milestones — do **not** implement in this plan even if it feels natural to do so.

- Math helpers in `src/lib/math/` (deferred to M2; first island uses them)
- Any interactive Svelte islands beyond the theme toggle (M2–M4)
- Embedding fixture pipeline in `scripts/` (M3)
- Content beyond a placeholder Topic 1 (M2–M4)
- Sitemap, OG/Twitter metadata (M5)
- ESLint, Husky, lint-staged (M5; Prettier is in M1)
- Lighthouse CI (M5)

## Pre-flight

- The repo is a fresh Git repo on `main` containing only `CLAUDE.md` and `docs/`.
- Work directly on `main` for M1; later milestones can use feature branches.
- Commit at every "Commit" step. Commit messages follow conventional commits.

## File structure (M1)

```
.github/workflows/
├─ ci.yml                                  # CREATE
└─ deploy.yml                              # CREATE
src/
├─ components/
│  ├─ layout/
│  │  ├─ Sidebar.astro                     # CREATE — data-driven from collection
│  │  ├─ ThemeToggle.svelte                # CREATE — Svelte 5 island
│  │  ├─ LangSwitch.astro                  # CREATE
│  │  └─ PrevNext.astro                    # CREATE
│  └─ mdx/
│     ├─ Callout.astro                     # CREATE
│     ├─ Details.astro                     # CREATE
│     ├─ TryYourself.astro                 # CREATE
│     ├─ Takeaways.astro                   # CREATE
│     └─ Takeaway.astro                    # CREATE
├─ content.config.ts                       # CREATE — collection schema
├─ content/topics/
│  ├─ th/01-vector.mdx                     # CREATE — placeholder
│  └─ en/01-vector.mdx                     # CREATE — placeholder
├─ integrations/
│  └─ validate-topics.ts                   # CREATE — Astro integration
├─ layouts/
│  └─ TopicLayout.astro                    # CREATE
├─ lib/
│  ├─ i18n.ts                              # CREATE — pure helpers
│  ├─ i18n.test.ts                         # CREATE — Vitest
│  ├─ topics.ts                            # CREATE — pure helpers
│  ├─ topics.test.ts                       # CREATE — Vitest
│  └─ validate-topics.ts                   # CREATE — pure validator
│  └─ validate-topics.test.ts              # CREATE — Vitest
├─ pages/
│  ├─ index.astro                          # CREATE — TH home
│  ├─ [slug].astro                         # CREATE — TH topic
│  ├─ 404.astro                            # CREATE — TH 404
│  └─ en/
│     ├─ index.astro                       # CREATE — EN home
│     ├─ [slug].astro                      # CREATE — EN topic
│     └─ 404.astro                         # CREATE — EN 404
├─ styles/
│  └─ global.css                           # CREATE — Tailwind + theme + KaTeX
└─ env.d.ts                                # MODIFY — add Svelte types
public/
└─ favicon.svg                             # CREATE — minimal placeholder
astro.config.mjs                            # MODIFY — integrations + i18n
package.json                                # MODIFY — scripts + deps
tsconfig.json                               # CREATE/MODIFY — strict
vitest.config.ts                            # CREATE
.prettierrc                                 # CREATE
.prettierignore                             # CREATE
.gitignore                                  # MODIFY — Astro defaults
README.md                                   # CREATE
```

---

## Task 1: Initialize Astro project with pnpm

**Files:** `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `src/env.d.ts`

- [ ] **Step 1.1:** Confirm pnpm is available

Run: `pnpm --version`
Expected: prints a version (≥ 9). If missing: `npm i -g pnpm`.

- [ ] **Step 1.2:** Run the Astro create wizard non-interactively

Run from repo root:
```bash
pnpm create astro@latest . -- --template minimal --typescript strict --install --no-git --skip-houston --yes
```
Expected: Astro initializes in the current directory, installs deps. The `--no-git` flag prevents reinitializing the existing repo. The `--yes` flag auto-confirms "directory not empty" since we already have `CLAUDE.md` and `docs/`.

If the wizard refuses because the directory contains files, run instead in a temp directory and copy the generated files in:
```bash
mkdir -p /tmp/astro-bootstrap
cd /tmp/astro-bootstrap && pnpm create astro@latest . -- --template minimal --typescript strict --install --no-git --skip-houston --yes
# Then copy non-existent files into the project:
rsync -a --ignore-existing /tmp/astro-bootstrap/ /Users/sutee/Documents/Workspace/foreveraloneT/learn-vector-db/
```

- [ ] **Step 1.3:** Verify the dev server starts

Run: `pnpm dev`
Expected: server starts on `http://localhost:4321` and prints "watching for changes". Hit Ctrl-C to stop.

- [ ] **Step 1.4:** Commit

```bash
git add .
git commit -m "chore: scaffold Astro 5 project with TypeScript strict"
```

---

## Task 2: Add Tailwind CSS v4

**Files:** `package.json`, `astro.config.mjs`, `src/styles/global.css`

- [ ] **Step 2.1:** Run the Astro Tailwind add command

Run: `pnpm astro add tailwind --yes`
Expected: installs `@tailwindcss/vite` and `tailwindcss`, adds the Vite plugin to `astro.config.mjs`, creates `src/styles/global.css` containing `@import "tailwindcss";`.

- [ ] **Step 2.2:** Verify the integration

Run: `pnpm astro check`
Expected: 0 errors.

Run: `pnpm dev`, open `http://localhost:4321`, view source.
Expected: Tailwind reset CSS is present.

- [ ] **Step 2.3:** Commit

```bash
git add .
git commit -m "chore: add Tailwind CSS v4 via @tailwindcss/vite"
```

---

## Task 3: Add Svelte 5 integration

**Files:** `package.json`, `astro.config.mjs`, `src/env.d.ts`

- [ ] **Step 3.1:** Run the Astro Svelte add command

Run: `pnpm astro add svelte --yes`
Expected: installs `@astrojs/svelte` and `svelte` (≥ 5.x), adds `svelte()` to `integrations: []` in `astro.config.mjs`, ensures `svelte.config.js` exists.

- [ ] **Step 3.2:** Verify Svelte 5 was installed

Run: `pnpm list svelte`
Expected: prints `svelte 5.x.x`.

- [ ] **Step 3.3:** Commit

```bash
git add .
git commit -m "chore: add Svelte 5 integration"
```

---

## Task 4: Add MDX integration

**Files:** `package.json`, `astro.config.mjs`

- [ ] **Step 4.1:** Run the Astro MDX add command

Run: `pnpm astro add mdx --yes`
Expected: installs `@astrojs/mdx`, adds `mdx()` to integrations.

- [ ] **Step 4.2:** Commit

```bash
git add .
git commit -m "chore: add MDX integration"
```

---

## Task 5: Add KaTeX dependencies and wire into MDX

**Files:** `package.json`, `astro.config.mjs`, `src/styles/global.css`

- [ ] **Step 5.1:** Install KaTeX dependencies

Run:
```bash
pnpm add remark-math rehype-katex katex
```
Expected: three packages added under `dependencies`.

- [ ] **Step 5.2:** Edit `astro.config.mjs` to register the math plugins

The full file should look like this (preserve any other integrations you already have):

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

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
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

> **Note:** Replace `site` with the actual GitHub Pages URL once known (e.g., `https://<user>.github.io`). For a project page, also set `base: '/learn-vector-db/'`. This can be deferred until the deploy task.

- [ ] **Step 5.3:** Add KaTeX CSS to `src/styles/global.css`

Append at the end of the file (we will overwrite this whole file in Task 8 — for now, just the import):

```css
@import "tailwindcss";
@import "katex/dist/katex.min.css";
```

- [ ] **Step 5.4:** Verify the build still passes

Run: `pnpm astro check && pnpm build`
Expected: build succeeds with no errors. (The site will look empty — no pages yet.)

- [ ] **Step 5.5:** Commit

```bash
git add .
git commit -m "feat: wire remark-math + rehype-katex + KaTeX CSS into MDX"
```

---

## Task 6: Set up Vitest + @testing-library/svelte

**Files:** `package.json`, `vitest.config.ts`

- [ ] **Step 6.1:** Install dev dependencies

Run:
```bash
pnpm add -D vitest @vitest/ui jsdom @testing-library/svelte @testing-library/jest-dom @testing-library/user-event @sveltejs/vite-plugin-svelte
```

> `@sveltejs/vite-plugin-svelte` is needed by `vitest.config.ts` to compile `.svelte` files in tests; it's already a transitive dep of `@astrojs/svelte`, but installing explicitly avoids relying on hoisting.

- [ ] **Step 6.2:** Create `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: false })],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

- [ ] **Step 6.3:** Create `vitest.setup.ts`

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6.4:** Add test scripts to `package.json`

In `package.json`, add to `"scripts"`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "astro check && tsc --noEmit"
  }
}
```

- [ ] **Step 6.5:** Verify Vitest runs (with no tests yet)

Run: `pnpm test`
Expected: "No test files found" (this is fine; Vitest exits 0 unless you set `passWithNoTests: false`). If it errors out about no test files, add `passWithNoTests: true` under `test:` in `vitest.config.ts`.

- [ ] **Step 6.6:** Commit

```bash
git add .
git commit -m "chore: configure Vitest + @testing-library/svelte"
```

---

## Task 7: Configure global Tailwind theme + dark mode + typography

**Files:** `src/styles/global.css`, `package.json`

- [ ] **Step 7.1:** Install the typography plugin

Run: `pnpm add -D @tailwindcss/typography`

- [ ] **Step 7.2:** Replace `src/styles/global.css` with the full theme

```css
@import "tailwindcss";
@import "katex/dist/katex.min.css";
@plugin "@tailwindcss/typography";

/* Selector-based dark mode: toggled by adding `class="dark"` to <html> */
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* Brand palette — defaults; can be tuned in M5 polish */
  --color-brand-50:  oklch(0.97 0.02 250);
  --color-brand-100: oklch(0.93 0.05 250);
  --color-brand-300: oklch(0.78 0.13 250);
  --color-brand-500: oklch(0.55 0.18 250);
  --color-brand-700: oklch(0.40 0.16 250);
  --color-brand-900: oklch(0.22 0.10 250);

  /* Font stack — system fonts (no web font download) */
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Thai", sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "JetBrains Mono", Consolas, monospace;
}

/* Apply base typography defaults */
:root {
  color-scheme: light;
}
:root.dark {
  color-scheme: dark;
}

html {
  font-family: var(--font-sans);
}
```

- [ ] **Step 7.3:** Verify the build

Run: `pnpm build`
Expected: no errors.

- [ ] **Step 7.4:** Commit

```bash
git add .
git commit -m "feat: configure Tailwind v4 theme, dark mode, typography plugin"
```

---

## Task 8: Set up TypeScript strict + Svelte types in env.d.ts

**Files:** `tsconfig.json`, `src/env.d.ts`

- [ ] **Step 8.1:** Verify `tsconfig.json` extends Astro strict

Open `tsconfig.json`. It should look like this; if not, replace with:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

- [ ] **Step 8.2:** Verify `src/env.d.ts` references Astro client types

It should contain (at minimum):

```ts
/// <reference path="../.astro/types.d.ts" />
```

- [ ] **Step 8.3:** Run typecheck

Run: `pnpm typecheck`
Expected: 0 errors.

- [ ] **Step 8.4:** Commit (only if files changed)

```bash
git add .
git commit -m "chore: enable TypeScript strict + Vitest globals"
```

---

## Task 9: Define the content collection schema

**Files:** `src/content.config.ts`

- [ ] **Step 9.1:** Create `src/content.config.ts`

```ts
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

export const TOPIC_GROUPS = ['math', 'vector-db', 'real-world'] as const;
export const LOCALES = ['th', 'en'] as const;

const topics = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/topics' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    group: z.enum(TOPIC_GROUPS),
    order: z.number().int().positive(),
    locale: z.enum(LOCALES),
    summary: z.string(),
    hasInteractive: z.boolean().default(false),
    interactiveComponent: z.string().optional(),
    hasMath: z.boolean().default(false),
    updated: z.coerce.date().optional(),
  }),
});

export const collections = { topics };
```

- [ ] **Step 9.2:** Run sync to confirm schema parses

Run: `pnpm astro sync`
Expected: completes without errors. (The collection has 0 entries — that's fine.)

- [ ] **Step 9.3:** Commit

```bash
git add src/content.config.ts
git commit -m "feat: define topics content collection schema"
```

---

## Task 10: Add placeholder Topic 1 ("Vector") in TH and EN

**Files:** `src/content/topics/th/01-vector.mdx`, `src/content/topics/en/01-vector.mdx`

- [ ] **Step 10.1:** Create the directory tree

```bash
mkdir -p src/content/topics/th src/content/topics/en
```

- [ ] **Step 10.2:** Create `src/content/topics/th/01-vector.mdx`

```mdx
---
title: เวกเตอร์
slug: vector
group: math
order: 1
locale: th
summary: เวกเตอร์คือลูกศรที่มีทั้งความยาวและทิศทาง
hasInteractive: false
hasMath: false
---

## ทำความเข้าใจ

ลองนึกภาพลูกศรที่วาดบนกระดาษ ลูกศรมีจุดเริ่มต้นและปลายทาง — นั่นคือเวกเตอร์ในรูปแบบที่ง่ายที่สุด

## ในโลกจริง

ฐานข้อมูลเวกเตอร์เก็บประโยค รูปภาพ หรือเสียงในรูปของเวกเตอร์ที่มีหลายมิติ เพื่อให้สามารถค้นหาสิ่งที่ "ใกล้เคียง" กันได้

## สรุป

- เวกเตอร์มีทั้งความยาวและทิศทาง
- ในฐานข้อมูลเวกเตอร์ ทุกอย่างถูกเก็บเป็นเวกเตอร์
```

- [ ] **Step 10.3:** Create `src/content/topics/en/01-vector.mdx`

```mdx
---
title: Vector
slug: vector
group: math
order: 1
locale: en
summary: A vector is an arrow with both length and direction.
hasInteractive: false
hasMath: false
---

## Intuition

Imagine an arrow drawn on a piece of paper. The arrow has a starting point and an ending point — that is a vector in its simplest form.

## In the real world

Vector databases store sentences, images, or audio as high-dimensional vectors so that you can find things that are "close" to each other.

## Key takeaways

- A vector has both length and direction.
- In a vector database, everything is stored as a vector.
```

- [ ] **Step 10.4:** Run sync to confirm both entries load

Run: `pnpm astro sync`
Expected: 0 errors. The generated `.astro/content.d.ts` should now include the topic types.

- [ ] **Step 10.5:** Commit

```bash
git add src/content/topics
git commit -m "feat: add placeholder Vector topic in TH and EN"
```

---

## Task 11: i18n helpers (TDD)

**Files:** `src/lib/i18n.ts`, `src/lib/i18n.test.ts`

- [ ] **Step 11.1:** Write failing tests in `src/lib/i18n.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import {
  getOtherLocale,
  buildTopicPath,
  getOtherLocaleUrl,
  isLocale,
} from './i18n';

describe('isLocale', () => {
  it('accepts th and en', () => {
    expect(isLocale('th')).toBe(true);
    expect(isLocale('en')).toBe(true);
  });
  it('rejects everything else', () => {
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('')).toBe(false);
    expect(isLocale('TH')).toBe(false);
  });
});

describe('getOtherLocale', () => {
  it('returns en when given th', () => {
    expect(getOtherLocale('th')).toBe('en');
  });
  it('returns th when given en', () => {
    expect(getOtherLocale('en')).toBe('th');
  });
});

describe('buildTopicPath', () => {
  it('builds a TH topic path with no prefix', () => {
    expect(buildTopicPath('th', 'vector')).toBe('/vector');
  });
  it('builds an EN topic path with /en prefix', () => {
    expect(buildTopicPath('en', 'vector')).toBe('/en/vector');
  });
  it('builds the TH home as /', () => {
    expect(buildTopicPath('th', '')).toBe('/');
  });
  it('builds the EN home as /en/', () => {
    expect(buildTopicPath('en', '')).toBe('/en/');
  });
});

describe('getOtherLocaleUrl', () => {
  it('flips a TH topic to EN', () => {
    expect(getOtherLocaleUrl('th', 'vector')).toBe('/en/vector');
  });
  it('flips an EN topic to TH', () => {
    expect(getOtherLocaleUrl('en', 'vector')).toBe('/vector');
  });
  it('flips the TH home to EN home', () => {
    expect(getOtherLocaleUrl('th', '')).toBe('/en/');
  });
});
```

- [ ] **Step 11.2:** Run tests, verify they fail

Run: `pnpm test src/lib/i18n.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 11.3:** Implement `src/lib/i18n.ts`

```ts
import { LOCALES } from '../content.config';

export type Locale = (typeof LOCALES)[number];

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function getOtherLocale(locale: Locale): Locale {
  return locale === 'th' ? 'en' : 'th';
}

export function buildTopicPath(locale: Locale, slug: string): string {
  const prefix = locale === 'th' ? '' : '/en';
  if (!slug) return prefix === '' ? '/' : `${prefix}/`;
  return `${prefix}/${slug}`;
}

export function getOtherLocaleUrl(currentLocale: Locale, slug: string): string {
  return buildTopicPath(getOtherLocale(currentLocale), slug);
}
```

- [ ] **Step 11.4:** Run tests, verify they pass

Run: `pnpm test src/lib/i18n.test.ts`
Expected: PASS — 4 test files, all green.

- [ ] **Step 11.5:** Commit

```bash
git add src/lib/i18n.ts src/lib/i18n.test.ts
git commit -m "feat(lib): add i18n helpers with tests"
```

---

## Task 12: Topics helpers (TDD)

**Files:** `src/lib/topics.ts`, `src/lib/topics.test.ts`

These are the pure functions used by Sidebar, PrevNext, and the dynamic topic pages.

- [ ] **Step 12.1:** Write failing tests in `src/lib/topics.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { getNeighbors, groupTopicsForSidebar, type TopicSummary } from './topics';

const sample: TopicSummary[] = [
  { slug: 'vector',              title: 'Vector',         group: 'math',       order: 1, locale: 'en' },
  { slug: 'vector-operations',   title: 'Vector ops',     group: 'math',       order: 2, locale: 'en' },
  { slug: 'distance-similarity', title: 'Distance',       group: 'math',       order: 3, locale: 'en' },
  { slug: 'embeddings',          title: 'Embeddings',     group: 'vector-db',  order: 6, locale: 'en' },
  { slug: 'semantic-search',     title: 'Semantic',       group: 'real-world', order: 9, locale: 'en' },
];

describe('getNeighbors', () => {
  it('returns null prev and the next topic at order 1', () => {
    const { prev, next } = getNeighbors(sample, 1);
    expect(prev).toBeNull();
    expect(next?.slug).toBe('vector-operations');
  });

  it('returns prev and next when not at boundary', () => {
    const { prev, next } = getNeighbors(sample, 2);
    expect(prev?.slug).toBe('vector');
    expect(next?.slug).toBe('distance-similarity');
  });

  it('returns null next at the last topic', () => {
    const { prev, next } = getNeighbors(sample, 9);
    expect(prev?.slug).toBe('embeddings');
    expect(next).toBeNull();
  });

  it('handles non-contiguous orders (gaps allowed)', () => {
    const { prev, next } = getNeighbors(sample, 3);
    expect(prev?.slug).toBe('vector-operations');
    expect(next?.slug).toBe('embeddings'); // skips order 4 and 5 — they don't exist
  });
});

describe('groupTopicsForSidebar', () => {
  it('groups by group and sorts by order within each group', () => {
    const groups = groupTopicsForSidebar(sample);
    expect(groups).toHaveLength(3);
    expect(groups[0].group).toBe('math');
    expect(groups[0].topics.map(t => t.slug)).toEqual([
      'vector', 'vector-operations', 'distance-similarity',
    ]);
    expect(groups[1].group).toBe('vector-db');
    expect(groups[2].group).toBe('real-world');
  });

  it('preserves the canonical group order even if input is shuffled', () => {
    const shuffled = [...sample].reverse();
    const groups = groupTopicsForSidebar(shuffled);
    expect(groups.map(g => g.group)).toEqual(['math', 'vector-db', 'real-world']);
  });

  it('omits groups with no topics', () => {
    const onlyMath = sample.filter(t => t.group === 'math');
    const groups = groupTopicsForSidebar(onlyMath);
    expect(groups).toHaveLength(1);
    expect(groups[0].group).toBe('math');
  });
});
```

- [ ] **Step 12.2:** Run tests, verify they fail

Run: `pnpm test src/lib/topics.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 12.3:** Implement `src/lib/topics.ts`

```ts
import { TOPIC_GROUPS } from './constants';
import type { Locale } from './i18n';

export type TopicGroup = (typeof TOPIC_GROUPS)[number];

export interface TopicSummary {
  slug: string;
  title: string;
  group: TopicGroup;
  order: number;
  locale: Locale;
}

export interface SidebarGroup {
  group: TopicGroup;
  topics: TopicSummary[];
}

export function getNeighbors(
  topics: TopicSummary[],
  currentOrder: number,
): { prev: TopicSummary | null; next: TopicSummary | null } {
  const sorted = [...topics].sort((a, b) => a.order - b.order);
  const prev = [...sorted].reverse().find(t => t.order < currentOrder) ?? null;
  const next = sorted.find(t => t.order > currentOrder) ?? null;
  return { prev, next };
}

export function groupTopicsForSidebar(topics: TopicSummary[]): SidebarGroup[] {
  return TOPIC_GROUPS
    .map(group => ({
      group,
      topics: topics
        .filter(t => t.group === group)
        .sort((a, b) => a.order - b.order),
    }))
    .filter(g => g.topics.length > 0);
}
```

- [ ] **Step 12.4:** Run tests, verify they pass

Run: `pnpm test src/lib/topics.test.ts`
Expected: PASS — 7 tests green.

- [ ] **Step 12.5:** Commit

```bash
git add src/lib/topics.ts src/lib/topics.test.ts
git commit -m "feat(lib): add topics helpers (getNeighbors, groupTopicsForSidebar) with tests"
```

---

## Task 13: Translation parity validator (TDD)

**Files:** `src/lib/validate-topics.ts`, `src/lib/validate-topics.test.ts`

This pure function powers the Astro integration in Task 14.

- [ ] **Step 13.1:** Write failing tests in `src/lib/validate-topics.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { validateTopicParity, type ValidatableTopic } from './validate-topics';

const okTopics: ValidatableTopic[] = [
  { slug: 'vector', locale: 'th', order: 1, interactiveComponent: undefined },
  { slug: 'vector', locale: 'en', order: 1, interactiveComponent: undefined },
];

describe('validateTopicParity', () => {
  it('passes when every slug has both locales and orders are unique per locale', () => {
    const result = validateTopicParity(okTopics, ['VectorPlayground']);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('fails when a slug is missing in one locale', () => {
    const topics: ValidatableTopic[] = [
      { slug: 'vector', locale: 'th', order: 1 },
      // no en/vector
    ];
    const result = validateTopicParity(topics, []);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Missing translation: slug "vector" exists in th but not en');
  });

  it('fails on duplicate order within a locale', () => {
    const topics: ValidatableTopic[] = [
      { slug: 'vector',             locale: 'th', order: 1 },
      { slug: 'vector-operations',  locale: 'th', order: 1 },
      { slug: 'vector',             locale: 'en', order: 1 },
      { slug: 'vector-operations',  locale: 'en', order: 2 },
    ];
    const result = validateTopicParity(topics, []);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.includes('Duplicate order 1 in locale "th"'))).toBe(true);
  });

  it('fails when interactiveComponent name is not in the registry', () => {
    const topics: ValidatableTopic[] = [
      { slug: 'vector', locale: 'th', order: 1, interactiveComponent: 'NopeComponent' },
      { slug: 'vector', locale: 'en', order: 1, interactiveComponent: 'NopeComponent' },
    ];
    const result = validateTopicParity(topics, ['VectorPlayground']);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.includes('Unknown interactiveComponent "NopeComponent"'))).toBe(true);
  });

  it('passes when interactiveComponent name is in the registry', () => {
    const topics: ValidatableTopic[] = [
      { slug: 'vector', locale: 'th', order: 1, interactiveComponent: 'VectorPlayground' },
      { slug: 'vector', locale: 'en', order: 1, interactiveComponent: 'VectorPlayground' },
    ];
    const result = validateTopicParity(topics, ['VectorPlayground']);
    expect(result.ok).toBe(true);
  });
});
```

- [ ] **Step 13.2:** Run tests, verify they fail

Run: `pnpm test src/lib/validate-topics.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 13.3:** Implement `src/lib/validate-topics.ts`

```ts
import { LOCALES } from './constants';
import type { Locale } from './i18n';

export interface ValidatableTopic {
  slug: string;
  locale: Locale;
  order: number;
  interactiveComponent?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export function validateTopicParity(
  topics: ValidatableTopic[],
  knownInteractiveComponents: string[],
): ValidationResult {
  const errors: string[] = [];

  // 1. Translation parity: every slug must exist in every locale
  const slugsByLocale = new Map<Locale, Set<string>>();
  for (const locale of LOCALES) slugsByLocale.set(locale, new Set());
  for (const t of topics) slugsByLocale.get(t.locale)?.add(t.slug);

  const allSlugs = new Set(topics.map(t => t.slug));
  for (const slug of allSlugs) {
    for (const locale of LOCALES) {
      if (!slugsByLocale.get(locale)?.has(slug)) {
        const presentIn = LOCALES.find(l => slugsByLocale.get(l)?.has(slug));
        errors.push(`Missing translation: slug "${slug}" exists in ${presentIn} but not ${locale}`);
      }
    }
  }

  // 2. Order uniqueness within locale
  for (const locale of LOCALES) {
    const seen = new Map<number, string>();
    for (const t of topics.filter(x => x.locale === locale)) {
      if (seen.has(t.order)) {
        errors.push(
          `Duplicate order ${t.order} in locale "${locale}": "${seen.get(t.order)}" and "${t.slug}"`,
        );
      } else {
        seen.set(t.order, t.slug);
      }
    }
  }

  // 3. interactiveComponent must resolve
  for (const t of topics) {
    if (t.interactiveComponent && !knownInteractiveComponents.includes(t.interactiveComponent)) {
      errors.push(
        `Unknown interactiveComponent "${t.interactiveComponent}" on "${t.locale}/${t.slug}"`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}
```

- [ ] **Step 13.4:** Run tests, verify they pass

Run: `pnpm test src/lib/validate-topics.test.ts`
Expected: PASS — 5 tests green.

- [ ] **Step 13.5:** Commit

```bash
git add src/lib/validate-topics.ts src/lib/validate-topics.test.ts
git commit -m "feat(lib): add topic parity validator with tests"
```

---

## Task 14: Custom Astro integration that runs the validator at build start

**Files:** `src/integrations/validate-topics.ts`, `astro.config.mjs`

- [ ] **Step 14.1:** Implement the integration

Create `src/integrations/validate-topics.ts`:

```ts
import type { AstroIntegration } from 'astro';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import matter from 'gray-matter';
import { validateTopicParity, type ValidatableTopic } from '../lib/validate-topics';

async function listIslandComponents(srcRoot: URL): Promise<string[]> {
  const islandsDir = join(fileURLToPath(srcRoot), 'components', 'islands');
  try {
    const entries = await readdir(islandsDir);
    return entries
      .filter(f => f.endsWith('.svelte'))
      .map(f => f.replace(/\.svelte$/, ''));
  } catch {
    return []; // no islands directory yet → empty allow-list
  }
}

async function listTopicFrontmatter(srcRoot: URL): Promise<ValidatableTopic[]> {
  const root = join(fileURLToPath(srcRoot), 'content', 'topics');
  const result: ValidatableTopic[] = [];
  for (const locale of ['th', 'en'] as const) {
    let files: string[] = [];
    try {
      files = await readdir(join(root, locale));
    } catch {
      continue;
    }
    for (const file of files) {
      if (!file.endsWith('.mdx')) continue;
      const raw = await readFile(join(root, locale, file), 'utf-8');
      const { data } = matter(raw);
      result.push({
        slug: String(data.slug),
        locale,
        order: Number(data.order),
        interactiveComponent: data.interactiveComponent
          ? String(data.interactiveComponent)
          : undefined,
      });
    }
  }
  return result;
}

export function validateTopicsIntegration(): AstroIntegration {
  return {
    name: 'validate-topics',
    hooks: {
      'astro:build:start': async ({ logger }) => {
        // `srcDir` is available in newer hook signatures; compute via process.cwd()
        const srcRoot = new URL('./src/', `file://${process.cwd()}/`);
        const [topics, islands] = await Promise.all([
          listTopicFrontmatter(srcRoot),
          listIslandComponents(srcRoot),
        ]);
        const result = validateTopicParity(topics, islands);
        if (!result.ok) {
          for (const err of result.errors) logger.error(err);
          throw new Error(`Topic validation failed with ${result.errors.length} error(s)`);
        }
        logger.info(`Topic validation passed (${topics.length} topics, ${islands.length} islands)`);
      },
    },
  };
}
```

- [ ] **Step 14.2:** Install `gray-matter`

Run: `pnpm add -D gray-matter`

- [ ] **Step 14.3:** Register the integration in `astro.config.mjs`

Add the import and entry in `integrations: []`:

```js
import { validateTopicsIntegration } from './src/integrations/validate-topics';
// ...
integrations: [
  svelte(),
  mdx({ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] }),
  validateTopicsIntegration(),
],
```

- [ ] **Step 14.4:** Verify the build runs the validator

Run: `pnpm build`
Expected: log line "Topic validation passed (2 topics, 0 islands)" and a successful build.

- [ ] **Step 14.5:** Verify it actually fails on bad input

Temporarily delete `src/content/topics/en/01-vector.mdx` and run `pnpm build`.
Expected: build fails with "Missing translation: slug \"vector\" exists in th but not en".
Restore the file: `git checkout -- src/content/topics/en/01-vector.mdx`.

- [ ] **Step 14.6:** Commit

```bash
git add src/integrations astro.config.mjs package.json
git commit -m "feat: add astro:build:start integration that validates topic parity"
```

---

## Task 15: ThemeToggle Svelte island (TDD)

**Files:** `src/components/layout/ThemeToggle.svelte`, `src/components/layout/ThemeToggle.test.ts`

- [ ] **Step 15.1:** Write the failing test

Create `src/components/layout/ThemeToggle.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ThemeToggle from './ThemeToggle.svelte';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('renders a button with an accessible label', () => {
    render(ThemeToggle);
    expect(screen.getByRole('button', { name: /theme/i })).toBeInTheDocument();
  });

  it('adds the `dark` class to <html> when toggled on', async () => {
    const user = userEvent.setup();
    render(ThemeToggle);
    await user.click(screen.getByRole('button', { name: /theme/i }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes the `dark` class when toggled twice', async () => {
    const user = userEvent.setup();
    render(ThemeToggle);
    const btn = screen.getByRole('button', { name: /theme/i });
    await user.click(btn);
    await user.click(btn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists the choice to localStorage', async () => {
    const user = userEvent.setup();
    render(ThemeToggle);
    await user.click(screen.getByRole('button', { name: /theme/i }));
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('reads the initial theme from localStorage on mount', () => {
    localStorage.setItem('theme', 'dark');
    render(ThemeToggle);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
```

- [ ] **Step 15.2:** Run the test, verify it fails

Run: `pnpm test ThemeToggle`
Expected: FAIL — `ThemeToggle.svelte` not found.

- [ ] **Step 15.3:** Implement `src/components/layout/ThemeToggle.svelte`

```svelte
<script lang="ts">
  let isDark = $state(false);

  $effect(() => {
    const stored = localStorage.getItem('theme');
    const initial =
      stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    isDark = initial;
    document.documentElement.classList.toggle('dark', initial);
  });

  function toggle() {
    isDark = !isDark;
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }
</script>

<button
  type="button"
  aria-label="Toggle theme"
  aria-pressed={isDark}
  onclick={toggle}
  class="rounded-md border border-brand-300 px-3 py-1 text-sm hover:bg-brand-50 dark:hover:bg-brand-900"
>
  {isDark ? '☾' : '☀'} <span class="sr-only">theme</span>
</button>
```

- [ ] **Step 15.4:** Run the test, verify it passes

Run: `pnpm test ThemeToggle`
Expected: PASS — 5 tests green.

- [ ] **Step 15.5:** Commit

```bash
git add src/components/layout/ThemeToggle.svelte src/components/layout/ThemeToggle.test.ts
git commit -m "feat(ui): add ThemeToggle Svelte island with localStorage persistence"
```

---

## Task 16: Sidebar.astro

**Files:** `src/components/layout/Sidebar.astro`

- [ ] **Step 16.1:** Implement the component

```astro
---
import { getCollection } from 'astro:content';
import { groupTopicsForSidebar, type TopicSummary } from '../../lib/topics';
import { buildTopicPath, type Locale } from '../../lib/i18n';

interface Props {
  locale: Locale;
  currentSlug?: string;
}

const { locale, currentSlug } = Astro.props;

const entries = await getCollection('topics', t => t.data.locale === locale);
const summaries: TopicSummary[] = entries.map(e => ({
  slug: e.data.slug,
  title: e.data.title,
  group: e.data.group,
  order: e.data.order,
  locale: e.data.locale,
}));
const groups = groupTopicsForSidebar(summaries);

const groupLabels: Record<typeof groups[number]['group'], Record<Locale, string>> = {
  'math':       { th: 'พื้นฐานคณิตศาสตร์', en: 'Math foundations' },
  'vector-db':  { th: 'ฐานข้อมูลเวกเตอร์',  en: 'Vector databases' },
  'real-world': { th: 'ตัวอย่างจริง',       en: 'Real-world examples' },
};
---

<nav aria-label="Topics" class="text-sm">
  {groups.map(({ group, topics }) => (
    <details open class="mb-4">
      <summary class="cursor-pointer font-semibold text-brand-700 dark:text-brand-300">
        {groupLabels[group][locale]}
      </summary>
      <ul class="mt-2 ml-2 space-y-1 border-l border-brand-100 pl-3 dark:border-brand-900">
        {topics.map(t => {
          const href = buildTopicPath(locale, t.slug);
          const isCurrent = t.slug === currentSlug;
          return (
            <li>
              <a
                href={href}
                aria-current={isCurrent ? 'page' : undefined}
                class:list={[
                  'block rounded px-2 py-1 hover:bg-brand-50 dark:hover:bg-brand-900',
                  isCurrent && 'bg-brand-100 font-medium dark:bg-brand-700',
                ]}
              >
                {t.title}
              </a>
            </li>
          );
        })}
      </ul>
    </details>
  ))}
</nav>
```

- [ ] **Step 16.2:** Verify Astro compiles it

Run: `pnpm astro check`
Expected: 0 errors.

- [ ] **Step 16.3:** Commit

```bash
git add src/components/layout/Sidebar.astro
git commit -m "feat(ui): add Sidebar component with collapsible groups and active highlight"
```

---

## Task 17: PrevNext.astro

**Files:** `src/components/layout/PrevNext.astro`

- [ ] **Step 17.1:** Implement

```astro
---
import { getCollection } from 'astro:content';
import { getNeighbors, type TopicSummary } from '../../lib/topics';
import { buildTopicPath, type Locale } from '../../lib/i18n';

interface Props {
  locale: Locale;
  currentOrder: number;
}

const { locale, currentOrder } = Astro.props;

const entries = await getCollection('topics', t => t.data.locale === locale);
const summaries: TopicSummary[] = entries.map(e => ({
  slug: e.data.slug,
  title: e.data.title,
  group: e.data.group,
  order: e.data.order,
  locale: e.data.locale,
}));

const { prev, next } = getNeighbors(summaries, currentOrder);

const labels = {
  th: { prev: 'ก่อนหน้า', next: 'ถัดไป' },
  en: { prev: 'Previous', next: 'Next' },
} as const;
---

<nav aria-label="Topic navigation" class="mt-12 flex justify-between border-t border-brand-100 pt-6 dark:border-brand-900">
  {prev ? (
    <a href={buildTopicPath(locale, prev.slug)} class="group">
      <span class="block text-xs text-brand-500">← {labels[locale].prev}</span>
      <span class="font-medium group-hover:underline">{prev.title}</span>
    </a>
  ) : <span />}
  {next ? (
    <a href={buildTopicPath(locale, next.slug)} class="group text-right">
      <span class="block text-xs text-brand-500">{labels[locale].next} →</span>
      <span class="font-medium group-hover:underline">{next.title}</span>
    </a>
  ) : <span />}
</nav>
```

- [ ] **Step 17.2:** Run check

Run: `pnpm astro check`
Expected: 0 errors.

- [ ] **Step 17.3:** Commit

```bash
git add src/components/layout/PrevNext.astro
git commit -m "feat(ui): add PrevNext nav with no-wrap boundaries"
```

---

## Task 18: LangSwitch.astro

**Files:** `src/components/layout/LangSwitch.astro`

- [ ] **Step 18.1:** Implement

```astro
---
import { getOtherLocaleUrl, getOtherLocale, type Locale } from '../../lib/i18n';

interface Props {
  locale: Locale;
  slug?: string;
}

const { locale, slug = '' } = Astro.props;
const otherLocale = getOtherLocale(locale);
const otherUrl = getOtherLocaleUrl(locale, slug);

const labels: Record<Locale, string> = { th: 'ไทย', en: 'English' };
---

<a
  href={otherUrl}
  hreflang={otherLocale}
  class="text-sm text-brand-700 hover:underline dark:text-brand-300"
>
  {labels[otherLocale]}
</a>
```

- [ ] **Step 18.2:** Run check

Run: `pnpm astro check`
Expected: 0 errors.

- [ ] **Step 18.3:** Commit

```bash
git add src/components/layout/LangSwitch.astro
git commit -m "feat(ui): add LangSwitch component"
```

---

## Task 19: MDX helper components

**Files:** `src/components/mdx/Callout.astro`, `Details.astro`, `TryYourself.astro`, `Takeaways.astro`, `Takeaway.astro`

These are minimal styled wrappers — keep them small.

- [ ] **Step 19.1:** Create `Callout.astro`

```astro
---
interface Props { type?: 'info' | 'tip' | 'warning' }
const { type = 'info' } = Astro.props;
const styles = {
  info:    'border-blue-300  bg-blue-50    dark:border-blue-700  dark:bg-blue-950',
  tip:     'border-green-300 bg-green-50   dark:border-green-700 dark:bg-green-950',
  warning: 'border-amber-300 bg-amber-50   dark:border-amber-700 dark:bg-amber-950',
}[type];
---
<aside class={`my-4 rounded-md border-l-4 px-4 py-3 ${styles}`}>
  <slot />
</aside>
```

- [ ] **Step 19.2:** Create `Details.astro`

```astro
---
interface Props { summary: string }
const { summary } = Astro.props;
---
<details class="my-4 rounded-md border border-brand-100 px-4 py-2 dark:border-brand-900">
  <summary class="cursor-pointer font-medium">{summary}</summary>
  <div class="mt-3 prose prose-sm dark:prose-invert">
    <slot />
  </div>
</details>
```

- [ ] **Step 19.3:** Create `TryYourself.astro`

```astro
---
---
<aside class="my-6 rounded-md border-2 border-dashed border-brand-300 bg-brand-50 px-4 py-3 dark:border-brand-700 dark:bg-brand-900">
  <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
    Try it yourself
  </p>
  <div class="prose prose-sm dark:prose-invert"><slot /></div>
</aside>
```

- [ ] **Step 19.4:** Create `Takeaways.astro`

```astro
---
---
<section class="my-6 rounded-md bg-brand-50 px-4 py-3 dark:bg-brand-900">
  <h3 class="m-0 mb-2 text-sm font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
    Key takeaways
  </h3>
  <ul class="m-0 list-disc pl-5">
    <slot />
  </ul>
</section>
```

- [ ] **Step 19.5:** Create `Takeaway.astro`

```astro
---
---
<li><slot /></li>
```

- [ ] **Step 19.6:** Run check

Run: `pnpm astro check`
Expected: 0 errors.

- [ ] **Step 19.7:** Commit

```bash
git add src/components/mdx
git commit -m "feat(ui): add MDX helper components (Callout, Details, TryYourself, Takeaways)"
```

---

## Task 20: TopicLayout.astro

**Files:** `src/layouts/TopicLayout.astro`

- [ ] **Step 20.1:** Implement

```astro
---
import '../styles/global.css';
import Sidebar from '../components/layout/Sidebar.astro';
import PrevNext from '../components/layout/PrevNext.astro';
import LangSwitch from '../components/layout/LangSwitch.astro';
import ThemeToggle from '../components/layout/ThemeToggle.svelte';
import type { Locale } from '../lib/i18n';

interface Props {
  title: string;
  summary: string;
  locale: Locale;
  slug: string;
  group: 'math' | 'vector-db' | 'real-world';
  order: number;
  hasMath?: boolean;
}

const { title, summary, locale, slug, group, order, hasMath = false } = Astro.props;

const groupLabels = {
  'math':       { th: 'พื้นฐานคณิตศาสตร์', en: 'Math foundations' },
  'vector-db':  { th: 'ฐานข้อมูลเวกเตอร์',  en: 'Vector databases' },
  'real-world': { th: 'ตัวอย่างจริง',       en: 'Real-world examples' },
} as const;
---

<!doctype html>
<html lang={locale}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={summary} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <script is:inline>
      // Apply theme before paint to avoid flash
      (() => {
        const stored = localStorage.getItem('theme');
        const dark = stored === 'dark' || (!stored && matchMedia('(prefers-color-scheme: dark)').matches);
        if (dark) document.documentElement.classList.add('dark');
      })();
    </script>
  </head>
  <body class="bg-white text-brand-900 antialiased dark:bg-brand-900 dark:text-brand-50">
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-brand-500 focus:px-3 focus:py-1 focus:text-white">
      {locale === 'th' ? 'ข้ามไปยังเนื้อหา' : 'Skip to content'}
    </a>
    <div class="mx-auto grid max-w-6xl gap-8 p-6 lg:grid-cols-[16rem_1fr]">
      <header class="lg:col-span-2 flex items-center justify-between border-b border-brand-100 pb-4 dark:border-brand-900">
        <a href={locale === 'th' ? '/' : '/en/'} class="font-semibold">Learn Vector DB</a>
        <div class="flex items-center gap-3">
          <LangSwitch locale={locale} slug={slug} />
          <ThemeToggle client:load />
        </div>
      </header>

      <details class="lg:hidden">
        <summary class="cursor-pointer font-medium">
          {locale === 'th' ? 'หัวข้อ' : 'Topics'}
        </summary>
        <Sidebar locale={locale} currentSlug={slug} />
      </details>
      <aside class="hidden lg:block">
        <Sidebar locale={locale} currentSlug={slug} />
      </aside>

      <main id="main">
        <p class="text-sm text-brand-500">{groupLabels[group][locale]}</p>
        <h1 class="mt-1 text-3xl font-bold">{title}</h1>
        <p class="mt-2 rounded-md bg-brand-50 px-4 py-3 text-brand-700 dark:bg-brand-900 dark:text-brand-100">
          {summary}
        </p>
        <article class="prose prose-brand mt-8 max-w-none dark:prose-invert">
          <slot />
        </article>
        <PrevNext locale={locale} currentOrder={order} />
        <footer class="mt-12 border-t border-brand-100 pt-4 text-xs text-brand-500 dark:border-brand-900">
          <a href="https://github.com/" class="hover:underline">
            {locale === 'th' ? 'ดู source code' : 'View source'}
          </a>
        </footer>
      </main>
    </div>
  </body>
</html>
```

> **Note on `hasMath`:** the prop is accepted for use in M2+ where we'll conditionally inject KaTeX styles based on it. In M1, KaTeX CSS is loaded globally via `global.css`; we'll narrow this in M5.

- [ ] **Step 20.2:** Run check

Run: `pnpm astro check`
Expected: 0 errors.

- [ ] **Step 20.3:** Commit

```bash
git add src/layouts/TopicLayout.astro
git commit -m "feat(ui): add TopicLayout with sidebar, prev/next, lang switch, theme toggle"
```

---

## Task 21: TH dynamic topic page

**Files:** `src/pages/[slug].astro`

- [ ] **Step 21.1:** Implement

```astro
---
import { getCollection, render } from 'astro:content';
import TopicLayout from '../layouts/TopicLayout.astro';

export async function getStaticPaths() {
  const entries = await getCollection('topics', t => t.data.locale === 'th');
  return entries.map(entry => ({
    params: { slug: entry.data.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---

<TopicLayout
  title={entry.data.title}
  summary={entry.data.summary}
  locale="th"
  slug={entry.data.slug}
  group={entry.data.group}
  order={entry.data.order}
  hasMath={entry.data.hasMath}
>
  <Content />
</TopicLayout>
```

- [ ] **Step 21.2:** Verify the page renders

Run: `pnpm dev` (background); visit `http://localhost:4321/vector`.
Expected: the placeholder Vector page renders with sidebar, title, summary, MDX content, prev/next (no prev since order 1, no next since only one topic).

Stop dev server.

- [ ] **Step 21.3:** Commit

```bash
git add src/pages/[slug].astro
git commit -m "feat(pages): add TH dynamic topic page"
```

---

## Task 22: TH index page

**Files:** `src/pages/index.astro`

- [ ] **Step 22.1:** Implement — redirect to first topic

For M1, the home page just lists the available topics in TH. (Real landing-page design happens in M5.)

```astro
---
import { getCollection } from 'astro:content';
import TopicLayout from '../layouts/TopicLayout.astro';
import { buildTopicPath } from '../lib/i18n';

const entries = await getCollection('topics', t => t.data.locale === 'th');
const sorted = entries.sort((a, b) => a.data.order - b.data.order);
---

<TopicLayout
  title="Learn Vector DB"
  summary="เรียนรู้คณิตศาสตร์เบื้องหลังฐานข้อมูลเวกเตอร์ ผ่านตัวอย่างที่จับต้องได้"
  locale="th"
  slug=""
  group="math"
  order={0}
>
  <p>เริ่มต้นกับหัวข้อใดหัวข้อหนึ่ง:</p>
  <ul>
    {sorted.map(e => (
      <li>
        <a href={buildTopicPath('th', e.data.slug)}>{e.data.title}</a> — {e.data.summary}
      </li>
    ))}
  </ul>
</TopicLayout>
```

- [ ] **Step 22.2:** Verify

Run: `pnpm dev`; visit `http://localhost:4321/`.
Expected: list of one topic.

- [ ] **Step 22.3:** Commit

```bash
git add src/pages/index.astro
git commit -m "feat(pages): add TH index page"
```

---

## Task 23: EN topic page and index

**Files:** `src/pages/en/[slug].astro`, `src/pages/en/index.astro`

- [ ] **Step 23.1:** Create `src/pages/en/[slug].astro` — same structure as TH but locale="en"

```astro
---
import { getCollection, render } from 'astro:content';
import TopicLayout from '../../layouts/TopicLayout.astro';

export async function getStaticPaths() {
  const entries = await getCollection('topics', t => t.data.locale === 'en');
  return entries.map(entry => ({
    params: { slug: entry.data.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---

<TopicLayout
  title={entry.data.title}
  summary={entry.data.summary}
  locale="en"
  slug={entry.data.slug}
  group={entry.data.group}
  order={entry.data.order}
  hasMath={entry.data.hasMath}
>
  <Content />
</TopicLayout>
```

- [ ] **Step 23.2:** Create `src/pages/en/index.astro`

```astro
---
import { getCollection } from 'astro:content';
import TopicLayout from '../../layouts/TopicLayout.astro';
import { buildTopicPath } from '../../lib/i18n';

const entries = await getCollection('topics', t => t.data.locale === 'en');
const sorted = entries.sort((a, b) => a.data.order - b.data.order);
---

<TopicLayout
  title="Learn Vector DB"
  summary="Learn the math behind vector databases through hands-on examples."
  locale="en"
  slug=""
  group="math"
  order={0}
>
  <p>Start with any topic:</p>
  <ul>
    {sorted.map(e => (
      <li>
        <a href={buildTopicPath('en', e.data.slug)}>{e.data.title}</a> — {e.data.summary}
      </li>
    ))}
  </ul>
</TopicLayout>
```

- [ ] **Step 23.3:** Verify

Run: `pnpm dev`; visit `http://localhost:4321/en/` and `http://localhost:4321/en/vector`.
Expected: pages render with EN content; LangSwitch links back to TH equivalents.

- [ ] **Step 23.4:** Commit

```bash
git add src/pages/en
git commit -m "feat(pages): add EN index and dynamic topic pages"
```

---

## Task 24: 404 pages (TH and EN)

**Files:** `src/pages/404.astro`, `src/pages/en/404.astro`

- [ ] **Step 24.1:** TH 404

```astro
---
import '../styles/global.css';
---
<!doctype html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <title>ไม่พบหน้าที่ต้องการ — Learn Vector DB</title>
  </head>
  <body class="flex min-h-screen items-center justify-center bg-white text-brand-900 dark:bg-brand-900 dark:text-brand-50">
    <div class="text-center">
      <p class="text-sm text-brand-500">404</p>
      <h1 class="mt-2 text-2xl font-semibold">ไม่พบหน้าที่ต้องการ</h1>
      <a href="/" class="mt-4 inline-block text-brand-700 underline dark:text-brand-300">กลับหน้าแรก</a>
    </div>
  </body>
</html>
```

- [ ] **Step 24.2:** EN 404

```astro
---
import '../../styles/global.css';
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Not found — Learn Vector DB</title>
  </head>
  <body class="flex min-h-screen items-center justify-center bg-white text-brand-900 dark:bg-brand-900 dark:text-brand-50">
    <div class="text-center">
      <p class="text-sm text-brand-500">404</p>
      <h1 class="mt-2 text-2xl font-semibold">Page not found</h1>
      <a href="/en/" class="mt-4 inline-block text-brand-700 underline dark:text-brand-300">Back home</a>
    </div>
  </body>
</html>
```

- [ ] **Step 24.3:** Commit

```bash
git add src/pages/404.astro src/pages/en/404.astro
git commit -m "feat(pages): add 404 pages for both locales"
```

---

## Task 25: Favicon placeholder

**Files:** `public/favicon.svg`

- [ ] **Step 25.1:** Create a minimal SVG favicon

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="oklch(0.55 0.18 250)"/>
  <text x="16" y="22" font-family="ui-sans-serif, system-ui, sans-serif" font-size="20" font-weight="700" text-anchor="middle" fill="white">v</text>
</svg>
```

- [ ] **Step 25.2:** Commit

```bash
git add public/favicon.svg
git commit -m "chore: add minimal SVG favicon"
```

---

## Task 26: Production build smoke test

**Files:** none

- [ ] **Step 26.1:** Run the full build

Run: `pnpm typecheck && pnpm test && pnpm build`
Expected: all three pass with 0 errors.

- [ ] **Step 26.2:** Preview the built site

Run: `pnpm preview`
Visit:
- `http://localhost:4321/` (TH home)
- `http://localhost:4321/vector` (TH topic)
- `http://localhost:4321/en/` (EN home)
- `http://localhost:4321/en/vector` (EN topic)
- `http://localhost:4321/does-not-exist` (404)

Expected on every page: sidebar renders, theme toggle works, LangSwitch flips locales while preserving slug, prev/next renders correctly (no prev on order 1).

Stop preview server.

---

## Task 27: Prettier config

**Files:** `.prettierrc`, `.prettierignore`, `package.json`

- [ ] **Step 27.1:** Install Prettier and Astro/Svelte plugins

Run:
```bash
pnpm add -D prettier prettier-plugin-astro prettier-plugin-svelte
```

- [ ] **Step 27.2:** Create `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-astro", "prettier-plugin-svelte"],
  "overrides": [
    { "files": "*.astro",  "options": { "parser": "astro" } },
    { "files": "*.svelte", "options": { "parser": "svelte" } }
  ]
}
```

- [ ] **Step 27.3:** Create `.prettierignore`

```
dist/
.astro/
node_modules/
pnpm-lock.yaml
```

- [ ] **Step 27.4:** Add scripts to `package.json`

```json
{
  "scripts": {
    "format":      "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

- [ ] **Step 27.5:** Format the codebase once

Run: `pnpm format`
Expected: files normalized.

- [ ] **Step 27.6:** Commit

```bash
git add .
git commit -m "chore: configure Prettier with Astro and Svelte plugins"
```

---

## Task 28: GitHub Actions CI workflow

**Files:** `.github/workflows/ci.yml`

- [ ] **Step 28.1:** Create the workflow

```yaml
name: ci

on:
  pull_request:
  push:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm format:check
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

- [ ] **Step 28.2:** Commit

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add CI workflow (typecheck, test, build)"
```

---

## Task 29: GitHub Actions deploy workflow + Pages config

**Files:** `.github/workflows/deploy.yml`, `astro.config.mjs`

- [ ] **Step 29.1:** Confirm the GitHub Pages settings out-of-band

In the GitHub repo settings (manual step, do this in the browser):

1. Settings → Pages → Source → "GitHub Actions"
2. Note the project URL — typically `https://<user>.github.io/<repo>/`. The `<repo>` segment becomes the `base` path.

- [ ] **Step 29.2:** Update `site` and `base` in `astro.config.mjs`

If deploying to `https://<user>.github.io/learn-vector-db/`:

```js
export default defineConfig({
  site: 'https://<user>.github.io',
  base: '/learn-vector-db/',
  // ... rest unchanged
});
```

(If deploying to a user/organization page at `https://<user>.github.io/`, leave `base: '/'`.)

- [ ] **Step 29.3:** Add the deploy workflow `.github/workflows/deploy.yml`

```yaml
name: deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 29.4:** Commit and verify deployment

```bash
git add .github/workflows/deploy.yml astro.config.mjs
git commit -m "ci: add GitHub Pages deploy workflow"
git push origin main
```

Expected: the `deploy` workflow runs and the site appears at the configured URL within ~2 minutes.

> **If the site renders with broken links** (e.g., assets 404), the `base` path is wrong. Confirm with the URL shown in the Pages settings; update `base` and `site`; push again.

---

## Task 30: README

**Files:** `README.md`

- [ ] **Step 30.1:** Write the README

```markdown
# Learn Vector DB

Interactive, beginner-friendly learning site for vector databases and the math behind them. Bilingual: Thai (default) and English. Built with Astro 5, Tailwind v4, Svelte 5, MDX.

## Live site

https://<user>.github.io/learn-vector-db/

## Local development

Requires Node 20+ and pnpm 9+.

\`\`\`bash
pnpm install
pnpm dev          # http://localhost:4321
\`\`\`

## Scripts

| script              | what it does                            |
|---------------------|-----------------------------------------|
| \`pnpm dev\`         | start dev server                        |
| \`pnpm build\`       | static build to \`dist/\`                |
| \`pnpm preview\`     | preview the static build                |
| \`pnpm test\`        | run Vitest suite                        |
| \`pnpm typecheck\`   | astro check + tsc --noEmit              |
| \`pnpm format\`      | format with Prettier                    |
| \`pnpm format:check\`| Prettier check (used in CI)             |

## Adding a topic

1. Create two MDX files (one per locale): \`src/content/topics/th/<order>-<slug>.mdx\` and \`src/content/topics/en/<order>-<slug>.mdx\`.
2. Frontmatter must include: \`title\`, \`slug\`, \`group\` (\`math\` | \`vector-db\` | \`real-world\`), \`order\` (unique per locale), \`locale\`, \`summary\`. See the schema in \`src/content.config.ts\`.
3. Restart the dev server. The sidebar updates automatically.
4. The build will fail if a slug exists in only one locale or if two topics share the same \`order\`.

## Deployment

Pushes to \`main\` deploy to GitHub Pages via \`.github/workflows/deploy.yml\`.

## License

MIT.
```

(Replace `<user>` with the real GitHub username when known.)

- [ ] **Step 30.2:** Commit

```bash
git add README.md
git commit -m "docs: add README"
```

---

## Verification checklist (run before declaring M1 done)

- [ ] `pnpm typecheck` → 0 errors
- [ ] `pnpm test` → all green (~28 tests across 4 files: i18n, topics, validate-topics, ThemeToggle)
- [ ] `pnpm format:check` → no diff
- [ ] `pnpm build` → succeeds; "Topic validation passed" appears in build output
- [ ] `pnpm preview` → all four URLs work, sidebar renders, theme toggle persists, LangSwitch preserves slug, prev/next renders correctly
- [ ] CI workflow green on the latest push to `main`
- [ ] Deploy workflow green; site reachable at the GitHub Pages URL
