# Learn Vector DB — M3 (Vector DB Content) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Topics 6–8 (the "Vector databases" group: embeddings, vector-database, ANN) with their two interactive islands (`EmbeddingMap`, `AnnVisualizer`). Bring the offline embedding-fixture pipeline (`scripts/build-fixtures.ts`) live so the EmbeddingMap demo runs on real, pre-computed embeddings. Fold in the four M3-relevant deferred follow-ups from the M2 review so the foundation stays coherent.

**Architecture:** Two new pure math modules (`pca`, `knn`) extend `src/lib/math/`. The fixture pipeline runs once locally (`pnpm build:fixtures`), uses `@xenova/transformers` to embed a curated ~30-word list with `Xenova/all-MiniLM-L6-v2`, projects to 2D via in-house PCA, pre-computes top-5 neighbors in the *original* 384-dim space, and writes a single committed JSON file at `src/lib/embeddings/words.json`. Runtime never loads the model — islands import the JSON via static `import` and render. `EmbeddingMap` plots the scatter + highlights pre-computed neighbors on hover; `AnnVisualizer` synthesizes 200 seeded random points client-side and contrasts an exact-kNN sweep against a simplified greedy-graph search, reporting hops and overlap. Both islands follow the perf pattern noted in M2 follow-up #1: heavy work isolated to a derivation gated on its actual inputs.

**Tech Stack:** All M2 stack (Astro 6, Tailwind v4, Svelte 5, MDX, KaTeX, Vitest with split browser/node projects). New runtime: nothing — the model is dev-only. New devDependencies: `@xenova/transformers` (offline embedding), `tsx` (run TS scripts in Node).

**Spec reference:** `docs/superpowers/specs/2026-05-02-learn-vector-db-design.md` §7 (`EmbeddingMap`, `AnnVisualizer`, offline embedding pipeline), §2 (topics 6–8), §13 (`build:fixtures` script).

**M2 baseline:** `docs/superpowers/plans/2026-05-02-learn-vector-db-m2-math-foundations.md` — completed; its "Deferred follow-ups → For M3" section enumerates four items folded into Tasks 1–4 below.

---

## Out of scope for M3

Intentionally deferred (do **not** implement):

- Topics 9–11 (real-world group: semantic-search, RAG, recommendations) → M4
- The `SemanticSearchDemo`, `RagFlow`, `RecommendationsDemo` islands → M4
- Path B in spec §7 ("Enable live search" via in-browser transformers.js) → M4 stretch
- Drag-via-pointer-events for islands; keep the keyboard / numeric input path → M5
- Lighthouse CI / perf budget enforcement → M5
- Sitemap / OG tags, social cards → M5
- ESLint, Husky → M5
- 3D visualizations (PCA projection stays 2D) → never
- Fancy ANN algorithms (HNSW, IVF, PQ); ship the *simplified* greedy-graph for teaching → M5+
- Re-embedding fixtures in CI (the spec says "may optionally re-run"; not in M3) → M5
- Multilingual embeddings — the 30-word fixture is English; both TH and EN topic pages reference the same JSON and gloss the words in prose → revisit if/when a Thai-native demo becomes important

## Pre-flight

- Repo on `main`, M2 shipped (last commit `29d780e`). Verify clean baseline:

```bash
pnpm format:check && pnpm typecheck && pnpm test && pnpm build
```

  Expected: format clean, 0 type errors, ~74 tests across browser + node, build emits 12 pages with `Topic validation passed (10 topics, 4 islands, MDX usage verified)`.

- Work on `main` (matches M1/M2 cadence). One commit per task. Conventional commit prefixes (`feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`).

- Each topic continues to render through `TopicLayout.astro`. MDX helpers (`Callout`, `Details`, `TryYourself`, `Takeaways`, `Takeaway`) are already auto-discoverable; M2 confirmed they work without explicit imports.

- The validator in `src/integrations/validate-topics.ts` enforces both island-name resolution **and** MDX-body usage of the declared component (added in commit `9c6a384`). M3 islands and topics must satisfy both.

- The fixture pipeline runs **only** when `pnpm build:fixtures` is invoked. `astro build` must remain offline-friendly — it should never fetch a model.

## File structure (M3)

```
scripts/
├─ build-fixtures.ts                       # CREATE — offline pipeline driver
├─ build-fixtures.test.ts                  # CREATE — node-side contract test (no model load)
└─ embedding-words.ts                      # CREATE — curated 30-word list shared with the test
src/
├─ lib/
│  ├─ math/
│  │  ├─ vec.ts                            # MODIFY — converge on explicit-for style (deferred #4)
│  │  ├─ metrics.test.ts                   # MODIFY — add identical-non-axis cosine case (deferred #3)
│  │  ├─ pca.ts                            # CREATE — minimal 2D PCA via power iteration
│  │  ├─ pca.test.ts                       # CREATE
│  │  ├─ knn.ts                            # CREATE — exact kNN + simplified greedy-graph
│  │  └─ knn.test.ts                       # CREATE
│  ├─ content/
│  │  ├─ topic-schema.ts                   # CREATE — extracted from src/content.config.ts
│  │  └─ topic-schema.test.ts              # CREATE — Zod schema unit test (deferred #2)
│  └─ embeddings/                          # NEW directory
│     ├─ words.json                        # CREATE — built by scripts/build-fixtures.ts
│     └─ words-loader.ts                   # CREATE — typed loader + runtime contract
├─ components/islands/
│  ├─ EmbeddingMap.svelte                  # CREATE — Topic 6
│  ├─ EmbeddingMap.test.ts                 # CREATE
│  ├─ AnnVisualizer.svelte                 # CREATE — Topic 8
│  └─ AnnVisualizer.test.ts                # CREATE
├─ content/topics/
│  ├─ th/06-embeddings.mdx                 # CREATE
│  ├─ th/07-vector-database.mdx            # CREATE
│  ├─ th/08-ann.mdx                        # CREATE
│  ├─ en/06-embeddings.mdx                 # CREATE
│  ├─ en/07-vector-database.mdx            # CREATE
│  └─ en/08-ann.mdx                        # CREATE
└─ content.config.ts                       # MODIFY — re-export schema from src/lib/content/topic-schema
README.md                                   # MODIFY — document `pnpm build:fixtures`, when to rerun
package.json                                # MODIFY — add tsx, @xenova/transformers; add build:fixtures script
.gitignore                                  # MODIFY — keep words.json committed; ignore HF model cache
```

Tasks 1–3 are deferred-follow-up cleanups front-loaded so subsequent tasks build on the corrected foundation.

---

## Task 1: vec.ts style consistency (deferred follow-up #4)

**Files:** `src/lib/math/vec.ts`, `src/lib/math/vec.test.ts`

Currently `add` and `sub` use `.map(...)`, while `dot`, `magnitude`, and `l1norm` use explicit `for` loops. The deferred-follow-up calls for picking one style and applying it throughout. Pick **explicit `for` loops** for two reasons: (a) `dot` *must* accumulate, so it can't be expressed with `.map`, meaning some of the file is for-loop-shaped no matter what; (b) explicit loops avoid an intermediate array allocation in the hot paths used by `HighDimIntuition` and the new `AnnVisualizer`.

- [ ] **Step 1.1:** Update `src/lib/math/vec.ts`

```ts
export type Vec = readonly number[];

function assertSameLength(a: Vec, b: Vec): void {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }
}

export function add(a: Vec, b: Vec): number[] {
  assertSameLength(a, b);
  const out: number[] = new Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] + b[i];
  return out;
}

export function sub(a: Vec, b: Vec): number[] {
  assertSameLength(a, b);
  const out: number[] = new Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] - b[i];
  return out;
}

export function scale(v: Vec, k: number): number[] {
  const out: number[] = new Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] * k;
  return out;
}

export function dot(a: Vec, b: Vec): number {
  assertSameLength(a, b);
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

export function magnitude(v: Vec): number {
  return Math.sqrt(dot(v, v));
}

export function l1norm(v: Vec): number {
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += Math.abs(v[i]);
  return sum;
}

export function normalize(v: Vec): number[] {
  const m = magnitude(v);
  if (m === 0) throw new Error('Cannot normalize zero vector');
  return scale(v, 1 / m);
}
```

- [ ] **Step 1.2:** Run `pnpm test src/lib/math/vec.test.ts`

Expected: all existing assertions still pass — these are pure refactors with no behavior change. If anything goes red, restore the previous file and investigate.

- [ ] **Step 1.3:** Run the full test suite once to confirm nothing downstream relies on the old shape (e.g., reference equality of the returned array).

```bash
pnpm test
```

Expected: still ~74 tests green.

- [ ] **Step 1.4:** Commit

```bash
git add src/lib/math/vec.ts
git commit -m "refactor(math): converge vec.ts on explicit-for loops for style symmetry

dot/magnitude/l1norm already used explicit accumulator loops; convert
add/sub/scale/l1norm to the same shape so every vec function reads the
same way. Avoids the intermediate array allocation .map produces in
hot paths used by HighDimIntuition and the upcoming AnnVisualizer."
```

---

## Task 2: Add cosineSimilarity identical-non-axis test (deferred follow-up #3)

**Files:** `src/lib/math/metrics.test.ts`

Currently `cosineSimilarity([1, 0], [2, 0])` is tested (axis-aligned identical direction), but the diagonal case `cosineSimilarity([1, 1], [1, 1])` is not. Trivial gap to close.

- [ ] **Step 2.1:** Open `src/lib/math/metrics.test.ts`. Inside the existing `describe('cosineSimilarity', ...)` block, add this case adjacent to the existing "returns 1 for identical direction" case:

```ts
it('returns 1 for identical non-axis-aligned vectors', () => {
  expect(cosineSimilarity([1, 1], [1, 1])).toBeCloseTo(1, 10);
});
```

- [ ] **Step 2.2:** Run

```bash
pnpm test src/lib/math/metrics.test.ts
```

