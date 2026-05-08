# Learn Vector DB

Interactive, beginner-friendly learning site for vector databases and the math behind them. Bilingual: Thai (default) and English. Built with Astro 6, Tailwind v4, Svelte 5, MDX.

## Live site

https://<user>.github.io/learn-vector-db/

(Replace `<user>` once GitHub Pages is configured.)

## Local development

Requires Node 20+ and pnpm 9+.

```bash
pnpm install
pnpm dev          # http://localhost:4321
```

## Scripts

| script                | what it does                                         |
| --------------------- | ---------------------------------------------------- |
| `pnpm dev`            | start dev server                                     |
| `pnpm build`          | static build to `dist/`                              |
| `pnpm build:fixtures` | regenerate `src/lib/embeddings/words.json` (offline) |
| `pnpm preview`        | preview the static build                             |
| `pnpm test`           | run Vitest suite                                     |
| `pnpm typecheck`      | astro check + tsc --noEmit                           |
| `pnpm format`         | format with Prettier                                 |
| `pnpm format:check`   | Prettier check (used in CI)                          |

## Adding a topic

1. Create two MDX files (one per locale): `src/content/topics/th/<order>-<slug>.mdx` and `src/content/topics/en/<order>-<slug>.mdx`.
2. Frontmatter must include: `title`, `slug`, `group` (`math` | `vector-db` | `real-world`), `order` (unique per locale), `locale`, `summary`. See the schema in `src/content.config.ts`.
3. Restart the dev server. The sidebar updates automatically.
4. If the topic embeds an interactive demo, set `interactiveComponent: <Name>` in the frontmatter. The component must live at `src/components/islands/<Name>.svelte` — that's the only directory the build-time validator searches. Anywhere else and the build will fail with `Unknown interactiveComponent`.
5. MDX helper components (`TryYourself`, `Takeaways`, `Takeaway`, `Callout`, `Details`) are **not** auto-injected by the layout. Every MDX file that uses them must include explicit imports at the top of the file, e.g.:
   ```mdx
   import TryYourself from '../../../components/mdx/TryYourself.astro';
   import Takeaways from '../../../components/mdx/Takeaways.astro';
   import Takeaway from '../../../components/mdx/Takeaway.astro';
   ```
6. The build will fail if a slug exists in only one locale or if two topics share the same `order`.

## Rebuilding embedding fixtures

The `EmbeddingMap` demo on the "Embeddings" topic page is driven by a committed JSON file at `src/lib/embeddings/words.json`. That file is produced offline by:

```bash
pnpm build:fixtures
```

Run it only when one of the following changes:

- The curated word list in `scripts/embedding-words.ts`
- The embedding model name in `scripts/build-fixtures.ts` (defaults to `Xenova/all-MiniLM-L6-v2`)
- The number of pre-computed neighbors per word (`DEFAULT_K`)

The first run downloads the model (~25 MB) into a local cache. Subsequent runs are fast. The pipeline is **not** wired into `pnpm build` — `astro build` always reads the committed JSON and never reaches the network.

After regenerating, eyeball `meta` and the first few entries:

```bash
node -e "const f = require('./src/lib/embeddings/words.json'); console.log(f.meta); console.log(f.words.slice(0, 2));"
```

Commit `words.json` along with whatever change triggered the rebuild.

## Deployment

Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml`. To enable:

1. Repo Settings → Pages → Source → "GitHub Actions"
2. Update `site` and `base` in `astro.config.mjs` to match the Pages URL (e.g. `site: 'https://<user>.github.io'`, `base: '/learn-vector-db/'`)
3. Push to `main`

## License

MIT.
