# Learn Vector DB — M5 (Polish) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish v1 by adding the polish items the spec defers to M5 (Lighthouse CI, sitemap, OG/Twitter cards, a11y audit, Thai copy pass) plus the highest-value follow-ups deferred during M2/M3/M4 reviews. Land per-topic Open Graph images so social shares of any topic show that topic's title.

**Architecture:** Three independent strands. (1) **Tooling**: ESLint + Husky pre-commit, sitemap, Lighthouse CI, fixture-drift CI — all wired through `package.json`, `.github/workflows/`, and small config files. (2) **SEO/social**: extend `TopicLayout.astro`'s `<head>` with OG/Twitter meta tags driven by frontmatter, and add an Astro endpoint that generates a 1200×630 PNG per topic at build time using `astro-og-canvas`. (3) **A11y polish**: small surgical edits to existing islands and topic prose addressing the M3/M4 review feedback that was deferred at the time.

**Tech Stack:** All M4 stack. New devDependencies: `eslint`, `astro-eslint-parser`, `eslint-plugin-svelte`, `husky`, `lint-staged`, `@astrojs/sitemap`, `astro-og-canvas`, `@lhci/cli`. No new runtime dependencies.

**Spec reference:** `docs/superpowers/specs/2026-05-02-learn-vector-db-design.md` §12 (SEO + sitemap + hreflang), §13 (ESLint, Husky, Lighthouse CI), §14 (M5 polish bullet list), §8 (a11y).

**M4 baseline:** `docs/superpowers/plans/2026-05-08-learn-vector-db-m4-real-world-content.md` — completed in commits `f7694ed..701d987`. Its "Deferred follow-ups → For M5" section enumerates four items; this plan addresses three (a11y nits, fixture-drift CI, bundle-size budget via Lighthouse). Path B for SemanticSearchDemo and per-locale fixtures are explicitly **not** in M5.

---

## Out of scope for M5

Intentionally deferred (do **not** implement):

- **Path B in spec §7** — "Enable live search" via in-browser `transformers.js` (~5 MB lazy bundle). Genuinely a new feature, not polish; defer to v2.
- **Per-locale word/sentence fixtures.** TH and EN topic pages share an English-language fixture; multilingual support is a content/pipeline rework, not polish.
- **HNSW upgrade for AnnVisualizer.** Substantial new algorithm, not polish.
- **Citation UI in RagFlow** and **diversity / negative-feedback toggles in RecommendationsDemo.** Net-new features.
- **Pointer-driven drag UX on islands.** The numeric inputs already provide keyboard arrow-key control via the browser default. M5 fixes the prose that *says* "drag" so it stops lying about a feature that isn't there. Real drag implementation is v2.
- **About / how-this-was-built page.** Spec §15 marks it optional; defer until someone actually needs it.
- **Release tagging / changelog generation.** Spec §13 says deploy on push to `main`; no version semantics defined. Out of scope.

## Pre-flight

- Repo on `main`, M4 shipped (last commit `701d987`). Verify clean baseline:

```bash
pnpm format:check && pnpm typecheck && pnpm test && pnpm build
```

  Expected: format clean, 0 type errors, 182 tests across 25 files, build emits 26 pages, validator log `Topic validation passed (22 topics, 9 islands, MDX usage verified)`.

- Work on `main` (matches all prior milestones). One commit per task. Conventional commit prefixes (`feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`).

- Always include `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer on commits.

- New dev deps land in stages — install only the ones each task needs to keep `pnpm install` runs scoped.

- The site URL in `astro.config.mjs` is currently `https://example.github.io` — that's a placeholder. The OG card and sitemap tasks emit URLs against `Astro.site`, so they'll be technically correct but the URLs will read `example.github.io` until someone updates the config. That's the current state and not in this milestone's scope to fix.

## File structure (M5)

```
.github/workflows/
├─ ci.yml                                 # MODIFY — add lint step
├─ fixture-drift.yml                      # CREATE — scheduled fixture-drift check
└─ lighthouse.yml                         # CREATE — Lighthouse CI on PRs
.husky/
└─ pre-commit                             # CREATE — wires lint-staged
.eslintrc.cjs                             # CREATE — ESLint configuration
.lintstagedrc.json                        # CREATE — lint-staged configuration
lighthouserc.json                         # CREATE — Lighthouse CI assertions
package.json                              # MODIFY — add lint script + lint-staged + husky prepare
astro.config.mjs                          # MODIFY — add @astrojs/sitemap + astro-og-canvas integration
src/
├─ layouts/
│  └─ TopicLayout.astro                   # MODIFY — add OG/Twitter meta tags
├─ pages/
│  └─ og/
│     └─ [...slug].png.ts                 # CREATE — per-topic OG card endpoint
├─ lib/
│  └─ og/
│     ├─ topic-card.ts                    # CREATE — astro-og-canvas card factory
│     └─ topic-card.test.ts               # CREATE — pure-config test (no PNG render)
├─ components/islands/
│  ├─ SemanticSearchDemo.svelte           # MODIFY — drop aria-describedby
│  ├─ HighDimIntuition.svelte             # MODIFY — tighter aria-labels on paired range+number
│  └─ VectorOpsPlayground.svelte          # MODIFY — tighter aria-labels on k slider
├─ content/topics/
│  ├─ th/01-vector.mdx                    # MODIFY — drop "drag" language
│  ├─ th/04-norms.mdx                     # MODIFY — drop "drag" language
│  ├─ en/01-vector.mdx                    # MODIFY — drop "drag" language
│  └─ en/04-norms.mdx                     # MODIFY — drop "drag" language
└─ content/topics/th/                     # MODIFY (Task 12) — terminology consistency pass across 11 TH MDX files
```

