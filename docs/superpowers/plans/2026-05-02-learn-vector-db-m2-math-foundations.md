# Learn Vector DB — M2 (Math Foundations) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Topics 2–5 (the math foundations group) with their interactive Svelte islands. Replace the placeholder Topic 1 with full content using its island. Fold in M1 review follow-ups so the foundation stays clean as more content lands.

**Architecture:** Build a small framework-agnostic math library (`src/lib/math/`) of pure functions: vector ops, distance/similarity metrics, and seeded RNG. Build four Svelte 5 islands that consume the math library, each rendered through `client:visible` from MDX. Each island is self-contained (no shared state, no props) — they're educational widgets, not part of an application data model. Test math helpers exhaustively; test islands against their math-display contract (input change → readout updates), not pixel positions.

**Tech Stack:** All M1 stack (Astro 6, Tailwind v4, Svelte 5, MDX, KaTeX, Vitest). New: `src/lib/math/` library, `src/components/islands/` directory.

**Spec reference:** `docs/superpowers/specs/2026-05-02-learn-vector-db-design.md` §7 (interactive islands), §2 (topics 1–5 of the math foundations group).

**M1 baseline:** `docs/superpowers/plans/2026-05-02-learn-vector-db-m1-skeleton.md` — completed in commits `9eec398..68f6a08`. M1's "Deferred follow-ups" section lists items being addressed here.

---

## Out of scope for M2

Intentionally deferred (do **not** implement):

- Topics 6–11 (vector-db and real-world groups) → M3, M4
- Embedding fixture pipeline (`scripts/build-fixtures.ts`) → M3
- Transformers.js or any embedding generation → M3+
- 3D visualizations → never (spec calls for 2D + histogram only in M2)
- Drag-via-pointer-events for islands → write the keyboard/numeric input path now; pointer drag is a polish item for M5 or whenever
- Animated transitions (`prefers-reduced-motion` handling beyond instant transitions) → M5
- Lighthouse CI / performance budget enforcement → M5
- Sitemap / OG tags → M5
- ESLint, Husky → M5

## Pre-flight

- The repo is on `main` with M1 shipped. Run `pnpm typecheck && pnpm test && pnpm build` first; should be 0 errors / 29 tests / 6 pages.
- Work on `main` (matches M1 cadence). One commit per task; commit messages follow the pattern from M1 (`feat(...)`, `chore(...)`, etc.).
- Each topic page builds on top of `TopicLayout.astro` (already wired in M1). The MDX helpers `Callout`, `Details`, `TryYourself`, `Takeaways`, `Takeaway` are already available.

## File structure (M2)

```
src/
├─ components/islands/                    # NEW directory (validator already expects this path)
│  ├─ VectorPlayground.svelte             # CREATE — used on Topic 1, Topic 4
│  ├─ VectorPlayground.test.ts            # CREATE
│  ├─ VectorOpsPlayground.svelte          # CREATE — Topic 2
│  ├─ VectorOpsPlayground.test.ts         # CREATE
│  ├─ DistanceComparator.svelte           # CREATE — Topic 3
│  ├─ DistanceComparator.test.ts          # CREATE
│  ├─ HighDimIntuition.svelte             # CREATE — Topic 5
│  └─ HighDimIntuition.test.ts            # CREATE
├─ lib/
│  └─ math/                               # NEW directory
│     ├─ vec.ts                           # CREATE — n-dim vector ops
│     ├─ vec.test.ts                      # CREATE
│     ├─ metrics.ts                       # CREATE — euclidean, manhattan, cosine
│     ├─ metrics.test.ts                  # CREATE
│     ├─ random.ts                        # CREATE — seeded RNG, random unit vectors
│     └─ random.test.ts                   # CREATE
├─ content/topics/
│  ├─ th/01-vector.mdx                    # MODIFY — replace placeholder, add island
│  ├─ th/02-vector-operations.mdx         # CREATE
│  ├─ th/03-distance-similarity.mdx       # CREATE
│  ├─ th/04-norms.mdx                     # CREATE
│  ├─ th/05-high-dimensional.mdx          # CREATE
│  ├─ en/01-vector.mdx                    # MODIFY
│  ├─ en/02-vector-operations.mdx         # CREATE
│  ├─ en/03-distance-similarity.mdx       # CREATE
│  ├─ en/04-norms.mdx                     # CREATE
│  └─ en/05-high-dimensional.mdx          # CREATE
├─ integrations/
│  └─ validate-topics.test.ts             # CREATE — fixture-based integration test
├─ tsconfig.json                          # MODIFY — remove "node" from global types
README.md                                  # MODIFY — document islands directory convention
package.json                               # MODIFY — pin @types/node to ^20
vitest.config.ts                           # MODIFY (or DELETE if replaced by workspace)
vitest.workspace.ts                        # CREATE — split per-package test config
```

---

## Task 1: Pin `@types/node` to `^20` and scope it locally

**Files:** `package.json`, `tsconfig.json`, `src/integrations/validate-topics.ts`

The M1 cleanup left `@types/node@^25` at the top level and `"types": ["vitest/globals", "node"]` in `tsconfig.json`, which leaks Node globals (`process`, `Buffer`, `__dirname`) into every Astro/Svelte file. We want Node types available only where needed (the integrations folder).

- [ ] **Step 1.1:** Update `package.json` — pin `@types/node` to `^20`

```diff
-    "@types/node": "^25.6.0",
+    "@types/node": "^20.16.5",
```

Then run `pnpm install` so the lockfile updates.

- [ ] **Step 1.2:** Remove `"node"` from the global types in `tsconfig.json`

```diff
   "compilerOptions": {
-    "types": ["vitest/globals", "node"]
+    "types": ["vitest/globals"]
   }
```

- [ ] **Step 1.3:** Add a triple-slash reference to `node` types where they're used

In `src/integrations/validate-topics.ts`, at the very top of the file (line 1, before the `import type {...}` line):

```ts
/// <reference types="node" />
```

- [ ] **Step 1.4:** Verify

```bash
pnpm typecheck
```

Expected: 0 errors. The integration's `process.cwd()`, `node:fs/promises`, `node:url`, `node:path` imports still resolve via the triple-slash reference. Nothing else in `src/` has access to Node globals anymore.

```bash
pnpm test && pnpm build
```

Expected: 29 tests, 6 pages, build clean.

- [ ] **Step 1.5:** Commit

```bash
git add package.json pnpm-lock.yaml tsconfig.json src/integrations/validate-topics.ts
git commit -m "chore: scope @types/node to integrations only and pin to ^20

Removes 'node' from the root tsconfig.json types array so Node globals
(process, Buffer, __dirname, setImmediate) no longer leak into every
.astro/.svelte file. The integration that genuinely needs them now
opts in via a triple-slash reference at the top of the file. Pin
@types/node to ^20 to match the actual CI Node version."
```

---

## Task 2: Document the islands directory convention in the README

**Files:** `README.md`

The `validate-topics` integration's `listIslandComponents` only inspects `src/components/islands/`. Future authors need to know that.

- [ ] **Step 2.1:** Edit the README's "Adding a topic" section

Find the existing "Adding a topic" section. Add a fourth point right before the last point (the validation-failure note):

```markdown
4. If the topic embeds an interactive demo, set `interactiveComponent: <Name>` in the frontmatter. The component must live at `src/components/islands/<Name>.svelte` — that's the only directory the build-time validator searches. Anywhere else and the build will fail with `Unknown interactiveComponent`.
```

(Renumber the old point 4 — "The build will fail if a slug exists in only one locale..." — as point 5.)

- [ ] **Step 2.2:** Run `pnpm format:check` to confirm Prettier is happy.

If Prettier reformats the README, run `pnpm format` and re-stage.

- [ ] **Step 2.3:** Commit

```bash
git add README.md
git commit -m "docs(readme): document the src/components/islands/ convention

The build-time validator only resolves interactiveComponent names
against this directory. Authors who put islands elsewhere will hit
'Unknown interactiveComponent' with no clear hint."
```

---

## Task 3: Create the `src/components/islands/` directory placeholder

**Files:** `src/components/islands/.gitkeep`

We need the directory to exist before any tests reference it (or the validator inspects it during dev). An empty directory + `.gitkeep` is the standard pattern.

- [ ] **Step 3.1:** Create the directory and placeholder

```bash
mkdir -p src/components/islands
touch src/components/islands/.gitkeep
git add src/components/islands/.gitkeep
```

- [ ] **Step 3.2:** Commit

```bash
git commit -m "chore: create src/components/islands/ placeholder"
```

(This commit will be tiny — that's fine. It exists so subsequent islands have a stable home.)

---

## Task 4: Math helpers — vector library (TDD)

**Files:** `src/lib/math/vec.ts`, `src/lib/math/vec.test.ts`

Pure n-dimensional vector operations. No DOM, no Node, no Astro imports. Just numbers in, numbers out.

- [ ] **Step 4.1:** Write failing tests in `src/lib/math/vec.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { add, sub, scale, dot, magnitude, l1norm, normalize } from './vec';

describe('add', () => {
  it('adds element-wise', () => {
    expect(add([1, 2], [3, 4])).toEqual([4, 6]);
  });
  it('works on n-dim vectors', () => {
    expect(add([1, 2, 3], [10, 20, 30])).toEqual([11, 22, 33]);
  });
  it('throws on length mismatch', () => {
    expect(() => add([1, 2], [3, 4, 5])).toThrow(/length/i);
  });
});

describe('sub', () => {
  it('subtracts element-wise', () => {
    expect(sub([5, 7], [1, 2])).toEqual([4, 5]);
  });
  it('throws on length mismatch', () => {
    expect(() => sub([1], [2, 3])).toThrow(/length/i);
  });
});

describe('scale', () => {
  it('multiplies each element by k', () => {
    expect(scale([1, 2, 3], 2)).toEqual([2, 4, 6]);
  });
  it('handles negative scalar', () => {
    expect(scale([1, -2], -1)).toEqual([-1, 2]);
  });
  it('handles zero scalar', () => {
    expect(scale([4, 5], 0)).toEqual([0, 0]);
  });
});

describe('dot', () => {
  it('returns the dot product', () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
  });
  it('returns 0 for orthogonal vectors', () => {
    expect(dot([1, 0], [0, 1])).toBe(0);
  });
  it('throws on length mismatch', () => {
    expect(() => dot([1, 2], [3])).toThrow(/length/i);
  });
});

describe('magnitude', () => {
  it('returns the L2 norm', () => {
    expect(magnitude([3, 4])).toBe(5);
  });
  it('returns 0 for the zero vector', () => {
    expect(magnitude([0, 0, 0])).toBe(0);
  });
  it('handles n-dim', () => {
    expect(magnitude([1, 1, 1, 1])).toBeCloseTo(2, 10);
  });
});

describe('l1norm', () => {
  it('returns the sum of absolute values', () => {
    expect(l1norm([1, -2, 3])).toBe(6);
  });
  it('returns 0 for the zero vector', () => {
    expect(l1norm([0, 0])).toBe(0);
  });
});

describe('normalize', () => {
  it('returns a unit vector', () => {
    const n = normalize([3, 4]);
    expect(magnitude(n)).toBeCloseTo(1, 10);
    expect(n).toEqual([0.6, 0.8]);
  });
  it('throws on the zero vector', () => {
    expect(() => normalize([0, 0])).toThrow(/zero/i);
  });
});
```

- [ ] **Step 4.2:** Run tests, verify they fail

Run: `pnpm test src/lib/math/vec.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4.3:** Implement `src/lib/math/vec.ts`

```ts
export type Vec = readonly number[];

function assertSameLength(a: Vec, b: Vec): void {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }
}

