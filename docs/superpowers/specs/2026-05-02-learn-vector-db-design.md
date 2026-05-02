# Learn Vector DB — Interactive Learning Site (Design)

**Date:** 2026-05-02
**Status:** Approved (brainstorming complete; ready for implementation plan)

## 1. Goal & audience

An interactive, beginner-friendly learning site that teaches vector databases and the math behind them, anchored to real-world use cases.

- **Primary audience:** complete beginners with little math background. Heavy on intuition and animated visuals; minimal formulas (formal definitions are optional, hidden behind collapsed blocks).
- **Secondary goal:** every concept is connected to a real-world vector-database scenario so the math feels useful, not abstract.
- **Languages:** Thai (default) and English. Thai is the canonical content; English mirrors it.
- **Hosting:** GitHub Pages, deployed from a static build. No backend, no API keys, no server runtime.

## 2. Scope

### Topic set (11 topics, 3 groups)

| order | group        | slug                  | title (en)                   |
|------:|--------------|-----------------------|------------------------------|
| 1     | math         | vector                | Vector                       |
| 2     | math         | vector-operations     | Vector operations            |
| 3     | math         | distance-similarity   | Distance & similarity        |
| 4     | math         | norms                 | Norms in plain English       |
| 5     | math         | high-dimensional      | High-dimensional intuition   |
| 6     | vector-db    | embeddings            | What is an embedding?        |
| 7     | vector-db    | vector-database       | What is a vector database?   |
| 8     | vector-db    | ann                   | Approximate nearest neighbor |
| 9     | real-world   | semantic-search       | Semantic search              |
| 10    | real-world   | rag                   | RAG                          |
| 11    | real-world   | recommendations       | Recommendations              |

### Out of scope (v1)

- User accounts, progress tracking, graded quizzes
- Server-rendered / SSR pages — static only
- Live LLM-backed RAG (RAG demo uses canned answers; no API keys)
- In-browser embedding generation by default (stretch goal only)
- Site-wide search box (sidebar covers 11 topics)
- Comments, discussion, social sign-in
- Analytics
- E2E tests (Playwright)

## 3. Stack

- **Astro 5** (static output) with `@astrojs/mdx`, `@astrojs/svelte`, `@astrojs/tailwind`
- **Tailwind CSS** for all styling (light + dark via `class` strategy, theme toggle)
- **Svelte 5** for interactive islands; only mounted on pages that need them
- **KaTeX** via `remark-math` + `rehype-katex` for math rendering inside MDX
- **Astro Content Collections** for typed topic frontmatter
- **Astro built-in i18n**: `defaultLocale: "th"`, `locales: ["th", "en"]`, `prefixDefaultLocale: false` → routes are `/<slug>` for Thai, `/en/<slug>` for English
- **Node 20 LTS**, **pnpm** for package management
- **TypeScript** strict mode throughout

## 4. Repository layout

```
src/
├─ components/
│  ├─ layout/        # Sidebar.astro, ThemeToggle.svelte, LangSwitch.astro, PrevNext.astro
│  └─ islands/       # VectorPlayground.svelte, DistanceComparator.svelte, ...
├─ content.config.ts  # Content Collection schema (root, per Astro 5 convention)
├─ content/
│  └─ topics/
│     ├─ th/01-vector.mdx ... 11-recommendations.mdx
│     └─ en/01-vector.mdx ... 11-recommendations.mdx
├─ layouts/
│  └─ TopicLayout.astro
├─ pages/
│  ├─ index.astro              # TH home
│  ├─ [slug].astro             # TH topic pages
│  └─ en/
│     ├─ index.astro           # EN home
│     └─ [slug].astro          # EN topic pages
├─ lib/
│  ├─ embeddings/              # pre-computed JSON fixtures (committed)
│  └─ math/                    # pure helpers: dot, norm, cosine, euclidean, manhattan
└─ styles/
   └─ global.css               # Tailwind base + KaTeX overrides
public/
└─ (favicons, og images)
scripts/
└─ build-fixtures.ts           # offline pipeline that produces lib/embeddings/*.json
.github/workflows/
├─ ci.yml
└─ deploy.yml
```

