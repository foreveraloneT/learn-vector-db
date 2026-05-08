<script lang="ts">
  import { sentencesFixture } from '../../lib/embeddings/sentences-loader';
  import { CANNED_RAG_RUNS } from '../../lib/rag/canned';

  type StepKind = 'question' | 'embed' | 'retrieve' | 'answer';
  const STEPS: { kind: StepKind; label: string }[] = [
    { kind: 'question', label: 'Question' },
    { kind: 'embed', label: 'Embed' },
    { kind: 'retrieve', label: 'Retrieve' },
    { kind: 'answer', label: 'Answer' },
  ];

  let runIdx = $state(0);
  let stepIdx = $state(0);

  const run = $derived(CANNED_RAG_RUNS[runIdx]);
  const step = $derived(STEPS[stepIdx]);
  const retrievedTexts = $derived(run.retrieved.map((i) => sentencesFixture.sentences[i].text));

  function goNext() {
    if (stepIdx < STEPS.length - 1) stepIdx += 1;
  }
  function goPrev() {
    if (stepIdx > 0) stepIdx -= 1;
  }
  function pickRun(e: Event) {
    const v = (e.target as HTMLSelectElement).value;
    runIdx = Number(v);
    stepIdx = 0;
  }
</script>

<div class="not-prose my-6 rounded-md border border-brand-100 p-4 dark:border-brand-900">
  <label class="block text-sm">
    <span class="mb-1 block text-brand-500">Demo run</span>
    <select
      onchange={pickRun}
      class="w-full rounded border border-brand-300 bg-transparent px-2 py-1 text-sm"
    >
      {#each CANNED_RAG_RUNS as r, i}
        <option value={i} selected={i === runIdx}>{r.question}</option>
      {/each}
    </select>
  </label>

  <ol class="mt-4 grid grid-cols-4 gap-1 text-xs">
    {#each STEPS as s, i}
      <li
        class="rounded px-2 py-1 text-center transition-colors motion-reduce:transition-none"
        class:bg-brand-100={i === stepIdx}
        class:dark:bg-brand-700={i === stepIdx}
        class:text-brand-500={i !== stepIdx}
      >
        {i + 1}. {s.label}
      </li>
    {/each}
  </ol>

  <section
    class="mt-4 min-h-[8rem] rounded-md bg-brand-50 px-4 py-3 dark:bg-brand-900"
    aria-live="polite"
  >
    <p class="text-xs uppercase tracking-wide text-brand-500" data-testid="step-label">
      {step.label}
    </p>
    <div class="mt-2 text-sm" data-testid="step-body">
      {#if step.kind === 'question'}
        <p class="font-mono">{run.question}</p>
      {:else if step.kind === 'embed'}
        <p>
          The question is sent through the embedding model — same model as Topic 6 — and becomes a
          384-dim vector.
        </p>
        <p class="mt-2 font-mono text-xs text-brand-500">
          [0.0123, −0.0456, 0.0289, … (384 numbers total)]
        </p>
      {:else if step.kind === 'retrieve'}
        <p class="text-xs text-brand-500">Top retrieved sentences (cosine similarity):</p>
        <ol class="mt-2 list-decimal space-y-1 pl-5">
          {#each retrievedTexts as t}
            <li>{t}</li>
          {/each}
        </ol>
      {:else}
        <p>{run.answer}</p>
        <p class="mt-2 text-xs text-brand-500">
          (This answer is canned for the demo. A real RAG pipeline feeds the retrieved sentences
          plus the question into an LLM here.)
        </p>
      {/if}
    </div>
  </section>

  <div class="mt-4 flex justify-between">
    <button
      type="button"
      onclick={goPrev}
      disabled={stepIdx === 0}
      class="rounded border border-brand-300 px-3 py-1 text-sm enabled:hover:bg-brand-50 disabled:opacity-50 dark:enabled:hover:bg-brand-900"
    >
      ← Prev
    </button>
    <button
      type="button"
      onclick={goNext}
      disabled={stepIdx === STEPS.length - 1}
      class="rounded border border-brand-300 px-3 py-1 text-sm enabled:hover:bg-brand-50 disabled:opacity-50 dark:enabled:hover:bg-brand-900"
    >
      Next →
    </button>
  </div>
</div>