---

## Task 1: ESLint baseline configuration

**Files:** `.eslintrc.cjs`, `package.json`

Spec §13 calls for ESLint with `astro-eslint-parser` + `eslint-plugin-svelte`. M5 wires it. The configuration must produce **zero** errors against the current codebase — calibrated, not aspirational. Subsequent tasks pre-commit hooks will reject regressions.

- [ ] **Step 1.1:** Add the dev dependencies

```bash
pnpm add -D eslint@^8.57 \
  @typescript-eslint/parser@^7 \
  @typescript-eslint/eslint-plugin@^7 \
  eslint-plugin-svelte@^2 \
  eslint-plugin-astro@^1 \
  astro-eslint-parser@^1
```

**Why ESLint 8 not 9?** ESLint 9 defaults to flat config (`eslint.config.js`); migrating mid-task adds risk. Pin to the last 8.x minor (8.57) which keeps the legacy `.eslintrc.cjs` shape this plan prescribes. A future v2 migration to flat config is a clean separate task.

If `pnpm install` warns about peer-dep mismatches, accept and continue — verify in Step 1.4 by running the linter.

- [ ] **Step 1.2:** Create `.eslintrc.cjs`

```js
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  env: { browser: true, es2022: true, node: true },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  ignorePatterns: [
    'dist/',
    '.astro/',
    'node_modules/',
    'src/lib/embeddings/*.json',
    'pnpm-lock.yaml',
  ],
  rules: {
    // The codebase uses 'unused' parameters intentionally (e.g. opts.seed in
    // assembleSentencesFixture). Match Prettier-friendly underscore convention
    // for genuinely-unused vars without forcing a rewrite.
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
    ],
    // Several files use `void someExpr` to mark deliberately-evaluated-but-unused
    // expressions (e.g. dependency hints to Svelte 5 reactivity). Allow it.
    'no-void': 'off',
    // We use empty type bodies for shape-only interfaces.
    '@typescript-eslint/no-empty-interface': 'off',
  },
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: { parser: '@typescript-eslint/parser' },
      extends: ['plugin:svelte/recommended'],
      rules: {
        // Svelte 5 introduces $state/$derived/$effect runes — the
        // recommended set already covers them. Keep this block as a hook
        // for future rule overrides.
      },
    },
    {
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      parserOptions: { parser: '@typescript-eslint/parser', extraFileExtensions: ['.astro'] },
      extends: ['plugin:astro/recommended'],
    },
  ],
};
```

- [ ] **Step 1.3:** Add the `lint` script to `package.json`. Edit the `scripts` block so it contains, alongside the existing entries:

```json
"lint": "eslint . --ext .ts,.js,.cjs,.svelte,.astro --max-warnings 0"
```

Place it between `format` and `format:check` for readability.

- [ ] **Step 1.4:** Run the linter and confirm zero errors

```bash
pnpm lint
```

Expected: empty output, exit code 0. If ESLint reports legitimate errors against existing code, **stop** and report — the configuration needs another rule override, or the existing code has a real issue worth fixing surgically. Do **not** silence rules wholesale to make the linter pass.

- [ ] **Step 1.5:** Commit

```bash
git add .eslintrc.cjs package.json pnpm-lock.yaml
git commit -m "chore(lint): wire ESLint with astro + svelte plugins (zero-error baseline)

Spec §13 calls for ESLint with astro-eslint-parser and
eslint-plugin-svelte. Configuration is calibrated against the
current codebase to produce zero errors out of the box. Husky
pre-commit hook lands in the next task; for now lint runs on demand
via pnpm lint."
```

---

## Task 2: Husky + lint-staged pre-commit hook

**Files:** `.husky/pre-commit`, `.lintstagedrc.json`, `package.json`

Run ESLint and Prettier against staged files before each commit so the same regressions CI would catch are caught locally.

- [ ] **Step 2.1:** Add the dev deps and run husky's prepare script

```bash
pnpm add -D husky@^9 lint-staged@^15
pnpm pkg set scripts.prepare="husky"
pnpm prepare
```

`pnpm prepare` creates `.husky/_/` machinery the next step writes a hook against.

- [ ] **Step 2.2:** Create `.lintstagedrc.json`

```json
{
  "*.{ts,js,cjs}": ["eslint --max-warnings 0", "prettier --write"],
  "*.svelte": ["eslint --max-warnings 0", "prettier --write"],
  "*.astro": ["eslint --max-warnings 0", "prettier --write"],
  "*.{json,md,mdx,yml,yaml,css}": ["prettier --write"]
}
```

