<script lang="ts">
  import { magnitude, l1norm } from '../../lib/math/vec';

  let x = $state(3);
  let y = $state(2);

  const SIZE = 280;
  const CENTER = SIZE / 2;
  const SCALE = 25;

  const len = $derived(magnitude([x, y]));
  const l1 = $derived(l1norm([x, y]));

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