Expected: passes immediately (the implementation already handles this correctly — we're just locking it down).

- [ ] **Step 2.3:** Commit

```bash
git add src/lib/math/metrics.test.ts
git commit -m "test(math): cover cosineSimilarity for identical non-axis-aligned vectors"
```

---

## Task 3: Extract topic schema + add a Zod schema unit test (deferred follow-up #2)

**Files:** `src/content.config.ts`, `src/lib/content/topic-schema.ts`, `src/lib/content/topic-schema.test.ts`

The Zod topic schema currently lives inside `src/content.config.ts` and is only exercised at build time. M3 introduces three new topics; faster feedback in dev is worth the small refactor. Extracting the schema to `src/lib/content/topic-schema.ts` (a) gives us a unit-testable target that the existing `browser` Vitest project automatically picks up via its `src/lib/**/*.test.ts` glob, and (b) keeps `content.config.ts` as a thin wiring file.

- [ ] **Step 3.1:** Create `src/lib/content/topic-schema.ts`

```ts
import { z } from 'astro/zod';

/**
 * Zod schema for a single topic's frontmatter.
 *
 * Single source of truth — `src/content.config.ts` re-exports this and wires
 * it into the Astro content collection. Anyone wanting to assert frontmatter
 * shape in a unit test should import from here, not from `content.config.ts`.
 */
export const topicSchema = z.object({
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
});

export type TopicFrontmatter = z.infer<typeof topicSchema>;
```

- [ ] **Step 3.2:** Create `src/lib/content/topic-schema.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { topicSchema } from './topic-schema';

const minimalValid = {
  title: 'Vector',
  slug: 'vector',
  group: 'math' as const,
  order: 1,
  locale: 'th' as const,
  summary: 'A vector is an arrow.',
};

describe('topicSchema', () => {
  it('accepts a minimal valid topic and applies defaults', () => {
    const parsed = topicSchema.parse(minimalValid);
    expect(parsed.hasInteractive).toBe(false);
    expect(parsed.hasMath).toBe(false);
    expect(parsed.interactiveComponent).toBeUndefined();
    expect(parsed.updated).toBeUndefined();
  });

  it('rejects an unknown group', () => {
    expect(() => topicSchema.parse({ ...minimalValid, group: 'recipes' })).toThrow();
  });

  it('rejects an unknown locale', () => {
    expect(() => topicSchema.parse({ ...minimalValid, locale: 'fr' })).toThrow();
  });

  it('rejects a non-integer order', () => {
    expect(() => topicSchema.parse({ ...minimalValid, order: 1.5 })).toThrow();
  });

  it('rejects a missing required field', () => {
    const { summary: _drop, ...withoutSummary } = minimalValid;
    expect(() => topicSchema.parse(withoutSummary)).toThrow();
  });

  it('accepts an interactive topic with a component name', () => {
    const parsed = topicSchema.parse({
      ...minimalValid,
      hasInteractive: true,
      interactiveComponent: 'VectorPlayground',
    });
    expect(parsed.hasInteractive).toBe(true);
    expect(parsed.interactiveComponent).toBe('VectorPlayground');
  });

  it('accepts an updated date', () => {
    const d = new Date('2026-05-07');
    const parsed = topicSchema.parse({ ...minimalValid, updated: d });
    expect(parsed.updated).toEqual(d);
  });
});
```

- [ ] **Step 3.3:** Replace the body of `src/content.config.ts` so it imports the extracted schema. Read the current file first and edit it surgically — preserve the loader configuration. The result should look like:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { topicSchema } from './lib/content/topic-schema';

const topics = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/topics' }),
  schema: topicSchema,
});

export const collections = { topics };
```

- [ ] **Step 3.4:** Verify tests pass

```bash
pnpm test src/lib/content/topic-schema.test.ts
```

Expected: 7 tests green.

- [ ] **Step 3.5:** Verify the build still wires the schema correctly

```bash
pnpm typecheck && pnpm build
```

Expected: 0 type errors; build emits 12 pages; validator log unchanged.

- [ ] **Step 3.6:** Commit

```bash
git add src/lib/content/topic-schema.ts src/lib/content/topic-schema.test.ts src/content.config.ts
git commit -m "refactor(content): extract topic schema to src/lib/content for unit testing

Pulls the Zod topic-schema definition out of src/content.config.ts so
it has a stable import path that the browser Vitest project picks up
via its src/lib/**/*.test.ts glob. content.config.ts now just wires
the extracted schema into the collection. Adds a focused unit test
covering defaults, enum rejections, missing-field rejection, and the
interactive-component shape — three new topics land in this milestone
and fast dev feedback is worth the small refactor."
```

---

## Task 4: PCA helper for 2D projection (TDD)

**Files:** `src/lib/math/pca.ts`, `src/lib/math/pca.test.ts`

Implements a minimal 2D PCA via power iteration on the covariance matrix. Pure, no deps. Used **only** in the offline fixture pipeline (Task 9), not at runtime — but housed under `src/lib/math/` so it can be unit-tested with the rest of the math library and stays available if a future demo wants client-side PCA.

Algorithm:

1. Center the data: subtract the mean of each column.
2. First principal component: power-iterate on `X^T X` for `iters` (default 200) iterations starting from a seeded random unit vector; the result is the first eigenvector.
3. Deflate: project out the first component from the centered data.
4. Second principal component: power-iterate on the deflated data.
5. Project original centered data onto the two components → return an array of `[x, y]` tuples.

Power iteration is appropriate here because we only want the top 2 components and the data is small (~30×384). A full SVD is overkill.

- [ ] **Step 4.1:** Write failing tests in `src/lib/math/pca.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { pca2d } from './pca';
import { mulberry32 } from './random';

describe('pca2d', () => {
  it('returns one [x, y] pair per input row', () => {
    const data = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const projected = pca2d(data, mulberry32(1));
    expect(projected).toHaveLength(3);
    for (const p of projected) expect(p).toHaveLength(2);
  });

  it('separates two clearly-clustered inputs along PC1', () => {
    // Two tight clusters along the first axis; PC1 should align with that axis.
    const cluster = (cx: number) =>
      Array.from({ length: 10 }, (_, i) => [cx + (i % 2) * 0.01, (i % 3) * 0.01, 0]);
    const data = [...cluster(0), ...cluster(10)];
    const projected = pca2d(data, mulberry32(2));

    const left = projected.slice(0, 10).map((p) => p[0]);
    const right = projected.slice(10).map((p) => p[0]);
    const meanLeft = left.reduce((s, x) => s + x, 0) / left.length;
    const meanRight = right.reduce((s, x) => s + x, 0) / right.length;

    expect(Math.abs(meanLeft - meanRight)).toBeGreaterThan(5);
  });

  it('produces deterministic output for a given seed', () => {
    const data = Array.from({ length: 8 }, (_, i) => [Math.sin(i), Math.cos(i), i / 10]);
    const a = pca2d(data, mulberry32(7));
    const b = pca2d(data, mulberry32(7));
    expect(a).toEqual(b);
  });

  it('throws when given fewer than 2 rows', () => {
    expect(() => pca2d([[1, 2, 3]], mulberry32(1))).toThrow(/at least 2/i);
  });

  it('throws when rows have inconsistent lengths', () => {
    expect(() =>
      pca2d(
        [
          [1, 2],
          [3, 4, 5],
        ],
        mulberry32(1),
      ),
    ).toThrow(/length/i);
  });
});
```

- [ ] **Step 4.2:** Run, verify failing.

```bash
pnpm test src/lib/math/pca.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 4.3:** Implement `src/lib/math/pca.ts`

```ts
import { dot, normalize, scale, sub, type Vec } from './vec';

const ITERS = 200;
const EPS = 1e-12;

function columnMeans(data: number[][]): number[] {
  const dim = data[0].length;
  const means = new Array(dim).fill(0);
  for (const row of data) {
    for (let j = 0; j < dim; j++) means[j] += row[j];
  }
  for (let j = 0; j < dim; j++) means[j] /= data.length;
  return means;
}

function center(data: number[][], means: number[]): number[][] {
  return data.map((row) => sub(row, means));
}

/**
 * y = X^T X v, returned without ever materializing X^T X (which would be
 * dim x dim — fine here, but the streaming form generalizes).
 */
function covMul(centered: number[][], v: Vec): number[] {
  const dim = v.length;
  const out = new Array(dim).fill(0);
  for (const row of centered) {
    const s = dot(row, v);
    for (let j = 0; j < dim; j++) out[j] += s * row[j];
  }
  return out;
}

function powerIterate(centered: number[][], rng: () => number, iters = ITERS): number[] {
  const dim = centered[0].length;
  let v: number[] = new Array(dim);
  for (let i = 0; i < dim; i++) v[i] = rng() - 0.5;
  v = normalize(v);
  for (let k = 0; k < iters; k++) {
    const next = covMul(centered, v);
    let mag = 0;
    for (let j = 0; j < dim; j++) mag += next[j] * next[j];
    mag = Math.sqrt(mag);
    if (mag < EPS) return v; // degenerate input — keep the random direction
    for (let j = 0; j < dim; j++) next[j] /= mag;
    v = next;
  }
  return v;
}

function deflate(centered: number[][], pc: Vec): number[][] {
  return centered.map((row) => {
    const s = dot(row, pc);
    return sub(row, scale(pc, s));
  });
}

/**
 * Project rows of `data` onto their first two principal components.
 * Returns one `[x, y]` pair per row in the same order as the input.
 *
 * `rng` is a seeded PRNG (see `mulberry32`); seeding makes the projection
 * deterministic across runs, which matters because the result is committed
 * as a fixture.
 */
export function pca2d(data: number[][], rng: () => number): [number, number][] {
  if (data.length < 2) throw new Error('PCA needs at least 2 rows');
  const dim = data[0].length;
  for (const row of data) {
    if (row.length !== dim) {
      throw new Error(`Inconsistent row length: ${row.length} vs ${dim}`);
    }
  }
  const means = columnMeans(data);
  const centered = center(data, means);
  const pc1 = powerIterate(centered, rng);
  const deflated = deflate(centered, pc1);
  const pc2 = powerIterate(deflated, rng);
  return centered.map((row) => [dot(row, pc1), dot(row, pc2)]);
}
```

- [ ] **Step 4.4:** Run, verify passing.

```bash
pnpm test src/lib/math/pca.test.ts
```

Expected: 5 tests green.

- [ ] **Step 4.5:** Commit

```bash
git add src/lib/math/pca.ts src/lib/math/pca.test.ts
git commit -m "feat(math): add 2D PCA via seeded power iteration

Used by the offline fixture pipeline to project ~30 word embeddings
from 384 dimensions to 2D for the EmbeddingMap scatter. Power iteration
is appropriate at this scale (top-2 components, small input) and avoids
pulling in a full SVD library. Seeded so the projection is deterministic
across builds — the output JSON is committed."
```

---

## Task 5: kNN helpers — exact + simplified greedy graph (TDD)

**Files:** `src/lib/math/knn.ts`, `src/lib/math/knn.test.ts`

Two functions that `AnnVisualizer` consumes:

- `exactKnn(points, query, k)` — brute-force top-k by Euclidean distance.
- `greedyGraphKnn(points, neighborTable, entry, query, k)` — given a pre-built undirected k-graph (each row is a list of neighbor indices), walk greedily from `entry` toward `query`, then return the top-k closest among visited nodes. Also returns the visited path for visualization.

The graph itself is built once (Task 11) using `exactKnn` over the synthetic point cloud.

- [ ] **Step 5.1:** Write failing tests in `src/lib/math/knn.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { exactKnn, buildKnnGraph, greedyGraphKnn } from './knn';

const grid = [
  [0, 0],
  [1, 0],
  [2, 0],
  [0, 1],
  [1, 1],
  [2, 1],
  [0, 2],
  [1, 2],
  [2, 2],
];

describe('exactKnn', () => {
  it('returns the k nearest indices in ascending distance', () => {
    const result = exactKnn(grid, [0.1, 0.1], 3);
    expect(result.indices).toEqual([0, 1, 3]);
    expect(result.distances[0]).toBeLessThan(result.distances[1]);
    expect(result.distances[1]).toBeLessThan(result.distances[2]);
  });

  it('returns at most points.length results when k exceeds the dataset', () => {
    const result = exactKnn(grid, [0, 0], 100);
    expect(result.indices).toHaveLength(grid.length);
  });

  it('throws when k is non-positive', () => {
    expect(() => exactKnn(grid, [0, 0], 0)).toThrow(/positive/i);
  });
});

describe('buildKnnGraph', () => {
  it('produces one neighbor list per point', () => {
    const g = buildKnnGraph(grid, 3);
    expect(g).toHaveLength(grid.length);
    // After the symmetric-union step, lists can exceed k — at most 2k since
    // every reverse edge had to come from someone else's top-k.
    for (const list of g) {
      expect(list.length).toBeGreaterThan(0);
      expect(list.length).toBeLessThanOrEqual(6);
    }
  });

  it('does not include the point itself in its own neighbor list', () => {
    const g = buildKnnGraph(grid, 4);
    g.forEach((list, i) => {
      expect(list).not.toContain(i);
    });
  });

  it('makes the graph undirected (edges symmetric after union)', () => {
    const g = buildKnnGraph(grid, 2);
    for (let i = 0; i < g.length; i++) {
      for (const j of g[i]) {
        expect(g[j]).toContain(i);
      }
    }
  });

  it('contains each node\'s original top-k as a subset of its neighbor list', () => {
    const g = buildKnnGraph(grid, 3);
    g.forEach((list, i) => {
      const directTop = exactKnn(grid, grid[i], 4).indices.filter((j) => j !== i).slice(0, 3);
      for (const j of directTop) expect(list).toContain(j);
    });
  });
});

describe('greedyGraphKnn', () => {
  it('finds the exact nearest point in a small grid', () => {
    const graph = buildKnnGraph(grid, 3);
    const result = greedyGraphKnn(grid, graph, 8, [0.1, 0.1], 1);
    expect(result.indices).toEqual([0]);
    expect(result.path[0]).toBe(8); // started at the entry
    expect(result.path[result.path.length - 1]).toBe(0); // ended at the answer
  });

  it('records the hop path including the entry node', () => {
    const graph = buildKnnGraph(grid, 3);
    const result = greedyGraphKnn(grid, graph, 0, [2, 2], 1);
    expect(result.path[0]).toBe(0);
    expect(result.path.length).toBeGreaterThan(1);
  });

  it('returns at most k indices', () => {
    const graph = buildKnnGraph(grid, 4);
    const result = greedyGraphKnn(grid, graph, 0, [1, 1], 3);
    expect(result.indices.length).toBeLessThanOrEqual(3);
  });

  it('throws when entry is out of range', () => {
    const graph = buildKnnGraph(grid, 3);
    expect(() => greedyGraphKnn(grid, graph, 999, [0, 0], 1)).toThrow(/entry/i);
  });
});
```

