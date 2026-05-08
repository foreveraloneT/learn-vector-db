# Learn Vector DB

An interactive, beginner-friendly learning site that teaches vector databases and the math behind them, with every concept anchored to a real-world use case. Bilingual: Thai (default) and English.

## Live site

**🌐 https://foreveralonet.github.io/learn-vector-db/**

Deploys automatically on every push to `main` via the `deploy.yml` GitHub Actions workflow.

## What's covered

11 topics across 3 groups, with 9 interactive Svelte islands:

| group               | topic                           | island              |
| ------------------- | ------------------------------- | ------------------- |
| Math foundations    | 1. Vector                       | VectorPlayground    |
|                     | 2. Vector operations            | VectorOpsPlayground |
|                     | 3. Distance & similarity        | DistanceComparator  |
|                     | 4. Norms in plain English       | VectorPlayground    |
|                     | 5. High-dimensional intuition   | HighDimIntuition    |
| Vector databases    | 6. What is an embedding?        | EmbeddingMap        |
|                     | 7. What is a vector database?   | _(no island)_       |
|                     | 8. Approximate nearest neighbor | AnnVisualizer       |
| Real-world examples | 9. Semantic search              | SemanticSearchDemo  |
|                     | 10. RAG                         | RagFlow             |
|                     | 11. Recommendations             | RecommendationsDemo |

## Stack

- **Astro 6** static output with `@astrojs/mdx`, `@astrojs/svelte`, `@astrojs/sitemap`
- **Svelte 5** (runes) for interactive islands, `client:visible` hydration
- **Tailwind v4** via `@tailwindcss/vite`
- **TypeScript strict** + **Vitest** (split browser/jsdom + node projects)
- **KaTeX** via `remark-math` + `rehype-katex` for math rendering inside MDX
- **astro-og-canvas** generates per-topic 1200×630 Open Graph cards at build time
- **@xenova/transformers** runs the offline embedding pipeline (model never loaded at runtime)
- **ESLint 8** + **Prettier** + **Husky** + **lint-staged** for the pre-commit gate
- **Lighthouse CI** asserts perf ≥ 0.9, a11y ≥ 0.95, LCP ≤ 1500 ms, CLS ≤ 0.05 on every PR

## Local development

Requires **Node 22+** (Astro 6 dropped Node 20) and **pnpm 9+**.

```bash
pnpm install
pnpm dev          # http://localhost:4321
```

Pre-commit hooks run automatically after install (Husky `prepare` script). They invoke `eslint` and `prettier --write` on staged files.

## Scripts

| script                | what it does                                        |
| --------------------- | --------------------------------------------------- |
| `pnpm dev`            | start dev server                                    |
| `pnpm build`          | static build to `dist/` (incl. OG PNGs and sitemap) |
| `pnpm preview`        | preview the static build                            |
| `pnpm build:fixtures` | regenerate `src/lib/embeddings/*.json` (offline)    |
| `pnpm test`           | run Vitest suite                                    |
| `pnpm test:watch`     | Vitest in watch mode                                |
| `pnpm typecheck`      | `astro check && tsc --noEmit`                       |
| `pnpm lint`           | ESLint with `--max-warnings 0`                      |
| `pnpm format`         | format with Prettier                                |
| `pnpm format:check`   | Prettier check (used in CI)                         |

## Repo layout (high-level)

```
src/
├─ components/
│  ├─ islands/        # interactive Svelte demos (one per topic that needs one)
│  ├─ layout/         # Sidebar, ThemeToggle, LangSwitch, PrevNext
│  └─ mdx/            # MDX-helper components (Callout, Details, Takeaway, …)
├─ content/topics/
│  ├─ th/             # Thai MDX (canonical content)
│  └─ en/             # English MDX (mirrored)
├─ layouts/
│  └─ TopicLayout.astro   # one shell, all 22 topic pages
├─ lib/
│  ├─ math/           # pure helpers — vec, metrics, random, pca, knn
│  ├─ embeddings/     # committed JSON fixtures + typed loaders
│  ├─ search/         # word-overlap matcher
│  ├─ rag/            # canned (Q, retrieved, A) tuples
│  ├─ recommendations/  # synthetic users + items generator
│  ├─ og/             # OG card config helper
│  ├─ svg/            # math→SVG coord helper
│  └─ content/        # extracted Zod topic schema
├─ pages/
│  ├─ [slug].astro       # TH topic pages
│  ├─ en/[slug].astro    # EN topic pages
│  └─ og/[...slug].ts    # per-topic OG PNG endpoint
└─ integrations/
   └─ validate-topics.ts # build-time parity + MDX-body usage validator
scripts/
├─ build-fixtures.ts
├─ embedding-words.ts
└─ semantic-search-corpus.ts
.github/workflows/
├─ ci.yml              # format/lint/typecheck/test/build on PR + push
├─ lighthouse.yml      # Lighthouse CI on PR + push
├─ deploy.yml          # publish dist/ to GitHub Pages on push to main
└─ fixture-drift.yml   # weekly fixture-drift detector
```