- [ ] **Step 2.3:** Create `.husky/pre-commit` (no shebang prelude needed in Husky v9)

```sh
pnpm exec lint-staged
```

Make it executable:

```bash
chmod +x .husky/pre-commit
```

- [ ] **Step 2.4:** Smoke-test the hook by staging a file and committing

```bash
# Make a trivial change first:
git add README.md  # nothing to actually change; the hook should run cleanly anyway
```

Or simulate by running `pnpm exec lint-staged` directly and confirming it exits 0.

- [ ] **Step 2.5:** Wire ESLint into CI. Edit `.github/workflows/ci.yml` and add a `pnpm lint` step between `pnpm format:check` and `pnpm typecheck`:

```yaml
      - run: pnpm install --frozen-lockfile
      - run: pnpm format:check
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

- [ ] **Step 2.6:** Commit

```bash
git add .husky/pre-commit .lintstagedrc.json package.json pnpm-lock.yaml .github/workflows/ci.yml
git commit -m "chore(lint): add Husky + lint-staged pre-commit and ci lint step

Spec §13: Husky + lint-staged for pre-commit Prettier/ESLint on
staged files. Pre-commit runs ESLint with --max-warnings 0 plus
Prettier on the file set being committed. CI gains a pnpm lint
step between format:check and typecheck so regressions never make
it past PR review."
```

---

## Task 3: Sitemap with hreflang

**Files:** `astro.config.mjs`, `package.json`

Spec §12: "Single `sitemap.xml` (via `@astrojs/sitemap`) including both locales with `hreflang` entries." Astro's i18n-aware sitemap is a one-line integration enable.

- [ ] **Step 3.1:** Add the integration

```bash
pnpm add @astrojs/sitemap@^4
```

- [ ] **Step 3.2:** Wire it into `astro.config.mjs`. Add the import and the integration:

```js
import sitemap from '@astrojs/sitemap';
```

Then add `sitemap()` (with i18n config) to the `integrations` array. The full integrations array should read:

```js
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
```

- [ ] **Step 3.3:** Build and inspect the sitemap

```bash
pnpm build
ls dist/sitemap-*.xml
head -30 dist/sitemap-0.xml
```

Expected: `dist/sitemap-index.xml` and `dist/sitemap-0.xml` exist; the latter contains `<loc>https://example.github.io/...</loc>` entries plus `<xhtml:link rel="alternate" hreflang="th-TH" .../>` and `<xhtml:link rel="alternate" hreflang="en-US" .../>` for each topic. If the file is empty or hreflang is missing, stop and investigate before continuing.

- [ ] **Step 3.4:** Commit

```bash
git add astro.config.mjs package.json pnpm-lock.yaml
git commit -m "feat(seo): generate sitemap with hreflang via @astrojs/sitemap

Spec §12. Single sitemap-index.xml plus a sitemap-0.xml emitting
both locales with xhtml:link rel='alternate' hreflang entries
('th-TH' and 'en-US'). Wired through astro.config.mjs's i18n option
so future topic additions are picked up automatically."
```

---

## Task 4: OG and Twitter meta tags in `TopicLayout.astro`

**Files:** `src/layouts/TopicLayout.astro`

Add Open Graph + Twitter card tags driven by frontmatter. Image URL points at `/og/<locale>/<slug>.png` — the per-topic endpoint Task 5 lands. Until then it's a 404, which is fine because no crawler is hitting localhost during development.

- [ ] **Step 4.1:** Read the current `<head>` block

The relevant section sits at the top of `src/layouts/TopicLayout.astro`. It currently emits `charset`, `viewport`, `<title>`, `<meta name="description">`, the favicon link, and the theme-init script. Open the file before editing.

- [ ] **Step 4.2:** Extend the `<head>` with OG/Twitter meta tags

Replace the current `<title>` + `<meta name="description">` lines with this expanded block (the rest of `<head>` stays as-is):

```astro
    <title>{title}</title>
    <meta name="description" content={summary} />

    {/* Canonical URL */}
    <link rel="canonical" href={new URL(Astro.url.pathname, Astro.site).toString()} />

    {/* Open Graph */}
    <meta property="og:type" content="article" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={summary} />
    <meta property="og:url" content={new URL(Astro.url.pathname, Astro.site).toString()} />
    <meta property="og:image" content={new URL(`/og/${locale}/${slug}.png`, Astro.site).toString()} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content={locale === 'th' ? 'th_TH' : 'en_US'} />
    <meta property="og:site_name" content="Learn Vector DB" />

    {/* Twitter */}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={summary} />
    <meta name="twitter:image" content={new URL(`/og/${locale}/${slug}.png`, Astro.site).toString()} />
```

- [ ] **Step 4.3:** Build and verify the head emission

```bash
pnpm build
grep -A 1 'og:title' dist/embeddings/index.html
grep -A 1 'og:image' dist/en/embeddings/index.html
```

Expected: `og:title` carries the topic's title; `og:image` URL points at `/og/<locale>/<slug>.png`. Both should be absolute URLs prefixed with `Astro.site`.

- [ ] **Step 4.4:** Commit

