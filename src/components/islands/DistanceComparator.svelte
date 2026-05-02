<script lang="ts">
  import { euclidean, manhattan, cosineSimilarity } from '../../lib/math/metrics';

  let pxv = $state(3);
  let pyv = $state(0);
  let qxv = $state(0);
  let qyv = $state(4);

  const p = $derived([pxv, pyv]);
  const q = $derived([qxv, qyv]);

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
    <polyline
      points="{sx(pxv)},{sy(pyv)} {sx(qxv)},{sy(pyv)} {sx(qxv)},{sy(qyv)}"
      fill="none"
      stroke="oklch(0.7 0.18 60)"
      stroke-dasharray="3 3"
      stroke-width="1.5"
    />
    <line
      x1={sx(pxv)}
      y1={sy(pyv)}
      x2={sx(qxv)}
      y2={sy(qyv)}
      stroke="oklch(0.55 0.18 250)"
      stroke-width="2"
    />
    <circle cx={sx(pxv)} cy={sy(pyv)} r="6" fill="oklch(0.55 0.18 250)" />
    <circle cx={sx(qxv)} cy={sy(qyv)} r="6" fill="oklch(0.55 0.18 145)" />
  </svg>

  <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
    <label class="flex items-center gap-2"
      >p.x <input
        type="number"
        min="-5"
        max="5"
        step="0.1"
        bind:value={pxv}
        class="w-20 rounded border border-brand-300 bg-transparent px-2 py-1"
      /></label
    >
    <label class="flex items-center gap-2"
      >p.y <input
        type="number"
        min="-5"
        max="5"
        step="0.1"
        bind:value={pyv}
        class="w-20 rounded border border-brand-300 bg-transparent px-2 py-1"
      /></label
    >
    <label class="flex items-center gap-2"
      >q.x <input
        type="number"
        min="-5"
        max="5"
        step="0.1"
        bind:value={qxv}
        class="w-20 rounded border border-brand-300 bg-transparent px-2 py-1"
      /></label
    >
    <label class="flex items-center gap-2"
      >q.y <input
        type="number"
        min="-5"
        max="5"
        step="0.1"
        bind:value={qyv}
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