export function add(a: Vec, b: Vec): number[] {
  assertSameLength(a, b);
  return a.map((v, i) => v + b[i]);
}

export function sub(a: Vec, b: Vec): number[] {
  assertSameLength(a, b);
  return a.map((v, i) => v - b[i]);
}

export function scale(v: Vec, k: number): number[] {
  return v.map((x) => x * k);
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
  for (const x of v) sum += Math.abs(x);
  return sum;
}

export function normalize(v: Vec): number[] {
  const m = magnitude(v);
  if (m === 0) throw new Error('Cannot normalize zero vector');
  return scale(v, 1 / m);
}
```

- [ ] **Step 4.4:** Run tests, verify they pass

Run: `pnpm test src/lib/math/vec.test.ts`
Expected: PASS — all green.

- [ ] **Step 4.5:** Commit

```bash
git add src/lib/math/vec.ts src/lib/math/vec.test.ts
git commit -m "feat(math): add n-dim vector ops (add, sub, scale, dot, magnitude, l1norm, normalize)"
```

---

## Task 5: Math helpers — distance and similarity metrics (TDD)

**Files:** `src/lib/math/metrics.ts`, `src/lib/math/metrics.test.ts`

- [ ] **Step 5.1:** Write failing tests in `src/lib/math/metrics.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { euclidean, manhattan, cosineSimilarity, cosineDistance } from './metrics';

describe('euclidean', () => {
  it('returns 0 for identical points', () => {
    expect(euclidean([1, 2], [1, 2])).toBe(0);
  });
  it('returns the L2 distance', () => {
    expect(euclidean([0, 0], [3, 4])).toBe(5);
  });
  it('throws on length mismatch', () => {
    expect(() => euclidean([1], [1, 2])).toThrow(/length/i);
  });
});

describe('manhattan', () => {
  it('returns 0 for identical points', () => {
    expect(manhattan([1, 2], [1, 2])).toBe(0);
  });
  it('returns the L1 distance', () => {
    expect(manhattan([0, 0], [3, 4])).toBe(7);
  });
  it('handles negative coords', () => {
    expect(manhattan([-1, -1], [1, 1])).toBe(4);
  });
});

describe('cosineSimilarity', () => {
  it('returns 1 for identical direction', () => {
    expect(cosineSimilarity([1, 0], [2, 0])).toBeCloseTo(1, 10);
  });
  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 10);
  });
  it('returns -1 for opposite direction', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 10);
  });
  it('returns 0 when either vector is zero', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
    expect(cosineSimilarity([1, 1], [0, 0])).toBe(0);
  });
});

describe('cosineDistance', () => {
  it('returns 0 for identical direction', () => {
    expect(cosineDistance([1, 0], [2, 0])).toBeCloseTo(0, 10);
  });
  it('returns 1 for orthogonal vectors', () => {
    expect(cosineDistance([1, 0], [0, 1])).toBeCloseTo(1, 10);
  });
  it('returns 2 for opposite direction', () => {
    expect(cosineDistance([1, 0], [-1, 0])).toBeCloseTo(2, 10);
  });
});
```

- [ ] **Step 5.2:** Run, verify failing.

- [ ] **Step 5.3:** Implement `src/lib/math/metrics.ts`

```ts
import { dot, magnitude, sub, l1norm, type Vec } from './vec';

export function euclidean(a: Vec, b: Vec): number {
  return magnitude(sub(a, b));
}

export function manhattan(a: Vec, b: Vec): number {
  return l1norm(sub(a, b));
}

export function cosineSimilarity(a: Vec, b: Vec): number {
  const ma = magnitude(a);
  const mb = magnitude(b);
  if (ma === 0 || mb === 0) return 0;
  return dot(a, b) / (ma * mb);
}

export function cosineDistance(a: Vec, b: Vec): number {
  return 1 - cosineSimilarity(a, b);
}
```

- [ ] **Step 5.4:** Run, verify passing.

- [ ] **Step 5.5:** Commit

```bash
git add src/lib/math/metrics.ts src/lib/math/metrics.test.ts
git commit -m "feat(math): add distance and similarity metrics (euclidean, manhattan, cosine)"
```

---

## Task 6: Math helpers — seeded RNG and random unit vectors (TDD)

**Files:** `src/lib/math/random.ts`, `src/lib/math/random.test.ts`

Needed by `HighDimIntuition` (Topic 5): generates 500 random unit vectors at a chosen dimensionality. We use a seeded PRNG (mulberry32) so the histogram doesn't reshuffle on every keystroke; users see a stable picture as they slide.

- [ ] **Step 6.1:** Write failing tests in `src/lib/math/random.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { mulberry32, randomUnitVector, randomUnitVectors } from './random';
import { magnitude } from './vec';