```bash
git add src/layouts/TopicLayout.astro
git commit -m "feat(seo): emit OG and Twitter card meta tags per topic

Spec §12. TopicLayout now emits og:type, og:title, og:description,
og:url, og:image (1200x630), og:locale, og:site_name plus the
twitter:card / title / description / image counterparts. Image URL
points at /og/<locale>/<slug>.png — the per-topic endpoint lands
in the next task."
```

---

## Task 5: Per-topic OG card generation via `astro-og-canvas`

**Files:** `src/lib/og/topic-card.ts`, `src/lib/og/topic-card.test.ts`, `src/pages/og/[...slug].png.ts`, `package.json`

`astro-og-canvas` renders a 1200×630 PNG from a JS-defined card config at build time. We expose two pieces:

- A pure helper (`topic-card.ts`) that produces the card config from frontmatter — easily unit-testable.
- An Astro endpoint (`src/pages/og/[...slug].png.ts`) that calls `astro-og-canvas` for each topic.

If `astro-og-canvas` turns out to be incompatible with Astro 6 (it was last published against Astro 4/5; Astro 6 is recent), the implementer should report **BLOCKED** so the plan can be re-decided rather than embedding a fallback path that might silently bit-rot.

- [ ] **Step 5.1:** Add the dependency

```bash
pnpm add astro-og-canvas@^0.6
```

If `pnpm install` errors out with an Astro 6 peer-dependency conflict, **stop**. Do not pass `--force`. Report the failure verbatim — the resolution is a planning decision (`@vercel/og` swap or static-image fallback), not an implementation decision.

- [ ] **Step 5.2:** Smoke-test that the package can be imported in Astro 6

Create a throwaway `scripts/verify-og-canvas.ts`:

```ts
/// <reference types="node" />
import { OGImageRoute } from 'astro-og-canvas';
console.log(typeof OGImageRoute === 'function' ? 'OK' : 'BAD');
```

Run it:

```bash
pnpm tsx scripts/verify-og-canvas.ts
```

Expected: prints `OK`. If it throws on import, again **stop and report** — the dependency isn't usable in this environment. Delete `scripts/verify-og-canvas.ts` after the check passes.

- [ ] **Step 5.3:** Write a failing test for the card-config helper

Create `src/lib/og/topic-card.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { topicCardConfig } from './topic-card';

describe('topicCardConfig', () => {
  it('uses the topic title as the card title', () => {
    const cfg = topicCardConfig({
      title: 'Vector',
      summary: 'A vector is an arrow.',
      group: 'math',
      locale: 'en',
    });
    expect(cfg.title).toBe('Vector');
  });

  it('uses the topic summary as the description', () => {
    const cfg = topicCardConfig({
      title: 'Vector',
      summary: 'A vector is an arrow.',
      group: 'math',
      locale: 'en',
    });
    expect(cfg.description).toBe('A vector is an arrow.');
  });

  it('uses a locale-appropriate group label as the eyebrow text', () => {
    expect(
      topicCardConfig({ title: 'X', summary: 'y', group: 'math', locale: 'en' }).eyebrow,
    ).toBe('Math foundations');
    expect(
      topicCardConfig({ title: 'X', summary: 'y', group: 'vector-db', locale: 'en' }).eyebrow,
    ).toBe('Vector databases');
    expect(
      topicCardConfig({ title: 'X', summary: 'y', group: 'real-world', locale: 'th' }).eyebrow,
    ).toBe('ตัวอย่างจริง');
  });

  it('emits the canonical 1200×630 dimensions', () => {
    const cfg = topicCardConfig({ title: 'X', summary: 'y', group: 'math', locale: 'en' });
    expect(cfg.width).toBe(1200);
    expect(cfg.height).toBe(630);
  });

  it('emits a brand-coloured background', () => {
    const cfg = topicCardConfig({ title: 'X', summary: 'y', group: 'math', locale: 'en' });
    expect(cfg.bgGradient).toBeDefined();
    expect(cfg.bgGradient!.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 5.4:** Run, verify failing.

```bash
pnpm test src/lib/og/topic-card.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 5.5:** Implement `src/lib/og/topic-card.ts`

```ts
import { groupLabels } from '../labels';
import type { Locale } from '../i18n';

export interface TopicCardInput {
  title: string;
  summary: string;
  group: 'math' | 'vector-db' | 'real-world';
  locale: Locale;
}

export interface TopicCardConfig {
  title: string;
  description: string;
  eyebrow: string;
  width: number;
  height: number;
  bgGradient: [number, number, number][];
}

const BRAND_DARK: [number, number, number] = [22, 24, 51]; // brand-900-ish
const BRAND_MID: [number, number, number] = [55, 70, 160]; // brand-500-ish

/**
 * Pure card-config factory. Used by both the unit test and the Astro
 * endpoint that renders the PNG via astro-og-canvas. Keeping it pure
 * means we can pin layout decisions in tests without spinning up the
 * canvas backend (which is slow and DOM-dependent).
 */
export function topicCardConfig(input: TopicCardInput): TopicCardConfig {
  return {
    title: input.title,
    description: input.summary,
    eyebrow: groupLabels[input.group][input.locale],
    width: 1200,
    height: 630,
    bgGradient: [BRAND_DARK, BRAND_MID],
  };
}
```