## 5. Content model

### Content Collection schema (`src/content.config.ts`)

```ts
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const topics = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/topics' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    group: z.enum(['math', 'vector-db', 'real-world']),
    order: z.number().int(),
    locale: z.enum(['th', 'en']),
    summary: z.string(),
    hasInteractive: z.boolean().default(false),
    interactiveComponent: z.string().optional(),
    hasMath: z.boolean().default(false),
    updated: z.date().optional(),
  }),
});

export const collections = { topics };
```

### Sidebar generation

- At build time: `getCollection('topics', t => t.data.locale === currentLocale)`
- Group by `data.group`; sort by `data.order` within each group
- Render as **collapsible sections** (`<details open>` for default-expanded), each containing a `<ul>` of topic links
- Active topic gets `aria-current="page"` and a highlight
- Group labels are localized:
  - TH: `พื้นฐานคณิตศาสตร์` / `ฐานข้อมูลเวกเตอร์` / `ตัวอย่างจริง`
  - EN: `Math foundations` / `Vector databases` / `Real-world examples`
- Mobile: sidebar collapses into a top "Topics" drawer using a pure HTML `<details>` toggle (no Svelte needed)

### Prev / Next

- `PrevNext.astro` receives the current `order` + `locale`, queries the collection, and resolves neighbors. No wrap-around: order 1 renders no "Prev" link; order 11 renders no "Next" link.

### URL structure

- TH (default, no prefix): `/`, `/vector`, `/vector-operations`, …, `/recommendations`
- EN: `/en/`, `/en/vector`, `/en/vector-operations`, …
- A `LangSwitch` component flips between locales while preserving the slug.

### Translation parity check (build-time invariant)

A small Node script wired into the build via an Astro integration hook (`astro:build:start`) asserts:

- Every `slug` exists in both `th` and `en` topic folders
- `order` values are unique within each locale
- Every `interactiveComponent` name resolves to a file in `src/components/islands/`

Any violation fails the build with a clear message.

## 6. Per-page template (`TopicLayout.astro`)

Visual structure top → bottom:

1. **Breadcrumb / group label** — small text: `Math foundations / Vector` (localized)
2. **Title** (`<h1>`) — from frontmatter
3. **"What you'll learn"** banner — one-sentence `summary` in a soft tinted box
4. **MDX body** with conventional sub-headings (`<h2>`):
   - **Intuition** — analogy or visual hook, no formulas
   - **Try it** (when `hasInteractive: true`) — embedded Svelte island via `<Component client:visible />`
   - **In the real world** — short paragraph anchoring the concept to vector DB usage
   - **Formal definition** (optional) — `<Details>` block, collapsed by default
   - **Try it yourself** — open-ended prompt(s)
   - **Key takeaways** — 2–3 bullets
5. **Prev / Next** navigation
6. **Footer** — last-updated date (localized format), source repo link, language switch

### MDX authoring helpers (auto-imported)

- `<Callout type="info|tip|warning">`
- `<Details summary="...">` — styled collapsible block
- `<TryYourself>` — styled prompt box
- `<Takeaways>` + `<Takeaway>` — styled key-takeaways list
- `<Math>` for inline math; `$$ ... $$` for block math (handled by remark/rehype plugins)

### Hydration strategy

- All islands use `client:visible` (no JS until scrolled into view)
- Theme toggle uses `client:load` so it works immediately

### Typography

- `@tailwindcss/typography` (`prose` class) tuned for our brand color and dark mode
- KaTeX styles loaded only on pages that contain math, gated by a `hasMath: boolean` flag on the topic frontmatter (added to the schema in §5)

## 7. Interactive Svelte islands

All islands are pure-client components in `src/components/islands/`. They take no server state. Math helpers live in `src/lib/math/` as pure functions.