## Adding a topic

1. Create two MDX files (one per locale): `src/content/topics/th/<order>-<slug>.mdx` and `src/content/topics/en/<order>-<slug>.mdx`.
2. Frontmatter must include: `title`, `slug`, `group` (`math` | `vector-db` | `real-world`), `order` (unique per locale), `locale`, `summary`. See the schema in `src/content.config.ts`.
3. Restart the dev server. The sidebar updates automatically.
4. If the topic embeds an interactive demo, set `interactiveComponent: <Name>` in the frontmatter. The component must live at `src/components/islands/<Name>.svelte` — that's the only directory the build-time validator searches. Anywhere else and the build will fail with `Unknown interactiveComponent`. The MDX body must also actually mention `<Name>` (the validator enforces this).
5. MDX helper components (`TryYourself`, `Takeaways`, `Takeaway`, `Callout`, `Details`) are **not** auto-injected by the layout. Every MDX file that uses them must include explicit imports at the top:

   ```mdx
   import TryYourself from '../../../components/mdx/TryYourself.astro';
   import Takeaways from '../../../components/mdx/Takeaways.astro';
   import Takeaway from '../../../components/mdx/Takeaway.astro';
   ```

6. The build will fail if a slug exists in only one locale or if two topics share the same `order` within a locale.

## Adding an interactive island

1. Create `src/components/islands/<Name>.svelte`.
2. Reference it from a topic MDX via `interactiveComponent: <Name>` and `<Name client:visible />` in the body.
3. Test with `<Name>.test.ts` alongside it. Browser-side islands run under jsdom; mock fixture loaders with `vi.mock` to keep tests deterministic.
4. Heavy work that depends only on static fixture inputs should run **once at module init** (not inside `$derived`); per-frame state churn drives only cheap derivations.

## Rebuilding embedding fixtures

The two committed fixture files at `src/lib/embeddings/words.json` and `src/lib/embeddings/sentences.json` drive `EmbeddingMap`, `SemanticSearchDemo`, and `RagFlow`. Both are produced offline by:

```bash
pnpm build:fixtures
```

A single invocation loads the embedding model once and writes both fixtures. Run it when one of the following changes:

- The curated word list in `scripts/embedding-words.ts`
- The sentence corpus or canned queries in `scripts/semantic-search-corpus.ts`
- The embedding model name in `scripts/build-fixtures.ts` (defaults to `Xenova/all-MiniLM-L6-v2`)
- The number of pre-computed neighbors / per-query top-K (`DEFAULT_K`, `DEFAULT_QUERY_K`)

The first run downloads the model (~25 MB) into a local cache. Subsequent runs are fast. The pipeline is **not** wired into `pnpm build` — `astro build` always reads the committed JSON and never reaches the network. The `fixture-drift.yml` workflow re-runs the pipeline weekly on CI and fails if the result diverges from what's committed (excluding the timestamp).

After regenerating, eyeball both files:

```bash
node -e "const w = require('./src/lib/embeddings/words.json'); const s = require('./src/lib/embeddings/sentences.json'); console.log('words:', w.meta); console.log('sentences:', s.meta);"
```

Commit both `words.json` and `sentences.json` together with whatever change triggered the rebuild.

## Deployment

Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml`. The site URL and base path are configured in `astro.config.mjs`:

- `site`: `https://foreveralonet.github.io`
- `base`: `/learn-vector-db/`

Update both fields and the README "Live site" link if forking to a different account or repo name.

## License

Not yet declared. Add a `LICENSE` file at the repo root before sharing publicly.