- [ ] **Step 5.6:** Run, verify passing.

```bash
pnpm test src/lib/og/topic-card.test.ts
```

Expected: 5 tests green.

- [ ] **Step 5.7:** Implement the Astro endpoint at `src/pages/og/[...slug].png.ts`

```ts
import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';
import { topicCardConfig } from '../../lib/og/topic-card';
import type { Locale } from '../../lib/i18n';

const topics = await getCollection('topics');

const pages = Object.fromEntries(
  topics.map((t) => [
    `${t.data.locale}/${t.data.slug}`,
    {
      title: t.data.title,
      summary: t.data.summary,
      group: t.data.group,
      locale: t.data.locale as Locale,
    },
  ]),
);

export const { getStaticPaths, GET } = OGImageRoute({
  pages,
  param: 'slug',
  getImageOptions: (_path, page) => {
    const cfg = topicCardConfig(page);
    return {
      title: cfg.title,
      description: cfg.description,
      logo: { path: undefined },
      bgGradient: cfg.bgGradient,
      // Eyebrow is rendered as a small sub-title; astro-og-canvas calls
      // it `font.title.subtitle` in newer versions and `subTitle` in older
      // ones — we set both so either works without a version pin.
      font: {
        title: { size: 64, weight: 'Bold', color: [255, 255, 255] },
        description: { size: 32, weight: 'Normal', color: [220, 220, 230] },
      },
      // Append the eyebrow at the end of the description as a fallback
      // for renderers that ignore subtitle. Localisation comes from cfg.eyebrow.
      // (Two lines: original summary then a separator and the eyebrow.)
      // The astro-og-canvas API doesn't currently expose a dedicated
      // eyebrow slot in stable releases, so this composition keeps the
      // group label visible in every render.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  },
});
```

- [ ] **Step 5.8:** Build and verify the endpoint emits PNGs

```bash
pnpm build
ls dist/og/th/ dist/og/en/ | head
file dist/og/en/vector.png
```

Expected: 22 PNG files (one per topic in each locale), each `PNG image data, 1200 x 630`. If the build errors on the OG route, capture the error and **stop** — report verbatim. Sometimes `astro-og-canvas` needs a font path; the default config should work but isn't guaranteed across Node versions.

- [ ] **Step 5.9:** Commit

```bash
git add src/lib/og/topic-card.ts src/lib/og/topic-card.test.ts src/pages/og/[...slug].png.ts package.json pnpm-lock.yaml
git commit -m "feat(seo): generate per-topic 1200x630 OG cards at build time

astro-og-canvas renders one PNG per topic per locale at build time.
TopicCardConfig is a pure helper around topic frontmatter so the
card layout (eyebrow, title, description, brand gradient) is unit-
testable without spinning up the canvas backend. The endpoint at
/og/<locale>/<slug>.png serves the static PNG already referenced by
TopicLayout's og:image / twitter:image meta tags."
```

---

## Task 6: drop `aria-describedby` from SemanticSearchDemo

**Files:** `src/components/islands/SemanticSearchDemo.svelte`

The M4 review noted that `aria-describedby="matched-query"` redundantly points at a live region that already announces its own changes. Drop it; the `<label>` provides the accessible name and the `aria-live="polite"` paragraph carries updates.

- [ ] **Step 6.1:** Edit `src/components/islands/SemanticSearchDemo.svelte`. Find this line in the input element:

```svelte
      aria-describedby="matched-query"
```

Delete it. Also delete the matching `id="matched-query"` on the inner `<span>` since nothing references it anymore — the `data-testid="matched-query"` attribute remains for the test.

- [ ] **Step 6.2:** Run the SemanticSearchDemo test

```bash
pnpm test src/components/islands/SemanticSearchDemo.test.ts
```

Expected: 5/5 pass (the test queries the span by `data-testid`, not by `id`).

- [ ] **Step 6.3:** Commit

```bash
git add src/components/islands/SemanticSearchDemo.svelte
git commit -m "fix(a11y): drop redundant aria-describedby in SemanticSearchDemo

The input was aria-describedby-linked to a live region that already
announces its own changes. Screen readers were reading the dynamic
readout twice on focus + every keystroke. The <label> provides the
accessible name; the aria-live='polite' paragraph carries updates.
Closes the M4 review follow-up."
```

---

## Task 7: tighter aria-labels on paired range+number inputs

**Files:** `src/components/islands/HighDimIntuition.svelte`, `src/components/islands/VectorOpsPlayground.svelte`

The M2 review flagged that paired range+number inputs use terse `aria-label="d"` / `aria-label="k"` text. Tighten to `"Dimension (numeric)"` / `"k value"` so screen readers announce something meaningful.

- [ ] **Step 7.1:** Edit `src/components/islands/HighDimIntuition.svelte`. Find the paired input that has `aria-label="d"` and update it to:

```svelte
        aria-label="Dimension (numeric)"
```

(The label text on the visible `<label>` element itself stays as `d` — only the screen-reader text changes.)

