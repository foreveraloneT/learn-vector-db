<script lang="ts">
  import { wordsFixture } from '../../lib/embeddings/words-loader';
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

  // Cluster index per word. The curated list is ordered animals (0..7),
  // foods (8..15), tech (16..23), emotions (24..29) — but we never want to
  // overrun if the fixture is shorter (mock fixture has 4 entries).
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
      <g class:opacity-30={selected !== null && !isHighlighted(i)} class="transition-opacity">
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
          onclick={() => (selected = i)}
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
