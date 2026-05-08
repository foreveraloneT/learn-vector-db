<script lang="ts">
  import { generateRecommendationsData, TASTE_AXES } from '../../lib/recommendations/data';
  import { cosineSimilarity } from '../../lib/math/metrics';

  // Heavy work runs once at module init; the seed is constant so this
  // initialization is genuinely a one-shot, not a reactive derivation.
  const data = generateRecommendationsData();

  let userIdx = $state(0);

  const activeUser = $derived(data.users[userIdx]);
  const ranked = $derived(
    data.items
      .map((item) => ({ item, score: cosineSimilarity(activeUser.taste, item.taste) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
  );

  function pickUser(e: Event) {
    userIdx = Number((e.target as HTMLSelectElement).value);
  }
</script>

<div class="not-prose my-6 rounded-md border border-brand-100 p-4 dark:border-brand-900">
  <label class="block text-sm">
    <span class="mb-1 block text-brand-500">User</span>
    <select
      onchange={pickUser}
      class="w-full rounded border border-brand-300 bg-transparent px-2 py-1 text-sm"
    >
      {#each data.users as u, i}
        <option value={i} selected={i === userIdx}>{u.name}</option>
      {/each}
    </select>
  </label>

  <div class="mt-4">
    <p class="text-xs uppercase tracking-wide text-brand-500">{activeUser.name}'s taste</p>
    <ul class="mt-2 space-y-1 text-sm">
      {#each TASTE_AXES as axis, j}
        <li class="grid grid-cols-[8rem_1fr_3rem] items-center gap-2">
          <span>{axis}</span>
          <span class="h-2 rounded bg-brand-100 dark:bg-brand-900">
            <span
              class="block h-full rounded bg-brand-500"
              style:width={`${(activeUser.taste[j] * 100).toFixed(0)}%`}
            ></span>
          </span>
          <span class="font-mono text-right text-xs">{activeUser.taste[j].toFixed(2)}</span>
        </li>
      {/each}
    </ul>
  </div>

  <div class="mt-6">
    <p class="text-xs uppercase tracking-wide text-brand-500">Top 5 recommendations (by cosine)</p>
    <ol class="mt-2 list-decimal space-y-1 pl-5 text-sm" data-testid="rec-list">
      {#each ranked as r}
        <li>
          <span class="font-mono">{r.item.name}</span>
          <span class="ml-2 font-mono text-xs text-brand-500">{r.score.toFixed(2)}</span>
        </li>
      {/each}
    </ol>
  </div>
</div>
