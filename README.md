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

| script              | what it does                |
| ------------------- | --------------------------- |
| `pnpm dev`          | start dev server            |
| `pnpm build`        | static build to `dist/`     |
| `pnpm preview`      | preview the static build    |
| `pnpm test`         | run Vitest suite            |
| `pnpm typecheck`    | astro check + tsc --noEmit  |
| `pnpm format`       | format with Prettier        |
| `pnpm format:check` | Prettier check (used in CI) |

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

## Deployment

Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml`. To enable:

1. Repo Settings → Pages → Source → "GitHub Actions"
2. Update `site` and `base` in `astro.config.mjs` to match the Pages URL (e.g. `site: 'https://<user>.github.io'`, `base: '/learn-vector-db/'`)
3. Push to `main`

## License

MIT.