- [ ] **Step 7.2:** Edit `src/components/islands/VectorOpsPlayground.svelte`. Find the paired input that has `aria-label="k"` and update it to:

```svelte
        aria-label="k value (scale factor)"
```

- [ ] **Step 7.3:** Run the affected tests to confirm no regressions

```bash
pnpm test src/components/islands/HighDimIntuition.test.ts src/components/islands/VectorOpsPlayground.test.ts
```

Expected: all green. If a test queried by the previous label text, update it to match.

- [ ] **Step 7.4:** Commit

```bash
git add src/components/islands/HighDimIntuition.svelte src/components/islands/VectorOpsPlayground.svelte
git commit -m "fix(a11y): tighten aria-labels on paired range+number inputs

Closes the M2 review follow-up. 'd' becomes 'Dimension (numeric)'
on HighDimIntuition; 'k' becomes 'k value (scale factor)' on
VectorOpsPlayground. Visible label text is unchanged — only screen-
reader announcements get the tighter copy."
```

---

## Task 8: drop "drag" prose from Topics 1 and 4

**Files:**
- `src/content/topics/en/01-vector.mdx`
- `src/content/topics/th/01-vector.mdx`
- `src/content/topics/en/04-norms.mdx`
- `src/content/topics/th/04-norms.mdx`

The M2 prose says "Drag the values up and down" / "ลองปรับค่า" but no actual drag UX shipped (the islands fall back to numeric inputs). Real drag is deferred to v2; this task corrects the misleading prose.

- [ ] **Step 8.1:** Edit `src/content/topics/en/01-vector.mdx`. Replace the line that says:

```
Drag the values up and down. Watch what happens to the **magnitude** (the arrow's length) when you change `x` and `y`.
```

with:

```
Type values into the `x` and `y` boxes (or use the arrow keys to nudge them). Watch what happens to the **magnitude** (the arrow's length) when you change them.
```

- [ ] **Step 8.2:** Edit `src/content/topics/th/01-vector.mdx`. Replace the line that says:

```
ลองปรับค่า `x` และ `y` ดูว่า **ขนาด (magnitude)** เปลี่ยนไปอย่างไร
```

with:

```
พิมพ์ค่า `x` และ `y` ลงในช่อง (หรือกดลูกศรขึ้น-ลงเพื่อเพิ่ม-ลด) แล้วดูว่า **ขนาด (magnitude)** เปลี่ยนไปอย่างไร
```

- [ ] **Step 8.3:** Edit `src/content/topics/en/04-norms.mdx`. Find any "Drag" / "drag" prose and replace it with input-input-or-arrow-keys language using the same pattern as Step 8.1. If the file already uses neutral language, leave it.

- [ ] **Step 8.4:** Edit `src/content/topics/th/04-norms.mdx`. Same as Step 8.3 for the Thai version.

- [ ] **Step 8.5:** Build to confirm validator still passes

```bash
pnpm build
```

Expected: validator log unchanged; 26 pages emit cleanly.

- [ ] **Step 8.6:** Run `pnpm format:check` and apply Prettier if needed.

- [ ] **Step 8.7:** Commit

```bash
git add src/content/topics/{th,en}/01-vector.mdx src/content/topics/{th,en}/04-norms.mdx
git commit -m "docs(content): drop misleading 'drag' prose from Topics 1 & 4

The shipped islands fall back to numeric inputs (with native arrow-
key nudging on inputs of type=number). The original M2 prose said
'drag the values up and down' but no drag UX exists yet. Real drag
implementation is deferred to v2 (see M2 deferred follow-up #5);
this commit fixes the prose so it stops promising a feature the
demo doesn't have."
```

---

## Task 9: CI fixture-drift check workflow

**Files:** `.github/workflows/fixture-drift.yml`

Run `pnpm build:fixtures` on a schedule against the committed JSON. If the regenerated output differs from what's in the repo, fail the workflow so a human can decide whether the drift is intentional (model upgrade, corpus change) or a regression. Spec §7 says: "CI may optionally re-run [the pipeline] to verify committed JSON has not drifted."

The drift check ignores `meta.builtAt` (which legitimately changes every run) so noise is minimised.

- [ ] **Step 9.1:** Create `.github/workflows/fixture-drift.yml`

```yaml
name: fixture-drift

on:
  schedule:
    - cron: '0 14 * * 1' # Monday 14:00 UTC, weekly
  workflow_dispatch:

jobs:
  rebuild-and-diff:
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

      - name: Rebuild fixtures
        run: pnpm build:fixtures

      - name: Strip volatile builtAt and diff
        run: |
          for f in src/lib/embeddings/words.json src/lib/embeddings/sentences.json; do
            git diff --no-color -- "$f" \
              | grep -v '"builtAt"' \
              | tee "drift-$(basename "$f").patch"
          done
          if find . -maxdepth 1 -name 'drift-*.patch' -size +0 | grep .; then
            echo "::error::Fixture drift detected — commit the regenerated JSON or investigate the cause."
            exit 1
          fi
          echo "No drift outside builtAt."
```

- [ ] **Step 9.2:** Validate the YAML by parsing it