- [ ] **Step 5.2:** Run, verify failing.

```bash
pnpm test src/lib/math/knn.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 5.3:** Implement `src/lib/math/knn.ts`

```ts
import { euclidean } from './metrics';
import type { Vec } from './vec';

export interface KnnResult {
  indices: number[];
  distances: number[];
}

export interface GreedyResult extends KnnResult {
  /** Sequence of node indices visited from `entry` to the converged node. */
  path: number[];
}

export function exactKnn(points: readonly Vec[], query: Vec, k: number): KnnResult {
  if (k <= 0) throw new Error('k must be positive');
  const scored = points.map((p, i) => ({ i, d: euclidean(p, query) }));
  scored.sort((a, b) => a.d - b.d);
  const trimmed = scored.slice(0, Math.min(k, points.length));
  return {
    indices: trimmed.map((s) => s.i),
    distances: trimmed.map((s) => s.d),
  };
}

/**
 * Builds an undirected k-NN graph over `points`. Each entry is the union of
 * its outgoing top-k neighbors and any other point that includes it among
 * its top-k — guaranteeing edge symmetry.
 */
export function buildKnnGraph(points: readonly Vec[], k: number): number[][] {
  const out: Set<number>[] = points.map(() => new Set<number>());
  for (let i = 0; i < points.length; i++) {
    const top = exactKnn(points, points[i], k + 1).indices.filter((j) => j !== i).slice(0, k);
    for (const j of top) {
      out[i].add(j);
      out[j].add(i); // symmetric union
    }
  }
  return out.map((set) => [...set]);
}

/**
 * Greedy graph search: from `entry`, repeatedly hop to the neighbor closest
 * to `query` until no neighbor improves the distance. Returns the top-k
 * closest *visited* points and the sequence of hops.
 */
export function greedyGraphKnn(
  points: readonly Vec[],
  graph: readonly number[][],
  entry: number,
  query: Vec,
  k: number,
): GreedyResult {
  if (k <= 0) throw new Error('k must be positive');
  if (entry < 0 || entry >= points.length) throw new Error(`entry ${entry} out of range`);

  const visited = new Set<number>([entry]);
  const path: number[] = [entry];
  let current = entry;
  let currentDist = euclidean(points[entry], query);

  while (true) {
    let bestNext = -1;
    let bestDist = currentDist;
    for (const j of graph[current]) {
      if (visited.has(j)) continue;
      const d = euclidean(points[j], query);
      if (d < bestDist) {
        bestDist = d;
        bestNext = j;
      }
    }
    if (bestNext === -1) break;
    visited.add(bestNext);
    path.push(bestNext);
    current = bestNext;
    currentDist = bestDist;
  }

  // Top-k among visited nodes (so we always return at most k results).
  const scored = [...visited].map((i) => ({ i, d: euclidean(points[i], query) }));
  scored.sort((a, b) => a.d - b.d);
  const trimmed = scored.slice(0, Math.min(k, scored.length));
  return {
    indices: trimmed.map((s) => s.i),
    distances: trimmed.map((s) => s.d),
    path,
  };
}
```

- [ ] **Step 5.4:** Run, verify passing.

```bash
pnpm test src/lib/math/knn.test.ts
```

Expected: 11 tests green.

- [ ] **Step 5.5:** Commit

```bash
git add src/lib/math/knn.ts src/lib/math/knn.test.ts
git commit -m "feat(math): add exactKnn, buildKnnGraph, greedyGraphKnn

Brute-force kNN plus a teaching-grade greedy-graph variant: build an
undirected k-NN graph offline, then walk greedily toward the query.
Used by the upcoming AnnVisualizer to contrast exact-search latency
against approximate-search hops + accuracy. The graph build is the
naive O(N^2) form — fine at N=200, deliberately not HNSW."
```

---

## Task 6: Add fixture-pipeline dependencies and the curated word list

**Files:** `package.json`, `pnpm-lock.yaml`, `scripts/embedding-words.ts`, `.gitignore`

Two new dev dependencies and a new npm script. Plus the word list lives in TS so both `build-fixtures.ts` and the contract test can import it without duplicating strings.

- [ ] **Step 6.1:** Add dev dependencies

```bash
pnpm add -D tsx@^4 @xenova/transformers@^2
```

This updates `package.json` and `pnpm-lock.yaml`. Confirm the resolved versions land in `package.json` under `devDependencies`.

- [ ] **Step 6.2:** Add the `build:fixtures` script. Edit `package.json` so the `scripts` block contains, alongside the existing entries:

```json
"build:fixtures": "tsx scripts/build-fixtures.ts"
```

Place it between `build` and `preview` for readability.

- [ ] **Step 6.3:** Create `scripts/embedding-words.ts`

```ts
/**
 * Curated word list for the EmbeddingMap demo.
 *
 * Four loose semantic clusters (animals, foods, tech, emotions). The list is
 * deliberately small (~30 words) so the 2D PCA projection is easy to read and
 * the JSON fixture stays under a few KB. Order is preserved end-to-end so
 * indices into the fixture array match positions here.
 */
export const EMBEDDING_WORDS: readonly string[] = [
  // Animals
  'cat',
  'dog',
  'bird',
  'fish',
  'lion',
  'tiger',
  'elephant',
  'mouse',
  // Foods
  'pizza',
  'burger',
  'salad',
  'sushi',
  'pasta',
  'rice',
  'bread',
  'soup',
  // Tech
  'computer',
  'phone',
  'laptop',
  'software',
  'internet',
  'code',
  'data',
  'server',
  // Emotions
  'happy',
  'sad',
  'angry',
  'calm',
  'excited',
  'scared',
] as const;

export const EMBEDDING_CLUSTERS: readonly { label: string; range: [number, number] }[] = [
  { label: 'animals', range: [0, 8] },
  { label: 'foods', range: [8, 16] },
  { label: 'tech', range: [16, 24] },
  { label: 'emotions', range: [24, 30] },
] as const;
```

- [ ] **Step 6.4:** Update `.gitignore` to ignore the Hugging Face model cache that `@xenova/transformers` may drop in the project root, while explicitly **not** ignoring the committed JSON fixture. Append to `.gitignore`:

```
# @xenova/transformers downloads model files into ./.cache when running
# scripts/build-fixtures.ts. The model is dev-only — never commit it.
.cache/
node_modules/.cache/transformers/
```

(Do not add `src/lib/embeddings/` to `.gitignore`. The JSON fixture in that directory is intentionally committed.)

- [ ] **Step 6.5:** Sanity-check the install

```bash
pnpm typecheck
```

Expected: 0 errors. (The new packages don't touch the runtime build yet.)

- [ ] **Step 6.6:** Commit

```bash
git add package.json pnpm-lock.yaml scripts/embedding-words.ts .gitignore
git commit -m "chore: add fixture-pipeline deps and curated word list

Adds tsx (TS script runner) and @xenova/transformers (offline embedding)
as devDependencies, wires the pnpm build:fixtures script, and lands the
curated 30-word list shared by the pipeline driver and its contract test.
The HF model cache is gitignored — the .json fixture it produces is
not, since runtime depends on it."
```

---

## Task 7: build-fixtures contract test (TDD, no model load)

**Files:** `scripts/build-fixtures.test.ts`

The expensive part of `build-fixtures.ts` is the embedding step (downloads a model, takes minutes). That part lives behind a function we **don't** call from tests. We test the pure-data pieces:

- The "build a `WordsFixture` object from a list of words and an embedding function" assembly logic.
- The schema invariants: every word present, indices match positions, neighbors are valid in-range indices excluding self, top-2 PCA returns 2D coords.

The driver script (`build-fixtures.ts`, Task 8) will export the assembly function so this test can pass it a fake embedder.

- [ ] **Step 7.1:** Write failing tests in `scripts/build-fixtures.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { assembleWordsFixture } from './build-fixtures';
import { EMBEDDING_WORDS } from './embedding-words';

/**
 * Fake embedder: assigns each word a deterministic 4-dim vector so the
 * test runs in milliseconds. Cluster shape: each cluster gets a distinct
 * one-hot-ish basis so PCA and neighbor lookup behave predictably.
 */
function fakeEmbedder(): (word: string) => number[] {
  const dims = 4;
  return (word: string) => {
    const idx = EMBEDDING_WORDS.indexOf(word);
    if (idx < 0) throw new Error(`Unknown word: ${word}`);
    const cluster = Math.floor(idx / 8); // 0..3
    const v = new Array(dims).fill(0);
    v[cluster % dims] = 1;
    // Tiny within-cluster jitter so PCA finds meaningful structure.
    v[(cluster + 1) % dims] = (idx % 8) * 0.01;
    return v;
  };
}

