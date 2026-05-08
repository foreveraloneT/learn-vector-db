<script lang="ts">
  import { add, sub, scale, dot } from '../../lib/math/vec';
  import { svgCoords } from '../../lib/svg/coords';

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

  const coords = svgCoords();
  const px = coords.x;
  const py = coords.y;
</script>

<div class="not-prose my-6 rounded-md border border-brand-100 p-4 dark:border-brand-900">
  <svg
    viewBox="0 0 {coords.size} {coords.size}"
    role="img"
    aria-label="Vector operations playground"
    class="mx-auto block h-72 w-72"
  >
    <line
      x1={coords.center}
      y1="0"
      x2={coords.center}
      y2={coords.size}
      stroke="currentColor"
      stroke-opacity="0.15"
    />
    <line
      x1="0"
      y1={coords.center}
      x2={coords.size}
      y2={coords.center}
      stroke="currentColor"
      stroke-opacity="0.15"
    />
    <line
      x1={coords.center}
      y1={coords.center}
      x2={px(ax)}
      y2={py(ay)}
      stroke="oklch(0.55 0.18 250)"
      stroke-width="2"
    />
    <line
      x1={coords.center}
      y1={coords.center}
      x2={px(bx)}
      y2={py(by)}
      stroke="oklch(0.55 0.18 145)"
      stroke-width="2"
    />
    {#if result.kind === 'vec'}
      <line
        x1={coords.center}
        y1={coords.center}
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
      <div class="col-span-2 flex items-center gap-2 text-sm">
        <span aria-hidden="true">k</span>
        <input
          type="range"
          min="-3"
          max="3"
          step="0.1"
          bind:value={k}
          class="flex-1"
          aria-label="k slider"
        />
        <input
          type="number"
          min="-3"
          max="3"
          step="0.1"
          bind:value={k}
          class="w-20 rounded border border-brand-300 bg-transparent px-2 py-1"
          aria-label="k value (scale factor)"
        />
      </div>
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