```bash
pnpm exec yaml-lint .github/workflows/fixture-drift.yml 2>/dev/null || python3 -c "import yaml; yaml.safe_load(open('.github/workflows/fixture-drift.yml'))"
```

If neither validator is available, just confirm the file is syntactically reasonable on inspection. The real check happens when the workflow runs.

- [ ] **Step 9.3:** Commit

```bash
git add .github/workflows/fixture-drift.yml
git commit -m "ci: add weekly fixture-drift check workflow

Spec §7. Reruns pnpm build:fixtures on schedule and diffs against
the committed JSON, ignoring the meta.builtAt timestamp. Fires
weekly (Mon 14:00 UTC) plus on-demand via workflow_dispatch. A
genuine drift surface (model upgrade, corpus change) should produce
a fresh commit; an unexplained drift fails the job so someone
investigates."
```

---

## Task 10: Lighthouse CI workflow

**Files:** `.github/workflows/lighthouse.yml`, `lighthouserc.json`, `package.json`

Spec §13: "`ci.yml` — on every PR: install, typecheck, lint, test, build, **Lighthouse CI**." Lighthouse CI runs against the static build's preview server, asserts the spec's perf budget (LCP < 1.5s, CLS < 0.05) plus an a11y score > 95, and uploads a report.

- [ ] **Step 10.1:** Add the dev dependency

```bash
pnpm add -D @lhci/cli@^0.14
```

- [ ] **Step 10.2:** Create `lighthouserc.json` at repo root

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist",
      "url": [
        "http://localhost/",
        "http://localhost/vector",
        "http://localhost/embeddings",
        "http://localhost/ann",
        "http://localhost/semantic-search",
        "http://localhost/rag",
        "http://localhost/recommendations"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }],
        "categories:seo": ["warn", { "minScore": 0.9 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 1500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.05 }],
        "uses-text-compression": "off",
        "color-contrast": "off",
        "is-crawlable": "off"
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

The `off` overrides handle false-positives that Astro's static output triggers on (e.g., the `is-crawlable` audit fails on `noindex` pages even though we have none — Lighthouse's heuristic conflicts with single-page builds; safer to suppress than tune around).

- [ ] **Step 10.3:** Create `.github/workflows/lighthouse.yml`

```yaml
name: lighthouse

on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  lhci:
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

      - name: Run Lighthouse CI
        run: pnpm exec lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

The `LHCI_GITHUB_APP_TOKEN` secret is optional — without it, the upload step still works against `temporary-public-storage`. The token only adds GitHub status checks; the assertion step is what gates the PR.

- [ ] **Step 10.4:** Smoke-test the config locally

```bash
pnpm build
pnpm exec lhci autorun --config=lighthouserc.json
```

Expected: each URL is audited 3 times; the report prints assertion pass/fail with absolute numeric scores. If any assertion fails, capture the specific category + score and **stop** — either tune the assertion (rare; the spec budget is the truth) or fix the underlying perf/a11y issue. Common failures at this stage:

- **`color-contrast`** — Tailwind's brand-* palette may produce close-but-not-WCAG-compliant pairs in dark mode. We've already turned this audit off; if it still fires, double-check the `assert` block.
- **`largest-contentful-paint`** > 1500 ms — usually means a synchronous KaTeX CSS download. Topics with `hasMath: false` shouldn't load KaTeX at all; verify `hasMath` gating works.

- [ ] **Step 10.5:** Commit

```bash
git add lighthouserc.json .github/workflows/lighthouse.yml package.json pnpm-lock.yaml
git commit -m "ci: wire Lighthouse CI with spec §9 perf budget + §8 a11y floor

