/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  env: { browser: true, es2022: true, node: true },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: [
    'dist/',
    '.astro/',
    'node_modules/',
    'src/lib/embeddings/*.json',
    'pnpm-lock.yaml',
  ],
  rules: {
    // The codebase uses 'unused' parameters intentionally (e.g. opts.seed in
    // assembleSentencesFixture). Match Prettier-friendly underscore convention
    // for genuinely-unused vars without forcing a rewrite.
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
    ],
    // Several files use `void someExpr` to mark deliberately-evaluated-but-unused
    // expressions (e.g. dependency hints to Svelte 5 reactivity). Allow it.
    'no-void': 'off',
    // We use empty type bodies for shape-only interfaces.
    '@typescript-eslint/no-empty-interface': 'off',
    // Astro's canonical env.d.ts uses `/// <reference path="../.astro/types.d.ts" />`
    // to augment ambient types — this is the recommended Astro pattern and
    // cannot be replaced with an import statement.
    '@typescript-eslint/triple-slash-reference': 'off',
    // `while (true) { ... break }` is an idiomatic loop pattern used in the
    // greedy graph-search implementation (knn.ts). checkLoops: false keeps
    // the rule active for genuinely-problematic constant conditions in if/ternary
    // while allowing intentional infinite-loop-with-break patterns.
    'no-constant-condition': ['error', { checkLoops: false }],
  },
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: { parser: '@typescript-eslint/parser' },
      extends: ['plugin:svelte/recommended'],
      rules: {
        // Svelte 5 introduces $state/$derived/$effect runes — the
        // recommended set already covers them. Keep this block as a hook
        // for future rule overrides.
      },
    },
    {
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      parserOptions: { parser: '@typescript-eslint/parser', extraFileExtensions: ['.astro'] },
      extends: ['plugin:astro/recommended'],
    },
  ],
};