| # | Component                  | Used on topic                | Behavior summary                                                                                  |
|---|----------------------------|------------------------------|---------------------------------------------------------------------------------------------------|
| 1 | `VectorPlayground.svelte`  | 1 (Vector), 4 (Norms)        | Drag a 2D vector head; live-updates `(x, y)`, L2 magnitude, L1 norm. Optional second vector.     |
| 2 | `VectorOpsPlayground.svelte` | 2 (Vector ops)             | Two draggable vectors `a`, `b`; tabs for Add / Subtract / Scale (slider) / Dot product.          |
| 3 | `DistanceComparator.svelte` | 3 (Distance & similarity)   | Two draggable points; live Euclidean / Manhattan / Cosine values + visual overlays for each.     |
| 4 | `HighDimIntuition.svelte`   | 5 (High-dim intuition)      | Slider `dim: 2..100`; histogram of pairwise cosine sims of 500 random unit vectors.              |
| 5 | `EmbeddingMap.svelte`       | 6 (Embeddings)              | Pre-computed 2D PCA scatter of ~30 word embeddings. Hover to highlight neighbors and clusters.   |
| 6 | `AnnVisualizer.svelte`      | 8 (ANN)                     | 200-point scatter; toggle Exact kNN vs simplified greedy graph search. Compares hops vs accuracy.|
| 7 | `SemanticSearchDemo.svelte` | 9 (Semantic search)         | ~50 pre-embedded sentences; user query matched to the closest canned query, top-5 results shown. |
| 8 | `RagFlow.svelte`            | 10 (RAG)                    | Animated step-through: question → embed → retrieve → LLM → answer (canned).                      |
| 9 | `RecommendationsDemo.svelte`| 11 (Recommendations)        | 20 fake users × 30 fake items with 4-dim taste vectors; pick a user, see top-5 recs by cosine.   |

### Semantic search behavior

- **Path A (default, shipped):** ~50 canned queries with pre-computed embeddings. User input is matched to the nearest canned query via simple word-overlap, then that query's top-5 results are displayed. Fully offline.
- **Path B (stretch, deferred):** behind an "Enable live search" button, lazy-load `transformers.js` (~5 MB) to embed any user query in-browser. No server involved either way.

### Offline embedding pipeline

- `scripts/build-fixtures.ts` runs in Node, uses `@xenova/transformers` with `Xenova/all-MiniLM-L6-v2` (384-dim), produces JSON in `src/lib/embeddings/`
- Output JSON is **committed**; runtime never loads the model
- `pnpm build:fixtures` is **not** part of `astro build`; only run when fixtures change
- CI may optionally re-run it to verify committed JSON has not drifted

### Bundle expectations