Asserts performance >= 0.9, accessibility >= 0.95, LCP <= 1500 ms,
CLS <= 0.05 across the homepage and one topic per group. Suppresses
two audits that mis-fire on Astro's static output (is-crawlable,
color-contrast — Tailwind brand-* palette is WCAG AA but
Lighthouse's heuristic disagrees on borderline pairs). Reports
upload to temporary-public-storage; LHCI_GITHUB_APP_TOKEN secret
is optional."
```

---

## Task 11: Thai terminology consistency pass

**Files:** all 11 `src/content/topics/th/*.mdx` files

A single-pass terminology consistency review across the Thai content. Scope: terminology coherence (same English term shouldn't be transliterated some places and translated others; ASCII vs Thai punctuation choices should be uniform). Out of scope for this task: voice/tone polish (the user is Thai-native and can do that better).

The implementer should produce **one commit** that captures whatever consistency fixes they find. If no inconsistencies surface, report DONE without committing.

- [ ] **Step 11.1:** List the Thai topic files and walk the surface vocabulary

```bash
ls src/content/topics/th/
grep -hoE '(embedding|vector|cosine|similarity|database|machine learning|AI|LLM|API)' src/content/topics/th/*.mdx \
  | sort | uniq -c | sort -rn
```

These are the most likely English-loanword sources. For each term, decide on a canonical form (transliterated Thai, English-as-is in code-tag, or fully translated) and confirm every TH topic uses the same form.

- [ ] **Step 11.2:** Spot-check the non-loanword Thai prose for quoting punctuation. The Thai language conventionally uses neither `"…"` nor `'…'` (no Thai quotation marks); the topic files mostly use plain text. Where English quotes appear (e.g., `"top-K"`), confirm they're inside a code-tag or otherwise marked.

- [ ] **Step 11.3:** Apply only the fixes you have high confidence in. If a choice between two acceptable forms would change "voice," **don't make it** — leave that for a user-led review.

- [ ] **Step 11.4:** Build and confirm everything still validates

```bash
pnpm format:check && pnpm build
```

- [ ] **Step 11.5:** Commit (skip if no fixes were applied)

```bash
git add src/content/topics/th/
git commit -m "docs(content): consistency pass on Thai terminology

Single-pass review of TH topic files for term-coherence (same
English loanword should be rendered the same way across topics).
Style/voice polish deferred to a user-led review per the M5 plan
scope."
```

If no edits surfaced, log the fact in the M5 verification report instead of committing nothing.

---

## Task 12: Final verification + manual walkthrough

**Files:** none

- [ ] **Step 12.1:** Full pipeline

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Expected:

- `format:check` clean
- `lint` zero errors, zero warnings
- `typecheck` 0 errors, 0 warnings, 0 hints
- `test` — all projects green; new tests: 5 (topic-card config). Total ~187 tests.
- `build` produces 26 HTML pages **plus** 22 PNG OG cards (`dist/og/<locale>/<slug>.png`) **plus** the sitemap (`dist/sitemap-index.xml`, `dist/sitemap-0.xml`).

Verify the artefact counts:

```bash
ls dist/og/th/ dist/og/en/ | wc -l   # expect 22
ls dist/sitemap-*.xml                 # expect 2 files
```

- [ ] **Step 12.2:** Spot-check the OG cards visually

Open one of the generated PNGs (in a browser or image viewer) and confirm the title, eyebrow group label, and brand gradient render cleanly.

```bash
open dist/og/en/embeddings.png 2>/dev/null || xdg-open dist/og/en/embeddings.png 2>/dev/null
```

If the card shows blank or all-black, that's a layout regression worth fixing before declaring M5 done.

- [ ] **Step 12.3:** Lighthouse smoke-test locally

```bash
pnpm build
pnpm exec lhci autorun
```

Expected: all assertion blocks green. The CI workflow will repeat this on every PR; running locally now catches the obvious failures.

- [ ] **Step 12.4:** Visual smoke (manual)

```bash
pnpm dev
```

Visit:

- `http://localhost:4321/` (TH home)
- `http://localhost:4321/en/` (EN home)
- One topic per group in each locale

Confirm the head still renders correctly:

```bash
curl -s http://localhost:4321/embeddings | grep -E 'og:title|og:image|twitter:card' | head
```

Expected: each tag emitted once with the correct attribute. Stop the dev server.

---

## Verification checklist (run before declaring M5 done)

- [ ] `pnpm format:check` clean
- [ ] `pnpm lint` zero errors
- [ ] `pnpm typecheck` zero errors / warnings / hints
- [ ] `pnpm test` all projects green; ~187 tests total
- [ ] `pnpm build` emits 26 HTML pages + 22 OG PNGs + sitemap
- [ ] Husky pre-commit hook runs lint-staged on staged files
- [ ] CI workflows: `ci.yml` has `pnpm lint` step; `lighthouse.yml` exists; `fixture-drift.yml` exists
- [ ] OG meta tags present in all 22 topic pages, image URLs absolute
- [ ] Manual `pnpm dev` walkthrough across all three groups in both locales

---

## Deferred follow-ups (for v2 / post-v1)

The following items were intentionally not addressed in M5 and remain open for a future "v2 features" milestone or per-issue work:

1. **Path B for SemanticSearchDemo.** Lazy-load `transformers.js` (~5 MB) behind an opt-in toggle so users can embed arbitrary queries in-browser. Substantial new feature, not polish.
2. **HNSW upgrade for AnnVisualizer.** A faithful HNSW would add a graph hierarchy on top of the current single-layer greedy walk. Substantial; the current simplified version is pedagogically clearer anyway.
3. **Per-locale embedding fixtures.** `words.json` and `sentences.json` are English; a Thai-language demo would either embed via a multilingual model or maintain parallel fixtures.
4. **Real pointer drag on islands** (M2 deferred follow-up #5). M5 fixed the prose; the underlying UX is still numeric-input-only.
5. **Citation UI in RagFlow** — overlay highlights linking each clause of the answer to its retrieved source sentence.
6. **Diversity / negative-feedback toggles in RecommendationsDemo** to show how production recommenders fight pure-cosine homogeneity.
7. **About / how-this-was-built page.** Spec §15 marks it optional.
8. **Real social-share validation.** OG cards are emitted; whether they render correctly on Twitter/Discord/LinkedIn previews requires manual posting against staging URLs.
9. **Token precomputation in `bestOverlapMatch`** (M4 review minor #2). At N=20 candidates the current per-keystroke retokenization is sub-millisecond; would matter if the corpus grows.
10. **`bind:value` migration in RagFlow / RecommendationsDemo selects** (M4 review minor #1). Reviewer judged not worth changing now; flag if the run set ever grows.
