# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context7

Always use Context7 when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

## What this is

A static, bilingual (Thai canonical, English mirrored) Astro 6 site teaching vector databases through 11 topics × 9 interactive Svelte 5 islands. Deployed to GitHub Pages at `https://foreveralonet.github.io/learn-vector-db/`. Implementation history is in `docs/superpowers/plans/` (M1 skeleton through M5 polish) — reach for those plans when context about a specific decision is needed.

## Commands

```bash
pnpm dev               # localhost:4321
pnpm build             # static build to dist/ (also emits OG PNGs + sitemap)
pnpm test              # full Vitest suite
pnpm test <path>       # single file, e.g. pnpm test src/lib/math/vec.test.ts
pnpm test:watch        # watch mode
pnpm typecheck         # astro check && tsc --noEmit
pnpm lint              # ESLint, --max-warnings 0
pnpm format:check      # Prettier check
pnpm build:fixtures    # offline embedding pipeline; rebuilds words.json + sentences.json
```

Husky pre-commit runs ESLint + Prettier on staged files. Don't bypass with `--no-verify`.

## Architecture (big picture)

**Three-way contract for interactive topics.** Each topic with `hasInteractive: true` participates in a build-time enforced contract:

1. The topic's MDX frontmatter declares `interactiveComponent: <Name>`.
2. A file at `src/components/islands/<Name>.svelte` must exist (no other directory is searched).
3. The MDX body must actually mention `<Name>` (e.g. `<Name client:visible />`).

`src/integrations/validate-topics.ts` runs during `astro:build:start` and fails the build if any leg of this contract is broken. When adding/renaming an island, all three legs must move in lockstep.

**Offline fixture pipeline.** `scripts/build-fixtures.ts` runs the @xenova/transformers model once on dev hardware, embeds the curated word list (`scripts/embedding-words.ts`) and sentence corpus (`scripts/semantic-search-corpus.ts`), and writes two committed JSONs at `src/lib/embeddings/{words,sentences}.json`. **The runtime never loads the model** — islands import typed loaders (`words-loader.ts`, `sentences-loader.ts`) which `import` the JSON statically. The two JSON files are in `.prettierignore` because their format is `JSON.stringify(value, null, 2)` and Prettier would inline short arrays, creating churn on every fixture rebuild.

**Path/base handling.** `src/lib/i18n.ts` `buildTopicPath(locale, slug)` is the single source of truth for every internal href across Sidebar / PrevNext / LangSwitch / index pages / 404 pages / TopicLayout brand link. It prefixes paths with `import.meta.env.BASE_URL` so the site works under the `/learn-vector-db/` GitHub Pages base. Vitest defaults BASE_URL to `/`, so the test assertions stay valid without environment-specific guards. **Don't hardcode `/foo` paths anywhere** — go through `buildTopicPath` (for topic links) or `${import.meta.env.BASE_URL}foo` (for static assets like the favicon).

**Vitest split-project setup.** `vitest.config.ts` defines two projects:

- **browser** (jsdom + Svelte plugin): runs `src/components/**/*.test.ts` and `src/lib/**/*.test.ts`.
- **node**: runs `src/integrations/**/*.test.ts` and `scripts/**/*.test.ts`.

Files under `scripts/` and `src/integrations/` get Node types via a triple-slash `/// <reference types="node" />` at the top — `tsconfig.json` does **not** include `node` globally, so Node APIs aren't available in `src/components/` or `src/lib/`.

**Island perf shape (M2 deferred follow-up #1, applied site-wide).** Heavy work that depends only on static fixture inputs runs **once at module init** (e.g., `const layout = (() => { ... })();`) — not inside `$derived`. Per-frame state churn (input changes) drives only cheap derivations. Tests for islands mock the fixture loader via `vi.mock('../../lib/embeddings/...-loader', () => ({ ... }))` to stay deterministic.

**Math library style (M2 deferred follow-up #4).** `src/lib/math/vec.ts` uses explicit `for` loops over `.map`/`.filter` for tight numeric paths — keeps the file uniform and avoids intermediate-array allocations in hot paths like `HighDimIntuition` and `AnnVisualizer`. Match this style in any new `src/lib/math/` helpers.

**Topic schema is extracted.** `src/lib/content/topic-schema.ts` exports the Zod schema; `src/content.config.ts` re-exports it into the Astro content collection. Schema changes go in the lib file and get unit-tested at `src/lib/content/topic-schema.test.ts` rather than only at build time.

## Workflow conventions

- **Commit directly to `main`.** No feature branches; the established cadence across M1–M5 is one commit per task on `main`. CI gates (`ci.yml`) catch regressions on PRs _and_ pushes.
- **Conventional commit prefixes**: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`, `ci`.
- **Always include the trailer** `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` on commits.
- **Plans live in `docs/superpowers/plans/`** and are committed alongside the work they drove. When picking up a milestone, read its plan first.
- **CI runs Node 22.** `package.json`'s `engines.node` is `>=22.0` (Astro 6 dropped Node 20).

## What to avoid

- Don't add features speculatively. The "Out of scope" sections in each milestone plan list what was deliberately deferred — those items are deferred for reasons documented there.
- Don't load the embedding model at runtime. The committed JSON is the contract.
- Don't modify `words.json` or `sentences.json` by hand — re-run `pnpm build:fixtures` and commit the regenerated output.
- Don't restructure `astro.config.mjs`'s `site` / `base` without updating `src/lib/i18n.ts` callers — those values are deploy-coupled.
