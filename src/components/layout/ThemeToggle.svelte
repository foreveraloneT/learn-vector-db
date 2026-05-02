<script lang="ts">
  let isDark = $state(false);

  $effect(() => {
    const stored = localStorage.getItem('theme');
    const initial =
      stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    isDark = initial;
    document.documentElement.classList.toggle('dark', initial);
  });

  function toggle() {
    isDark = !isDark;
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }
</script>

<button
  type="button"
  aria-label="Toggle theme"
  aria-pressed={isDark}
  onclick={toggle}
  class="rounded-md border border-brand-300 px-3 py-1 text-sm hover:bg-brand-50 dark:hover:bg-brand-900"
>
  {isDark ? '☾' : '☀'} <span class="sr-only">theme</span>
</button>
