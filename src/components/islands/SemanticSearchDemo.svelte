<script lang="ts">
  import { sentencesFixture } from '../../lib/embeddings/sentences-loader';
  import { bestOverlapMatch } from '../../lib/search/word-overlap';

  let userInput = $state('');

  // The list of canned queries is static, derived once from the fixture.
  const queryTexts: string[] = sentencesFixture.queries.map((q) => q.text);

  // Per-frame derivations: match the typed input to a canned query, then
  // resolve that query's pre-computed top-5 sentence texts. Cheap.
  const match = $derived(bestOverlapMatch(userInput, queryTexts));
  const matchedQuery = $derived(match.index >= 0 ? sentencesFixture.queries[match.index] : null);
  const results = $derived(
    matchedQuery ? matchedQuery.top.map((i) => sentencesFixture.sentences[i]) : [],
  );
</script>

<div class="not-prose my-6 rounded-md border border-brand-100 p-4 dark:border-brand-900">
  <label class="block text-sm">
    <span class="mb-1 block text-brand-500">Search the corpus</span>
    <input
      type="text"
      bind:value={userInput}
      placeholder="e.g. best language for machine learning"
      class="w-full rounded border border-brand-300 bg-transparent px-3 py-2 text-sm"
      aria-describedby="matched-query"
    />
  </label>

  <p class="mt-3 text-sm" aria-live="polite">
    <span class="text-brand-500">Matched query:</span>
    <span class="font-mono" data-testid="matched-query" id="matched-query">
      {#if userInput.trim().length === 0}
        — start typing to search
      {:else if matchedQuery}
        {matchedQuery.text}
      {:else}
        No match in canned queries — try different words
      {/if}
    </span>
  </p>

  <ol
    class="mt-4 list-decimal space-y-2 pl-5 text-sm"
    aria-label="Top results"
    data-testid="result-list"
  >
    {#each results as r}
      <li>{r.text}</li>
    {/each}
  </ol>

  {#if results.length === 0 && userInput.trim().length > 0 && !matchedQuery}
    <p class="mt-2 text-xs text-brand-500">
      Path A is offline-only — try one of the canned queries listed above each result block.
    </p>
  {/if}
</div>
