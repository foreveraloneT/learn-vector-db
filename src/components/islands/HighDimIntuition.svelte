<script lang="ts">
  import { mulberry32, randomUnitVectors } from '../../lib/math/random';
  import { dot } from '../../lib/math/vec';

  const N = 500;
  const PAIRS = 1000;
  const SEED = 42;
  const BINS = 21;

  let dim = $state(2);

  const stats = $derived.by(() => {
    const rng = mulberry32(SEED);
    const vecs = randomUnitVectors(N, dim, rng);
    const sims: number[] = [];
    const pairRng = mulberry32(SEED + 1);
    for (let k = 0; k < PAIRS; k++) {
      const i = Math.floor(pairRng() * N);
      let j = Math.floor(pairRng() * N);
      if (j === i) j = (j + 1) % N;
      sims.push(dot(vecs[i], vecs[j]));
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
    aria-label="Distribution of pairwise cosine similarities at dimension {dim}"
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
    <line x1="0" y1={SVG_H - 1} x2={SVG_W} y2={SVG_H - 1} stroke="currentColor" stroke-opacity="0.4" />
    <line x1={SVG_W / 2} y1="0" x2={SVG_W / 2} y2={SVG_H} stroke="currentColor" stroke-opacity="0.2" stroke-dasharray="2 3" />
  </svg>

  <div class="mt-4 grid grid-cols-[max-content_1fr_max-content] items-center gap-3 text-sm">
    <span aria-hidden="true">Dimension</span>
    <input
      type="range"
      min="2"
      max="100"
      step="1"
      bind:value={dim}
      aria-label="Dimension slider"
    />
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
    {PAIRS} random pairs of unit vectors at this dimension. Watch the histogram concentrate around 0 as dimension rises.
  </p>
</div>