- Per-page island JS: 5–25 KB gzipped depending on island
- Embedding JSON files loaded via dynamic `import()` inside islands (only fetched on the topic's page)
- KaTeX CSS (~25 KB gzipped) loaded only on pages containing math

## 8. Accessibility

- Real `<button>` / `<input type="range">` / `<input type="text">` everywhere; no fake clickable `<div>`s
- Keyboard interaction for all draggable elements:
  - Tab to focus a vector head; arrow keys nudge by 0.1; Shift+arrow nudges by 1.0
  - Adjacent numeric inputs accept direct typed values
- SVG-based demos include an `aria-live` region announcing current values (debounced)
- Color is never the only signal — vectors carry both color and label; histograms have axes; metrics have text labels
- Color contrast meets WCAG AA in light and dark
- Sidebar drawer on mobile uses `<details>` for correct keyboard semantics
- "Skip to content" link at the top of every page
- All islands honor `prefers-reduced-motion` (animations disabled, instant transitions instead)
- DOM order is logical without CSS (sidebar after main content; positioned via Tailwind grid)

## 9. Performance

Budget targets:

- HTML per topic page: under 30 KB
- Global CSS (Tailwind purged + KaTeX): under 50 KB gzipped
- JS per topic: under 30 KB gzipped on the heaviest island; pages with no island ship 0 KB JS
- LCP under 1.5 s on a simulated 4G connection; CLS under 0.05
- No web fonts; system font stack via Tailwind defaults

## 10. Error handling

This is a static educational site, so "errors" mostly mean authoring mistakes and demo edge cases.

**Build-time validation (preferred):**

- Content collection schema enforces required frontmatter fields
- Translation parity script: every slug exists in both locales
- `order` uniqueness check within each locale
- `interactiveComponent` names must resolve to a file in `src/components/islands/`

**Runtime in islands:**

- Numeric inputs clamp to sensible ranges (no try/catch)
- Fixture loads use static `import` for type safety; missing fixtures fail the build
- Cosine similarity guards `||a|| === 0` (returns 0; UI shows "Vector has no length" hint)

**404 page:** small static `404.astro` per locale, with a link back to home.

## 11. Testing

- **Unit tests (Vitest, no DOM):** all helpers in `src/lib/math/` — dot, norm, cosine, euclidean, manhattan. Includes degenerate cases (zero vector, identical points, high dimensions)
- **Component tests (Vitest + `@testing-library/svelte`):** each island's logic — wire up the component, simulate input events, assert displayed values. Testing the math-display contract, not pixel positions
- **Build smoke test in CI:** `pnpm build` must pass; this exercises every build-time validation
- **Lighthouse CI** in GitHub Actions on PRs: enforces the performance budget and a11y score above 95
- **No E2E tests** for v1

## 12. SEO & metadata

- Open Graph + Twitter card tags on every topic page, localized
- Single `sitemap.xml` (via `@astrojs/sitemap`) including both locales with `hreflang` entries
- `robots.txt` allows everything

## 13. Tooling & dev workflow

**Toolchain:**

- Node 20 LTS, pnpm, TypeScript strict
- ESLint with `astro-eslint-parser` + `eslint-plugin-svelte`
- Prettier with `prettier-plugin-astro` and `prettier-plugin-svelte`
- Husky + lint-staged for pre-commit Prettier/ESLint on staged files

**Scripts (`package.json`):**

| script             | command                                  |
|--------------------|------------------------------------------|
| `dev`              | `astro dev`                              |
| `build`            | `astro build`                            |
| `preview`          | `astro preview`                          |
| `build:fixtures`   | `tsx scripts/build-fixtures.ts`          |
| `test`             | `vitest run`                             |
| `test:watch`       | `vitest`                                 |
| `typecheck`        | `astro check && tsc --noEmit`            |
| `lint`             | `eslint . && prettier --check .`         |
| `format`           | `prettier --write .`                     |

**CI (`.github/workflows/`):**

- `ci.yml` — on every PR: install, typecheck, lint, test, build, Lighthouse CI
- `deploy.yml` — on push to `main`: build and deploy `dist/` to GitHub Pages via `actions/deploy-pages`
- Branch protection on `main`: PRs require `ci` to pass

**Local workflow:**

1. `pnpm install`
2. `pnpm build:fixtures` (once, or whenever fixtures change)
3. `pnpm dev` → `localhost:4321`
4. Adding a topic = create two MDX files (one per locale), set `order` / `group` / `slug` / `summary`, restart dev server

**Repo conventions:**

- Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)
- One PR per topic for content; one PR per island for interactivity
- README documents how to run, how to add a topic, how to add an island, and how to rebuild fixtures

## 14. Milestones

- **M1 — Skeleton:** Astro + Tailwind + Svelte + MDX + KaTeX wired up; one placeholder topic in both locales; sidebar; theme toggle; deploy pipeline. No interactive demos yet.
- **M2 — Math foundations content:** Topics 1–5 with their islands (`VectorPlayground`, `VectorOpsPlayground`, `DistanceComparator`, `HighDimIntuition`).
- **M3 — Vector DB content:** Topics 6–8 with `EmbeddingMap` and `AnnVisualizer`; fixture build pipeline live.
- **M4 — Real-world content:** Topics 9–11 with `SemanticSearchDemo`, `RagFlow`, `RecommendationsDemo`.
- **M5 — Polish:** Lighthouse CI tuning, a11y audit, copy pass on Thai content, social cards, optional "About" page.

## 15. Deferred decisions

To be resolved during implementation, not now:

- Exact Tailwind theme colors / brand palette (will propose 2–3 swatches at the start of M1)
- Specific Thai translations for technical terms (handled per topic as content is authored)
- Whether to include a small "About / how this site was built" page (defer to M5)
