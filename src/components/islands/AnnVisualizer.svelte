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

    <!-- Exact top-K (blue rings) -->
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

    <!-- Greedy top-K (amber dots) -->
    {#each greedyRes.indices as idx}
      <circle
        cx={layout.x(points[idx][0])}
        cy={layout.y(points[idx][1])}
        r="3"
        fill="oklch(0.65 0.16 60)"
      />
    {/each}

    <!-- Query (magenta) -->
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