describe('mulberry32', () => {
  it('produces deterministic output for a given seed', () => {
    const r1 = mulberry32(42);
    const r2 = mulberry32(42);
    const a = [r1(), r1(), r1()];
    const b = [r2(), r2(), r2()];
    expect(a).toEqual(b);
  });
  it('produces values in [0, 1)', () => {
    const r = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('produces different sequences for different seeds', () => {
    const r1 = mulberry32(1);
    const r2 = mulberry32(2);
    expect(r1()).not.toBe(r2());
  });
});

describe('randomUnitVector', () => {
  it('returns a vector of the requested dimension', () => {
    const v = randomUnitVector(7, mulberry32(1));
    expect(v).toHaveLength(7);
  });
  it('returns a unit vector', () => {
    const v = randomUnitVector(10, mulberry32(123));
    expect(magnitude(v)).toBeCloseTo(1, 10);
  });
  it('is deterministic for a given seed', () => {
    const a = randomUnitVector(5, mulberry32(99));
    const b = randomUnitVector(5, mulberry32(99));
    expect(a).toEqual(b);
  });
});

describe('randomUnitVectors', () => {
  it('returns n vectors of the requested dimension', () => {
    const vs = randomUnitVectors(20, 4, mulberry32(7));
    expect(vs).toHaveLength(20);
    for (const v of vs) {
      expect(v).toHaveLength(4);
      expect(magnitude(v)).toBeCloseTo(1, 10);
    }
  });
  it('is deterministic for a given seed', () => {
    const a = randomUnitVectors(5, 3, mulberry32(2));
    const b = randomUnitVectors(5, 3, mulberry32(2));
    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 6.2:** Run, verify failing.

- [ ] **Step 6.3:** Implement `src/lib/math/random.ts`

```ts
import { normalize, type Vec } from './vec';

/**
 * Mulberry32 PRNG: small, fast, good-enough for visualization.
 * Returns a function that yields values in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Standard-normal sample via Box-Muller. Each call yields one number.
 */
function gaussian(rng: () => number): number {
  // Avoid log(0) by clamping rng away from 0.
  const u1 = Math.max(rng(), Number.EPSILON);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Uniform-on-sphere sample: draw n iid Gaussians, then normalize.
 */
export function randomUnitVector(dim: number, rng: () => number): number[] {
  const raw: number[] = new Array(dim);
  for (let i = 0; i < dim; i++) raw[i] = gaussian(rng);
  return normalize(raw);
}

export function randomUnitVectors(n: number, dim: number, rng: () => number): number[][] {
  const out: number[][] = new Array(n);
  for (let i = 0; i < n; i++) out[i] = randomUnitVector(dim, rng);
  return out;
}
```

- [ ] **Step 6.4:** Run, verify passing.

- [ ] **Step 6.5:** Commit

```bash
git add src/lib/math/random.ts src/lib/math/random.test.ts
git commit -m "feat(math): add seeded PRNG and uniform-on-sphere random unit vectors"
```

---

## Task 7: VectorPlayground island (TDD)

**Files:** `src/components/islands/VectorPlayground.svelte`, `src/components/islands/VectorPlayground.test.ts`

A 2D vector playground. Two number inputs (x, y) drive a live SVG arrow plus magnitude and L1-norm readouts. Used on Topic 1 (Vector) and Topic 4 (Norms).

- [ ] **Step 7.1:** Write failing tests in `src/components/islands/VectorPlayground.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import VectorPlayground from './VectorPlayground.svelte';

describe('VectorPlayground', () => {
  it('renders accessible x and y inputs', () => {
    render(VectorPlayground);
    expect(screen.getByLabelText(/^x/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^y/i)).toBeInTheDocument();
  });

  it('shows the L2 magnitude for the default vector (3, 2)', () => {
    render(VectorPlayground);
    // sqrt(13) ≈ 3.61
    expect(screen.getByTestId('magnitude').textContent).toMatch(/3\.61/);
  });

  it('shows the L1 norm for the default vector (3, 2)', () => {
    render(VectorPlayground);
    // |3| + |2| = 5
    expect(screen.getByTestId('l1norm').textContent).toMatch(/5\.00/);
  });

  it('updates magnitude when x is changed', async () => {
    const user = userEvent.setup();
    render(VectorPlayground);
    const x = screen.getByLabelText(/^x/i) as HTMLInputElement;
    await user.clear(x);
    await user.type(x, '0');
    // Now (0, 2) → magnitude 2
    expect(screen.getByTestId('magnitude').textContent).toMatch(/2\.00/);
  });

  it('updates L1 norm when y is changed to a negative value', async () => {
    const user = userEvent.setup();
    render(VectorPlayground);
    const y = screen.getByLabelText(/^y/i) as HTMLInputElement;
    await user.clear(y);
    await user.type(y, '-4');
    // (3, -4) → |3| + |-4| = 7
    expect(screen.getByTestId('l1norm').textContent).toMatch(/7\.00/);
  });
});
```

- [ ] **Step 7.2:** Run, verify failing.

- [ ] **Step 7.3:** Implement `src/components/islands/VectorPlayground.svelte`

```svelte
<script lang="ts">
  import { magnitude, l1norm } from '../../lib/math/vec';

  let x = $state(3);
  let y = $state(2);

  const SIZE = 280;
  const CENTER = SIZE / 2;
  const SCALE = 25; // pixels per unit

  const len = $derived(magnitude([x, y]));
  const l1 = $derived(l1norm([x, y]));

  // SVG y-axis is inverted relative to math convention
  const px = $derived(CENTER + x * SCALE);
  const py = $derived(CENTER - y * SCALE);
</script>

<div class="not-prose my-6 rounded-md border border-brand-100 p-4 dark:border-brand-900">
  <svg
    viewBox="0 0 {SIZE} {SIZE}"
    role="img"
    aria-label="2D vector playground"
    class="mx-auto block h-72 w-72"
  >
    <line x1={CENTER} y1="0" x2={CENTER} y2={SIZE} stroke="currentColor" stroke-opacity="0.15" />
    <line x1="0" y1={CENTER} x2={SIZE} y2={CENTER} stroke="currentColor" stroke-opacity="0.15" />
    <line x1={CENTER} y1={CENTER} x2={px} y2={py} stroke="oklch(0.55 0.18 250)" stroke-width="2" />
    <circle cx={px} cy={py} r="6" fill="oklch(0.55 0.18 250)" />
  </svg>

  <div class="mt-4 grid grid-cols-2 gap-3">
    <label class="flex items-center gap-2 text-sm">
      x
      <input
        type="number"
        min="-5"
        max="5"
        step="0.1"
        bind:value={x}
        class="w-20 rounded border border-brand-300 bg-transparent px-2 py-1"
      />
    </label>
    <label class="flex items-center gap-2 text-sm">
      y
      <input
        type="number"
        min="-5"
        max="5"
        step="0.1"
        bind:value={y}
        class="w-20 rounded border border-brand-300 bg-transparent px-2 py-1"
      />
    </label>
  </div>

  <dl class="mt-4 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm" aria-live="polite">
    <dt class="text-brand-500">Magnitude (L2)</dt>
    <dd class="font-mono" data-testid="magnitude">{len.toFixed(2)}</dd>
    <dt class="text-brand-500">L1 norm</dt>
    <dd class="font-mono" data-testid="l1norm">{l1.toFixed(2)}</dd>
  </dl>
</div>
```

- [ ] **Step 7.4:** Run, verify passing.

- [ ] **Step 7.5:** Commit

```bash
git add src/components/islands/VectorPlayground.svelte src/components/islands/VectorPlayground.test.ts
git commit -m "feat(island): add VectorPlayground (2D vector + magnitude/L1 readouts)"
```

---

## Task 8: Replace Topic 1 (Vector) with full content + island

**Files:** `src/content/topics/th/01-vector.mdx`, `src/content/topics/en/01-vector.mdx`

Topic 1 is currently a placeholder. Now that VectorPlayground exists, give Topic 1 its real content with the island mounted via `client:visible`.

- [ ] **Step 8.1:** Replace `src/content/topics/en/01-vector.mdx`

```mdx
---
title: Vector
slug: vector
group: math
order: 1
locale: en
summary: A vector is an arrow with both length and direction — and that's enough to make a search engine.
hasInteractive: true
interactiveComponent: VectorPlayground
hasMath: false
---

import VectorPlayground from '../../../components/islands/VectorPlayground.svelte';

## Intuition

Imagine an arrow drawn on a piece of paper. The arrow has a starting point and an ending point. That arrow is a **vector** — at its simplest, it's just a length and a direction.

We can describe the same arrow with two numbers: how far it goes sideways (`x`), and how far it goes up (`y`). The pair `(x, y)` is the vector's **components**.

## Try it

<VectorPlayground client:visible />

Drag the values up and down. Watch what happens to the **magnitude** (the arrow's length) when you change `x` and `y`.

## In the real world

Vector databases store sentences, images, and audio as long lists of numbers — vectors with hundreds or thousands of components. Two pieces of content that "feel similar" become vectors that are close to each other; finding similar items is just finding nearby vectors. Everything else this site teaches builds on that one idea.

<TryYourself>Set `x = 3` and `y = 4`. What's the magnitude? Why is it exactly 5?</TryYourself>

<Takeaways>
  <Takeaway>
    A vector is just a list of numbers — its length and direction fall out of those numbers.
  </Takeaway>
  <Takeaway>
    Magnitude (L2 norm) is how far the vector reaches: $\sqrt{x ^ (2 + y) ^ 2}$ in 2D.
  </Takeaway>
  <Takeaway>
    In a vector database, every item — a sentence, an image — is one of these vectors.
  </Takeaway>
</Takeaways>
```

- [ ] **Step 8.2:** Replace `src/content/topics/th/01-vector.mdx`

```mdx
---
title: เวกเตอร์
slug: vector
group: math
order: 1
locale: th
summary: เวกเตอร์คือลูกศรที่มีทั้งความยาวและทิศทาง — แค่นี้ก็พอให้เป็นหัวใจของระบบค้นหาแล้ว
hasInteractive: true
interactiveComponent: VectorPlayground
hasMath: false
---

import VectorPlayground from '../../../components/islands/VectorPlayground.svelte';

## ทำความเข้าใจ

ลองนึกภาพลูกศรที่วาดบนกระดาษ ลูกศรมีจุดเริ่มต้นและจุดปลาย ลูกศรนั้นคือ **เวกเตอร์** — พูดง่ายๆ ก็คือ "ความยาว + ทิศทาง"

เราสามารถอธิบายลูกศรเดียวกันด้วยตัวเลขสองตัว: ไปด้านข้างเท่าไร (`x`) และขึ้นเท่าไร (`y`) คู่ `(x, y)` คือ **องค์ประกอบ** ของเวกเตอร์

## ลองเล่นดู

<VectorPlayground client:visible />

ลองปรับค่า `x` และ `y` ดูว่า **ขนาด (magnitude)** เปลี่ยนไปอย่างไร

## ในโลกจริง

ฐานข้อมูลเวกเตอร์เก็บประโยค รูปภาพ และเสียงในรูปของรายการตัวเลขที่ยาว — เวกเตอร์ที่มีหลายร้อยหรือหลายพันมิติ สิ่งที่ "รู้สึกคล้ายกัน" จะกลายเป็นเวกเตอร์ที่อยู่ใกล้กัน การค้นหาสิ่งที่คล้ายกันก็คือการค้นหาเวกเตอร์ที่อยู่ใกล้กันนั่นเอง ทุกอย่างที่เราจะเรียนต่อจากนี้ ตั้งอยู่บนแนวคิดเดียวกันนี้

<TryYourself>
  ตั้งค่า `x = 3` และ `y = 4` ดูสิ ขนาดของเวกเตอร์เป็นเท่าไร? ทำไมถึงเป็น 5 พอดี?
</TryYourself>

<Takeaways>
  <Takeaway>เวกเตอร์คือรายการของตัวเลข — ความยาวและทิศทางคำนวณได้จากตัวเลขเหล่านั้น</Takeaway>
  <Takeaway>
    Magnitude (L2 norm) คือความยาวของเวกเตอร์ ในสองมิติเท่ากับ $\sqrt{x ^ (2 + y) ^ 2}$
  </Takeaway>
  <Takeaway>ในฐานข้อมูลเวกเตอร์ ทุกๆ ไอเทม — ทุกประโยค ทุกรูปภาพ — คือเวกเตอร์หนึ่งตัว</Takeaway>
</Takeaways>
```

> **Note about MDX import paths:** the path `../../../components/islands/VectorPlayground.svelte` is correct relative to `src/content/topics/{th|en}/01-vector.mdx`. Three levels up: `topics/{th|en}/` → `topics/` → `content/` → `src/`.
>
> **Note about MDX helper components:** `<TryYourself>` and `<Takeaways>` / `<Takeaway>` are not auto-imported by Astro — they need explicit imports if not auto-injected by the MDX configuration. If the build complains "Component is not defined", add at the top of the MDX file (right after the existing import line):
>
> ```mdx
> import TryYourself from '../../../components/mdx/TryYourself.astro';
> import Takeaways from '../../../components/mdx/Takeaways.astro';
> import Takeaway from '../../../components/mdx/Takeaway.astro';
> ```
>
> If the build passes without these explicit imports, the MDX integration is auto-resolving them somehow (via globals or shortcuts) — fine, leave the file as written. **The first MDX file we author after M1 is the source of truth here**: figure out which path works on this build, document the answer in the README's "Adding a topic" section, and use the same approach for all later topics in this plan.

- [ ] **Step 8.3:** Run the build

```bash
pnpm build
```

If the build fails with "TryYourself is not defined" or similar, add explicit imports as described in the note above, then commit them as part of the same task.

If the build fails with "Unknown interactiveComponent VectorPlayground", confirm `src/components/islands/VectorPlayground.svelte` exists and the validator's allow-list includes it (the integration's log line should now read `Topic validation passed (2 topics, 1 islands)`).

- [ ] **Step 8.4:** Verify in dev

```bash
pnpm dev
```

Visit `http://localhost:4321/vector` and `http://localhost:4321/en/vector`. Confirm the playground mounts and the math readouts update when you change inputs. Stop the server.

- [ ] **Step 8.5:** Commit

```bash
git add src/content/topics/th/01-vector.mdx src/content/topics/en/01-vector.mdx
git commit -m "feat(content): replace placeholder Topic 1 with full content + VectorPlayground island"
```

If MDX-component imports were needed in 8.2, also commit a short note added to README's "Adding a topic" section explaining the convention. Use a separate commit:

```bash
git add README.md
git commit -m "docs(readme): document the MDX helper-component import convention"
```

---

## Task 9: VectorOpsPlayground island (TDD)

**Files:** `src/components/islands/VectorOpsPlayground.svelte`, `src/components/islands/VectorOpsPlayground.test.ts`

Two draggable vectors `a` and `b`. A radio toggle picks one of: Add, Subtract, Scale (with a slider for `k`), or Dot product. Result is shown as either a third vector or a scalar.

- [ ] **Step 9.1:** Write failing tests in `src/components/islands/VectorOpsPlayground.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import VectorOpsPlayground from './VectorOpsPlayground.svelte';

describe('VectorOpsPlayground', () => {
  it('renders four numeric inputs (a.x, a.y, b.x, b.y)', () => {
    render(VectorOpsPlayground);
    expect(screen.getByLabelText(/a\.x/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/a\.y/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/b\.x/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/b\.y/i)).toBeInTheDocument();
  });

  it('defaults to Add and shows a + b', () => {
    render(VectorOpsPlayground);
    // defaults: a=(2,1), b=(1,2) → result (3, 3)
    expect(screen.getByTestId('result').textContent).toMatch(/3\.00.*3\.00/);
  });

  it('switches to Sub and updates the result', async () => {
    const user = userEvent.setup();
    render(VectorOpsPlayground);
    await user.click(screen.getByLabelText(/subtract/i));
    // a=(2,1), b=(1,2) → a - b = (1, -1)
    expect(screen.getByTestId('result').textContent).toMatch(/1\.00.*-1\.00/);
  });

  it('switches to Dot and shows a scalar', async () => {
    const user = userEvent.setup();
    render(VectorOpsPlayground);
    await user.click(screen.getByLabelText(/dot/i));
    // a=(2,1) · b=(1,2) = 4
    expect(screen.getByTestId('result-scalar').textContent).toMatch(/4\.00/);
  });

  it('switches to Scale and respects the k slider', async () => {
    const user = userEvent.setup();
    render(VectorOpsPlayground);
    await user.click(screen.getByLabelText(/scale/i));
    // default k = 1, a = (2, 1) → (2, 1)
    expect(screen.getByTestId('result').textContent).toMatch(/2\.00.*1\.00/);
    // change k to 2 via the number input fallback
    const kInput = screen.getByLabelText(/^k/i) as HTMLInputElement;
    await user.clear(kInput);
    await user.type(kInput, '2');
    expect(screen.getByTestId('result').textContent).toMatch(/4\.00.*2\.00/);
  });
});
```

- [ ] **Step 9.2:** Run, verify failing.

- [ ] **Step 9.3:** Implement `src/components/islands/VectorOpsPlayground.svelte`

```svelte
<script lang="ts">
  import { add, sub, scale, dot } from '../../lib/math/vec';

  type Op = 'add' | 'sub' | 'scale' | 'dot';

  let ax = $state(2);
  let ay = $state(1);
  let bx = $state(1);
  let by = $state(2);
  let op: Op = $state('add');
  let k = $state(1);

  const a = $derived([ax, ay]);
  const b = $derived([bx, by]);

  const result = $derived.by(() => {
    switch (op) {
      case 'add':
        return { kind: 'vec' as const, value: add(a, b) };
      case 'sub':
        return { kind: 'vec' as const, value: sub(a, b) };
      case 'scale':
        return { kind: 'vec' as const, value: scale(a, k) };
      case 'dot':
        return { kind: 'scalar' as const, value: dot(a, b) };
    }
  });

  const SIZE = 280;
  const CENTER = SIZE / 2;
  const SCALE = 25;
  function px(v: number) {
    return CENTER + v * SCALE;
  }
  function py(v: number) {
    return CENTER - v * SCALE;
  }
</script>

<div class="not-prose my-6 rounded-md border border-brand-100 p-4 dark:border-brand-900">
  <svg
    viewBox="0 0 {SIZE} {SIZE}"
    role="img"
    aria-label="Vector operations playground"
    class="mx-auto block h-72 w-72"
  >
    <line x1={CENTER} y1="0" x2={CENTER} y2={SIZE} stroke="currentColor" stroke-opacity="0.15" />
    <line x1="0" y1={CENTER} x2={SIZE} y2={CENTER} stroke="currentColor" stroke-opacity="0.15" />
    <!-- a in blue -->
    <line
      x1={CENTER}
      y1={CENTER}
      x2={px(ax)}
      y2={py(ay)}
      stroke="oklch(0.55 0.18 250)"
      stroke-width="2"
    />
    <!-- b in green -->
    <line
      x1={CENTER}
      y1={CENTER}
      x2={px(bx)}
      y2={py(by)}
      stroke="oklch(0.55 0.18 145)"
      stroke-width="2"
    />
    <!-- result vector in amber, only when result is a vector -->
    {#if result.kind === 'vec'}
      <line
        x1={CENTER}
        y1={CENTER}
        x2={px(result.value[0])}
        y2={py(result.value[1])}
        stroke="oklch(0.7 0.18 60)"
        stroke-width="2"
        stroke-dasharray="4 3"
      />
    {/if}
  </svg>

  <fieldset class="mt-4">
    <legend class="text-sm text-brand-500">Operation</legend>
    <div class="mt-1 flex flex-wrap gap-3 text-sm">
      <label><input type="radio" name="op" value="add" bind:group={op} /> Add (a + b)</label>
      <label><input type="radio" name="op" value="sub" bind:group={op} /> Subtract (a − b)</label>
      <label><input type="radio" name="op" value="scale" bind:group={op} /> Scale (k · a)</label>
      <label><input type="radio" name="op" value="dot" bind:group={op} /> Dot (a · b)</label>
    </div>
  </fieldset>

  <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
    <label class="flex items-center gap-2"
      >a.x <input
        type="number"
        min="-5"
        max="5"
        step="0.1"
        bind:value={ax}
        class="w-20 rounded border border-brand-300 bg-transparent px-2 py-1"
      /></label
    >
    <label class="flex items-center gap-2"
      >a.y <input
        type="number"
        min="-5"
        max="5"
        step="0.1"
        bind:value={ay}
        class="w-20 rounded border border-brand-300 bg-transparent px-2 py-1"
      /></label
    >
    <label class="flex items-center gap-2"
      >b.x <input
        type="number"
        min="-5"
        max="5"
        step="0.1"
        bind:value={bx}
        class="w-20 rounded border border-brand-300 bg-transparent px-2 py-1"
      /></label
    >
    <label class="flex items-center gap-2"
      >b.y <input
        type="number"
        min="-5"
        max="5"
        step="0.1"
        bind:value={by}
        class="w-20 rounded border border-brand-300 bg-transparent px-2 py-1"
      /></label
    >
    {#if op === 'scale'}
      <label class="col-span-2 flex items-center gap-2"
        >k
        <input type="range" min="-3" max="3" step="0.1" bind:value={k} class="flex-1" />
        <input
          type="number"
          min="-3"
          max="3"
          step="0.1"
          bind:value={k}
          class="w-20 rounded border border-brand-300 bg-transparent px-2 py-1"
          aria-label="k"
        />
      </label>
    {/if}
  </div>

  <dl class="mt-4 text-sm" aria-live="polite">
    {#if result.kind === 'vec'}
      <dt class="text-brand-500">Result vector</dt>
      <dd class="font-mono" data-testid="result">
        ({result.value[0].toFixed(2)}, {result.value[1].toFixed(2)})
      </dd>
    {:else}
      <dt class="text-brand-500">Dot product</dt>
      <dd class="font-mono" data-testid="result-scalar">{result.value.toFixed(2)}</dd>
    {/if}
  </dl>
</div>
```

- [ ] **Step 9.4:** Run, verify passing.

- [ ] **Step 9.5:** Commit

```bash
git add src/components/islands/VectorOpsPlayground.svelte src/components/islands/VectorOpsPlayground.test.ts
git commit -m "feat(island): add VectorOpsPlayground (add/sub/scale/dot)"
```

---

## Task 10: Topic 2 — Vector operations (MDX)

**Files:** `src/content/topics/th/02-vector-operations.mdx`, `src/content/topics/en/02-vector-operations.mdx`

- [ ] **Step 10.1:** Create EN MDX

```mdx
---
title: Vector operations
slug: vector-operations
group: math
order: 2
locale: en
summary: Adding, subtracting, scaling, and the dot product — the four moves vector databases use behind every search.
hasInteractive: true
interactiveComponent: VectorOpsPlayground
hasMath: false
---

import VectorOpsPlayground from '../../../components/islands/VectorOpsPlayground.svelte';

## Intuition

Once we have vectors, we want to combine them. Four operations come up over and over again in vector databases:

- **Add** (`a + b`): walk along `a`, then along `b`. The result lands at a new point.
- **Subtract** (`a − b`): the arrow that points from `b` to `a`. This is how we get a "direction of difference."
- **Scale** (`k · a`): make the arrow longer or shorter by a factor `k`. Negative `k` flips it around.
- **Dot product** (`a · b`): a single number that captures how much `a` and `b` "agree" in direction.

The dot product is the secret ingredient. When two vectors point the same way, the dot product is large and positive. When they're at right angles, it's zero. When they point opposite ways, it's negative. That's the whole basis of cosine similarity, which is the search algorithm under most semantic search engines.

## Try it

<VectorOpsPlayground client:visible />

Switch between operations. Notice how `a + b` lands at the same point regardless of which order you walk; how `a − b` is the same length whether you stand at `a` and look at `b`, or vice versa; and how the dot product becomes 0 the moment the two vectors are perpendicular.

## In the real world

Search engines compute dot products at a massive scale. To find "the 10 documents most similar to your query," the engine takes the query's vector and computes its dot product against every document vector, then sorts. Modern vector databases do this with optimized algorithms, but the operation underneath is still: dot product, sort, return top-k.

<TryYourself>
  Set `a = (2, 0)` and `b = (0, 2)`. Switch to Dot product. What does it read? Now rotate `b` toward
  `a` and watch the number climb.
</TryYourself>

<Takeaways>
  <Takeaway>
    Add and subtract walk you between vectors; scale makes them longer or shorter.
  </Takeaway>
  <Takeaway>
    The dot product is a single number that says "how aligned are these two vectors."
  </Takeaway>
  <Takeaway>
    Almost every vector-database search uses the dot product (or its cousin, cosine similarity).
  </Takeaway>
</Takeaways>
```

- [ ] **Step 10.2:** Create TH MDX

```mdx
---
title: การคำนวณเวกเตอร์
slug: vector-operations
group: math
order: 2
locale: th
summary: บวก ลบ คูณด้วยจำนวน และ dot product — สี่การคำนวณที่ฐานข้อมูลเวกเตอร์ใช้ตลอดเวลา
hasInteractive: true
interactiveComponent: VectorOpsPlayground
hasMath: false
---

import VectorOpsPlayground from '../../../components/islands/VectorOpsPlayground.svelte';

## ทำความเข้าใจ

เมื่อมีเวกเตอร์แล้ว สิ่งที่อยากทำต่อคือเอามารวมกัน การคำนวณ 4 อย่างจะปรากฏบ่อยมากในงานฐานข้อมูลเวกเตอร์:

- **บวก** (`a + b`): เดินตามทาง `a` แล้วต่อด้วย `b` ผลคือจุดใหม่
- **ลบ** (`a − b`): ลูกศรที่ชี้จาก `b` ไป `a` ใช้สำหรับวัด "ความต่างของทิศทาง"
- **คูณด้วยจำนวน** (`k · a`): ขยายหรือย่อเวกเตอร์ ถ้า `k` ติดลบ ลูกศรจะหันกลับด้าน
- **Dot product** (`a · b`): ตัวเลขเดียวที่บอกว่า `a` และ `b` "ไปทางเดียวกันแค่ไหน"

Dot product คือหัวใจของเรื่องนี้ ถ้าเวกเตอร์สองตัวชี้ไปทางเดียวกัน dot product จะเป็นบวกและมีค่ามาก ถ้าตั้งฉากกัน จะเป็น 0 ถ้าหันสวนทางกัน จะเป็นลบ ทั้งหมดนี้คือพื้นฐานของ cosine similarity ซึ่งเป็นอัลกอริทึมหลักของระบบค้นหาเชิงความหมาย

## ลองเล่นดู

<VectorOpsPlayground client:visible />

ลองสลับระหว่าง operation ดู สังเกตว่า `a + b` ลงเอยที่จุดเดียวกันไม่ว่าเดินเรียงลำดับไหน, `a − b` ยาวเท่ากันไม่ว่าจะวัดจากฝั่งไหน, และ dot product จะเป็น 0 พอดีตอนที่เวกเตอร์ทั้งสองตั้งฉากกัน

## ในโลกจริง

ระบบค้นหาคำนวณ dot product จำนวนมหาศาลทุกวินาที เวลาค้นหา "เอกสาร 10 อันที่ใกล้เคียงกับคำค้นมากที่สุด" ระบบจะเอาเวกเตอร์ของคำค้นไป dot กับเวกเตอร์ของเอกสารทุกอันแล้วเรียงลำดับ แม้จะมีเทคนิคเร่งความเร็ว แต่หัวใจยังคือ dot product, sort, return top-k

<TryYourself>
  ตั้ง `a = (2, 0)` และ `b = (0, 2)` แล้วเลือก Dot product ดูว่าได้เลขเท่าไร? ลองหมุน `b` ให้เข้าหา
  `a` แล้วสังเกตว่าเลขเปลี่ยนอย่างไร
</TryYourself>

<Takeaways>
  <Takeaway>บวกและลบใช้เดินระหว่างเวกเตอร์ การคูณด้วยจำนวนใช้ขยายหรือย่อ</Takeaway>
  <Takeaway>Dot product คือตัวเลขเดียวที่บอกว่าเวกเตอร์สองตัว "ไปทางเดียวกันแค่ไหน"</Takeaway>
  <Takeaway>
    การค้นหาในฐานข้อมูลเวกเตอร์เกือบทุกวิธี ใช้ dot product (หรือ cosine similarity) อยู่เบื้องหลัง
  </Takeaway>
</Takeaways>
```

If MDX-component imports for `<TryYourself>` / `<Takeaways>` / `<Takeaway>` were needed in Task 8, add the same imports here.

- [ ] **Step 10.3:** Build

```bash
pnpm build
```

Validator should now report `Topic validation passed (4 topics, 2 islands)`. The build should produce 8 pages (4 topics × TH/EN + 2 indexes + 2 404s).

- [ ] **Step 10.4:** Commit

```bash
git add src/content/topics/th/02-vector-operations.mdx src/content/topics/en/02-vector-operations.mdx
git commit -m "feat(content): add Topic 2 (vector operations) in TH and EN"
```

---

## Task 11: DistanceComparator island (TDD)

**Files:** `src/components/islands/DistanceComparator.svelte`, `src/components/islands/DistanceComparator.test.ts`

Two draggable points `p` and `q`. Live readouts of Euclidean, Manhattan, and Cosine similarity (treating the points as vectors from the origin).

- [ ] **Step 11.1:** Write failing tests in `src/components/islands/DistanceComparator.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import DistanceComparator from './DistanceComparator.svelte';

describe('DistanceComparator', () => {
  it('shows three metrics for the default points', () => {
    render(DistanceComparator);
    // defaults: p = (3, 0), q = (0, 4)
    // euclidean = 5, manhattan = 7, cosine sim = 0
    expect(screen.getByTestId('euclidean').textContent).toMatch(/5\.00/);
    expect(screen.getByTestId('manhattan').textContent).toMatch(/7\.00/);
    expect(screen.getByTestId('cosine').textContent).toMatch(/0\.00/);
  });

  it('updates all three metrics when p moves', async () => {
    const user = userEvent.setup();
    render(DistanceComparator);
    const px = screen.getByLabelText(/p\.x/i) as HTMLInputElement;
    await user.clear(px);
    await user.type(px, '0');
    // p = (0, 0), q = (0, 4) → all metrics: euclidean = 4, manhattan = 4, cosine = 0 (zero vec)
    expect(screen.getByTestId('euclidean').textContent).toMatch(/4\.00/);
    expect(screen.getByTestId('manhattan').textContent).toMatch(/4\.00/);
    expect(screen.getByTestId('cosine').textContent).toMatch(/0\.00/);
  });

  it('shows cosine = 1 when p and q point the same way', async () => {
    const user = userEvent.setup();
    render(DistanceComparator);
    const qx = screen.getByLabelText(/q\.x/i) as HTMLInputElement;
    const qy = screen.getByLabelText(/q\.y/i) as HTMLInputElement;
    await user.clear(qx);
    await user.type(qx, '6');
    await user.clear(qy);
    await user.type(qy, '0');
    // p = (3, 0), q = (6, 0) → same direction → cosine sim = 1
    expect(screen.getByTestId('cosine').textContent).toMatch(/1\.00/);
  });
});
```

- [ ] **Step 11.2:** Run, verify failing.

- [ ] **Step 11.3:** Implement `src/components/islands/DistanceComparator.svelte`

```svelte
<script lang="ts">
  import { euclidean, manhattan, cosineSimilarity } from '../../lib/math/metrics';

  let px_ = $state(3);
  let py_ = $state(0);
  let qx_ = $state(0);
  let qy_ = $state(4);

  const p = $derived([px_, py_]);
  const q = $derived([qx_, qy_]);

  const eDist = $derived(euclidean(p, q));
  const mDist = $derived(manhattan(p, q));
  const cSim = $derived(cosineSimilarity(p, q));

  const SIZE = 280;
  const CENTER = SIZE / 2;
  const SCALE = 25;
  function sx(v: number) {
    return CENTER + v * SCALE;
  }
  function sy(v: number) {
    return CENTER - v * SCALE;
  }
</script>

<div class="not-prose my-6 rounded-md border border-brand-100 p-4 dark:border-brand-900">
  <svg
    viewBox="0 0 {SIZE} {SIZE}"
    role="img"
    aria-label="Distance metric comparator"
    class="mx-auto block h-72 w-72"
  >
    <line x1={CENTER} y1="0" x2={CENTER} y2={SIZE} stroke="currentColor" stroke-opacity="0.15" />
    <line x1="0" y1={CENTER} x2={SIZE} y2={CENTER} stroke="currentColor" stroke-opacity="0.15" />
    <!-- Manhattan path (L-shape) -->
    <polyline
      points="{sx(px_)},{sy(py_)} {sx(qx_)},{sy(py_)} {sx(qx_)},{sy(qy_)}"
      fill="none"
      stroke="oklch(0.7 0.18 60)"
      stroke-dasharray="3 3"
      stroke-width="1.5"
    />
    <!-- Euclidean line -->
    <line
      x1={sx(px_)}
      y1={sy(py_)}
      x2={sx(qx_)}
      y2={sy(qy_)}
      stroke="oklch(0.55 0.18 250)"
      stroke-width="2"
    />
    <!-- Points -->
    <circle cx={sx(px_)} cy={sy(py_)} r="6" fill="oklch(0.55 0.18 250)" />
    <circle cx={sx(qx_)} cy={sy(qy_)} r="6" fill="oklch(0.55 0.18 145)" />
  </svg>

  <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
    <label class="flex items-center gap-2"
      >p.x <input
        type="number"
        min="-5"
        max="5"
        step="0.1"
        bind:value={px_}
        class="w-20 rounded border border-brand-300 bg-transparent px-2 py-1"
      /></label
    >
    <label class="flex items-center gap-2"
      >p.y <input
        type="number"
        min="-5"
        max="5"
        step="0.1"
        bind:value={py_}
        class="w-20 rounded border border-brand-300 bg-transparent px-2 py-1"
      /></label
    >
    <label class="flex items-center gap-2"
      >q.x <input
        type="number"
        min="-5"
        max="5"
        step="0.1"
        bind:value={qx_}
        class="w-20 rounded border border-brand-300 bg-transparent px-2 py-1"
      /></label
    >
    <label class="flex items-center gap-2"
      >q.y <input
        type="number"
        min="-5"
        max="5"
        step="0.1"
        bind:value={qy_}
        class="w-20 rounded border border-brand-300 bg-transparent px-2 py-1"
      /></label
    >
  </div>

  <dl class="mt-4 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm" aria-live="polite">
    <dt class="text-brand-500">Euclidean</dt>
    <dd class="font-mono" data-testid="euclidean">{eDist.toFixed(2)}</dd>
    <dt class="text-brand-500">Manhattan</dt>
    <dd class="font-mono" data-testid="manhattan">{mDist.toFixed(2)}</dd>
    <dt class="text-brand-500">Cosine sim.</dt>
    <dd class="font-mono" data-testid="cosine">{cSim.toFixed(2)}</dd>
  </dl>
</div>
```

- [ ] **Step 11.4:** Run, verify passing.

- [ ] **Step 11.5:** Commit

```bash
git add src/components/islands/DistanceComparator.svelte src/components/islands/DistanceComparator.test.ts
git commit -m "feat(island): add DistanceComparator (Euclidean / Manhattan / cosine sim.)"
```

---

## Task 12: Topic 3 — Distance & similarity (MDX)

**Files:** `src/content/topics/th/03-distance-similarity.mdx`, `src/content/topics/en/03-distance-similarity.mdx`

- [ ] **Step 12.1:** Create EN MDX

```mdx
---
title: Distance & similarity
slug: distance-similarity
group: math
order: 3
locale: en
summary: Three ways to ask "how close are these two things?" — and why most search engines pick one of them.
hasInteractive: true
interactiveComponent: DistanceComparator
hasMath: false
---

import DistanceComparator from '../../../components/islands/DistanceComparator.svelte';

## Intuition

There's more than one way to measure how far apart two points are. Three show up everywhere in vector databases:

- **Euclidean distance** — the straight-line distance, the one you'd measure with a ruler.
- **Manhattan distance** — the distance if you have to walk along city blocks: only along the axes, no diagonals.
- **Cosine similarity** — how much the two points point in the same direction (treating them as arrows from the origin). Returns 1 for identical direction, 0 for perpendicular, −1 for opposite.

The first two measure **how far** two points are. Cosine similarity measures **how aligned** they are. They're answering different questions, and which one matters depends on what your data is.

## Try it

<DistanceComparator client:visible />

Drag the points around. Notice that Euclidean and Manhattan agree about "near vs. far" but disagree about exactly how far. Now make the two points line up along a ray from the origin: Euclidean and Manhattan go up as one slides farther out, but cosine similarity stays at 1 — they're still pointing the same way.

## In the real world

For text, almost all production vector databases use **cosine similarity** (or its mathematically-equivalent normalized dot product). The reason: a longer document doesn't mean it's "more similar" — what matters is whether it's about the same topic. Cosine ignores length and asks only about direction, which is exactly what you want.

For other domains, the answer differs. Geographic search uses Euclidean (literal distance on a map). Some image-similarity systems use Manhattan because it's faster. Most vector databases let you pick.

<TryYourself>
  Set `p = (1, 1)` and `q = (3, 3)`. Euclidean and Manhattan both grow as the points spread, but
  cosine similarity stays at 1. Why?
</TryYourself>

<Takeaways>
  <Takeaway>Euclidean and Manhattan ask "how far apart" — they care about distance.</Takeaway>
  <Takeaway>Cosine similarity asks "how aligned" — it ignores length entirely.</Takeaway>
  <Takeaway>
    Text-search vector DBs almost always use cosine; pick deliberately for other domains.
  </Takeaway>
</Takeaways>
```

- [ ] **Step 12.2:** Create TH MDX

```mdx
---
title: ระยะห่างและความคล้าย
slug: distance-similarity
group: math
order: 3
locale: th
summary: สามวิธีในการถามว่า "สองสิ่งนี้อยู่ใกล้กันแค่ไหน" — และทำไมระบบค้นหาส่วนใหญ่เลือกใช้แค่วิธีเดียว
hasInteractive: true
interactiveComponent: DistanceComparator
hasMath: false
---

import DistanceComparator from '../../../components/islands/DistanceComparator.svelte';

## ทำความเข้าใจ

มีหลายวิธีที่จะวัดว่าจุดสองจุดอยู่ห่างกันแค่ไหน วิธีที่พบบ่อยในฐานข้อมูลเวกเตอร์มี 3 แบบ:

- **Euclidean distance** — ระยะห่างเส้นตรง วัดได้ด้วยไม้บรรทัด
- **Manhattan distance** — ระยะที่ต้องเดินตามถนนในเมืองที่ตัดเป็นบล็อก เดินขึ้นลงซ้ายขวาเท่านั้น ไม่มีทางเฉียง
- **Cosine similarity** — สองจุดชี้ไปทางเดียวกันแค่ไหน (มองเป็นลูกศรจากจุดกำเนิด) ค่า 1 = ทิศเดียวกันสนิท, 0 = ตั้งฉาก, −1 = สวนทาง

สองตัวแรกวัด **ความห่าง** ส่วน Cosine วัด **ความตรงทิศกัน** เป็นคำถามคนละแบบ และเลือกใช้ตัวไหนขึ้นอยู่กับว่าข้อมูลของเราเป็นอะไร

## ลองเล่นดู

<DistanceComparator client:visible />

ลองลากจุดไปมา จะเห็นว่า Euclidean และ Manhattan ไม่เถียงกันเรื่อง "ใกล้/ไกล" แต่ตัวเลขจะต่างกัน ลองให้สองจุดอยู่บนแนวเส้นตรงเดียวกันจากจุดกำเนิด: Euclidean และ Manhattan เพิ่มขึ้นเมื่อเลื่อนจุดออกไป แต่ cosine ยังเป็น 1 — เพราะยังชี้ไปทางเดียวกันอยู่

## ในโลกจริง

สำหรับข้อความ ฐานข้อมูลเวกเตอร์ในโปรดักชั่นเกือบทั้งหมดใช้ **cosine similarity** (หรือ normalized dot product ที่ค่าทางคณิตศาสตร์เท่ากัน) เหตุผล: เอกสารที่ยาวกว่าไม่ได้แปลว่า "คล้ายกว่า" สิ่งที่สำคัญคือเป็นเรื่องเดียวกันหรือเปล่า cosine ไม่สนเรื่องความยาว สนแค่ทิศทาง — ซึ่งคือสิ่งที่เราต้องการ

ในโดเมนอื่นเลือกต่างกัน: การค้นหาทางภูมิศาสตร์ใช้ Euclidean (ระยะจริงบนแผนที่) ระบบเปรียบเทียบรูปบางตัวใช้ Manhattan เพราะเร็วกว่า ฐานข้อมูลเวกเตอร์ส่วนใหญ่ให้เราเลือกได้

<TryYourself>
  ตั้ง `p = (1, 1)` และ `q = (3, 3)` Euclidean และ Manhattan เพิ่มขึ้นเมื่อจุดห่างกันมากขึ้น แต่
  cosine ยังเป็น 1 ทำไม?
</TryYourself>

<Takeaways>
  <Takeaway>Euclidean และ Manhattan ตอบคำถาม "ห่างกันแค่ไหน"</Takeaway>
  <Takeaway>Cosine similarity ตอบคำถาม "ตรงทิศกันแค่ไหน" โดยไม่สนความยาว</Takeaway>
  <Takeaway>การค้นหาข้อความใช้ cosine เกือบทั้งหมด สำหรับโดเมนอื่นต้องเลือกอย่างมีเหตุผล</Takeaway>
</Takeaways>
```

- [ ] **Step 12.3:** Build, verify validator says `4 topics → 6 topics, 3 islands`. Wait — at this point, after Topic 3 is added, the count is **6 topics (3 slugs × 2 locales), 3 islands**.

```bash
pnpm build
```

- [ ] **Step 12.4:** Commit

```bash
git add src/content/topics/th/03-distance-similarity.mdx src/content/topics/en/03-distance-similarity.mdx
git commit -m "feat(content): add Topic 3 (distance & similarity) in TH and EN"
```

---

## Task 13: Topic 4 — Norms (MDX, reuses VectorPlayground)

**Files:** `src/content/topics/th/04-norms.mdx`, `src/content/topics/en/04-norms.mdx`

No new island. Reuses `VectorPlayground` from Topic 1 — the same widget, but the page focuses on the L1 vs L2 distinction shown in the readouts.

- [ ] **Step 13.1:** Create EN MDX

```mdx
---
title: Norms in plain English
slug: norms
group: math
order: 4
locale: en
summary: L1 vs L2 — two ways to measure a vector's "size," and why your search engine cares.
hasInteractive: true
interactiveComponent: VectorPlayground
hasMath: false
---

import VectorPlayground from '../../../components/islands/VectorPlayground.svelte';

## Intuition

We've been calling the length of a vector its "magnitude." There are actually multiple ways to measure that length, called **norms**. Two are common:

- **L2 norm** (Euclidean): $\sqrt{x_1^2 + x_2^2 + \dots}$. The familiar straight-line length.
- **L1 norm** (Manhattan): $|x_1| + |x_2| + \dots$. Sum of the absolute values of each component.

If you've already met Euclidean and Manhattan distances, these are the same idea, just measuring a single vector's length instead of the distance between two points.

The math difference is small. The behavior difference is real:

- **L2** rewards spreading the magnitude across many components evenly. A vector with many small components has a smaller L2 than a vector with one huge component, even if both have the same L1.
- **L1** doesn't care how spread-out the components are — only their total absolute size.

## Try it

<VectorPlayground client:visible />

Same playground as before, but now compare the two readouts. Set `(x, y) = (3, 0)`: both norms are 3. Set `(x, y) = (3, 3)`: L1 is 6, L2 is about 4.24. The bigger the spread, the bigger the gap between them.

## In the real world

Vector databases mostly use **L2** because it pairs naturally with cosine similarity (cosine is just the dot product divided by both vectors' L2 norms). But L1 shows up in:

- **Compression / sparsity**: L1-based math tends to drive components to zero, which is useful for compressing high-dimensional vectors.
- **Robustness**: L1 is less sensitive to outliers than L2, because it doesn't square the values.

You'll see "L2-normalized embeddings" mentioned often. That just means: divide every embedding by its L2 norm so all of them have length 1. Cosine similarity on L2-normalized vectors equals their dot product — the cheapest possible similarity metric.

<TryYourself>
  Find a vector where L1 = L2. (Hint: at least one component must be exactly zero.)
</TryYourself>

<Takeaways>
  <Takeaway>
    A norm is a way to measure a vector's "size." L1 and L2 are the two everyday ones.
  </Takeaway>
  <Takeaway>L2 = straight-line length. L1 = sum of absolute components.</Takeaway>
  <Takeaway>
    L2-normalized embeddings + dot product = the standard recipe in production vector search.
  </Takeaway>
</Takeaways>
```

Note: `hasMath: false` on this topic even though it has KaTeX expressions, because globally in M1 KaTeX CSS is loaded everywhere. We'll narrow this in M5.

- [ ] **Step 13.2:** Create TH MDX

```mdx
---
title: Norm แบบเข้าใจง่าย
slug: norms
group: math
order: 4
locale: th
summary: L1 กับ L2 — สองวิธีวัด "ขนาด" ของเวกเตอร์ และเหตุผลที่ระบบค้นหาเลือกใช้แต่ละแบบ
hasInteractive: true
interactiveComponent: VectorPlayground
hasMath: false
---

import VectorPlayground from '../../../components/islands/VectorPlayground.svelte';

## ทำความเข้าใจ

ที่ผ่านมาเราเรียกความยาวของเวกเตอร์ว่า "magnitude" ซึ่งจริงๆ แล้ววัดได้หลายแบบ เรียกว่า **norm** ที่พบบ่อยมีสองแบบ:

- **L2 norm** (Euclidean): $\sqrt{x_1^2 + x_2^2 + \dots}$ ความยาวเส้นตรงที่คุ้นเคย
- **L1 norm** (Manhattan): $|x_1| + |x_2| + \dots$ ผลรวมของค่าสัมบูรณ์ของแต่ละองค์ประกอบ

ถ้าเคยเจอ Euclidean และ Manhattan distance มาแล้ว นี่คือแนวคิดเดียวกัน — แต่วัดความยาวของเวกเตอร์ตัวเดียวแทนที่จะวัดระยะระหว่างจุดสองจุด

ความต่างทางคณิตศาสตร์เล็กน้อย แต่พฤติกรรมต่างกันจริง:

- **L2** ชอบเวกเตอร์ที่กระจายขนาดเท่าๆ กันในหลายองค์ประกอบ เวกเตอร์ที่มีหลายๆ องค์ประกอบเล็กๆ จะมี L2 น้อยกว่าเวกเตอร์ที่มีองค์ประกอบเดียวใหญ่ๆ แม้ L1 จะเท่ากัน
- **L1** ไม่สนเรื่องการกระจาย สนแต่ผลรวมของค่าสัมบูรณ์เท่านั้น

## ลองเล่นดู

<VectorPlayground client:visible />

playground เดิม แต่ลองเทียบสองค่าในชาร์ทดู ตั้ง `(x, y) = (3, 0)`: ทั้งสอง norm เท่ากับ 3 ตั้ง `(x, y) = (3, 3)`: L1 เป็น 6, L2 ประมาณ 4.24 ยิ่งกระจายมาก ช่องว่างระหว่างสองค่าก็ยิ่งใหญ่

## ในโลกจริง

ฐานข้อมูลเวกเตอร์ส่วนใหญ่ใช้ **L2** เพราะเข้าคู่กับ cosine similarity ได้ลงตัว (cosine คือ dot product หารด้วย L2 norm ของทั้งสองตัว) แต่ L1 ยังถูกใช้ในงาน:

- **การบีบอัด / sparsity**: คณิตศาสตร์ที่ใช้ L1 มักผลักให้องค์ประกอบหลายตัวเป็นศูนย์ ใช้บีบอัดเวกเตอร์มิติสูงได้ดี
- **ความทนทานต่อค่าผิดปกติ**: L1 ไม่ยกกำลังสองค่า จึงไม่ถูกค่าผิดปกติเด่นๆ ดึงเฉ

คำว่า "L2-normalized embeddings" เจอบ่อย หมายความว่า: หาร embedding ทุกตัวด้วย L2 norm ของมัน เพื่อให้ทุกตัวมีความยาว 1 พอดี เมื่อ embedding มี L2 = 1 แล้ว cosine similarity ก็เท่ากับ dot product ตรงๆ — เป็นวิธีคำนวณความคล้ายที่ถูกที่สุด

<TryYourself>
  ลองหาเวกเตอร์ที่ L1 = L2 ดูสิ (Hint: ต้องมีองค์ประกอบที่เป็น 0 อย่างน้อยหนึ่งตัว)
</TryYourself>

<Takeaways>
  <Takeaway>Norm คือวิธีวัด "ขนาด" ของเวกเตอร์ L1 และ L2 เป็นสองตัวที่เจอบ่อย</Takeaway>
  <Takeaway>L2 = ความยาวเส้นตรง, L1 = ผลรวมของค่าสัมบูรณ์</Takeaway>
  <Takeaway>L2-normalized embeddings + dot product = สูตรมาตรฐานในระบบค้นหาเวกเตอร์</Takeaway>
</Takeaways>
```

- [ ] **Step 13.3:** Build

```bash
pnpm build
```

Validator should now report `8 topics, 3 islands`.

- [ ] **Step 13.4:** Commit

```bash
git add src/content/topics/th/04-norms.mdx src/content/topics/en/04-norms.mdx
git commit -m "feat(content): add Topic 4 (norms) in TH and EN"
```

---

## Task 14: HighDimIntuition island (TDD)

**Files:** `src/components/islands/HighDimIntuition.svelte`, `src/components/islands/HighDimIntuition.test.ts`

Slider for dimension (2..100). Generates `N=500` random unit vectors at the chosen dim, computes pairwise cosine similarities, and shows their distribution as a simple histogram. The "aha" moment: as `dim` rises, the distribution concentrates around 0.

- [ ] **Step 14.1:** Write failing tests

```ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import HighDimIntuition from './HighDimIntuition.svelte';

describe('HighDimIntuition', () => {
  it('renders a dimension slider with default 2', () => {
    render(HighDimIntuition);
    const slider = screen.getByLabelText(/dimension/i) as HTMLInputElement;
    expect(slider).toBeInTheDocument();
    expect(slider.value).toBe('2');
  });

  it('renders a histogram with the expected number of bins', () => {
    render(HighDimIntuition);
    const bins = screen.getAllByTestId('histogram-bin');
    // We use 21 bins covering [-1, 1] in 0.1-wide buckets.
    expect(bins.length).toBe(21);
  });

  it('shows the mean cosine similarity readout updating as dim rises', async () => {
    const user = userEvent.setup();
    render(HighDimIntuition);
    const slider = screen.getByLabelText(/dimension/i) as HTMLInputElement;
    // Use the number-input alias to set a high dim deterministically
    const numInput = screen.getByLabelText(/^d$/i) as HTMLInputElement;
    await user.clear(numInput);
    await user.type(numInput, '100');
    // At dim=100, mean cosine similarity should be very close to 0.
    const mean = parseFloat(
      screen.getByTestId('mean-cosine').textContent!.replace(/[^-0-9.]/g, ''),
    );
    expect(Math.abs(mean)).toBeLessThan(0.05);
  });
});
```

- [ ] **Step 14.2:** Run, verify failing.

- [ ] **Step 14.3:** Implement `src/components/islands/HighDimIntuition.svelte`

```svelte
<script lang="ts">
  import { mulberry32, randomUnitVectors } from '../../lib/math/random';
  import { dot } from '../../lib/math/vec';

  const N = 500; // pairs sampled from N(N-1)/2; we'll cap this
  const PAIRS = 1000;
  const SEED = 42;
  const BINS = 21; // bins of width 0.1 covering [-1.05, 1.05]

  let dim = $state(2);

  const stats = $derived.by(() => {
    const rng = mulberry32(SEED);
    const vecs = randomUnitVectors(N, dim, rng);
    const sims: number[] = [];
    // Sample PAIRS random pairs (instead of all N(N-1)/2)
    const pairRng = mulberry32(SEED + 1);
    for (let k = 0; k < PAIRS; k++) {
      const i = Math.floor(pairRng() * N);
      let j = Math.floor(pairRng() * N);
      if (j === i) j = (j + 1) % N;
      sims.push(dot(vecs[i], vecs[j])); // unit vecs → dot = cosine sim
    }
    const counts = new Array(BINS).fill(0);
    for (const s of sims) {
      const idx = Math.min(BINS - 1, Math.max(0, Math.floor(((s + 1) / 2) * BINS)));
      counts[idx]++;
    }
    const max = Math.max(...counts, 1);
    const mean = sims.reduce((a, b) => a + b, 0) / sims.length;
    return { counts, max, mean };
  });

  const SVG_W = 320;
  const SVG_H = 160;
  const BAR_W = SVG_W / BINS;
</script>

<div class="not-prose my-6 rounded-md border border-brand-100 p-4 dark:border-brand-900">
  <svg
    viewBox="0 0 {SVG_W} {SVG_H}"
    role="img"
    aria-label="Distribution of pairwise cosine similarities at dim={dim}"
    class="mx-auto block"
  >
    {#each stats.counts as count, i}
      <rect
        x={i * BAR_W}
        y={SVG_H - (count / stats.max) * SVG_H}
        width={BAR_W - 1}
        height={(count / stats.max) * SVG_H}
        fill="oklch(0.55 0.18 250)"
        data-testid="histogram-bin"
      />
    {/each}
    <line
      x1="0"
      y1={SVG_H - 1}
      x2={SVG_W}
      y2={SVG_H - 1}
      stroke="currentColor"
      stroke-opacity="0.4"
    />
    <line
      x1={SVG_W / 2}
      y1="0"
      x2={SVG_W / 2}
      y2={SVG_H}
      stroke="currentColor"
      stroke-opacity="0.2"
      stroke-dasharray="2 3"
    />
  </svg>

  <div class="mt-4 grid grid-cols-[max-content_1fr_max-content] items-center gap-3 text-sm">
    <label for="dim-slider">Dimension</label>
    <input id="dim-slider" type="range" min="2" max="100" step="1" bind:value={dim} />
    <input
      type="number"
      min="2"
      max="100"
      step="1"
      bind:value={dim}
      class="w-16 rounded border border-brand-300 bg-transparent px-2 py-1"
      aria-label="d"
    />
  </div>

  <dl class="mt-3 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm" aria-live="polite">
    <dt class="text-brand-500">Mean cosine sim.</dt>
    <dd class="font-mono" data-testid="mean-cosine">{stats.mean.toFixed(3)}</dd>
  </dl>

  <p class="mt-2 text-xs text-brand-500">
    {PAIRS} random pairs of unit vectors at this dimension. Watch the histogram concentrate around 0 as
    dimension rises.
  </p>
</div>
```

- [ ] **Step 14.4:** Run, verify passing.

The high-dim test (`Math.abs(mean) < 0.05` at dim=100) is statistically reliable: mean of cosine sim. for random unit vectors converges to 0, and with 1000 pairs the standard error is ~1/sqrt(100·1000) ≈ 0.003. The 0.05 threshold gives plenty of margin.

- [ ] **Step 14.5:** Commit

```bash
git add src/components/islands/HighDimIntuition.svelte src/components/islands/HighDimIntuition.test.ts
git commit -m "feat(island): add HighDimIntuition (cosine-sim histogram across dim 2..100)"
```

---

## Task 15: Topic 5 — High-dimensional intuition (MDX)

**Files:** `src/content/topics/th/05-high-dimensional.mdx`, `src/content/topics/en/05-high-dimensional.mdx`

- [ ] **Step 15.1:** Create EN MDX

```mdx
---
title: High-dimensional intuition
slug: high-dimensional
group: math
order: 5
locale: en
summary: In 2D, "random pair of arrows" can point any way. In 768D, almost every pair is nearly perpendicular. That's the foundation of vector search.
hasInteractive: true
interactiveComponent: HighDimIntuition
hasMath: false
---

import HighDimIntuition from '../../../components/islands/HighDimIntuition.svelte';

## Intuition

Up to now, we've been working in 2D — flat paper. Vector databases work in **hundreds or thousands of dimensions**. The math doesn't change, but our intuition completely fails.

Here's the fact that breaks intuition: pick two random unit vectors in 2D. Their cosine similarity could be anything between −1 and 1, with a flat-ish distribution. Pick two random unit vectors in 768 dimensions. Their cosine similarity is almost certainly between −0.05 and 0.05. **Almost every pair of high-dimensional vectors is nearly perpendicular.**

This is sometimes called the **curse of dimensionality**, but it's also a blessing for search. If random vectors are nearly perpendicular, then a vector that has a meaningful cosine similarity to your query — say 0.3 or 0.7 — is genuinely related, not a coincidence. That's what lets a vector database surface the right document out of millions: in high dimensions, real similarity stands out from noise.

## Try it

<HighDimIntuition client:visible />

Slide the dimension up. At dim 2 the histogram is wide. By dim 10 it's already narrowing. By dim 100 it's a tight spike around zero.

## In the real world

Embedding models like OpenAI's `text-embedding-3-small` produce 1536-dimensional vectors. Sentence-Transformers' `all-MiniLM-L6-v2` produces 384-dim. Both rely on the same property you just observed: in those dimensions, two unrelated sentences will have cosine similarity essentially 0, while two paraphrases land at 0.7+. The signal-to-noise ratio is what makes search work.

This is also why you can't intuitively "draw" a 768-dim space in 2D and expect anything meaningful. Projections compress, and most of the structure is lost. Always reason about high-dim spaces through their statistics, not their pictures.

<TryYourself>
  At dim = 100, the histogram is so concentrated that random vectors are essentially never
  "similar." A cosine similarity of 0.5 would be extraordinary. What does this imply about how rare
  a "good match" is in a real vector DB?
</TryYourself>

<Takeaways>
  <Takeaway>
    In high dimensions, random unit vectors are nearly perpendicular almost always.
  </Takeaway>
  <Takeaway>
    That's why a cosine of 0.3+ in 768D is a strong signal: random vectors don't accidentally hit
    it.
  </Takeaway>
  <Takeaway>
    Don't trust your low-dim intuition for high-dim spaces. Reason in statistics, not in pictures.
  </Takeaway>
</Takeaways>
```

- [ ] **Step 15.2:** Create TH MDX

```mdx
---
title: สัญชาตญาณในมิติสูง
slug: high-dimensional
group: math
order: 5
locale: th
summary: ใน 2 มิติ ลูกศรสองอันสุ่มชี้ไปทางไหนก็ได้ ใน 768 มิติ เกือบทุกคู่ตั้งฉากกันแทบสนิท นี่คือพื้นฐานของการค้นหาเวกเตอร์
hasInteractive: true
interactiveComponent: HighDimIntuition
hasMath: false
---

import HighDimIntuition from '../../../components/islands/HighDimIntuition.svelte';

## ทำความเข้าใจ

ที่ผ่านมาเราอยู่ใน 2 มิติบนกระดาษ ฐานข้อมูลเวกเตอร์ทำงานใน **หลายร้อยถึงหลายพันมิติ** คณิตศาสตร์เหมือนเดิม แต่สัญชาตญาณของเรา "พัง" สนิท

ข้อเท็จจริงที่หักล้างสัญชาตญาณ: สุ่มเวกเตอร์หน่วยสองตัวใน 2 มิติ cosine similarity จะอยู่ระหว่าง −1 ถึง 1 กระจายกว้างๆ สุ่มเวกเตอร์หน่วยสองตัวใน 768 มิติ cosine similarity เกือบทุกครั้งจะอยู่ระหว่าง −0.05 ถึง 0.05 — **เวกเตอร์มิติสูงสุ่มสองตัวเกือบจะตั้งฉากกันเสมอ**

ปรากฏการณ์นี้เรียกว่า **curse of dimensionality** บางที แต่สำหรับการค้นหามันคือพรอย่างหนึ่ง: ถ้าเวกเตอร์สุ่มตั้งฉากกันเป็นปกติ คู่ที่ cosine similarity = 0.3 หรือ 0.7 จึงไม่ใช่เรื่องบังเอิญ แต่ "เกี่ยวข้องกันจริงๆ" นี่คือสิ่งที่ทำให้ฐานข้อมูลเวกเตอร์ค้นเอกสารที่ใช่จากเอกสารหลายล้านได้ — สัญญาณจริงเด่นชัดออกจาก noise

## ลองเล่นดู

<HighDimIntuition client:visible />

เลื่อน slider ของ dimension ขึ้น ที่ dim = 2 histogram กว้าง ที่ dim = 10 เริ่มแคบลง ที่ dim = 100 บีบเป็น spike แคบๆ รอบศูนย์

## ในโลกจริง

โมเดล embedding อย่าง OpenAI `text-embedding-3-small` ให้เวกเตอร์ 1536 มิติ Sentence-Transformers `all-MiniLM-L6-v2` ให้ 384 มิติ ทั้งคู่อาศัยคุณสมบัตินี้ที่เพิ่งเห็น: ในมิติเหล่านั้น ประโยคที่ไม่เกี่ยวข้องกัน cosine similarity จะใกล้ 0 ส่วนประโยคที่ paraphrase กันจะอยู่ที่ 0.7 ขึ้นไป ความต่างของสัญญาณกับ noise นี่แหละทำให้การค้นหาทำงานได้

นี่คือเหตุผลที่เรา "วาด" 768 มิติบน 2 มิติ ไม่ได้แล้วได้อะไรที่มีความหมาย การฉายลงต่ำมิติทำลายโครงสร้างส่วนใหญ่ทิ้ง สำหรับมิติสูง ต้องคิดผ่านสถิติ ไม่ใช่ภาพ

<TryYourself>
  ที่ dim = 100 histogram บีบแคบจนเวกเตอร์สุ่มแทบไม่มีทางใกล้กัน cosine = 0.5 ถือว่าผิดปกติมาก
  สิ่งนี้บอกเราว่าอะไรเกี่ยวกับ "match ที่ดี" ในฐานข้อมูลเวกเตอร์จริง?
</TryYourself>

<Takeaways>
  <Takeaway>ในมิติสูง เวกเตอร์หน่วยสุ่มสองตัวเกือบจะตั้งฉากกันเสมอ</Takeaway>
  <Takeaway>
    นั่นคือเหตุผลที่ cosine 0.3+ ใน 768 มิติคือสัญญาณที่หนักแน่น:
    ความบังเอิญไม่มีทางทำให้ได้ขนาดนั้น
  </Takeaway>
  <Takeaway>อย่าเชื่อสัญชาตญาณจากมิติต่ำในมิติสูง คิดผ่านสถิติ ไม่ใช่ภาพ</Takeaway>
</Takeaways>
```

- [ ] **Step 15.3:** Build

```bash
pnpm build
```

Validator should report `10 topics, 4 islands`. The site now has 12 pages (5 topics × TH/EN + 2 indexes).

- [ ] **Step 15.4:** Commit

```bash
git add src/content/topics/th/05-high-dimensional.mdx src/content/topics/en/05-high-dimensional.mdx
git commit -m "feat(content): add Topic 5 (high-dimensional intuition) in TH and EN"
```

---

## Task 16: Vitest workspace split (M1 follow-up #3)

**Files:** `vitest.config.ts` (delete or convert), `vitest.workspace.ts` (new), `tsconfig.json`

The current `vitest.config.ts` sets `resolve.conditions: ['browser']` globally. This is needed for Svelte 5 component tests (mount via jsdom) but breaks Node-side tests. Phase 7 (next task) needs a Node-side integration test, so split now.

- [ ] **Step 16.1:** Create `vitest.workspace.ts`

```ts
import { defineWorkspace } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineWorkspace([
  // Browser-side tests (Svelte components and any DOM-touching code)
  {
    extends: './vitest.config.ts',
    plugins: [svelte({ hot: false })],
    test: {
      name: 'browser',
      environment: 'jsdom',
      globals: true,
      include: [
        'src/components/**/*.test.ts',
        'src/lib/**/*.test.ts', // pure JS works fine in jsdom
      ],
      setupFiles: ['./vitest.setup.ts'],
      passWithNoTests: true,
    },
    resolve: { conditions: ['browser'] },
  },
  // Node-side tests (integrations, scripts, anything that uses node:fs)
  {
    extends: './vitest.config.ts',
    test: {
      name: 'node',
      environment: 'node',
      globals: true,
      include: ['src/integrations/**/*.test.ts', 'scripts/**/*.test.ts'],
      passWithNoTests: true,
    },
  },
]);
```

- [ ] **Step 16.2:** Trim `vitest.config.ts` to a base config (no `resolve.conditions`, no env)

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true,
  },
});
```

The workspace config inherits from this base.

- [ ] **Step 16.3:** Verify

```bash
pnpm test
```

Expected: both projects run; both pass. The output should show two project headers (`browser` and `node`), with the existing 29-ish browser tests + 0 node tests.

If the workspace doesn't load (e.g., Vitest 4.x changed API), check the Vitest changelog. Vitest 4 deprecates `defineWorkspace` in favor of `projects` in the main config — adapt by moving the array into `vitest.config.ts` under a `projects` key.

- [ ] **Step 16.4:** Commit

```bash
git add vitest.workspace.ts vitest.config.ts
git commit -m "test: split vitest into browser (jsdom + Svelte) and node projects

The browser condition in resolve.conditions was applied globally,
which would break Node-side imports (node:fs/promises) in upcoming
integration tests. Splitting per project so Svelte components still
mount in jsdom and integration tests run in Node."
```

---

## Task 17: Fixture-based test for the validate-topics integration (M1 follow-up #2)

**Files:** `src/integrations/validate-topics.test.ts`

The validator's pure function is well-tested, but the file-loading wrapper (`listTopicFrontmatter`) isn't. Add a fixture-based test in the new `node` project.

- [ ] **Step 17.1:** Refactor the integration to expose its internal helpers

The current `validateTopicsIntegration()` keeps `listTopicFrontmatter` and `listIslandComponents` as module-private functions. Export them so they can be tested directly.

In `src/integrations/validate-topics.ts`, add `export` to both helper functions:

```diff
-async function listIslandComponents(srcRoot: URL): Promise<string[]> {
+export async function listIslandComponents(srcRoot: URL): Promise<string[]> {
```

```diff
-async function listTopicFrontmatter(srcRoot: URL): Promise<ValidatableTopic[]> {
+export async function listTopicFrontmatter(srcRoot: URL): Promise<ValidatableTopic[]> {
```

- [ ] **Step 17.2:** Write the test

Create `src/integrations/validate-topics.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listTopicFrontmatter, listIslandComponents } from './validate-topics';

let workDir: string;

beforeAll(async () => {
  workDir = await mkdtemp(join(tmpdir(), 'lvdb-fixture-'));
  await mkdir(join(workDir, 'src', 'content', 'topics', 'th'), { recursive: true });
  await mkdir(join(workDir, 'src', 'content', 'topics', 'en'), { recursive: true });
  await mkdir(join(workDir, 'src', 'components', 'islands'), { recursive: true });
});

afterAll(async () => {
  await rm(workDir, { recursive: true, force: true });
});

function srcRoot(): URL {
  return new URL('./src/', `file://${workDir}/`);
}

async function writeTopic(locale: 'th' | 'en', file: string, fm: Record<string, unknown>) {
  const yaml = Object.entries(fm)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? `"${v}"` : v}`)
    .join('\n');
  await writeFile(
    join(workDir, 'src', 'content', 'topics', locale, file),
    `---\n${yaml}\n---\nbody\n`,
  );
}

describe('listTopicFrontmatter', () => {
  it('returns nothing when topic dirs are empty', async () => {
    const result = await listTopicFrontmatter(srcRoot());
    expect(result).toEqual([]);
  });

  it('reads slug, locale, order, and interactiveComponent from frontmatter', async () => {
    await writeTopic('th', '01-vector.mdx', {
      slug: 'vector',
      order: 1,
      interactiveComponent: 'VectorPlayground',
    });
    await writeTopic('en', '01-vector.mdx', {
      slug: 'vector',
      order: 1,
      interactiveComponent: 'VectorPlayground',
    });
    const result = await listTopicFrontmatter(srcRoot());
    expect(result).toHaveLength(2);
    expect(result.find((t) => t.locale === 'th')).toMatchObject({
      slug: 'vector',
      order: 1,
      interactiveComponent: 'VectorPlayground',
    });
  });

  it('skips non-MDX files in the topics directory', async () => {
    await writeFile(join(workDir, 'src', 'content', 'topics', 'th', 'README.md'), '# notes');
    const result = await listTopicFrontmatter(srcRoot());
    // Still 2 (the .md file is ignored).
    expect(result).toHaveLength(2);
  });
});

describe('listIslandComponents', () => {
  it('returns empty when the islands dir is empty', async () => {
    const result = await listIslandComponents(srcRoot());
    expect(result).toEqual([]);
  });

  it('returns names without the .svelte extension', async () => {
    await writeFile(join(workDir, 'src', 'components', 'islands', 'Foo.svelte'), '');
    await writeFile(join(workDir, 'src', 'components', 'islands', 'Bar.svelte'), '');
    await writeFile(join(workDir, 'src', 'components', 'islands', '.gitkeep'), '');
    const result = (await listIslandComponents(srcRoot())).sort();
    expect(result).toEqual(['Bar', 'Foo']);
  });

  it('returns empty when the islands dir does not exist', async () => {
    const otherDir = await mkdtemp(join(tmpdir(), 'lvdb-no-islands-'));
    try {
      const result = await listIslandComponents(new URL('./src/', `file://${otherDir}/`));
      expect(result).toEqual([]);
    } finally {
      await rm(otherDir, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 17.3:** Run the test

```bash
pnpm test
```

Expected: the `node` project picks up the new test and runs it. All assertions green.

If `pnpm test` runs only the browser project (Vitest didn't recognize the workspace), check the workspace file syntax. As a fallback, run `pnpm vitest run --project node` to verify the node project alone, then debug the workspace integration.

- [ ] **Step 17.4:** Commit

```bash
git add src/integrations/validate-topics.ts src/integrations/validate-topics.test.ts
git commit -m "test(integrations): add fixture-based test for validate-topics file loading

Exercises listTopicFrontmatter and listIslandComponents against tmpdir
fixtures. Closes the gap left by M1: the pure validator was unit-tested
but the file-system reading layer wasn't."
```

---

## Task 18: Final M2 verification

**Files:** none

- [ ] **Step 18.1:** Full pipeline

```bash
pnpm format:check && pnpm typecheck && pnpm test && pnpm build
```

Expected:

- `format:check` clean
- `typecheck` 0 errors
- `test` — both projects (browser + node), all green. Approximate counts:
  - browser: 29 (M1) + 7 (vec) + 8 (metrics) + 8 (random) + 5 (VectorPlayground) + 5 (VectorOpsPlayground) + 3 (DistanceComparator) + 3 (HighDimIntuition) ≈ 68 tests
  - node: 6 tests (validate-topics integration)
- `build` produces 12 pages and reports `Topic validation passed (10 topics, 4 islands)`

- [ ] **Step 18.2:** Visual smoke (manual)

```bash
pnpm dev
```

Visit each page in TH and EN. Confirm:

- Sidebar shows all five Math foundations topics, current page highlighted
- Each topic page renders its island below the "Try it" heading and the island responds to input
- Prev/Next nav links between topics in order
- LangSwitch flips locale and preserves slug

Stop the dev server.

---

## Verification checklist (run before declaring M2 done)

- [ ] `pnpm format:check` clean
- [ ] `pnpm typecheck` → 0 errors, 0 warnings, 0 hints
- [ ] `pnpm test` → both browser and node projects green; ~74 tests total
- [ ] `pnpm build` → 12 pages, validator reports `Topic validation passed (10 topics, 4 islands)`
- [ ] Manual `pnpm dev` walkthrough of all five topic pages in both locales
- [ ] CI workflow green on push to `main`
- [ ] No new `astro check` hints introduced

---

## Deferred follow-ups (for M3 / M5)

The four "quick win" items from the M2 final review have been applied (commits `4f88f0f`, `9c6a384`, `e92a423`, `4ccaff9`). The items below are intentionally deferred. When picking up M3, scan this list and pull in the ones that intersect the new work.

**For M3 (vector-DB topics + first embedding-pipeline island):**

1. **`HighDimIntuition` perf — separate `vecs` and `sims` derivations.** Currently both are computed in a single `$derived.by` block, so dragging the dim slider regenerates 500 unit vectors per step (50k Gaussian draws at dim=100). M3 islands that follow the same "draw N samples and aggregate" shape should split the heavy work into a `vecs` derivation that re-runs only when its inputs change, and a lighter `sims`/`stats` derivation. Optionally debounce the slider via `requestAnimationFrame` if real use feels janky.
2. **Add a content-collection schema test.** The build catches frontmatter violations late; a Vitest unit test on the Zod schema in `src/content.config.ts` catches them in dev. M3 will add 3 new topics, raising the value of fast feedback.
3. **Add `cosineSimilarity([1, 1], [1, 1]) === 1` to the metrics test suite.** Identical-non-axis-aligned cosine is currently untested. Trivial addition.
4. **Style consistency in `vec.ts`:** `add` and `sub` use `.map`, `dot` uses an explicit `for`. Pick one and apply throughout for symmetry. No behavior change.

**For M5 (polish):**

5. **Real drag affordance + arrow-key keyboard nudging on islands.** Spec §7 (drag the head of a 2D vector) and §8 (Tab focus + arrow-key nudge by 0.1 / Shift+arrow by 1.0) were not implemented in M2 — only the numeric-input fallback shipped. Topic 1 prose says "Drag the values up and down" but there's nothing to drag yet. Either update the prose to "type values" / "use the numeric inputs" until drag lands, or implement drag+keyboard now.
6. **Tighter aria-labels on paired range+number inputs.** `aria-label="k"` and `aria-label="d"` are operable but terse for screen readers. Suggest `"k value"` / `"Dimension (numeric)"`.
7. **Prettier override for inline LaTeX** when the first `hasMath: true` topic lands. Likely fix:
   ```json
   { "files": "*.mdx", "options": { "embeddedLanguageFormatting": "off" } }
   ```
   in `.prettierrc`. Don't add speculatively — wait until a real LaTeX topic forces the issue and test against real `$...$` content.

**Cosmetic / optional:**

8. **`HighDimIntuition` SCALE-vs-input-range invariant comment.** If anyone widens the input range without bumping SCALE, the SVG silently overflows. Worth a one-line comment near the constants noting `SCALE = SIZE/2 / inputMax`.