describe('assembleWordsFixture', () => {
  it('produces one entry per input word in the same order', async () => {
    const fixture = await assembleWordsFixture(EMBEDDING_WORDS, fakeEmbedder(), { seed: 1 });
    expect(fixture.words).toHaveLength(EMBEDDING_WORDS.length);
    fixture.words.forEach((entry, i) => {
      expect(entry.word).toBe(EMBEDDING_WORDS[i]);
    });
  });

  it('includes 2D coords for every entry', async () => {
    const fixture = await assembleWordsFixture(EMBEDDING_WORDS, fakeEmbedder(), { seed: 1 });
    for (const entry of fixture.words) {
      expect(typeof entry.x).toBe('number');
      expect(typeof entry.y).toBe('number');
      expect(Number.isFinite(entry.x)).toBe(true);
      expect(Number.isFinite(entry.y)).toBe(true);
    }
  });

  it('includes top-K neighbor indices that are in-range and exclude self', async () => {
    const K = 5;
    const fixture = await assembleWordsFixture(EMBEDDING_WORDS, fakeEmbedder(), { seed: 1, k: K });
    fixture.words.forEach((entry, i) => {
      expect(entry.neighbors).toHaveLength(K);
      for (const j of entry.neighbors) {
        expect(j).toBeGreaterThanOrEqual(0);
        expect(j).toBeLessThan(EMBEDDING_WORDS.length);
        expect(j).not.toBe(i);
      }
      // Neighbors should be unique.
      expect(new Set(entry.neighbors).size).toBe(K);
    });
  });

  it('groups intra-cluster neighbors together with the fake embedder', async () => {
    const fixture = await assembleWordsFixture(EMBEDDING_WORDS, fakeEmbedder(), { seed: 1, k: 3 });
    // The fake embedder makes every cluster a one-hot basis; the top-3
    // neighbors of any word should all live in the same cluster of 8.
    fixture.words.forEach((entry, i) => {
      const cluster = Math.floor(i / 8);
      for (const j of entry.neighbors) {
        expect(Math.floor(j / 8)).toBe(cluster);
      }
    });
  });

  it('records the embedding dimension and model name in the metadata', async () => {
    const fixture = await assembleWordsFixture(EMBEDDING_WORDS, fakeEmbedder(), {
      seed: 1,
      modelName: 'fake-test-embedder',
    });
    expect(fixture.meta.dim).toBe(4);
    expect(fixture.meta.model).toBe('fake-test-embedder');
    expect(fixture.meta.count).toBe(EMBEDDING_WORDS.length);
  });

  it('produces deterministic output for a given seed', async () => {
    const a = await assembleWordsFixture(EMBEDDING_WORDS, fakeEmbedder(), { seed: 42 });
    const b = await assembleWordsFixture(EMBEDDING_WORDS, fakeEmbedder(), { seed: 42 });
    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 7.2:** Run, verify failing.

```bash
pnpm test scripts/build-fixtures.test.ts
```

Expected: FAIL — `./build-fixtures` not found. The `node` Vitest project picks up files under `scripts/**/*.test.ts` (see `vitest.config.ts`).

---

## Task 8: build-fixtures driver script

**Files:** `scripts/build-fixtures.ts`

Houses both `assembleWordsFixture` (pure, tested) and the embedding/IO orchestration (impure, run only via `pnpm build:fixtures`).

- [ ] **Step 8.1:** Implement `scripts/build-fixtures.ts`

```ts
/// <reference types="node" />
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { mulberry32 } from '../src/lib/math/random';
import { pca2d } from '../src/lib/math/pca';
import { exactKnn } from '../src/lib/math/knn';
import { EMBEDDING_WORDS } from './embedding-words';

const DEFAULT_MODEL = 'Xenova/all-MiniLM-L6-v2';
const DEFAULT_K = 5;

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../src/lib/embeddings/words.json');

export interface WordEntry {
  word: string;
  x: number;
  y: number;
  neighbors: number[];
}

export interface WordsFixture {
  meta: {
    model: string;
    dim: number;
    count: number;
    /** ISO-8601 timestamp; helpful for debugging without affecting determinism. */
    builtAt: string;
  };
  words: WordEntry[];
}

export interface AssembleOptions {
  seed: number;
  k?: number;
  modelName?: string;
}

export type Embedder = (word: string) => number[] | Promise<number[]>;

/**
 * Pure assembly: takes a word list and an embedder, returns the fixture.
 * Tested with a fake embedder; production uses an @xenova/transformers
 * embedder built in `main`.
 */
export async function assembleWordsFixture(
  words: readonly string[],
  embed: Embedder,
  opts: AssembleOptions,
): Promise<WordsFixture> {
  const k = opts.k ?? DEFAULT_K;
  const modelName = opts.modelName ?? DEFAULT_MODEL;

  // 1. Embed every word in input order.
  const embeddings: number[][] = [];
  for (const word of words) {
    const v = await embed(word);
    embeddings.push(v);
  }
  const dim = embeddings[0]?.length ?? 0;

  // 2. PCA-project to 2D for the scatter.
  const projected = pca2d(embeddings, mulberry32(opts.seed));

  // 3. Pre-compute top-k neighbors in the *original* (high-dim) space.
  const neighbors: number[][] = embeddings.map((vec, i) => {
    const result = exactKnn(embeddings, vec, k + 1);
    return result.indices.filter((j) => j !== i).slice(0, k);
  });

  return {
    meta: {
      model: modelName,
      dim,
      count: words.length,
      builtAt: new Date().toISOString(),
    },
    words: words.map((word, i) => ({
      word,
      x: projected[i][0],
      y: projected[i][1],
      neighbors: neighbors[i],
    })),
  };
}

/**
 * Lazily build the production embedder. Imported on demand so the test file
 * never pulls in @xenova/transformers (the model download would balloon the
 * Vitest run).
 */
async function buildXenovaEmbedder(modelName: string): Promise<Embedder> {
  const { pipeline } = await import('@xenova/transformers');
  const extractor = await pipeline('feature-extraction', modelName);
  return async (word: string) => {
    const output = await extractor(word, { pooling: 'mean', normalize: true });
    return Array.from(output.data as Float32Array);
  };
}

async function main(): Promise<void> {
  const modelName = DEFAULT_MODEL;
  console.log(`[build-fixtures] Loading model ${modelName} (first run downloads ~25 MB) ...`);
  const embed = await buildXenovaEmbedder(modelName);

  console.log(`[build-fixtures] Embedding ${EMBEDDING_WORDS.length} words ...`);
  const fixture = await assembleWordsFixture(EMBEDDING_WORDS, embed, { seed: 1, modelName });

  // Stable JSON shape — keys sorted, two-space indent, trailing newline.
  const json = JSON.stringify(fixture, null, 2) + '\n';
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, json, 'utf-8');

  console.log(
    `[build-fixtures] Wrote ${OUTPUT_PATH} (${fixture.words.length} words, ${fixture.meta.dim}-dim)`,
  );
}

// Run main() only when invoked as a script (not when imported by tests).
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 8.2:** Verify the contract test (Task 7) now passes

```bash
pnpm test scripts/build-fixtures.test.ts
```

Expected: 6 tests green. The test never reaches `main()` or `buildXenovaEmbedder` — only `assembleWordsFixture`.

- [ ] **Step 8.3:** Verify the full suite is still green

```bash
pnpm test
```

Expected: ~80+ tests green (74 from M2 plus PCA, kNN, schema, build-fixtures contract).

- [ ] **Step 8.4:** Commit

```bash
git add scripts/build-fixtures.ts scripts/build-fixtures.test.ts
git commit -m "feat(scripts): add build-fixtures.ts (offline word-embedding pipeline)

assembleWordsFixture is the pure, tested core: words + embedder ->
{words[], meta} with PCA-2D coords and pre-computed top-5 neighbors in
the original embedding space. main() wires that to @xenova/transformers
running Xenova/all-MiniLM-L6-v2 and writes the fixture JSON. The model
loader is dynamically imported so the contract test never instantiates
the real model.

Run with: pnpm build:fixtures (writes src/lib/embeddings/words.json)."
```

---

## Task 9: Run the pipeline and commit the fixture

**Files:** `src/lib/embeddings/words.json`, `src/lib/embeddings/words-loader.ts`

- [ ] **Step 9.1:** Run the pipeline

```bash
pnpm build:fixtures
```

Expected (first run will download the model, ~1–3 minutes on a fast connection):

```
[build-fixtures] Loading model Xenova/all-MiniLM-L6-v2 (first run downloads ~25 MB) ...
[build-fixtures] Embedding 30 words ...
[build-fixtures] Wrote .../src/lib/embeddings/words.json (30 words, 384-dim)
```

If the script fails because `@xenova/transformers` cannot reach the Hugging Face CDN, retry once. If it still fails, see the troubleshooting note at the bottom of this task.

- [ ] **Step 9.2:** Sanity-check the output

```bash
node -e "const f = require('./src/lib/embeddings/words.json'); console.log(f.meta); console.log(f.words.slice(0, 2));"
```

Expected: `meta.model = 'Xenova/all-MiniLM-L6-v2'`, `meta.dim = 384`, `meta.count = 30`. Each word entry has `word`, `x`, `y` (numbers near the origin since PCA centers data), and a 5-element `neighbors` array. Glance at the first few neighbor lists — `cat`'s neighbors should mostly be other animals, `pizza`'s should be other foods. If a clearly mis-clustered neighbor list appears (e.g., `cat`'s neighbors are all foods), stop and investigate before committing.

- [ ] **Step 9.3:** Create the typed loader at `src/lib/embeddings/words-loader.ts`

```ts
import wordsJson from './words.json';

/**
 * Shape of a single word entry in the committed fixture.
 *
 * Kept in sync with `WordEntry` in `scripts/build-fixtures.ts` — when the
 * pipeline schema changes, update both. The duplication is deliberate: the
 * runtime should not import from `scripts/`.
 */
export interface WordEntry {
  word: string;
  x: number;
  y: number;
  neighbors: number[];
}

export interface WordsFixture {
  meta: {
    model: string;
    dim: number;
    count: number;
    builtAt: string;
  };
  words: WordEntry[];
}

export const wordsFixture: WordsFixture = wordsJson as WordsFixture;
```

This indirection (a) gives islands a typed import without leaking the build-script type into the runtime tree, and (b) makes the JSON shape easier to mock in component tests.

- [ ] **Step 9.4:** Confirm tsconfig allows JSON imports. Astro's strict tsconfig already enables `resolveJsonModule`, but verify by typechecking:

```bash
pnpm typecheck
```

Expected: 0 errors. If this fails with `Cannot find module './words.json'`, add `"resolveJsonModule": true` and `"esModuleInterop": true` to the `compilerOptions` in `tsconfig.json`.

- [ ] **Step 9.5:** Commit

```bash
git add src/lib/embeddings/words.json src/lib/embeddings/words-loader.ts
git commit -m "feat(embeddings): commit words.json fixture and typed loader

30 English words across 4 loose semantic clusters, embedded with
Xenova/all-MiniLM-L6-v2 (384-dim) via pnpm build:fixtures, projected
to 2D with our PCA helper, top-5 neighbors pre-computed in the
original space. The runtime never loads the model — islands import
the typed loader."
```

> **Troubleshooting note:** if `pnpm build:fixtures` fails because the network is unavailable and you absolutely need to make progress, do **not** hand-author `words.json`. The whole point of the pipeline is determinism + provenance. Surface the failure to the user and pause.

---

## Task 10: EmbeddingMap island (TDD)

**Files:** `src/components/islands/EmbeddingMap.svelte`, `src/components/islands/EmbeddingMap.test.ts`

A 2D scatter of the 30 words. Hovering or focusing any word highlights its top-5 neighbors. Cluster colors come from the four-cluster grouping. Following the M2 deferred follow-up #1 perf shape: data is loaded once into a derivation gated only on the fixture import; per-frame work (which word is hovered, which lines to draw) is in a separate cheap derivation.

The EmbeddingMap test mocks the JSON loader so it doesn't depend on real embeddings — that keeps the test stable even if the fixture is regenerated.

- [ ] **Step 10.1:** Write failing tests in `src/components/islands/EmbeddingMap.test.ts`

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('../../lib/embeddings/words-loader', () => ({
  wordsFixture: {
    meta: { model: 'mock', dim: 4, count: 4, builtAt: '2026-05-07T00:00:00Z' },
    words: [
      { word: 'cat', x: -1, y: 1, neighbors: [1] },
      { word: 'dog', x: -1.1, y: 1.1, neighbors: [0] },
      { word: 'pizza', x: 1, y: -1, neighbors: [3] },
      { word: 'burger', x: 1.1, y: -1.1, neighbors: [2] },
    ],
  },
}));

import EmbeddingMap from './EmbeddingMap.svelte';

describe('EmbeddingMap', () => {
  beforeEach(() => {
    // Each render starts with no selection.
  });

  it('renders one focusable point per word', () => {
    render(EmbeddingMap);
    expect(screen.getByRole('button', { name: /cat/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dog/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pizza/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /burger/i })).toBeInTheDocument();
  });

  it('shows the empty-selection hint by default', () => {
    render(EmbeddingMap);
    expect(screen.getByTestId('selected-word').textContent).toMatch(/hover|none|—/i);
  });

  it('updates the selection readout when a word is clicked', async () => {
    const user = userEvent.setup();
    render(EmbeddingMap);
    await user.click(screen.getByRole('button', { name: /cat/i }));
    expect(screen.getByTestId('selected-word').textContent).toMatch(/cat/i);
  });

  it('lists pre-computed neighbors of the selected word', async () => {
    const user = userEvent.setup();
    render(EmbeddingMap);
    await user.click(screen.getByRole('button', { name: /cat/i }));
    expect(screen.getByTestId('neighbor-list').textContent).toMatch(/dog/i);
  });

  it('switches the neighbor list when a different word is selected', async () => {
    const user = userEvent.setup();
    render(EmbeddingMap);
    await user.click(screen.getByRole('button', { name: /pizza/i }));
    expect(screen.getByTestId('neighbor-list').textContent).toMatch(/burger/i);
    expect(screen.getByTestId('neighbor-list').textContent).not.toMatch(/dog/i);
  });
});
```

- [ ] **Step 10.2:** Run, verify failing.

```bash
pnpm test src/components/islands/EmbeddingMap.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 10.3:** Implement `src/components/islands/EmbeddingMap.svelte`

```svelte
<script lang="ts">
  import { wordsFixture, type WordEntry } from '../../lib/embeddings/words-loader';
  import { svgCoords } from '../../lib/svg/coords';

  // Heavy work that depends only on the static fixture: compute the data-
  // bounds and the SVG coordinate transform once at module-init time, not on
  // every selection change. Per M2 deferred follow-up #1, this sits *outside*
  // the reactive layer so per-frame state never retriggers it.
  const SIZE = 360;
  const PADDING = 28;
  const layout = (() => {
    const xs = wordsFixture.words.map((w) => w.x);
    const ys = wordsFixture.words.map((w) => w.y);
    const max = Math.max(...xs.map(Math.abs), ...ys.map(Math.abs));
    const inner = SIZE / 2 - PADDING;
    const scale = max > 0 ? inner / max : 1;
    return { ...svgCoords(SIZE, scale), padding: PADDING };
  })();

  // Cluster index per word, derived from the position in the curated list
  // (8 / 8 / 8 / 6 cluster sizes, in order: animals, foods, tech, emotions).
  const CLUSTER_OF: number[] = wordsFixture.words.map((_, i) =>
    i < 8 ? 0 : i < 16 ? 1 : i < 24 ? 2 : 3,
  );
  const CLUSTER_COLORS = [
    'oklch(0.55 0.18 250)', // animals (blue)
    'oklch(0.65 0.16 60)', // foods (amber)
    'oklch(0.55 0.18 145)', // tech (green)
    'oklch(0.55 0.18 320)', // emotions (magenta)
  ];

  let selected: number | null = $state(null);
  const selectedWord = $derived(selected !== null ? wordsFixture.words[selected] : null);
  const neighborWords = $derived(
    selectedWord ? selectedWord.neighbors.map((i) => wordsFixture.words[i]) : [],
  );

  function color(i: number): string {
    return CLUSTER_COLORS[CLUSTER_OF[i]];
  }

  function isHighlighted(i: number): boolean {
    if (selected === null) return false;
    if (i === selected) return true;
    return wordsFixture.words[selected].neighbors.includes(i);
  }
</script>

<div class="not-prose my-6 rounded-md border border-brand-100 p-4 dark:border-brand-900">
  <svg
    viewBox="0 0 {layout.size} {layout.size}"
    role="img"
    aria-label="2D embedding map of {wordsFixture.words.length} words"
    class="mx-auto block h-80 w-80 max-w-full"
  >
    <line
      x1={layout.center}
      y1={layout.padding}
      x2={layout.center}
      y2={layout.size - layout.padding}
      stroke="currentColor"
      stroke-opacity="0.1"
    />
    <line
      x1={layout.padding}
      y1={layout.center}
      x2={layout.size - layout.padding}
      y2={layout.center}
      stroke="currentColor"
      stroke-opacity="0.1"
    />

    {#if selectedWord}
      {#each selectedWord.neighbors as j}
        <line
          x1={layout.x(selectedWord.x)}
          y1={layout.y(selectedWord.y)}
          x2={layout.x(wordsFixture.words[j].x)}
          y2={layout.y(wordsFixture.words[j].y)}
          stroke="currentColor"
          stroke-opacity="0.35"
          stroke-width="1"
        />
      {/each}
    {/if}

    {#each wordsFixture.words as entry, i}
      <g
        class:opacity-30={selected !== null && !isHighlighted(i)}
        class="transition-opacity"
      >
        <circle
          cx={layout.x(entry.x)}
          cy={layout.y(entry.y)}
          r={isHighlighted(i) ? 7 : 5}
          fill={color(i)}
          stroke="white"
          stroke-width="1"
        />
        <text
          x={layout.x(entry.x) + 8}
          y={layout.y(entry.y) - 8}
          font-size="11"
          fill="currentColor"
          fill-opacity="0.85"
          pointer-events="none"
        >
          {entry.word}
        </text>
      </g>
    {/each}
  </svg>

  <div class="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm" aria-live="polite">
    <span class="text-brand-500">Selected:</span>
    <span class="font-mono" data-testid="selected-word">
      {selectedWord ? selectedWord.word : '— hover or click a word'}
    </span>
    <span class="text-brand-500">Neighbors:</span>
    <span class="font-mono" data-testid="neighbor-list">
      {neighborWords.map((w) => w.word).join(', ') || '—'}
    </span>
  </div>

  <ul class="mt-4 grid grid-cols-2 gap-1 text-sm sm:grid-cols-3 md:grid-cols-5">
    {#each wordsFixture.words as entry, i}
      <li>
        <button
          type="button"
          onclick={() => (selected = selected === i ? null : i)}
          onmouseenter={() => (selected = i)}
          onfocus={() => (selected = i)}
          aria-pressed={selected === i}
          class="block w-full rounded px-2 py-1 text-left font-mono hover:bg-brand-50 focus:bg-brand-50 dark:hover:bg-brand-900 dark:focus:bg-brand-900"
          style:color={color(i)}
        >
          {entry.word}
        </button>
      </li>
    {/each}
  </ul>
</div>
```

- [ ] **Step 10.4:** Run, verify passing.

```bash
pnpm test src/components/islands/EmbeddingMap.test.ts
```

Expected: 5 tests green.

- [ ] **Step 10.5:** Commit

```bash
git add src/components/islands/EmbeddingMap.svelte src/components/islands/EmbeddingMap.test.ts
git commit -m "feat(island): add EmbeddingMap (2D word-embedding scatter + neighbors)

Reads the committed words.json fixture via the typed loader, plots each
word as a coloured dot on a PCA-2D canvas, and highlights pre-computed
top-5 neighbors on hover/focus/click. Cluster colours separate the four
loose categories. Layout work is gated on the static fixture import; per-
frame state (selection) drives only the cheap-to-recompute derivations."
```

---

## Task 11: AnnVisualizer island (TDD)

**Files:** `src/components/islands/AnnVisualizer.svelte`, `src/components/islands/AnnVisualizer.test.ts`

200 synthetic 2D points generated client-side from a seeded RNG (no fixture). One draggable query point. Two readouts side-by-side: exact-kNN top-5 vs greedy-graph top-5, with hops + accuracy. Following M2 deferred follow-up #1: the heavy `points` and `graph` derivations depend only on the seed (which never changes during interaction); the per-frame derivations consume those plus the live query.

- [ ] **Step 11.1:** Write failing tests in `src/components/islands/AnnVisualizer.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import AnnVisualizer from './AnnVisualizer.svelte';

describe('AnnVisualizer', () => {
  it('renders an exact-search readout and a greedy-search readout', () => {
    render(AnnVisualizer);
    expect(screen.getByTestId('exact-top')).toBeInTheDocument();
    expect(screen.getByTestId('greedy-top')).toBeInTheDocument();
  });

  it('shows a finite, non-negative hop count for the default query', () => {
    render(AnnVisualizer);
    const hops = Number(screen.getByTestId('greedy-hops').textContent);
    // Greedy always converges (no node is its own neighbor), so hops is bounded
    // by N. We avoid asserting `> 0` because a default query that happens to
    // sit closest to the entry node would converge in zero hops.
    expect(Number.isFinite(hops)).toBe(true);
    expect(hops).toBeGreaterThanOrEqual(0);
    expect(hops).toBeLessThan(200);
  });

  it('shows accuracy as a value between 0 and 1', () => {
    render(AnnVisualizer);
    const acc = Number(screen.getByTestId('greedy-accuracy').textContent);
    expect(acc).toBeGreaterThanOrEqual(0);
    expect(acc).toBeLessThanOrEqual(1);
  });

  it('updates the readouts when the query position changes', async () => {
    const user = userEvent.setup();
    render(AnnVisualizer);
    const before = screen.getByTestId('greedy-top').textContent;
    const qx = screen.getByLabelText(/query.*x/i) as HTMLInputElement;
    await user.clear(qx);
    await user.type(qx, '4');
    const after = screen.getByTestId('greedy-top').textContent;
    expect(after).not.toBe(before);
  });

  it('updates the exact top-K when the query moves to a different corner', async () => {
    const user = userEvent.setup();
    render(AnnVisualizer);
    const beforeExact = screen.getByTestId('exact-top').textContent;
    const qx = screen.getByLabelText(/query.*x/i) as HTMLInputElement;
    const qy = screen.getByLabelText(/query.*y/i) as HTMLInputElement;
    // Move from default (2, 2) to the opposite corner so the nearest
    // neighbors must be different points: with 200 uniform points in
    // [-5, 5]^2, the top-5 around (-4, -4) cannot overlap with the top-5
    // around (2, 2).
    await user.clear(qx);
    await user.type(qx, '-4');
    await user.clear(qy);
    await user.type(qy, '-4');
    const afterExact = screen.getByTestId('exact-top').textContent;
    expect(afterExact).not.toBe(beforeExact);
  });
});
```

- [ ] **Step 11.2:** Run, verify failing.

- [ ] **Step 11.3:** Implement `src/components/islands/AnnVisualizer.svelte`

```svelte
<script lang="ts">
  import { mulberry32 } from '../../lib/math/random';
  import { exactKnn, buildKnnGraph, greedyGraphKnn } from '../../lib/math/knn';
  import { svgCoords } from '../../lib/svg/coords';

  const N = 200;
  const SEED = 7;
  const GRAPH_K = 6;
  const QUERY_K = 5;
  const RANGE = 5; // points lie roughly in [-5, 5] x [-5, 5]

  let qx = $state(2);
  let qy = $state(2);

  // Heavy, seed-only initialization: runs once per component instance.
  // SEED is a module-level const, so this work has no reactive dependencies
  // and qx/qy churn cannot retrigger it — matching the M2 deferred follow-up
  // #1 perf shape (split heavy work from cheap per-frame work).
  const points: [number, number][] = (() => {
    const rng = mulberry32(SEED);
    const out: [number, number][] = [];
    for (let i = 0; i < N; i++) {
      out.push([(rng() - 0.5) * 2 * RANGE, (rng() - 0.5) * 2 * RANGE]);
    }
    return out;
  })();

  const graph = buildKnnGraph(points, GRAPH_K);

  // Per-frame derivations (cheap):
  const query = $derived([qx, qy]);
  const exactRes = $derived(exactKnn(points, query, QUERY_K));
  const greedyRes = $derived(greedyGraphKnn(points, graph, 0, query, QUERY_K));
  const accuracy = $derived.by(() => {
    const exactSet = new Set(exactRes.indices);
    let hit = 0;
    for (const i of greedyRes.indices) if (exactSet.has(i)) hit++;
    return greedyRes.indices.length > 0 ? hit / greedyRes.indices.length : 0;
  });

  const SIZE = 360;
  const layout = svgCoords(SIZE, (SIZE / 2 - 20) / RANGE);
</script>

<div class="not-prose my-6 rounded-md border border-brand-100 p-4 dark:border-brand-900">
  <svg
    viewBox="0 0 {layout.size} {layout.size}"
    role="img"
    aria-label="Approximate vs exact nearest-neighbor visualizer"
    class="mx-auto block h-80 w-80 max-w-full"
  >
    <line
      x1={layout.center}
      y1="0"
      x2={layout.center}
      y2={layout.size}
      stroke="currentColor"
      stroke-opacity="0.1"
    />
    <line
      x1="0"
      y1={layout.center}
      x2={layout.size}
      y2={layout.center}
      stroke="currentColor"
      stroke-opacity="0.1"
    />

    <!-- All points -->
    {#each points as p}
      <circle
        cx={layout.x(p[0])}
        cy={layout.y(p[1])}
        r="2"
        fill="currentColor"
        fill-opacity="0.35"
      />
    {/each}

    <!-- Greedy walk path -->
    {#each greedyRes.path.slice(1) as nodeIdx, i}
      {@const from = greedyRes.path[i]}
      <line
        x1={layout.x(points[from][0])}
        y1={layout.y(points[from][1])}
        x2={layout.x(points[nodeIdx][0])}
        y2={layout.y(points[nodeIdx][1])}
        stroke="oklch(0.65 0.16 60)"
        stroke-width="1.5"
        stroke-opacity="0.7"
      />
    {/each}

    <!-- Exact top-K (blue) -->
    {#each exactRes.indices as idx}
      <circle
        cx={layout.x(points[idx][0])}
        cy={layout.y(points[idx][1])}
        r="5"
        fill="none"
        stroke="oklch(0.55 0.18 250)"
        stroke-width="2"
      />
    {/each}

    <!-- Greedy top-K (amber) -->
    {#each greedyRes.indices as idx}
      <circle
        cx={layout.x(points[idx][0])}
        cy={layout.y(points[idx][1])}
        r="3"
        fill="oklch(0.65 0.16 60)"
      />
    {/each}

    <!-- Query (magenta cross) -->
    <circle
      cx={layout.x(qx)}
      cy={layout.y(qy)}
      r="6"
      fill="oklch(0.55 0.2 320)"
      stroke="white"
      stroke-width="1.5"
    />
  </svg>

  <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
    <label class="flex items-center gap-2"
      >query.x
      <input
        type="number"
        min={-RANGE}
        max={RANGE}
        step="0.1"
        bind:value={qx}
        aria-label="query x"
        class="w-20 rounded border border-brand-300 bg-transparent px-2 py-1"
      />
    </label>
    <label class="flex items-center gap-2"
      >query.y
      <input
        type="number"
        min={-RANGE}
        max={RANGE}
        step="0.1"
        bind:value={qy}
        aria-label="query y"
        class="w-20 rounded border border-brand-300 bg-transparent px-2 py-1"
      />
    </label>
  </div>

  <dl class="mt-4 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm" aria-live="polite">
    <dt class="text-brand-500">Exact top-{QUERY_K}</dt>
    <dd class="font-mono" data-testid="exact-top">
      [{exactRes.indices.join(', ')}]
    </dd>
    <dt class="text-brand-500">Greedy top-{QUERY_K}</dt>
    <dd class="font-mono" data-testid="greedy-top">
      [{greedyRes.indices.join(', ')}]
    </dd>
    <dt class="text-brand-500">Greedy hops</dt>
    <dd class="font-mono" data-testid="greedy-hops">{greedyRes.path.length - 1}</dd>
    <dt class="text-brand-500">Accuracy (overlap)</dt>
    <dd class="font-mono" data-testid="greedy-accuracy">{accuracy.toFixed(2)}</dd>
  </dl>
</div>
```

- [ ] **Step 11.4:** Run, verify passing.

```bash
pnpm test src/components/islands/AnnVisualizer.test.ts
```

Expected: 5 tests green.

- [ ] **Step 11.5:** Commit

```bash
git add src/components/islands/AnnVisualizer.svelte src/components/islands/AnnVisualizer.test.ts
git commit -m "feat(island): add AnnVisualizer (exact kNN vs greedy-graph search)

200 seeded random 2D points; query is a draggable point. Compares the
brute-force top-5 against a simplified greedy graph walk over a pre-built
6-NN graph, reporting hops and overlap. Heavy work (point gen + graph
build) is gated on the seed only — query churn doesn't re-trigger it,
matching the M2 deferred follow-up #1 perf shape."
```

---

## Task 12: Topic 6 — Embeddings (MDX)

**Files:** `src/content/topics/th/06-embeddings.mdx`, `src/content/topics/en/06-embeddings.mdx`

- [ ] **Step 12.1:** Create EN MDX

```mdx
---
title: What is an embedding?
slug: embeddings
group: vector-db
order: 6
locale: en
summary: Embeddings turn words, sentences, and images into vectors — and the geometry of that space carries meaning.
hasInteractive: true
interactiveComponent: EmbeddingMap
hasMath: false
---

import EmbeddingMap from '../../../components/islands/EmbeddingMap.svelte';

## Intuition

So far we've treated vectors as abstract lists of numbers. An **embedding** is a vector with a job: it represents a piece of content — a word, a sentence, an image — in a way that geometry preserves meaning.

The trick: the model that produces embeddings is trained so that "things that mean similar stuff" land close together. _Cat_ and _dog_ are near each other; _pizza_ and _laptop_ are far apart. You don't program this by hand. You train a model on a mountain of text (or images, or audio), and the geometry falls out.

## Try it

<EmbeddingMap client:visible />

These 30 English words were embedded with a real model (`all-MiniLM-L6-v2`, 384 dimensions), then squashed down to 2D so we can draw them. Hover any word to see its actual top-5 nearest neighbors — note that those neighbors are computed in the **original 384-dim space**, not the 2D picture you're looking at. Sometimes the closest neighbors look far apart on the 2D chart; that's because flattening 384 dimensions into 2 throws information away.

## In the real world

Every modern semantic-search system, RAG pipeline, or recommendation engine starts here. You feed your content through an embedding model once, store the resulting vectors in a database, and then "search" reduces to "find the vectors closest to the query's vector." The math from earlier topics — distance, similarity, the dot product — is exactly what runs at query time.

<TryYourself>
  Hover `cat`. Are its top-5 neighbors all animals? Now hover `code`. Are its neighbors what you'd
  expect? When the model surprises you, that's a hint about which texts it was trained on.
</TryYourself>

<Takeaways>
  <Takeaway>An embedding is a vector that represents a piece of content.</Takeaway>
  <Takeaway>
    A good embedding model puts similar content near each other in the vector space — without anyone
    hand-labeling "similar."
  </Takeaway>
  <Takeaway>2D visualizations are illustrative; the real geometry lives in hundreds of dimensions.</Takeaway>
</Takeaways>
```

- [ ] **Step 12.2:** Create TH MDX

```mdx
---
title: เอ็มเบดดิ้งคืออะไร?
slug: embeddings
group: vector-db
order: 6
locale: th
summary: Embedding คือการแปลงคำ ประโยค หรือรูปภาพให้กลายเป็นเวกเตอร์ — และระยะทางในสเปซนั้นพาความหมายไปด้วย
hasInteractive: true
interactiveComponent: EmbeddingMap
hasMath: false
---

import EmbeddingMap from '../../../components/islands/EmbeddingMap.svelte';

## ทำความเข้าใจ

ที่ผ่านมาเราได้มองเวกเตอร์เป็นแค่ตัวเลขชุดหนึ่ง **Embedding** คือเวกเตอร์ที่มีหน้าที่: แทนเนื้อหาชิ้นหนึ่ง — คำ ประโยค หรือรูปภาพ — โดยที่ "เนื้อหาที่ความหมายใกล้กัน" จะถูกวางใกล้กันในสเปซเวกเตอร์

เคล็ดลับคือ โมเดลที่สร้าง embedding ถูกฝึกให้สิ่งที่ความหมายคล้ายกันอยู่ใกล้กัน คำว่า _แมว_ กับ _หมา_ จะอยู่ใกล้กัน ส่วน _พิซซ่า_ กับ _แล็ปท็อป_ อยู่คนละมุม ไม่มีใครต้องบอกโมเดลว่า "สองสิ่งนี้คล้ายกันนะ" ทุกอย่างเกิดจากการฝึกโมเดลด้วยข้อมูลภาษาจำนวนมหาศาล

## ลองเล่นดู

<EmbeddingMap client:visible />

คำภาษาอังกฤษ 30 คำในภาพนี้ถูกแปลงเป็นเวกเตอร์ด้วยโมเดลจริง (`all-MiniLM-L6-v2`, 384 มิติ) แล้วถูกบีบลงมาเป็น 2 มิติเพื่อวาดให้เห็น ลองเอาเมาส์ไปวางบนคำใดก็ได้ จะเห็นเพื่อนบ้านที่ใกล้ที่สุด 5 อันดับ — เพื่อนบ้านเหล่านี้คำนวณจาก **สเปซ 384 มิติเดิม** ไม่ใช่จากภาพ 2D ที่เรามองอยู่ บางครั้งคำที่อยู่ใกล้กันในสเปซเดิมจะดูห่างกันบนกราฟ 2D เพราะการบีบ 384 มิติให้เหลือ 2 ทำให้ข้อมูลหายไปเยอะ

## ในโลกจริง

ระบบ semantic search, RAG, และระบบแนะนำสมัยใหม่ทุกระบบเริ่มต้นที่นี่ ผ่านเนื้อหาเข้าโมเดล embedding ครั้งเดียว เก็บเวกเตอร์ที่ได้ลงฐานข้อมูล จากนั้น "การค้นหา" ก็คือการ "หาเวกเตอร์ที่ใกล้กับเวกเตอร์ของคำค้นมากที่สุด" ทุกคณิตศาสตร์ที่เราเรียนมา — ระยะ ความคล้าย dot product — คือสิ่งที่ทำงานจริงตอนค้นหา

<TryYourself>
  ลองเอาเมาส์ไปวางบน `cat` เพื่อนบ้านทั้ง 5 คำเป็นสัตว์ทั้งหมดไหม? ลอง `code` ดูสิ ผลลัพธ์ตรงกับที่เราคิดไว้ไหม?
  เวลาผลออกมาแปลก นั่นคือเบาะแสว่าโมเดลถูกฝึกด้วยข้อมูลแบบไหน
</TryYourself>

<Takeaways>
  <Takeaway>Embedding คือเวกเตอร์ที่แทนเนื้อหาชิ้นหนึ่ง</Takeaway>
  <Takeaway>
    โมเดลที่ดีจะวางเนื้อหาที่ความหมายคล้ายกันไว้ใกล้กันในสเปซเวกเตอร์ — โดยไม่ต้องมีใครคอย label
  </Takeaway>
  <Takeaway>ภาพ 2D เป็นแค่การจำลอง สเปซจริงอยู่ในหลายร้อยมิติ</Takeaway>
</Takeaways>
```

- [ ] **Step 12.3:** Build

```bash
pnpm build
```

Validator should now report `Topic validation passed (12 topics, 5 islands, MDX usage verified)`.

- [ ] **Step 12.4:** Commit

```bash
git add src/content/topics/th/06-embeddings.mdx src/content/topics/en/06-embeddings.mdx
git commit -m "feat(content): add Topic 6 (embeddings) in TH and EN"
```

---

## Task 13: Topic 7 — Vector database (MDX, no island)

**Files:** `src/content/topics/th/07-vector-database.mdx`, `src/content/topics/en/07-vector-database.mdx`

This topic has no interactive island per the spec. Frontmatter sets `hasInteractive: false` (the validator's MDX-body check only fires when an `interactiveComponent` is declared).

- [ ] **Step 13.1:** Create EN MDX

```mdx
---
title: What is a vector database?
slug: vector-database
group: vector-db
order: 7
locale: en
summary: A database that stores embeddings and answers "what's nearest?" — fast, even with billions of vectors.
hasInteractive: false
hasMath: false
---

## Intuition

A normal database is great at "find the row where `id = 42`" or "every order placed last week." Those questions have exact, structured answers. Vector questions are different: "find the 10 documents most similar to this paragraph." There's no `WHERE clause` for that — you have to compute distances.

A **vector database** is a database whose primary index is built for similarity search over vectors. You put vectors (with whatever metadata you want — title, source URL, timestamp) in. You ask "give me the K most similar to this query vector." It returns those K, fast, even when the dataset has hundreds of millions of entries.

## What's actually inside

Three pieces matter:

- **Storage.** Just a flat list of vectors plus their metadata. Conceptually, an array.
- **An index.** A data structure built once over the vectors so future queries don't have to compare against every single vector. The next topic (ANN) is all about this.
- **A query API.** "Here is a vector. Give me the K nearest, with their metadata. Optionally filter by metadata first."

That's the whole product. Every commercial vector database — Pinecone, Weaviate, Qdrant, Milvus, pgvector — is variations on these three pieces.

## In the real world

You don't build a vector DB just to do similarity search on 30 words. The reason these systems exist is **scale**. A semantic-search engine over 100 million product descriptions can't compare a query against all 100 million on every keystroke. The index is what makes the answer feel instant.

Two practical reasons most teams reach for a dedicated vector DB instead of bolting one onto Postgres:

- **Throughput.** Specialized indexes (HNSW, IVF, ScaNN) handle the per-query hot path in microseconds.
- **Filtering with vectors.** "Find similar products, but only in the Electronics category, in stock, costing under $100." Combining metadata filters with vector search is harder than it sounds; the dedicated systems have invested in it.

<TryYourself>
  Imagine you're shipping a product-recommendation feature with 5 million items and 100 requests per
  second. Sketch what storage costs (each vector is 384 floats = 1.5 KB) and what query latency
  needs to be for the experience to feel instant.
</TryYourself>

<Takeaways>
  <Takeaway>A vector database stores embeddings and answers "what's nearest?"</Takeaway>
  <Takeaway>The index is what makes the system fast at scale — not the storage.</Takeaway>
  <Takeaway>
    Filtering by metadata while doing vector search is one of the hard parts these systems solve for
    you.
  </Takeaway>
</Takeaways>
```

- [ ] **Step 13.2:** Create TH MDX

```mdx
---
title: ฐานข้อมูลเวกเตอร์คืออะไร?
slug: vector-database
group: vector-db
order: 7
locale: th
summary: ฐานข้อมูลที่เก็บ embedding และตอบคำถาม "อะไรใกล้ที่สุด" ได้เร็วแม้มีเวกเตอร์เป็นพันล้าน
hasInteractive: false
hasMath: false
---

## ทำความเข้าใจ

ฐานข้อมูลทั่วไปทำงานได้ดีมากกับคำถามแบบ "หาแถวที่ `id = 42`" หรือ "ทุก order ของสัปดาห์ที่แล้ว" คำถามแบบนี้มีคำตอบที่แน่นอน ส่วนคำถามแบบเวกเตอร์ต่างออกไป: "หาเอกสาร 10 อันที่ใกล้เคียงกับย่อหน้านี้มากที่สุด" คำถามแบบนี้ไม่มี `WHERE` — ต้องคำนวณระยะทาง

**ฐานข้อมูลเวกเตอร์** คือฐานข้อมูลที่ index หลักถูกออกแบบมาเพื่อค้นหาความคล้าย ใส่เวกเตอร์ลงไป (พร้อม metadata เช่น title, source URL, timestamp) แล้วถาม "เอา K อันที่ใกล้กับเวกเตอร์นี้ที่สุด" ระบบจะตอบกลับมาเร็วๆ แม้จะมีข้อมูลเป็นร้อยล้านชิ้น

## ภายในมีอะไร

มีสามส่วนที่สำคัญ:

- **ที่เก็บข้อมูล (Storage).** รายการเวกเตอร์ + metadata แค่นั้น ในเชิงแนวคิดก็คืออาร์เรย์
- **Index.** โครงสร้างข้อมูลที่สร้างไว้ล่วงหน้า เพื่อให้การค้นหาในอนาคตไม่ต้องเปรียบเทียบกับเวกเตอร์ทุกตัว เนื้อหาในหัวข้อถัดไป (ANN) คือเรื่องนี้ทั้งหมด
- **API สำหรับค้นหา.** "นี่เวกเตอร์ คืน K อันที่ใกล้ที่สุดมาให้ พร้อม metadata ถ้า filter ก่อนได้ก็ดี"

นั่นคือฐานข้อมูลเวกเตอร์ทั้งหมด ระบบเชิงพาณิชย์ทุกตัว — Pinecone, Weaviate, Qdrant, Milvus, pgvector — เป็นรูปแบบต่างๆ ของสามส่วนนี้

## ในโลกจริง

จะไม่มีใครสร้างฐานข้อมูลเวกเตอร์เพื่อค้นหาในคำ 30 คำ เหตุผลที่ระบบเหล่านี้มีอยู่คือ **scale** semantic search บนสินค้าหรือเอกสาร 100 ล้านชิ้น ไม่สามารถเปรียบเทียบทุกชิ้นในทุกคำค้นได้ index เป็นส่วนที่ทำให้ตอบได้ทันที

เหตุผลที่หลายทีมเลือกใช้ vector DB เฉพาะทาง แทนที่จะต่อ extension เข้ากับ Postgres:

- **Throughput.** Index เฉพาะทาง (HNSW, IVF, ScaNN) ตอบคำถามได้ในระดับไมโครวินาที
- **Filter + vector search.** "หาสินค้าที่คล้ายกัน เฉพาะในหมวด Electronics, in stock, ราคาต่ำกว่า $100" การผสมเงื่อนไข metadata กับการค้นหาเวกเตอร์ยากกว่าที่คิด ระบบเฉพาะทางลงทุนกับเรื่องนี้มาเยอะ

<TryYourself>
  ลองคิดดูว่า ถ้าทำระบบแนะนำสินค้า 5 ล้านชิ้น traffic 100 requests ต่อวินาที ค่าเก็บข้อมูลจะเท่าไร
  (เวกเตอร์ 384 floats = 1.5 KB) และ latency ต้องเท่าไรถึงจะให้ความรู้สึกว่าไม่หน่วง?
</TryYourself>

<Takeaways>
  <Takeaway>ฐานข้อมูลเวกเตอร์เก็บ embedding และตอบ "อะไรใกล้ที่สุด"</Takeaway>
  <Takeaway>Index คือสิ่งที่ทำให้ระบบเร็วในระดับ scale ไม่ใช่ storage</Takeaway>
  <Takeaway>
    การ filter ด้วย metadata ขณะที่ค้นหาด้วยเวกเตอร์ คือส่วนที่ยากที่ระบบเฉพาะทางช่วยจัดการให้
  </Takeaway>
</Takeaways>
```

- [ ] **Step 13.3:** Build

```bash
pnpm build
```

Validator log should now read `Topic validation passed (14 topics, 5 islands, MDX usage verified)`. Five islands are wired so far (4 from M2 + EmbeddingMap); AnnVisualizer's count joins after Task 14.

- [ ] **Step 13.4:** Commit

```bash
git add src/content/topics/th/07-vector-database.mdx src/content/topics/en/07-vector-database.mdx
git commit -m "feat(content): add Topic 7 (vector database) in TH and EN"
```

---

## Task 14: Topic 8 — ANN (MDX)

**Files:** `src/content/topics/th/08-ann.mdx`, `src/content/topics/en/08-ann.mdx`

- [ ] **Step 14.1:** Create EN MDX

```mdx
---
title: Approximate nearest neighbor
slug: ann
group: vector-db
order: 8
locale: en
summary: Trade a small bit of accuracy for huge speed gains — the trick that makes billion-scale vector search possible.
hasInteractive: true
interactiveComponent: AnnVisualizer
hasMath: false
---

import AnnVisualizer from '../../../components/islands/AnnVisualizer.svelte';

## Intuition

The naive way to find the K nearest vectors is to compare your query against **every single vector** and keep the best K. That's called exact kNN. It's exactly correct, and it's exactly too slow once you have more than a few hundred thousand vectors.

**Approximate nearest neighbor** (ANN) trades exactness for speed. The idea: if we accept that we'll occasionally miss the truly best neighbor and pick the second-best instead, we can use clever data structures to skip almost all of the comparisons. Instead of looking at a million vectors per query, we look at a few hundred. The result is usually within a hair's breadth of the exact answer, but the query runs hundreds or thousands of times faster.

## How the simplest ANN works

Many production systems use a graph-based ANN like HNSW. The teaching version below is much simpler:

1. Build an index once: connect each vector to its nearest few neighbors (a "k-NN graph").
2. To answer a query: pick a starting node, then **greedily** hop to the neighbor closest to the query. Keep hopping until no neighbor improves. Return the closest visited nodes.

That's it. No promises that the path lands on the exact best — but in practice, it usually does or comes very close, after only a handful of hops.

## Try it

<AnnVisualizer client:visible />

The blue rings mark the **exact** top-5; the amber dots mark what the **greedy** walk found; the amber line is the path the walk took. Move the query around the canvas. Watch the hop count change with the query's location, and watch the **accuracy** number — that's the overlap between exact and greedy. Most queries hit 1.0 (perfect overlap) in only a few hops; some land at 0.6 or 0.8 because the greedy walk got "stuck" on the wrong side of the cloud. That's the trade-off.

## In the real world

Modern vector databases ship with battle-tested ANN indexes — usually HNSW (hierarchical navigable small worlds), which adds a hierarchy of graphs to the simple version above. Recall (the fraction of true neighbors found) typically lands at 0.95–0.99 with query latencies in microseconds, even at billion-vector scale. The trade-off is always the same shape: tune for higher recall, get slower queries; tune for faster queries, accept a hair lower recall.

<TryYourself>
  Move the query to a sparsely populated corner of the canvas. Notice how the hop count goes up and
  the accuracy might drop. Then move it near the center, where points are dense — the walk usually
  finds the answer almost immediately. Why is density helpful?
</TryYourself>

<Takeaways>
  <Takeaway>Exact kNN compares against every vector. ANN doesn't.</Takeaway>
  <Takeaway>
    Graph-based ANN walks a pre-built neighbor graph greedily — usually finds the true top-K in only
    a few hops.
  </Takeaway>
  <Takeaway>
    The trade-off is recall vs. latency, and production systems land at 95–99% recall with
    microsecond queries.
  </Takeaway>
</Takeaways>
```

- [ ] **Step 14.2:** Create TH MDX

```mdx
---
title: การค้นหาเพื่อนบ้านแบบประมาณ
slug: ann
group: vector-db
order: 8
locale: th
summary: ยอมเสียความแม่นเล็กน้อยเพื่อแลกกับความเร็วมหาศาล — เคล็ดลับที่ทำให้ค้นหาเวกเตอร์ระดับพันล้านได้
hasInteractive: true
interactiveComponent: AnnVisualizer
hasMath: false
---

import AnnVisualizer from '../../../components/islands/AnnVisualizer.svelte';

## ทำความเข้าใจ

วิธีหา K เวกเตอร์ที่ใกล้ที่สุดแบบตรงไปตรงมาคือ เปรียบเทียบกับ **เวกเตอร์ทุกตัว** แล้วเก็บ K อันที่ดีที่สุด เรียกว่า exact kNN ผลแม่นยำ 100% แต่ช้าเกินไปเมื่อข้อมูลเกินไม่กี่แสนตัว

**Approximate nearest neighbor (ANN)** แลกความแม่นเล็กน้อยกับความเร็วก้อนใหญ่ ไอเดียคือ ถ้ายอมรับได้ว่าบางครั้งเราอาจจะพลาดเพื่อนบ้านอันดับ 1 และได้อันดับ 2 มาแทน เราจะใช้โครงสร้างข้อมูลฉลาดๆ เพื่อข้ามการเปรียบเทียบส่วนใหญ่ได้ จากเดิมต้องเปรียบเทียบล้านตัวต่อหนึ่งคำค้น เหลือแค่ไม่กี่ร้อยตัว ผลที่ได้มักจะแทบไม่ต่างจากคำตอบจริง แต่เร็วขึ้นหลักร้อยหรือพันเท่า

## ANN แบบง่ายที่สุดทำงานยังไง

ระบบจริงส่วนใหญ่ใช้ ANN แบบ graph อย่าง HNSW เวอร์ชันสอนของเราง่ายกว่ามาก:

1. สร้าง index ครั้งเดียว: เชื่อมเวกเตอร์ทุกตัวกับเพื่อนบ้านที่ใกล้ที่สุดไม่กี่ตัว (เกิดเป็น "k-NN graph")
2. ตอนค้น: เริ่มที่จุดใดจุดหนึ่ง แล้ว **เดินแบบโลภ** (greedy) ไปหาเพื่อนบ้านที่ใกล้กับคำค้นที่สุด เดินไปเรื่อยๆ จนไม่มีเพื่อนบ้านไหนใกล้กว่าตัวเอง คืนจุดที่เดินผ่านที่ใกล้ที่สุด

แค่นี้แหละ ไม่มีการรับประกันว่าจะเจอคำตอบที่ดีที่สุดเสมอ แต่ในทางปฏิบัติ มักจะเจอหรือใกล้เคียงมาก ภายในไม่กี่ก้าว

## ลองเล่นดู

<AnnVisualizer client:visible />

วงกลมสีฟ้าคือ **คำตอบจริง** (top-5 จาก exact kNN), จุดสีเหลืองอำพันคือ **คำตอบจาก greedy walk**, เส้นสีเหลืองคือเส้นทางที่เดินไป ลองย้ายจุดคำค้นไปรอบๆ ดูว่าจำนวน hop เปลี่ยนไปยังไงตามตำแหน่ง และดูค่า **accuracy** ซึ่งคือสัดส่วนที่ greedy ตอบตรงกับ exact คำค้นส่วนใหญ่จะได้ 1.0 (ตอบถูกหมด) ภายในไม่กี่ hop แต่บางคำค้นได้ 0.6 หรือ 0.8 เพราะ greedy "ติด" อยู่ผิดด้านของกลุ่มจุด นี่คือสิ่งที่ต้องแลก

## ในโลกจริง

ฐานข้อมูลเวกเตอร์สมัยใหม่ใช้ ANN index ที่ผ่านการพิสูจน์มาแล้ว — ส่วนใหญ่คือ HNSW (Hierarchical Navigable Small Worlds) ซึ่งเพิ่มลำดับชั้นเข้าไปใน graph เวอร์ชันง่ายของเรา ค่า recall (สัดส่วนเพื่อนบ้านที่หาเจอ) มักอยู่ที่ 0.95–0.99 ใน latency ระดับไมโครวินาที แม้กับเวกเตอร์เป็นพันล้าน trade-off มีรูปร่างเดิมเสมอ: ปรับให้ recall สูง = ช้าลง, ปรับให้เร็ว = recall ลดเล็กน้อย

<TryYourself>
  ย้ายคำค้นไปยังมุมที่จุดบาง สังเกตว่า hop เพิ่มขึ้นและ accuracy อาจจะตก จากนั้นย้ายไปกลางๆ ที่จุดหนาแน่น
  greedy มักจะหาคำตอบเจอแทบจะทันที ทำไม density ถึงช่วย?
</TryYourself>

<Takeaways>
  <Takeaway>Exact kNN เปรียบเทียบทุกเวกเตอร์ ANN ไม่</Takeaway>
  <Takeaway>
    ANN แบบ graph เดิน greedy บนกราฟเพื่อนบ้านที่สร้างไว้ — มักได้คำตอบจริงใน hop ไม่กี่ก้าว
  </Takeaway>
  <Takeaway>
    Trade-off คือ recall กับ latency ระบบจริงปกติได้ recall 95–99% ที่ latency ระดับไมโครวินาที
  </Takeaway>
</Takeaways>
```

- [ ] **Step 14.3:** Build

```bash
pnpm build
```

Validator should now report `Topic validation passed (16 topics, 6 islands, MDX usage verified)` and the build emits 18 pages (8 topics × TH/EN + 2 indexes).

- [ ] **Step 14.4:** Commit

```bash
git add src/content/topics/th/08-ann.mdx src/content/topics/en/08-ann.mdx
git commit -m "feat(content): add Topic 8 (approximate nearest neighbor) in TH and EN"
```

---

## Task 15: Document the fixture pipeline in the README

**Files:** `README.md`

The fixture pipeline is the first piece of M3 a future contributor needs to understand if they want to change the word list or upgrade the embedding model. The README must explain when to run `pnpm build:fixtures`, where the output goes, and that the JSON is committed.

- [ ] **Step 15.1:** Open `README.md`. Find the existing "Local workflow" or "Scripts" section (M2 introduced both). Add a new section just below it titled exactly **"Rebuilding embedding fixtures"**. The outer fence below uses four backticks so the README's own three-backtick code fences nest correctly — when copying into `README.md`, drop the four-backtick wrapper and keep the three-backtick blocks as-is.

````markdown
### Rebuilding embedding fixtures

The EmbeddingMap demo on the "Embeddings" topic page is driven by a committed JSON file at `src/lib/embeddings/words.json`. That file is produced offline by:

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
````

(If the README already has a section near "Adding a topic" describing pnpm scripts, add the new section in the same neighborhood for cohesion.)

- [ ] **Step 15.2:** Run `pnpm format:check`. If Prettier reformats the README, run `pnpm format` and re-stage.

- [ ] **Step 15.3:** Commit

```bash
git add README.md
git commit -m "docs(readme): document the embedding-fixture rebuild workflow

Explains when to rerun pnpm build:fixtures, where the JSON lands,
and confirms astro build never touches the network."
```

---

## Task 16: Verification + manual walkthrough

Run the full pipeline and walk both new topic pages in both locales.

**Files:** none

- [ ] **Step 16.1:** Full pipeline

```bash
pnpm format:check && pnpm typecheck && pnpm test && pnpm build
```

Expected:

- `format:check` clean
- `typecheck` 0 errors
- `test` — both projects green. Approximate counts (M2 ~74 + new):
  - browser: previous 68 + 7 (topic-schema) + 5 (PCA) + 11 (kNN) + 5 (EmbeddingMap) + 5 (AnnVisualizer) + 1 (cosine identical-non-axis) ≈ **102 tests**
  - node: previous 6 + 6 (build-fixtures contract) = **12 node tests**
  - Total ≈ **114 tests**
- `build` produces 18 pages and reports `Topic validation passed (16 topics, 6 islands, MDX usage verified)`

If counts differ noticeably, investigate before declaring done — some test files may have been double-included or excluded.

- [ ] **Step 16.2:** Visual smoke (manual)

```bash
pnpm dev
```

Visit each new page in TH and EN:

- `http://localhost:4321/embeddings` — EmbeddingMap renders, hovering a word highlights neighbors and dims unrelated points
- `http://localhost:4321/vector-database` — content renders cleanly with no island, no console errors
- `http://localhost:4321/ann` — AnnVisualizer renders, query inputs change the readouts and the path on the canvas
- `http://localhost:4321/en/embeddings`, `/en/vector-database`, `/en/ann` — same checks for EN

Confirm:

- Sidebar now shows the "Vector databases" group with three topics, current page highlighted
- Prev/Next nav links between Topic 5 (`high-dimensional`) → 6 → 7 → 8 in order, with no `Next` link on Topic 8 (since 9 isn't shipped yet — Prev/Next falls off the end)
- LangSwitch flips locale and preserves slug
- No broken-link warnings in the dev console

Stop the dev server.

---

## Verification checklist (run before declaring M3 done)

- [ ] `pnpm format:check` clean
- [ ] `pnpm typecheck` → 0 errors, 0 warnings, 0 hints
- [ ] `pnpm test` → both browser and node projects green; ~114 tests total
- [ ] `pnpm build` → 18 pages, validator reports `Topic validation passed (16 topics, 6 islands, MDX usage verified)`
- [ ] `src/lib/embeddings/words.json` exists and is committed; `meta.dim === 384`, `meta.count === 30`
- [ ] Manual `pnpm dev` walkthrough of all three new topic pages in both locales
- [ ] CI workflow green on push to `main`
- [ ] No new `astro check` hints introduced

---

## Deferred follow-ups (for M4 / M5)

The following items were intentionally not addressed in M3. When picking up M4, scan this list and pull in anything that intersects the new work.

**For M4 (real-world topics + transformers.js stretch):**

1. **Path B in spec §7 — "Enable live search" for SemanticSearchDemo.** Lazy-load `transformers.js` (~5 MB) behind a button so users can embed arbitrary queries in the browser. Defer until M4 has the canned-query path shipped first.
2. **Per-locale word fixtures.** The `words.json` shipped here is English. M4's recommendations / RAG demos may want a Thai-language demo for the TH default locale; revisit whether to embed Thai words with a multilingual model (`paraphrase-multilingual-MiniLM-L12-v2`) or stay English with a TH gloss.

**For M5 (polish):**

3. **HNSW upgrade for AnnVisualizer.** The simplified greedy walk teaches the idea but isn't a faithful HNSW. If time allows, layer a small hierarchy of graphs and visualize the descent.
4. **Drag affordance for EmbeddingMap and AnnVisualizer query.** Same outstanding spec §7 / §8 item from M2: pointer drag + arrow-key keyboard nudging beyond the numeric-input fallback.
5. **CI fixture-drift check.** Run `pnpm build:fixtures` in CI on a schedule, diff against `words.json`, fail if drift exceeds a threshold. Spec §7 mentions this as optional.
6. **Bundle-size budget for the JSON fixture.** `words.json` should be well under 5 KB at 30 words × no embeddings shipped. Revisit if the word list grows past ~100 entries — at that point we may want to gzip it or split per cluster.
