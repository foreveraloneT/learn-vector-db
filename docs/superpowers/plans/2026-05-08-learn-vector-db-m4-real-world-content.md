# Learn Vector DB — M4 (Real-World Content) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Topics 9–11 (the "Real-world examples" group: semantic search, RAG, recommendations) with their three interactive islands (`SemanticSearchDemo`, `RagFlow`, `RecommendationsDemo`). Extend the offline fixture pipeline so SemanticSearchDemo runs on real, pre-computed sentence + query embeddings.

**Architecture:** A small word-overlap matcher (`src/lib/search/`) pairs free-form user input to one of ~20 canned queries. The fixture pipeline gains a second builder that embeds a 50-sentence corpus and a 20-query set, pre-computes each query's top-5 sentences in 384-dim space, and writes a single committed JSON at `src/lib/embeddings/sentences.json`. `SemanticSearchDemo` reads that fixture and stays fully offline. `RagFlow` reuses the same corpus to animate a four-step pipeline (question → embed → retrieve → answer), with hand-authored canned answers in `src/lib/rag/canned.ts`. `RecommendationsDemo` synthesizes 20 users × 30 items with named 4-dim taste axes from a seeded RNG and ranks items by cosine similarity at runtime — no fixture.

**Tech Stack:** All M3 stack (Astro 6, Tailwind v4, Svelte 5, MDX, KaTeX, Vitest with split browser/node projects, `@xenova/transformers` and `tsx` as devDeps for the offline pipeline). No new runtime dependencies.

**Spec reference:** `docs/superpowers/specs/2026-05-02-learn-vector-db-design.md` §7 (`SemanticSearchDemo`, `RagFlow`, `RecommendationsDemo`, "Semantic search behavior" Path A), §2 (topics 9–11).

**M3 baseline:** `docs/superpowers/plans/2026-05-07-learn-vector-db-m3-vector-db-content.md` — completed in commits `b98abaa..872c914`. Its "Deferred follow-ups → For M4" section enumerates two items; the plan handles them as noted in §"Out of scope" below.

---

## Out of scope for M4

Intentionally deferred (do **not** implement):

- Path B in spec §7 — "Enable live search" via in-browser `transformers.js`. M3 deferred this; keep deferred. Path A (canned queries + word overlap) is the shipped path.
- Per-locale word fixtures. The committed `sentences.json` is English; both TH and EN topic pages reference the same JSON and gloss in prose. Multilingual embeddings → M5 if a Thai-native demo becomes important.
- Streaming / animated typewriter effects on the "answer" step of `RagFlow`. Show the canned answer as a complete block; respect `prefers-reduced-motion`.
- Real LLM call in RAG. Spec §2 lists "Live LLM-backed RAG" as out-of-scope for v1; the canned answer is the contract.
- HNSW upgrade / fancy ANN inside `SemanticSearchDemo`. The corpus is small (50); brute-force cosine on the pre-computed embeddings at fixture-build time is correct and fast.
- Lighthouse CI / perf budget enforcement → M5
- Sitemap / OG tags, social cards → M5
- ESLint, Husky → M5

## Pre-flight

- Repo on `main`, M3 shipped (last commit `872c914`). Verify clean baseline:

```bash
pnpm format:check && pnpm typecheck && pnpm test && pnpm build
```

  Expected: format clean, 0 type errors, 139 tests across browser + node (19 files), build emits 20 pages and the validator logs `Topic validation passed (16 topics, 6 islands, MDX usage verified)`.

- Work on `main` (matches M1/M2/M3 cadence). One commit per task. Conventional commit prefixes (`feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`).

- The validator in `src/integrations/validate-topics.ts` enforces island-name resolution **and** MDX-body usage of the declared component (added in commit `9c6a384`). M4 islands and topics must satisfy both.

- The fixture pipeline runs **only** when `pnpm build:fixtures` is invoked. `astro build` must remain offline-friendly — it should never fetch a model. Re-running the pipeline after this milestone produces both `words.json` (M3) and `sentences.json` (new in M4); both are committed.

- `@types/node` is scoped to `src/integrations/` and `scripts/` via triple-slash references (added in M2 commit `8c055df`). New code under `scripts/` adds `/// <reference types="node" />` at the top; new code under `src/lib/` does not need it.

## File structure (M4)

```
scripts/
├─ build-fixtures.ts                              # MODIFY — call assembleSentencesFixture, write second JSON
├─ build-fixtures.test.ts                         # MODIFY — add tests for assembleSentencesFixture
└─ semantic-search-corpus.ts                      # CREATE — 50 sentences + 20 canned queries
src/
├─ lib/
│  ├─ embeddings/
│  │  ├─ sentences.json                           # CREATE — built by pipeline
│  │  └─ sentences-loader.ts                      # CREATE — typed loader
│  ├─ search/
│  │  ├─ word-overlap.ts                          # CREATE — query-matching helper
│  │  └─ word-overlap.test.ts                     # CREATE
│  ├─ rag/
│  │  ├─ canned.ts                                # CREATE — hand-authored (Q, retrieved, A) tuples
│  │  └─ canned.test.ts                           # CREATE — schema sanity test
│  └─ recommendations/
│     ├─ data.ts                                  # CREATE — synthetic users/items + taste-axis labels
│     └─ data.test.ts                             # CREATE
├─ components/islands/
│  ├─ SemanticSearchDemo.svelte                   # CREATE — Topic 9
│  ├─ SemanticSearchDemo.test.ts                  # CREATE
│  ├─ RagFlow.svelte                              # CREATE — Topic 10
│  ├─ RagFlow.test.ts                             # CREATE
│  ├─ RecommendationsDemo.svelte                  # CREATE — Topic 11
│  └─ RecommendationsDemo.test.ts                 # CREATE
└─ content/topics/
   ├─ th/09-semantic-search.mdx                   # CREATE
   ├─ th/10-rag.mdx                               # CREATE
   ├─ th/11-recommendations.mdx                   # CREATE
   ├─ en/09-semantic-search.mdx                   # CREATE
   ├─ en/10-rag.mdx                               # CREATE
   └─ en/11-recommendations.mdx                   # CREATE
README.md                                          # MODIFY — note sentences.json in fixtures section
```

---

## Task 1: word-overlap matcher (TDD)

**Files:** `src/lib/search/word-overlap.ts`, `src/lib/search/word-overlap.test.ts`

A tiny, no-dependency matcher. The tokenizer lowercases, strips ASCII punctuation, splits on whitespace, drops a small stoplist, and de-duplicates. The matcher scores each candidate by token-overlap count and returns the index of the maximum (ties broken by earlier index, which is deterministic). When no tokens overlap, return `-1` so the island can fall back to a "couldn't match" message.

- [ ] **Step 1.1:** Write failing tests in `src/lib/search/word-overlap.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { tokenize, bestOverlapMatch } from './word-overlap';

describe('tokenize', () => {
  it('lowercases and splits on whitespace', () => {
    expect(tokenize('Hello WORLD Foo')).toEqual(['hello', 'world', 'foo']);
  });

  it('strips ASCII punctuation', () => {
    expect(tokenize("What's a vector?")).toEqual(['vector']);
  });

  it('drops common stopwords', () => {
    expect(tokenize('the quick brown fox')).toEqual(['quick', 'brown', 'fox']);
  });

  it('returns an empty array for empty input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('   ')).toEqual([]);
  });

  it('de-duplicates repeated tokens', () => {
    expect(tokenize('cat cat dog')).toEqual(['cat', 'dog']);
  });
});

describe('bestOverlapMatch', () => {
  const candidates = [
    'How does Python compare to JavaScript',
    'What language is best for machine learning',
    'How fast is Rust',
    'What is the best pizza topping',
  ];

  it('returns the index of the candidate with the most token overlap', () => {
    const result = bestOverlapMatch('Python language for ML', candidates);
    // Tokens: python, language, ml — "language" matches candidate 1 (also "for")
    expect(result.index).toBe(1);
    expect(result.score).toBeGreaterThan(0);
  });

  it('returns the matched candidate text alongside the index', () => {
    const result = bestOverlapMatch('best pizza ever', candidates);
    expect(result.index).toBe(3);
    expect(result.candidate).toBe(candidates[3]);
  });

  it('returns index -1 and score 0 when nothing overlaps', () => {
    const result = bestOverlapMatch('xyzzy plugh', candidates);
    expect(result.index).toBe(-1);
    expect(result.score).toBe(0);
    expect(result.candidate).toBeNull();
  });

  it('breaks ties by earlier index (deterministic)', () => {
    const tieCandidates = ['python is fast', 'python is fun'];
    // 'python' tokenizes alone (is is a stopword) and overlaps with both equally.
    const result = bestOverlapMatch('python', tieCandidates);
    expect(result.index).toBe(0);
  });

  it('handles empty input by returning no-match', () => {
    expect(bestOverlapMatch('', candidates).index).toBe(-1);
    expect(bestOverlapMatch('   ', candidates).index).toBe(-1);
  });
});
```

- [ ] **Step 1.2:** Run, verify failing.

```bash
pnpm test src/lib/search/word-overlap.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 1.3:** Implement `src/lib/search/word-overlap.ts`

```ts
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'do', 'does',
  'for', 'from', 'has', 'have', 'how', 'i', 'in', 'is', 'it', 'its', 'me',
  'my', 'of', 'on', 'or', 'so', 'that', 'the', 'this', 'to', 'was', 'we',
  'what', 'when', 'where', 'who', 'why', 'will', 'with', 'you', 'your',
]);

/**
 * Lowercase, strip ASCII punctuation, split on whitespace, drop stopwords,
 * de-duplicate. Order is preserved by first-occurrence so test assertions
 * about tokenization stay readable.
 */
export function tokenize(text: string): string[] {
  const cleaned = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ');
  const out: string[] = [];
  const seen = new Set<string>();
  for (const tok of cleaned.split(/\s+/)) {
    if (!tok || STOPWORDS.has(tok) || seen.has(tok)) continue;
    seen.add(tok);
    out.push(tok);
  }
  return out;
}

export interface OverlapMatch {
  /** Index into the candidates array, or -1 if no candidate had any token overlap. */
  index: number;
  /** The matched candidate text, or null on no-match. */
  candidate: string | null;
  /** Number of tokens that overlapped. 0 on no-match. */
  score: number;
}

/**
 * Pair `input` to its best-matching candidate by token-set intersection size.
 * Ties go to the earlier index (deterministic).
 */
export function bestOverlapMatch(input: string, candidates: readonly string[]): OverlapMatch {
  const inputTokens = new Set(tokenize(input));
  if (inputTokens.size === 0) {
    return { index: -1, candidate: null, score: 0 };
  }
  let bestIndex = -1;
  let bestScore = 0;
  for (let i = 0; i < candidates.length; i++) {
    const candTokens = tokenize(candidates[i]);
    let score = 0;
    for (const t of candTokens) if (inputTokens.has(t)) score++;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return {
    index: bestIndex,
    candidate: bestIndex >= 0 ? candidates[bestIndex] : null,
    score: bestScore,
  };
}
```

- [ ] **Step 1.4:** Run, verify passing.

```bash
pnpm test src/lib/search/word-overlap.test.ts
```

Expected: 11 tests green.

- [ ] **Step 1.5:** Commit

```bash
git add src/lib/search/word-overlap.ts src/lib/search/word-overlap.test.ts
git commit -m "feat(search): add word-overlap tokenizer and matcher

Powers SemanticSearchDemo's Path A: free-form user input is matched
to the nearest canned query by token-set intersection size. Tokenizer
lowercases, strips Unicode punctuation, drops a small stoplist, and
de-duplicates. Matcher returns -1 when nothing overlaps so the island
can show a clear 'no match' state."
```

---

## Task 2: semantic-search corpus (data only)

**Files:** `scripts/semantic-search-corpus.ts`

50 short factual sentences across five topics + 20 canned queries. The corpus is hand-authored, prosaic, and English — same locale stance as `embedding-words.ts` (M3). Index ranges per topic make it easy to sense-check the recommended results.

- [ ] **Step 2.1:** Create `scripts/semantic-search-corpus.ts`

```ts
/**
 * Corpus and canned queries for the SemanticSearchDemo island.
 *
 * 50 sentences across 5 topics (cooking, programming, travel, science, sports)
 * and 20 canned queries that span those topics. Order is preserved end-to-end
 * so indices in the JSON fixture map directly back to positions here.
 */
export const SENTENCES: readonly string[] = [
  // Cooking (0–9)
  'Sourdough bread relies on wild yeast captured from the air.',
  'Searing meat develops flavor through the Maillard reaction.',
  'Olive oil smokes at a lower temperature than peanut oil.',
  'Sushi rice is seasoned with vinegar, sugar, and salt.',
  'Pasta water should taste like the sea before the noodles go in.',
  'Caramelizing onions takes at least 30 minutes of patience.',
  'A dull knife is more dangerous than a sharp one in the kitchen.',
  'Resting steak for five minutes lets the juices redistribute.',
  'Baking is precise chemistry; cooking is forgiving improvisation.',
  'Stocks should never boil — a gentle simmer keeps them clear.',
  // Programming (10–19)
  'Python is a popular language for data science and machine learning.',
  'JavaScript runs in every modern web browser without a plugin.',
  'Rust offers memory safety without a garbage collector.',
  'Go was designed for fast compilation and concurrency primitives.',
  'TypeScript adds optional static typing on top of JavaScript.',
  'Functional programming favors pure functions and immutable data.',
  'Version control lets teams collaborate without overwriting each other.',
  'Unit tests catch regressions before they reach production.',
  'A good API has small surface area and predictable behavior.',
  'Caching is the source of half the bugs in distributed systems.',
  // Travel (20–29)
  'Kyoto is famous for its temples and traditional tea houses.',
  'The Northern Lights appear best on cold, clear nights near the poles.',
  'Iceland sits on the boundary of two tectonic plates.',
  'Lisbon is built across seven hills overlooking the Atlantic.',
  'Tokyo runs one of the largest subway systems in the world.',
  'Patagonia stretches across both Argentina and Chile.',
  'The Inca Trail leads to the cloud-shrouded ruins of Machu Picchu.',
  'Marrakech is known for its souks and the High Atlas mountains beyond.',
  'Bali combines volcanic landscapes with terraced rice paddies.',
  'New Zealand is home to dramatic fjords and ancient kauri forests.',
  // Science (30–39)
  'Photosynthesis converts sunlight into chemical energy stored in sugars.',
  'Black holes warp spacetime so much that not even light escapes.',
  'CRISPR enables precise edits to specific sequences of DNA.',
  'The speed of light in a vacuum is a universal constant.',
  'Plate tectonics explains how continents drift over geologic time.',
  'Quantum particles behave as both waves and discrete bundles.',
  'Antibiotics target bacterial cells but leave viruses unaffected.',
  'Vaccines train the immune system without causing the underlying disease.',
  'The carbon cycle moves carbon through air, ocean, soil, and life.',
  'Neural networks learn by adjusting weights to minimize a loss function.',
  // Sports (40–49)
  'A marathon is just over 42 kilometers from start to finish.',
  'Tennis matches are scored in games and sets, not points alone.',
  'Cycling drafting saves a rider roughly 30 percent of their effort.',
  'Climbing routes are graded by difficulty using regional scales.',
  'Soccer offside is judged at the moment the ball is played.',
  'Basketball shot clocks force quick decisions on offense.',
  'Surfing waves break differently over reef versus sand bottoms.',
  'Skiing wax is matched to the day’s snow temperature.',
  'Cricket innings can last hours or days depending on the format.',
  'Olympic weightlifting features the snatch and the clean and jerk.',
] as const;

export const QUERIES: readonly string[] = [
  // Cooking
  'How do I make great steak at home',
  'What is the science behind sourdough',
  'Best oils for high heat cooking',
  // Programming
  'Best language for machine learning',
  'Memory-safe systems language',
  'Why use TypeScript over JavaScript',
  'How does version control help teams',
  // Travel
  'Where can I see the Northern Lights',
  'Famous places to visit in Japan',
  'Mountains and ruins in South America',
  'Volcanic islands with rice paddies',
  // Science
  'How do plants make food from sunlight',
  'What are black holes made of',
  'How do vaccines work',
  'What is CRISPR used for',
  // Sports
  'How long is a marathon',
  'How does drafting help cyclists',
  'How is offside decided in soccer',
  'Why do climbers grade routes',
  'Best way to wax skis',
] as const;

export const SENTENCE_TOPICS: readonly { label: string; range: [number, number] }[] = [
  { label: 'cooking', range: [0, 10] },
  { label: 'programming', range: [10, 20] },
  { label: 'travel', range: [20, 30] },
  { label: 'science', range: [30, 40] },
  { label: 'sports', range: [40, 50] },
] as const;
```

- [ ] **Step 2.2:** Sanity-check counts

```bash
node -e "import('./scripts/semantic-search-corpus.ts').catch(()=>{}); const m = await import('./scripts/semantic-search-corpus.ts'); console.log('sentences:', m.SENTENCES.length, 'queries:', m.QUERIES.length);" 2>/dev/null || node --experimental-strip-types -e "const { SENTENCES, QUERIES } = await import('./scripts/semantic-search-corpus.ts'); console.log(SENTENCES.length, QUERIES.length);"
```

Don't worry if this command refuses — it's belt-and-suspenders. The actual check we care about is `pnpm typecheck` succeeding, which Task 3 will exercise.

- [ ] **Step 2.3:** Commit

```bash
git add scripts/semantic-search-corpus.ts
git commit -m "chore(scripts): add semantic-search corpus (50 sentences + 20 queries)

Hand-authored content across 5 topics (cooking, programming, travel,
science, sports). Used by the upcoming sentences fixture builder and
the SemanticSearchDemo island. Order is preserved so JSON indices map
back to source-file positions."
```

---

## Task 3: extend the fixture pipeline for sentences (TDD)

**Files:** `scripts/build-fixtures.ts`, `scripts/build-fixtures.test.ts`

Add a second pure assembler, `assembleSentencesFixture`, alongside the existing `assembleWordsFixture`. It embeds every sentence and every query, then for each query computes the top-K sentence indices by cosine similarity over the original 384-dim space. Output schema mirrors the words fixture (`meta` + `sentences` + `queries`).

The contract test reuses the fake-embedder pattern from M3 so the test never touches `@xenova/transformers`.

- [ ] **Step 3.1:** Add a failing test block to `scripts/build-fixtures.test.ts`

Add the imports + new describe block at the end of the file:

```ts
import { assembleSentencesFixture } from './build-fixtures';
import { SENTENCES, QUERIES } from './semantic-search-corpus';

/**
 * Fake embedder for sentences/queries: maps each text to a 4-dim one-hot-ish
 * vector based on its position-derived "topic" so that intra-topic items
 * cluster together and queries match their topic's sentences.
 *
 *   sentences index → topic = floor(i / 10)        (5 topics, 10 each)
 *   queries  index  → topic = floor(j / 4)         (5 topics, 4 each)
 */
function fakeSentenceEmbedder(): (text: string) => number[] {
  const dims = 5;
  // Build a lookup so the same string always returns the same vector.
  const map = new Map<string, number[]>();
  SENTENCES.forEach((s, i) => {
    const topic = Math.floor(i / 10);
    const v = new Array(dims).fill(0);
    v[topic] = 1;
    v[(topic + 1) % dims] = (i % 10) * 0.005;
    map.set(s, v);
  });
  QUERIES.forEach((q, j) => {
    const topic = Math.floor(j / 4);
    const v = new Array(dims).fill(0);
    v[topic] = 1;
    v[(topic + 1) % dims] = 0.001; // tiny jitter so queries are not bit-identical to sentences
    map.set(q, v);
  });
  return (text: string) => {
    const v = map.get(text);
    if (!v) throw new Error(`Unknown text: ${text}`);
    return v;
  };
}

describe('assembleSentencesFixture', () => {
  it('produces one entry per sentence and per query, in order', async () => {
    const fixture = await assembleSentencesFixture(SENTENCES, QUERIES, fakeSentenceEmbedder(), {
      seed: 1,
    });
    expect(fixture.sentences).toHaveLength(SENTENCES.length);
    expect(fixture.queries).toHaveLength(QUERIES.length);
    fixture.sentences.forEach((s, i) => expect(s.text).toBe(SENTENCES[i]));
    fixture.queries.forEach((q, j) => expect(q.text).toBe(QUERIES[j]));
  });

  it('records meta: model, dim, sentence count, query count', async () => {
    const fixture = await assembleSentencesFixture(SENTENCES, QUERIES, fakeSentenceEmbedder(), {
      seed: 1,
      modelName: 'fake-test-embedder',
    });
    expect(fixture.meta.model).toBe('fake-test-embedder');
    expect(fixture.meta.dim).toBe(5);
    expect(fixture.meta.sentenceCount).toBe(SENTENCES.length);
    expect(fixture.meta.queryCount).toBe(QUERIES.length);
  });

  it('attaches top-K sentence indices to each query', async () => {
    const K = 5;
    const fixture = await assembleSentencesFixture(SENTENCES, QUERIES, fakeSentenceEmbedder(), {
      seed: 1,
      k: K,
    });
    fixture.queries.forEach((q) => {
      expect(q.top).toHaveLength(K);
      for (const idx of q.top) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(SENTENCES.length);
      }
      expect(new Set(q.top).size).toBe(K); // unique
    });
  });

  it('matches each query to sentences in its own topic with the fake embedder', async () => {
    const K = 5;
    const fixture = await assembleSentencesFixture(SENTENCES, QUERIES, fakeSentenceEmbedder(), {
      seed: 1,
      k: K,
    });
    fixture.queries.forEach((q, j) => {
      const queryTopic = Math.floor(j / 4);
      for (const idx of q.top) {
        expect(Math.floor(idx / 10)).toBe(queryTopic);
      }
    });
  });

  it('is deterministic for a given seed (modulo builtAt)', async () => {
    const a = await assembleSentencesFixture(SENTENCES, QUERIES, fakeSentenceEmbedder(), {
      seed: 42,
    });
    const b = await assembleSentencesFixture(SENTENCES, QUERIES, fakeSentenceEmbedder(), {
      seed: 42,
    });
    expect({ ...a, meta: { ...a.meta, builtAt: '' } }).toEqual({
      ...b,
      meta: { ...b.meta, builtAt: '' },
    });
  });
});
```

- [ ] **Step 3.2:** Run, verify failing

```bash
pnpm test scripts/build-fixtures.test.ts
```

Expected: FAIL on the new describe block — `assembleSentencesFixture` is not exported. Existing word-fixture tests still pass.

- [ ] **Step 3.3:** Implement the new builder in `scripts/build-fixtures.ts`. Add these declarations alongside the existing word-fixture exports (do **not** remove or rename anything existing):

```ts
import { cosineSimilarity } from '../src/lib/math/metrics';
import { SENTENCES, QUERIES } from './semantic-search-corpus';

const DEFAULT_QUERY_K = 5;
const SENTENCES_OUTPUT_PATH = resolve(__dirname, '../src/lib/embeddings/sentences.json');

export interface SentenceEntry {
  text: string;
}

export interface QueryEntry {
  text: string;
  /** Indices into the sentences array — top-K by cosine similarity in the original embedding space. */
  top: number[];
}

export interface SentencesFixture {
  meta: {
    model: string;
    dim: number;
    sentenceCount: number;
    queryCount: number;
    builtAt: string;
  };
  sentences: SentenceEntry[];
  queries: QueryEntry[];
}

export interface AssembleSentencesOptions {
  seed: number;
  k?: number;
  modelName?: string;
}

/**
 * Pure assembly: takes sentences + queries + an embedder and returns the
 * sentences fixture. Cosine similarity drives the ranking; the seed is
 * unused by the assembly itself but kept in the signature for parity with
 * `assembleWordsFixture` in case future fixture-build steps need it.
 */
export async function assembleSentencesFixture(
  sentences: readonly string[],
  queries: readonly string[],
  embed: Embedder,
  opts: AssembleSentencesOptions,
): Promise<SentencesFixture> {
  const k = opts.k ?? DEFAULT_QUERY_K;
  const modelName = opts.modelName ?? DEFAULT_MODEL;

  // Ack: opts.seed is currently unused, but we accept it so callers don't have
  // to special-case the words-vs-sentences pipelines. Touching it silences
  // unused-var lint without affecting behavior.
  void opts.seed;

  const sentenceEmbeddings: number[][] = [];
  for (const s of sentences) sentenceEmbeddings.push(await embed(s));
  const queryEmbeddings: number[][] = [];
  for (const q of queries) queryEmbeddings.push(await embed(q));
  const dim = sentenceEmbeddings[0]?.length ?? 0;

  const queryTops: number[][] = queryEmbeddings.map((qv) => {
    const scored = sentenceEmbeddings.map((sv, i) => ({ i, s: cosineSimilarity(sv, qv) }));
    scored.sort((a, b) => b.s - a.s);
    return scored.slice(0, k).map((entry) => entry.i);
  });

  return {
    meta: {
      model: modelName,
      dim,
      sentenceCount: sentences.length,
      queryCount: queries.length,
      builtAt: new Date().toISOString(),
    },
    sentences: sentences.map((text) => ({ text })),
    queries: queries.map((text, j) => ({ text, top: queryTops[j] })),
  };
}
```

- [ ] **Step 3.4:** Update `main()` in `scripts/build-fixtures.ts` so it builds **both** fixtures from a single model load. Replace the existing `main` body with:

```ts
async function main(): Promise<void> {
  const modelName = DEFAULT_MODEL;
  console.log(`[build-fixtures] Loading model ${modelName} (first run downloads ~25 MB) ...`);
  const embed = await buildXenovaEmbedder(modelName);

  console.log(`[build-fixtures] Embedding ${EMBEDDING_WORDS.length} words ...`);
  const wordsFixture = await assembleWordsFixture(EMBEDDING_WORDS, embed, {
    seed: 1,
    modelName,
  });
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(wordsFixture, null, 2) + '\n', 'utf-8');
  console.log(
    `[build-fixtures] Wrote ${OUTPUT_PATH} (${wordsFixture.words.length} words, ${wordsFixture.meta.dim}-dim)`,
  );

  console.log(
    `[build-fixtures] Embedding ${SENTENCES.length} sentences and ${QUERIES.length} queries ...`,
  );
  const sentencesFixture = await assembleSentencesFixture(SENTENCES, QUERIES, embed, {
    seed: 1,
    modelName,
  });
  await writeFile(
    SENTENCES_OUTPUT_PATH,
    JSON.stringify(sentencesFixture, null, 2) + '\n',
    'utf-8',
  );
  console.log(
    `[build-fixtures] Wrote ${SENTENCES_OUTPUT_PATH} (${sentencesFixture.sentences.length} sentences, ${sentencesFixture.queries.length} queries, ${sentencesFixture.meta.dim}-dim)`,
  );
}
```

- [ ] **Step 3.5:** Run, verify passing

```bash
pnpm test scripts/build-fixtures.test.ts
```

Expected: all (existing 6 + new 5) tests green.

- [ ] **Step 3.6:** Run the full suite to confirm nothing regressed

```bash
pnpm test
```

Expected: ~150 tests across both projects.

- [ ] **Step 3.7:** Commit

```bash
git add scripts/build-fixtures.ts scripts/build-fixtures.test.ts
git commit -m "feat(scripts): extend fixture pipeline with sentences + queries

Adds assembleSentencesFixture: embed N sentences and M queries, then
pre-compute top-5 sentence indices per query by cosine similarity over
the original 384-dim space. Wires it into main() so a single model
load produces both words.json (M3) and sentences.json (M4)."
```

---

## Task 4: run the pipeline and commit `sentences.json` + loader

**Files:** `src/lib/embeddings/sentences.json`, `src/lib/embeddings/sentences-loader.ts`

- [ ] **Step 4.1:** Run the pipeline

```bash
pnpm build:fixtures
```

Expected:

```
[build-fixtures] Loading model Xenova/all-MiniLM-L6-v2 ...
[build-fixtures] Embedding 30 words ...
[build-fixtures] Wrote .../src/lib/embeddings/words.json (30 words, 384-dim)
[build-fixtures] Embedding 50 sentences and 20 queries ...
[build-fixtures] Wrote .../src/lib/embeddings/sentences.json (50 sentences, 20 queries, 384-dim)
```

If the script fails because `@xenova/transformers` cannot reach the Hugging Face CDN, retry once. If it still fails, do **not** hand-author the JSON — surface the failure to the user and pause.

- [ ] **Step 4.2:** Eyeball results

```bash
node -e "const f = require('./src/lib/embeddings/sentences.json'); console.log(f.meta); console.log('Q:', f.queries[0].text); console.log('top sentences:'); f.queries[0].top.forEach(i => console.log('  -', f.sentences[i].text));"
```

Expected: `meta.dim === 384`, `meta.sentenceCount === 50`, `meta.queryCount === 20`. The first query is "How do I make great steak at home" — its top-5 should mostly be cooking sentences (indices 0–9). If a clearly off-topic sentence (e.g., a tennis sentence) lands in cooking's top-5, stop and investigate before committing.

- [ ] **Step 4.3:** Note that the same `pnpm build:fixtures` invocation also rewrites `src/lib/embeddings/words.json` — its `meta.builtAt` will tick to the current time but the embeddings/PCA/neighbors are deterministic, so the visible payload should be unchanged. If anything beyond `builtAt` actually shifted, stop and investigate before continuing. Now create `src/lib/embeddings/sentences-loader.ts`

```ts
import sentencesJson from './sentences.json';

/**
 * Shape of a single sentence in the committed fixture.
 *
 * Kept in sync with `SentenceEntry` / `QueryEntry` in `scripts/build-fixtures.ts`
 * — when the pipeline schema changes, update both. The duplication is
 * deliberate: the runtime should not import from `scripts/`.
 */
export interface SentenceEntry {
  text: string;
}

export interface QueryEntry {
  text: string;
  top: number[];
}

export interface SentencesFixture {
  meta: {
    model: string;
    dim: number;
    sentenceCount: number;
    queryCount: number;
    builtAt: string;
  };
  sentences: SentenceEntry[];
  queries: QueryEntry[];
}

export const sentencesFixture: SentencesFixture = sentencesJson as SentencesFixture;
```

- [ ] **Step 4.4:** Verify typecheck and test still pass

```bash
pnpm typecheck && pnpm test
```

Expected: 0 errors; all tests green.

- [ ] **Step 4.5:** Commit

```bash
git add src/lib/embeddings/sentences.json src/lib/embeddings/sentences-loader.ts
git commit -m "feat(embeddings): commit sentences.json fixture and typed loader

50-sentence corpus across 5 topics + 20 canned queries, embedded with
Xenova/all-MiniLM-L6-v2 (384-dim). Each query's top-5 sentence indices
are pre-computed by cosine similarity in the original space. Runtime
never loads the model — SemanticSearchDemo and RagFlow consume the
typed loader."
```

---

## Task 5: SemanticSearchDemo island (TDD)

**Files:** `src/components/islands/SemanticSearchDemo.svelte`, `src/components/islands/SemanticSearchDemo.test.ts`

The user types into a text input; on every keystroke (debounced trivially via Svelte's reactive system, no setTimeout), the input is word-overlap-matched against the canned queries. The matched query's pre-computed top-5 sentences are shown. If no candidates overlap, show a hint. The fixture import is mocked in tests so the component test runs with predictable data.

- [ ] **Step 5.1:** Write failing tests in `src/components/islands/SemanticSearchDemo.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('../../lib/embeddings/sentences-loader', () => ({
  sentencesFixture: {
    meta: { model: 'mock', dim: 4, sentenceCount: 4, queryCount: 2, builtAt: '2026-05-08T00:00:00Z' },
    sentences: [
      { text: 'Python is great for machine learning.' },
      { text: 'Rust offers memory safety without garbage collection.' },
      { text: 'Sushi is a Japanese rice and fish dish.' },
      { text: 'Marathons are over forty kilometers long.' },
    ],
    queries: [
      { text: 'best language for machine learning', top: [0, 1, 2, 3] },
      { text: 'famous Japanese food', top: [2, 0, 1, 3] },
    ],
  },
}));

import SemanticSearchDemo from './SemanticSearchDemo.svelte';

describe('SemanticSearchDemo', () => {
  it('renders an input and the empty-state hint by default', () => {
    render(SemanticSearchDemo);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByTestId('matched-query').textContent).toMatch(/start typing|type|—/i);
  });

  it('matches user input to the closest canned query', async () => {
    const user = userEvent.setup();
    render(SemanticSearchDemo);
    const input = screen.getByRole('textbox');
    await user.type(input, 'machine learning python');
    expect(screen.getByTestId('matched-query').textContent).toMatch(/machine learning/i);
  });

  it('renders the top-K sentences for the matched query', async () => {
    const user = userEvent.setup();
    render(SemanticSearchDemo);
    await user.type(screen.getByRole('textbox'), 'machine learning');
    const list = screen.getByTestId('result-list').textContent ?? '';
    expect(list).toMatch(/Python/);
  });

  it('switches results when input matches a different query', async () => {
    const user = userEvent.setup();
    render(SemanticSearchDemo);
    const input = screen.getByRole('textbox');
    await user.type(input, 'Japanese');
    const text = screen.getByTestId('matched-query').textContent ?? '';
    expect(text.toLowerCase()).toContain('japanese');
    expect(screen.getByTestId('result-list').textContent).toMatch(/Sushi/);
  });

  it('shows a no-match message when no canned query overlaps', async () => {
    const user = userEvent.setup();
    render(SemanticSearchDemo);
    await user.type(screen.getByRole('textbox'), 'xyzzy plugh');
    expect(screen.getByTestId('matched-query').textContent).toMatch(/no match|couldn't|nothing/i);
  });
});
```

- [ ] **Step 5.2:** Run, verify failing.

- [ ] **Step 5.3:** Implement `src/components/islands/SemanticSearchDemo.svelte`

```svelte
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
```

- [ ] **Step 5.4:** Run, verify passing.

```bash
pnpm test src/components/islands/SemanticSearchDemo.test.ts
```

Expected: 5 tests green.

- [ ] **Step 5.5:** Commit

```bash
git add src/components/islands/SemanticSearchDemo.svelte src/components/islands/SemanticSearchDemo.test.ts
git commit -m "feat(island): add SemanticSearchDemo (Path A: word-overlap + canned top-K)

Reads the committed sentences.json fixture, word-overlap-matches user
input to the nearest canned query, and renders that query's pre-
computed top-5 sentences. Fully offline. Path B (live transformers.js
embedding) stays deferred per spec §7."
```

---

## Task 6: Topic 9 — Semantic search (MDX)

**Files:** `src/content/topics/th/09-semantic-search.mdx`, `src/content/topics/en/09-semantic-search.mdx`

- [ ] **Step 6.1:** Create EN MDX

```mdx
---
title: Semantic search
slug: semantic-search
group: real-world
order: 9
locale: en
summary: When "find similar" beats "find with these exact words" — the search behind every modern docs site, FAQ, and product catalogue.
hasInteractive: true
interactiveComponent: SemanticSearchDemo
hasMath: false
---

import SemanticSearchDemo from '../../../components/islands/SemanticSearchDemo.svelte';
import TryYourself from '../../../components/mdx/TryYourself.astro';
import Takeaways from '../../../components/mdx/Takeaways.astro';
import Takeaway from '../../../components/mdx/Takeaway.astro';

## Intuition

Classic keyword search asks "which documents contain these words?" That works when you remember the exact phrasing. It falls apart when you don't: searching for "best language for AI" misses a perfectly relevant document that says "Python is widely used for machine learning" — different words, same idea.

**Semantic search** asks "which documents _mean_ the closest thing to what I asked?" It works on the embedding from the previous topic: turn the query into a vector, turn each document into a vector, return the documents whose vectors are nearest to the query vector. Synonyms, paraphrases, and related-but-different wordings all just work, because the model already knows they live near each other in the embedding space.

## Try it

<SemanticSearchDemo client:visible />

Type a question. We match your text to the closest of ~20 canned queries (this demo runs fully offline, so we can't embed your text live), then show the top-5 sentences from a 50-sentence corpus that the canned query was paired with. Try the same idea with different words: "best language for ML" and "language for machine learning" should land on the same canned query and the same results — that's the point.

## In the real world

Production semantic search runs every day on top of vector databases. Retrieval is rarely the only step:

- **Hybrid search** combines semantic similarity with classic keyword matching to get the best of both — often via a learned re-ranker.
- **Filters** ("documents updated in the last 30 days," "only this customer's content") apply on top of vector similarity, which is why the dedicated databases from Topic 7 are so useful.
- **Re-ranking** with a heavier model can refine the top-50 returned by the vector index down to the top-5 a user actually sees.

This pipeline is what powers most "ask a question" search bars on docs sites in 2026.

<TryYourself>
  Type "memory-safe systems language" and "rust safety". Did you land on the same canned query?
  Now try "xyzzy plugh" — the demo should show "no match." Why?
</TryYourself>

<Takeaways>
  <Takeaway>Semantic search retrieves by meaning, not keyword.</Takeaway>
  <Takeaway>
    The math is exactly what the previous topics taught: embed both sides, return the nearest by
    cosine.
  </Takeaway>
  <Takeaway>
    Production systems wrap retrieval with filters and re-rankers; raw nearest-neighbor is the core,
    not the whole pipeline.
  </Takeaway>
</Takeaways>
```

- [ ] **Step 6.2:** Create TH MDX

```mdx
---
title: ค้นหาเชิงความหมาย
slug: semantic-search
group: real-world
order: 9
locale: th
summary: เมื่อ "หาสิ่งที่คล้ายกัน" ทำงานได้ดีกว่า "หาสิ่งที่มีคำเดียวกันเป๊ะ" — เทคนิคเบื้องหลังระบบค้นหาบนเว็บ docs, FAQ, และแคตตาล็อกสินค้ายุคใหม่
hasInteractive: true
interactiveComponent: SemanticSearchDemo
hasMath: false
---

import SemanticSearchDemo from '../../../components/islands/SemanticSearchDemo.svelte';
import TryYourself from '../../../components/mdx/TryYourself.astro';
import Takeaways from '../../../components/mdx/Takeaways.astro';
import Takeaway from '../../../components/mdx/Takeaway.astro';

## ทำความเข้าใจ

ระบบค้นหาแบบ keyword ถามว่า "เอกสารใดบ้างที่มีคำเหล่านี้" ใช้ได้ดีถ้าจำคำที่แม่นยำได้ แต่ถ้าจำไม่ได้ก็พัง: ค้น "ภาษาที่ดีที่สุดสำหรับ AI" จะพลาดเอกสารที่เขียนว่า "Python ถูกใช้กันแพร่หลายในงาน machine learning" — คนละคำ แต่หมายความเหมือนกัน

**Semantic search** ถามว่า "เอกสารใดบ้างที่ _ความหมาย_ ใกล้เคียงกับสิ่งที่ฉันถามที่สุด" คำตอบมาจากการใช้ embedding ในหัวข้อที่แล้ว: แปลงคำค้นเป็นเวกเตอร์ แปลงเอกสารเป็นเวกเตอร์ แล้วคืนเอกสารที่เวกเตอร์อยู่ใกล้เวกเตอร์ของคำค้นที่สุด คำพ้องความหมาย, การเรียบเรียงใหม่, ทางเลือกการพูดที่ใกล้เคียง — ทุกอย่างทำงานเองโดยที่โมเดลรู้แล้วว่าคำเหล่านั้นอยู่ใกล้กันใน embedding space

## ลองเล่นดู

<SemanticSearchDemo client:visible />

ลองพิมพ์คำถามดู เราจะจับคู่ข้อความของเรากับ canned query ที่ใกล้เคียงที่สุดจาก ~20 อัน (เดโม่นี้ทำงานออฟไลน์ทั้งหมด เราจึงไม่สามารถ embed ข้อความใหม่ๆ แบบ live ได้) แล้วแสดงประโยค 5 อันดับแรกจาก corpus 50 ประโยคที่ canned query นั้นถูกจับคู่ไว้ ลองพิมพ์ความหมายเดียวกันด้วยคำต่างกัน เช่น "best language for ML" กับ "language for machine learning" ควรจะตกที่ canned query เดียวกันและได้ผลเหมือนกัน — นั่นคือประเด็น

## ในโลกจริง

Production semantic search ทำงานบน vector database ทุกวัน Retrieval มักไม่ใช่ขั้นตอนเดียว:

- **Hybrid search** ผสม semantic similarity กับการจับคู่ keyword แบบเดิมเพื่อให้ได้ผลลัพธ์ที่ดีที่สุดของทั้งสองแบบ — มักใช้ re-ranker ที่เรียนรู้
- **Filters** ("เอกสารที่อัปเดตใน 30 วันล่าสุด", "เฉพาะเนื้อหาของลูกค้ารายนี้") ทำงานต่อจาก vector similarity ซึ่งเป็นเหตุผลที่ฐานข้อมูลเฉพาะทางจาก Topic 7 มีประโยชน์
- **Re-ranking** ด้วยโมเดลที่หนักกว่า ใช้กรอง top-50 จาก vector index เหลือ top-5 ที่ผู้ใช้เห็นจริง

ระบบนี้คือสิ่งที่ขับเคลื่อนช่อง "ถามคำถาม" บนเว็บ docs ส่วนใหญ่ในปี 2026

<TryYourself>
  พิมพ์ "memory-safe systems language" และ "rust safety" — ตกที่ canned query เดียวกันไหม? ลอง "xyzzy plugh"
  ดู เดโม่จะขึ้นว่า "no match" ทำไม?
</TryYourself>

<Takeaways>
  <Takeaway>Semantic search ค้นหาจากความหมาย ไม่ใช่จาก keyword</Takeaway>
  <Takeaway>
    คณิตศาสตร์เบื้องหลังคือสิ่งที่หัวข้อก่อนหน้าสอน: embed ทั้งสองฝั่ง คืนตัวที่ใกล้ที่สุดด้วย cosine
  </Takeaway>
  <Takeaway>
    ระบบจริงครอบ retrieval ด้วย filter และ re-ranker — nearest-neighbor เป็นแกนหลัก ไม่ใช่ทั้งหมดของ pipeline
  </Takeaway>
</Takeaways>
```

- [ ] **Step 6.3:** Build

```bash
pnpm build
```

Expected: validator reports `Topic validation passed (18 topics, 7 islands, MDX usage verified)`. Build emits 22 pages.

- [ ] **Step 6.4:** Commit

```bash
git add src/content/topics/th/09-semantic-search.mdx src/content/topics/en/09-semantic-search.mdx
git commit -m "feat(content): add Topic 9 (semantic search) in TH and EN"
```

---

## Task 7: RAG canned data (TDD)

**Files:** `src/lib/rag/canned.ts`, `src/lib/rag/canned.test.ts`

A small typed dataset of (question, retrieved sentence indices, answer) triples. The `retrieved` field references the corpus from `sentences-loader` so the demo's "Retrieve" step shows real sentences from the same corpus the search demo uses.

- [ ] **Step 7.1:** Write failing tests in `src/lib/rag/canned.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { CANNED_RAG_RUNS } from './canned';
import { sentencesFixture } from '../embeddings/sentences-loader';

describe('CANNED_RAG_RUNS', () => {
  it('exposes at least 3 demo runs', () => {
    expect(CANNED_RAG_RUNS.length).toBeGreaterThanOrEqual(3);
  });

  it('every run has question, retrieved indices, and an answer', () => {
    for (const run of CANNED_RAG_RUNS) {
      expect(typeof run.question).toBe('string');
      expect(run.question.length).toBeGreaterThan(0);
      expect(Array.isArray(run.retrieved)).toBe(true);
      expect(run.retrieved.length).toBeGreaterThan(0);
      expect(typeof run.answer).toBe('string');
      expect(run.answer.length).toBeGreaterThan(0);
    }
  });

  it('retrieved indices are valid into the sentences corpus', () => {
    for (const run of CANNED_RAG_RUNS) {
      for (const idx of run.retrieved) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(sentencesFixture.sentences.length);
      }
    }
  });

  it('retrieved indices are unique within a run', () => {
    for (const run of CANNED_RAG_RUNS) {
      expect(new Set(run.retrieved).size).toBe(run.retrieved.length);
    }
  });
});
```

- [ ] **Step 7.2:** Run, verify failing.

- [ ] **Step 7.3:** Implement `src/lib/rag/canned.ts`

```ts
/**
 * Canned RAG demo runs for the RagFlow island.
 *
 * Each run is a hand-authored (question, retrieved corpus indices, answer)
 * triple. The retrieved indices reference `sentencesFixture.sentences` from
 * `src/lib/embeddings/sentences-loader.ts` (the same corpus SemanticSearchDemo
 * uses). Answers are deliberately short and don't pretend to be live LLM
 * output — the goal is to show the *flow*, not to run a real model.
 */
export interface CannedRagRun {
  question: string;
  /** Indices into the sentences corpus that the demo "retrieves". */
  retrieved: number[];
  answer: string;
}

export const CANNED_RAG_RUNS: readonly CannedRagRun[] = [
  {
    question: 'What language should I pick up for machine learning?',
    retrieved: [10, 14, 39],
    answer:
      'Python is the most popular choice — it has the deepest set of ML libraries and is what most tutorials assume. TypeScript is occasionally useful if you also want to ship a web UI.',
  },
  {
    question: "What's the best way to see the Northern Lights?",
    retrieved: [21, 22, 29],
    answer:
      'Travel to a high-latitude location (Iceland, Norway, northern Canada, New Zealand for the Southern variant) and aim for a cold, clear winter night well away from city lights.',
  },
  {
    question: 'How does CRISPR work, in one sentence?',
    retrieved: [32, 36, 37],
    answer:
      'CRISPR enables precise edits to specific DNA sequences using a guide RNA that directs an enzyme to cut at a chosen location.',
  },
  {
    question: 'Tips for cooking a great steak at home?',
    retrieved: [1, 7, 5],
    answer:
      'Pat the meat dry, get the pan very hot to develop a Maillard sear, and rest the steak for at least five minutes before slicing so the juices redistribute.',
  },
] as const;
```

- [ ] **Step 7.4:** Run, verify passing.

```bash
pnpm test src/lib/rag/canned.test.ts
```

Expected: 4 tests green.

- [ ] **Step 7.5:** Commit

```bash
git add src/lib/rag/canned.ts src/lib/rag/canned.test.ts
git commit -m "feat(rag): add canned RAG demo runs

Four hand-authored (question, retrieved corpus indices, answer) tuples
that reuse the SemanticSearchDemo sentences corpus. Powers the RagFlow
animation's Retrieve and Answer steps; keeps the v1 spec promise of no
live LLM call."
```

---

## Task 8: RagFlow island (TDD)

**Files:** `src/components/islands/RagFlow.svelte`, `src/components/islands/RagFlow.test.ts`

A four-step animated walkthrough: Question → Embed → Retrieve → Answer. The user picks one of the canned runs from a dropdown and steps through with Prev / Next buttons. `prefers-reduced-motion` is honored by skipping any CSS transitions (declared via Tailwind's `motion-reduce:` modifier; nothing JavaScript-driven needs to change because the steps are user-driven, not auto-advancing).

- [ ] **Step 8.1:** Write failing tests in `src/components/islands/RagFlow.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('../../lib/embeddings/sentences-loader', () => ({
  sentencesFixture: {
    meta: { model: 'mock', dim: 4, sentenceCount: 4, queryCount: 0, builtAt: '2026-05-08T00:00:00Z' },
    sentences: [
      { text: 'Sentence zero.' },
      { text: 'Sentence one.' },
      { text: 'Sentence two.' },
      { text: 'Sentence three.' },
    ],
    queries: [],
  },
}));

vi.mock('../../lib/rag/canned', () => ({
  CANNED_RAG_RUNS: [
    {
      question: 'Question A?',
      retrieved: [0, 1],
      answer: 'Answer A.',
    },
    {
      question: 'Question B?',
      retrieved: [2, 3],
      answer: 'Answer B.',
    },
  ],
}));

import RagFlow from './RagFlow.svelte';

describe('RagFlow', () => {
  it('starts on step 1 (Question)', () => {
    render(RagFlow);
    expect(screen.getByTestId('step-label').textContent).toMatch(/question/i);
    expect(screen.getByTestId('step-body').textContent).toMatch(/Question A/);
  });

  it('advances to step 2 (Embed) on Next', async () => {
    const user = userEvent.setup();
    render(RagFlow);
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByTestId('step-label').textContent).toMatch(/embed/i);
  });

  it('shows retrieved sentences on step 3 (Retrieve)', async () => {
    const user = userEvent.setup();
    render(RagFlow);
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByTestId('step-label').textContent).toMatch(/retrieve/i);
    const body = screen.getByTestId('step-body').textContent ?? '';
    expect(body).toMatch(/Sentence zero/);
    expect(body).toMatch(/Sentence one/);
  });

  it('shows the canned answer on step 4 (Answer)', async () => {
    const user = userEvent.setup();
    render(RagFlow);
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByTestId('step-label').textContent).toMatch(/answer/i);
    expect(screen.getByTestId('step-body').textContent).toMatch(/Answer A/);
  });

  it('disables Next on the last step', async () => {
    const user = userEvent.setup();
    render(RagFlow);
    const nextBtn = screen.getByRole('button', { name: /next/i }) as HTMLButtonElement;
    await user.click(nextBtn);
    await user.click(nextBtn);
    await user.click(nextBtn);
    expect(nextBtn.disabled).toBe(true);
  });

  it('disables Prev on the first step', () => {
    render(RagFlow);
    const prevBtn = screen.getByRole('button', { name: /prev|previous/i }) as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
  });

  it('switches the active run when the dropdown changes and resets to step 1', async () => {
    const user = userEvent.setup();
    render(RagFlow);
    // Advance, then switch run
    await user.click(screen.getByRole('button', { name: /next/i }));
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    await user.selectOptions(select, '1');
    expect(screen.getByTestId('step-label').textContent).toMatch(/question/i);
    expect(screen.getByTestId('step-body').textContent).toMatch(/Question B/);
  });
});
```

- [ ] **Step 8.2:** Run, verify failing.

- [ ] **Step 8.3:** Implement `src/components/islands/RagFlow.svelte`

```svelte
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
        <p>The question is sent through the embedding model — same model as Topic 6 — and becomes a 384-dim vector.</p>
        <p class="mt-2 font-mono text-xs text-brand-500">[0.0123, −0.0456, 0.0289, … (384 numbers total)]</p>
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
          (This answer is canned for the demo. A real RAG pipeline feeds the retrieved sentences plus the question into an LLM here.)
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
```

- [ ] **Step 8.4:** Run, verify passing.

```bash
pnpm test src/components/islands/RagFlow.test.ts
```

Expected: 7 tests green.

- [ ] **Step 8.5:** Commit

```bash
git add src/components/islands/RagFlow.svelte src/components/islands/RagFlow.test.ts
git commit -m "feat(island): add RagFlow (animated 4-step RAG walkthrough)

Question → Embed → Retrieve → Answer, driven by user-controlled Prev/
Next buttons (no auto-advance, so prefers-reduced-motion is satisfied
without extra logic). Reuses the sentences corpus for the Retrieve
step; the Answer step shows hand-authored canned text — spec §2 keeps
live LLM calls out of scope for v1."
```

---

## Task 9: Topic 10 — RAG (MDX)

**Files:** `src/content/topics/th/10-rag.mdx`, `src/content/topics/en/10-rag.mdx`

- [ ] **Step 9.1:** Create EN MDX

```mdx
---
title: RAG (Retrieval-Augmented Generation)
slug: rag
group: real-world
order: 10
locale: en
summary: Glue an LLM onto a vector database, and suddenly it can answer questions about your private docs without ever being trained on them.
hasInteractive: true
interactiveComponent: RagFlow
hasMath: false
---

import RagFlow from '../../../components/islands/RagFlow.svelte';
import TryYourself from '../../../components/mdx/TryYourself.astro';
import Takeaways from '../../../components/mdx/Takeaways.astro';
import Takeaway from '../../../components/mdx/Takeaway.astro';

## Intuition

LLMs (large language models) are trained on a fixed snapshot of the internet. They can write fluently about anything in that snapshot, but they have two huge limits: they don't know about your private documents, and they don't know about anything that happened after their training cutoff.

**Retrieval-Augmented Generation** (RAG) bolts a vector database onto an LLM to fix both problems at once. The pipeline:

1. **Question** — the user asks something.
2. **Embed** — the question gets turned into a vector by an embedding model.
3. **Retrieve** — that vector is used to fetch the top-K most-similar chunks from your private documents (which you embedded once, ahead of time).
4. **Answer** — the question and the retrieved chunks are stuffed into an LLM prompt, and the LLM writes an answer grounded in your data.

The LLM never gets re-trained. The vector database does the heavy lifting of "what should the model read to answer this?" Update your docs → re-embed those chunks → the model can answer questions about the new content tomorrow morning.

## Try it

<RagFlow client:visible />

Pick a question and step through the four stages. The "Retrieve" step uses the same 50-sentence corpus you saw in the previous topic. The "Answer" step is canned — building a real LLM call into a static demo would require API keys and a backend, both out of scope here. Production RAG glues an LLM in at the same point.

## In the real world

RAG underpins a huge fraction of "AI assistant" features shipped over the last two years: support agents trained on customer-specific docs, code assistants that pull from your private codebase, internal "search-with-an-answer" tools. The hard parts are not the math:

- **Chunking.** Splitting documents into the right size of retrievable units. Too small, and chunks lose context. Too large, and you waste LLM context window on irrelevant content.
- **Citation.** Real systems show users which retrieved chunks the answer was based on, so people can verify rather than blindly trust.
- **Cost control.** Every retrieval-and-answer call has a measurable LLM cost. Caching, smaller models for cheap routes, larger models only for hard questions — operations engineering as much as ML.

<TryYourself>
  Pick the "Best language for ML" run. Look at which sentences were retrieved. Could you write the
  same answer just from those sentences? That's the point — a good retrieval makes the LLM's job
  easy, and a bad retrieval makes it impossible.
</TryYourself>

<Takeaways>
  <Takeaway>RAG = retrieve relevant chunks from a vector DB, feed them to an LLM with the question.</Takeaway>
  <Takeaway>
    The LLM stays static; you keep the system "current" by updating the documents you embed.
  </Takeaway>
  <Takeaway>
    Hardest parts in production are chunking, citing sources, and cost — not the vector math.
  </Takeaway>
</Takeaways>
```

- [ ] **Step 9.2:** Create TH MDX

```mdx
---
title: RAG (Retrieval-Augmented Generation)
slug: rag
group: real-world
order: 10
locale: th
summary: ต่อ LLM เข้ากับฐานข้อมูลเวกเตอร์ แล้วจู่ๆ มันก็ตอบคำถามเกี่ยวกับเอกสารส่วนตัวได้ โดยไม่ต้องฝึกโมเดลใหม่
hasInteractive: true
interactiveComponent: RagFlow
hasMath: false
---

import RagFlow from '../../../components/islands/RagFlow.svelte';
import TryYourself from '../../../components/mdx/TryYourself.astro';
import Takeaways from '../../../components/mdx/Takeaways.astro';
import Takeaway from '../../../components/mdx/Takeaway.astro';

## ทำความเข้าใจ

LLM (large language models) ถูกฝึกบน snapshot คงที่ของอินเทอร์เน็ต พวกมันเขียนเรื่องอะไรก็ได้ที่อยู่ใน snapshot นั้นได้อย่างคล่องแคล่ว แต่มีข้อจำกัดใหญ่ 2 อย่าง: ไม่รู้จักเอกสารส่วนตัวของเรา และไม่รู้อะไรที่เกิดขึ้นหลังวันที่ตัด training data

**Retrieval-Augmented Generation (RAG)** แก้ทั้งสองปัญหาด้วยการต่อ vector database เข้ากับ LLM Pipeline ทำงานดังนี้:

1. **Question** — ผู้ใช้ถามอะไรบางอย่าง
2. **Embed** — โมเดล embedding แปลงคำถามเป็นเวกเตอร์
3. **Retrieve** — ใช้เวกเตอร์นั้นไปดึง top-K chunks ที่ใกล้เคียงที่สุดจากเอกสารของเรา (ที่ embed ไว้ล่วงหน้าแล้ว)
4. **Answer** — เอาคำถาม + chunks ที่ดึงมาส่งให้ LLM ตอบคำถามโดยอ้างอิงจากข้อมูลเรา

LLM ไม่ต้องถูกฝึกใหม่ vector database ทำหน้าที่หนัก "โมเดลควรอ่านอะไรเพื่อจะตอบคำถามนี้" อัปเดตเอกสาร → embed chunks ที่เปลี่ยน → พรุ่งนี้เช้าโมเดลก็ตอบคำถามเกี่ยวกับเนื้อหาใหม่ได้

## ลองเล่นดู

<RagFlow client:visible />

เลือกคำถามและเดินดูผ่าน 4 ขั้นตอน ขั้น "Retrieve" ใช้ corpus 50 ประโยคเดียวกับหัวข้อก่อนหน้า ส่วนขั้น "Answer" เป็นข้อความที่เตรียมไว้ — การต่อ LLM จริงๆ เข้ามาในเดโม่แบบ static ต้องใช้ API key และ backend ซึ่งอยู่นอกขอบเขต production RAG ต่อ LLM เข้ามาที่จุดเดียวกัน

## ในโลกจริง

RAG เป็นพื้นฐานของฟีเจอร์ "AI assistant" ส่วนใหญ่ในรอบ 2 ปีที่ผ่านมา: support agent ที่เรียนจาก docs ของลูกค้า, code assistant ที่ดึงจาก codebase ส่วนตัว, ระบบ "ค้นพร้อมตอบ" ภายในองค์กร ส่วนยากๆ ไม่ใช่คณิตศาสตร์:

- **Chunking** — ตัดเอกสารเป็นชิ้นขนาดเหมาะสม เล็กไปก็ขาดบริบท ใหญ่ไปก็เปลือง context window ของ LLM
- **Citation** — ระบบจริงโชว์ให้ผู้ใช้เห็นว่าคำตอบมาจาก chunks ไหน เพื่อให้ตรวจสอบได้ ไม่ต้องเชื่อบอด
- **Cost control** — การ retrieve-and-answer แต่ละครั้งมีต้นทุน LLM ที่วัดได้ การ cache, ใช้โมเดลเล็กกับคำถามง่าย, ใช้โมเดลใหญ่เฉพาะคำถามยาก — เป็น operations engineering ไม่แพ้ ML

<TryYourself>
  เลือก demo run "Best language for ML" ดูว่าประโยคไหนถูก retrieve มาบ้าง คุณเขียนคำตอบเดียวกันได้จากประโยคเหล่านั้นไหม?
  นั่นคือประเด็น — retrieval ดี ทำให้ LLM ตอบง่าย retrieval แย่ ทำให้ตอบไม่ได้
</TryYourself>

<Takeaways>
  <Takeaway>RAG = ดึง chunks ที่เกี่ยวข้องจาก vector DB ส่งให้ LLM พร้อมกับคำถาม</Takeaway>
  <Takeaway>LLM ไม่เปลี่ยน เราอัปเดตระบบโดยอัปเดตเอกสารที่ embed</Takeaway>
  <Takeaway>
    ส่วนยากใน production คือ chunking, การอ้างอิงแหล่งที่มา, และต้นทุน — ไม่ใช่คณิตศาสตร์ของเวกเตอร์
  </Takeaway>
</Takeaways>
```

- [ ] **Step 9.3:** Build

```bash
pnpm build
```

Expected: validator reports `Topic validation passed (20 topics, 8 islands, MDX usage verified)`. 24 pages.

- [ ] **Step 9.4:** Commit

```bash
git add src/content/topics/th/10-rag.mdx src/content/topics/en/10-rag.mdx
git commit -m "feat(content): add Topic 10 (RAG) in TH and EN"
```

---

## Task 10: recommendations data generator (TDD)

**Files:** `src/lib/recommendations/data.ts`, `src/lib/recommendations/data.test.ts`

20 users × 30 items × 4-dim taste vectors. Dimensions are named so the demo can label them. Vectors come from a seeded mulberry32 with each component drawn from `[0, 1]` (uniform — clipped Gaussians felt over-engineered for "fake taste data").

- [ ] **Step 10.1:** Write failing tests in `src/lib/recommendations/data.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { generateRecommendationsData, TASTE_AXES } from './data';

describe('TASTE_AXES', () => {
  it('exposes 4 named taste dimensions', () => {
    expect(TASTE_AXES).toHaveLength(4);
    for (const a of TASTE_AXES) expect(typeof a).toBe('string');
  });
});

describe('generateRecommendationsData', () => {
  it('produces 20 users and 30 items by default', () => {
    const d = generateRecommendationsData();
    expect(d.users).toHaveLength(20);
    expect(d.items).toHaveLength(30);
  });

  it('every user and item has a 4-dim vector and a name', () => {
    const d = generateRecommendationsData();
    for (const u of d.users) {
      expect(u.name.length).toBeGreaterThan(0);
      expect(u.taste).toHaveLength(4);
      for (const v of u.taste) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
    for (const it of d.items) {
      expect(it.name.length).toBeGreaterThan(0);
      expect(it.taste).toHaveLength(4);
      for (const v of it.taste) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('is deterministic for a given seed', () => {
    const a = generateRecommendationsData({ seed: 7 });
    const b = generateRecommendationsData({ seed: 7 });
    expect(a).toEqual(b);
  });

  it('produces different data for different seeds', () => {
    const a = generateRecommendationsData({ seed: 1 });
    const b = generateRecommendationsData({ seed: 2 });
    expect(a.users[0].taste).not.toEqual(b.users[0].taste);
  });

  it('honors custom counts', () => {
    const d = generateRecommendationsData({ userCount: 5, itemCount: 8 });
    expect(d.users).toHaveLength(5);
    expect(d.items).toHaveLength(8);
  });
});
```

- [ ] **Step 10.2:** Run, verify failing.

- [ ] **Step 10.3:** Implement `src/lib/recommendations/data.ts`

```ts
import { mulberry32 } from '../math/random';

export const TASTE_AXES: readonly string[] = [
  'adventurous',
  'traditional',
  'technical',
  'artistic',
] as const;

export interface RecEntity {
  name: string;
  taste: number[];
}

export interface RecData {
  users: RecEntity[];
  items: RecEntity[];
  axes: readonly string[];
}

export interface GenerateOptions {
  seed?: number;
  userCount?: number;
  itemCount?: number;
}

const DEFAULT_SEED = 11;
const DEFAULT_USERS = 20;
const DEFAULT_ITEMS = 30;

function tasteVec(rng: () => number): number[] {
  return [rng(), rng(), rng(), rng()];
}

function userName(i: number): string {
  return `User ${String.fromCharCode('A'.charCodeAt(0) + i)}`;
}

function itemName(i: number): string {
  return `Item ${String(i + 1).padStart(2, '0')}`;
}

export function generateRecommendationsData(opts: GenerateOptions = {}): RecData {
  const seed = opts.seed ?? DEFAULT_SEED;
  const userCount = opts.userCount ?? DEFAULT_USERS;
  const itemCount = opts.itemCount ?? DEFAULT_ITEMS;
  const rng = mulberry32(seed);
  const users: RecEntity[] = [];
  for (let i = 0; i < userCount; i++) {
    users.push({ name: userName(i), taste: tasteVec(rng) });
  }
  const items: RecEntity[] = [];
  for (let i = 0; i < itemCount; i++) {
    items.push({ name: itemName(i), taste: tasteVec(rng) });
  }
  return { users, items, axes: TASTE_AXES };
}
```

- [ ] **Step 10.4:** Run, verify passing.

```bash
pnpm test src/lib/recommendations/data.test.ts
```

Expected: 6 tests green.

- [ ] **Step 10.5:** Commit

```bash
git add src/lib/recommendations/data.ts src/lib/recommendations/data.test.ts
git commit -m "feat(recommendations): add seeded synthetic users + items generator

20 users × 30 items × 4-dim taste vectors over named axes
(adventurous / traditional / technical / artistic). Deterministic per
seed so the demo renders the same data on every visit."
```

---

## Task 11: RecommendationsDemo island (TDD)

**Files:** `src/components/islands/RecommendationsDemo.svelte`, `src/components/islands/RecommendationsDemo.test.ts`

Picks one of the 20 users from a select, displays their 4-dim taste vector as labelled bars, ranks all 30 items by cosine similarity to the user's taste, and shows the top-5 with their similarity scores.

- [ ] **Step 11.1:** Write failing tests in `src/components/islands/RecommendationsDemo.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import RecommendationsDemo from './RecommendationsDemo.svelte';

describe('RecommendationsDemo', () => {
  it('renders a user picker with 20 options', () => {
    render(RecommendationsDemo);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.options.length).toBe(20);
  });

  it('shows the active user name in the picker', () => {
    render(RecommendationsDemo);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.options[select.selectedIndex].textContent).toMatch(/User A/);
  });

  it("renders the active user's 4 taste-axis labels", () => {
    render(RecommendationsDemo);
    expect(screen.getByText(/adventurous/i)).toBeInTheDocument();
    expect(screen.getByText(/traditional/i)).toBeInTheDocument();
    expect(screen.getByText(/technical/i)).toBeInTheDocument();
    expect(screen.getByText(/artistic/i)).toBeInTheDocument();
  });

  it('renders 5 recommendations with similarity scores', () => {
    render(RecommendationsDemo);
    const list = screen.getByTestId('rec-list');
    expect(list.querySelectorAll('li').length).toBe(5);
    // Each list item should mention an Item NN and contain a score.
    for (const li of list.querySelectorAll('li')) {
      expect(li.textContent).toMatch(/Item \d{2}/);
      expect(li.textContent).toMatch(/0\.\d{2}/);
    }
  });

  it('updates the recommendation list when a different user is selected', async () => {
    const user = userEvent.setup();
    render(RecommendationsDemo);
    const before = screen.getByTestId('rec-list').textContent;
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    await user.selectOptions(select, select.options[5].value);
    const after = screen.getByTestId('rec-list').textContent;
    expect(after).not.toBe(before);
  });

  it('orders recommendations by similarity (descending)', () => {
    render(RecommendationsDemo);
    const list = screen.getByTestId('rec-list');
    const scores: number[] = [];
    for (const li of list.querySelectorAll('li')) {
      const m = li.textContent?.match(/0\.\d{2}/);
      if (m) scores.push(Number(m[0]));
    }
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });
});
```

- [ ] **Step 11.2:** Run, verify failing.

- [ ] **Step 11.3:** Implement `src/components/islands/RecommendationsDemo.svelte`

```svelte
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
```

- [ ] **Step 11.4:** Run, verify passing.

```bash
pnpm test src/components/islands/RecommendationsDemo.test.ts
```

Expected: 6 tests green.

- [ ] **Step 11.5:** Commit

```bash
git add src/components/islands/RecommendationsDemo.svelte src/components/islands/RecommendationsDemo.test.ts
git commit -m "feat(island): add RecommendationsDemo (cosine ranking on synthetic taste vectors)

20 users × 30 items × 4 named taste axes from a seeded RNG. Pick a
user, see their 4-dim taste profile rendered as labelled bars, plus
the top-5 items ranked by cosine similarity to that profile."
```

---

## Task 12: Topic 11 — Recommendations (MDX)

**Files:** `src/content/topics/th/11-recommendations.mdx`, `src/content/topics/en/11-recommendations.mdx`

- [ ] **Step 12.1:** Create EN MDX

```mdx
---
title: Recommendations
slug: recommendations
group: real-world
order: 11
locale: en
summary: Why Netflix's "you might like" panel and your music app's daily mix both come down to the same cosine-similarity step.
hasInteractive: true
interactiveComponent: RecommendationsDemo
hasMath: false
---

import RecommendationsDemo from '../../../components/islands/RecommendationsDemo.svelte';
import TryYourself from '../../../components/mdx/TryYourself.astro';
import Takeaways from '../../../components/mdx/Takeaways.astro';
import Takeaway from '../../../components/mdx/Takeaway.astro';

## Intuition

The simplest recommender works like this: represent every user as a vector ("taste profile"), represent every item the same way ("what kind of thing this is"), and recommend whichever items have vectors most similar to the user's. That's it. Cosine similarity, applied to two sides of the same space.

In practice the vectors come from a model trained on user behavior — clicks, watches, skips, dwell time. The model learns to embed users and items into a shared space such that "users tend to like items their vectors point toward."

## Try it

<RecommendationsDemo client:visible />

We made up 20 users and 30 items. Each has a 4-dimensional taste profile over named axes — `adventurous`, `traditional`, `technical`, `artistic`. Pick a user, look at their bars, and check which items rise to the top. The numbers next to the items are cosine similarity scores; closer to 1.0 means closer to perfectly aligned with the user's taste.

The taste vectors here are deliberately fake. In a production system, those four numbers would be hundreds — too many for humans to interpret directly, but interpretable enough for the model.

## In the real world

The recommendation engines you experience daily layer cleverness on top of this:

- **Cold start.** New users have no behavior history, so their taste vector is close to the population average — not great. Systems handle this with onboarding questionnaires, content-based fallback recommendations, or "popular in your country" lists.
- **Diversity.** Pure top-K cosine pushes similar items to the top; users get bored. Real systems mix in some exploration to surface things the user wouldn't have asked for.
- **Negative feedback.** Items the user explicitly disliked feed back into their taste vector with negative weight. The model learns from "no" as well as "yes."
- **Time decay.** Yesterday's binge matters more than last year's, so older signals are weighted down.

But peel the onion and at the centre of every modern recommender, you'll find a vector store and a top-K cosine query.

<TryYourself>
  Pick the user whose `technical` bar is the longest. Are the recommended items the ones with the
  longest `technical` bar of their own? Now pick a user whose taste is balanced across all four
  axes. Is the top-K still a clean cluster, or is it more varied?
</TryYourself>

<Takeaways>
  <Takeaway>Recommenders embed users and items in a shared space and rank by similarity.</Takeaway>
  <Takeaway>
    The taste vectors are learned from behavior, not hand-authored — the model figures out what the
    axes "mean."
  </Takeaway>
  <Takeaway>
    Production systems wrap the cosine step with cold-start, diversity, negative feedback, and time
    decay — but the core math is what you just played with.
  </Takeaway>
</Takeaways>
```

- [ ] **Step 12.2:** Create TH MDX

```mdx
---
title: ระบบแนะนำ
slug: recommendations
group: real-world
order: 11
locale: th
summary: ทำไม "คุณอาจชอบ" ของ Netflix และ daily mix ของแอปเพลงโปรด ลึกๆ แล้วใช้ขั้นตอน cosine similarity แบบเดียวกัน
hasInteractive: true
interactiveComponent: RecommendationsDemo
hasMath: false
---

import RecommendationsDemo from '../../../components/islands/RecommendationsDemo.svelte';
import TryYourself from '../../../components/mdx/TryYourself.astro';
import Takeaways from '../../../components/mdx/Takeaways.astro';
import Takeaway from '../../../components/mdx/Takeaway.astro';

## ทำความเข้าใจ

ระบบแนะนำที่เรียบง่ายที่สุดทำงานแบบนี้: แทนผู้ใช้ทุกคนด้วยเวกเตอร์ ("รสนิยม"), แทนสินค้าทุกชิ้นด้วยเวกเตอร์เหมือนกัน ("สินค้านี้เป็นแบบไหน") แล้วแนะนำสินค้าที่เวกเตอร์ใกล้เคียงกับเวกเตอร์ของผู้ใช้มากที่สุด แค่นั้น Cosine similarity บนสองฝั่งของสเปซเดียวกัน

ในทางปฏิบัติ เวกเตอร์มาจากโมเดลที่ฝึกบนพฤติกรรมผู้ใช้ — การคลิก, การดู, การข้าม, เวลาที่อยู่บนหน้านั้น โมเดลเรียนรู้ที่จะ embed ผู้ใช้และสินค้าลงในสเปซที่ใช้ร่วมกัน เพื่อให้ "ผู้ใช้มักจะชอบสินค้าที่เวกเตอร์ของตนชี้ไปทาง"

## ลองเล่นดู

<RecommendationsDemo client:visible />

เราสมมติผู้ใช้ 20 คนและสินค้า 30 ชิ้น แต่ละคน/ชิ้นมีรสนิยม 4 มิติ บนแกนชื่อว่า `adventurous`, `traditional`, `technical`, `artistic` ลองเลือกผู้ใช้คนหนึ่ง ดู bar รสนิยมของเขา แล้วเช็คว่าสินค้าใดที่ขึ้นมาเป็น top-K ตัวเลขข้างชื่อสินค้าคือ cosine similarity ใกล้ 1.0 ยิ่งหมายถึงตรงรสนิยมของผู้ใช้

เวกเตอร์รสนิยมในเดโม่นี้เป็นข้อมูลสมมติ ในระบบจริงตัวเลขเหล่านี้จะมีหลายร้อยมิติ — มากเกินกว่าคนจะตีความตรงๆ ได้ แต่โมเดลตีความได้

## ในโลกจริง

ระบบแนะนำที่เราเจอทุกวันใส่ความฉลาดเพิ่มจากนี้:

- **Cold start** — ผู้ใช้ใหม่ไม่มีประวัติพฤติกรรม เวกเตอร์รสนิยมจึงใกล้เคียงค่าเฉลี่ยประชากร ไม่ค่อยดี ระบบจัดการด้วยแบบสอบถามเริ่มต้น, การแนะนำตาม content, หรือ "ฮิตในประเทศคุณ"
- **Diversity** — ใช้ top-K cosine แบบบริสุทธิ์ จะดันสินค้าที่คล้ายกันขึ้นมาเรื่อยๆ ผู้ใช้เบื่อ ระบบจริงผสมการสำรวจเข้าไปเพื่อโผล่สิ่งที่ผู้ใช้ไม่ได้ขอ
- **Negative feedback** — สินค้าที่ผู้ใช้ไม่ชอบป้อนกลับเข้าเวกเตอร์รสนิยมด้วยน้ำหนักลบ โมเดลเรียนจาก "ไม่ชอบ" เท่ากับเรียนจาก "ชอบ"
- **Time decay** — การ binge เมื่อวานสำคัญกว่าปีที่แล้ว สัญญาณเก่าจึงถูกชั่งน้ำหนักลง

แต่เปลือกนอกออกแล้ว ใจกลางของระบบแนะนำสมัยใหม่ทุกตัว คือ vector store และ top-K cosine

<TryYourself>
  เลือกผู้ใช้ที่ bar `technical` ยาวที่สุด สินค้าที่ถูกแนะนำมีค่า `technical` สูงที่สุดด้วยไหม? แล้วลองเลือกผู้ใช้ที่รสนิยมสมดุลทั้ง 4
  แกน top-K ยังเป็น cluster ใกล้กันหรือเริ่มกระจาย?
</TryYourself>

<Takeaways>
  <Takeaway>ระบบแนะนำ embed ผู้ใช้และสินค้าในสเปซเดียวกัน แล้วจัดอันดับด้วยความคล้าย</Takeaway>
  <Takeaway>
    เวกเตอร์รสนิยมเรียนจากพฤติกรรม ไม่ได้เขียนเอง — โมเดลคิดเองว่าแกนแต่ละแกนหมายถึงอะไร
  </Takeaway>
  <Takeaway>
    ระบบจริงห่อขั้น cosine ด้วย cold-start, diversity, negative feedback, time decay — แต่หัวใจคณิตศาสตร์
    คือสิ่งที่เพิ่งเล่นไป
  </Takeaway>
</Takeaways>
```

- [ ] **Step 12.3:** Build

```bash
pnpm build
```

Expected: validator reports `Topic validation passed (22 topics, 9 islands, MDX usage verified)`. 26 pages.

- [ ] **Step 12.4:** Commit

```bash
git add src/content/topics/th/11-recommendations.mdx src/content/topics/en/11-recommendations.mdx
git commit -m "feat(content): add Topic 11 (recommendations) in TH and EN"
```

---

## Task 13: README — note `sentences.json` in the fixture section

**Files:** `README.md`

The "Rebuilding embedding fixtures" section currently mentions only `words.json`. Update it so authors know the same `pnpm build:fixtures` invocation produces both fixtures, and call out the new triggers.

- [ ] **Step 13.1:** Open `README.md`. Find the "Rebuilding embedding fixtures" section. Replace its body with the version below (keep the section heading exactly as it is). The four-backtick wrapper below is so the README's own code fences nest correctly when copying — drop the wrapper.

````markdown
The two committed fixture files at `src/lib/embeddings/words.json` and `src/lib/embeddings/sentences.json` drive the EmbeddingMap, SemanticSearchDemo, and RagFlow islands. Both are produced offline by:

```bash
pnpm build:fixtures
```

A single invocation loads the embedding model once and writes both fixtures. Run it when one of the following changes:

- The curated word list in `scripts/embedding-words.ts`
- The sentence corpus or canned queries in `scripts/semantic-search-corpus.ts`
- The embedding model name in `scripts/build-fixtures.ts` (defaults to `Xenova/all-MiniLM-L6-v2`)
- The number of pre-computed neighbors / per-query top-K (`DEFAULT_K`, `DEFAULT_QUERY_K`)

The first run downloads the model (~25 MB) into a local cache. Subsequent runs are fast. The pipeline is **not** wired into `pnpm build` — `astro build` always reads the committed JSON and never reaches the network.

After regenerating, eyeball both files:

```bash
node -e "const w = require('./src/lib/embeddings/words.json'); const s = require('./src/lib/embeddings/sentences.json'); console.log('words:', w.meta); console.log('sentences:', s.meta);"
```

Commit both `words.json` and `sentences.json` together with whatever change triggered the rebuild.
````

- [ ] **Step 13.2:** Add `sentences.json` to `.prettierignore` so its multi-line array format stays stable across rebuilds (matches what M3 did for `words.json`). Edit `.prettierignore`:

Find the line:

```
src/lib/embeddings/words.json
```

Replace with:

```
src/lib/embeddings/words.json
src/lib/embeddings/sentences.json
```

- [ ] **Step 13.3:** Run `pnpm format:check`. If Prettier reformats the README, run `pnpm format` and re-stage.

- [ ] **Step 13.4:** Commit

```bash
git add README.md .prettierignore
git commit -m "docs(readme): document sentences.json in the fixture-rebuild section

A single pnpm build:fixtures invocation now produces both words.json
(M3) and sentences.json (M4). README enumerates the new triggers
that warrant a rebuild. Adds sentences.json to .prettierignore for
the same reason words.json was — JSON.stringify produces multi-line
arrays that Prettier would inline."
```

---

## Task 14: Final verification + manual walkthrough

**Files:** none

- [ ] **Step 14.1:** Full pipeline

```bash
pnpm format:check && pnpm typecheck && pnpm test && pnpm build
```

Expected:

- `format:check` clean
- `typecheck` 0 errors
- `test` — both projects green. Approximate count (M3 ~139 + new):
  - browser: previous 119 + 11 (word-overlap) + 4 (canned RAG) + 6 (rec data) + 5 (SemanticSearchDemo) + 7 (RagFlow) + 6 (RecommendationsDemo) ≈ **158 tests**
  - node: previous 12 + 5 (sentences fixture contract) = **17 node tests**
  - Total ≈ **175 tests**
- `build` produces 26 pages and reports `Topic validation passed (22 topics, 9 islands, MDX usage verified)`

If counts differ noticeably, investigate before declaring done.

- [ ] **Step 14.2:** Visual smoke (manual or curl-based)

Start the dev server in the background:

```bash
pnpm dev
```

Then for each of the six new pages, confirm the page returns 200 and that the expected island markers are present:

```bash
for url in /semantic-search /rag /recommendations /en/semantic-search /en/rag /en/recommendations; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4321${url}")
  echo "${url} -> ${code}"
done

# Spot-check islands rendered:
curl -s http://localhost:4321/semantic-search | grep -c 'data-testid="matched-query"'   # expect 1
curl -s http://localhost:4321/rag             | grep -c 'data-testid="step-label"'       # expect 1
curl -s http://localhost:4321/recommendations | grep -c 'data-testid="rec-list"'         # expect 1
```

Confirm:

- All six pages return 200
- Sidebar now shows the third group ("Real-world examples" / "ตัวอย่างจริง") with three topics
- Prev/Next: Topic 8 (`ann`) → 9 → 10 → 11, with no `Next` link on Topic 11
- LangSwitch flips locale and preserves slug

Stop the dev server.

---

## Verification checklist (run before declaring M4 done)

- [ ] `pnpm format:check` clean
- [ ] `pnpm typecheck` → 0 errors, 0 warnings, 0 hints
- [ ] `pnpm test` → both projects green; ~175 tests total
- [ ] `pnpm build` → 26 pages, validator reports `Topic validation passed (22 topics, 9 islands, MDX usage verified)`
- [ ] `src/lib/embeddings/sentences.json` exists, committed, `meta.dim === 384`, `meta.sentenceCount === 50`, `meta.queryCount === 20`
- [ ] Manual `pnpm dev` walkthrough of all three new topic pages in both locales
- [ ] CI workflow green on push to `main`
- [ ] No new `astro check` hints introduced

---

## Deferred follow-ups (for M5)

The following items were intentionally not addressed in M4. When picking up M5, scan this list and pull in anything that intersects the polish work.

1. **Path B for SemanticSearchDemo.** Lazy-load `transformers.js` (~5 MB) behind an "Enable live search" button so users can embed arbitrary queries in-browser. Spec §7 mentions it as stretch; deferred since M3.
2. **Per-locale sentence fixtures.** Current `sentences.json` is English; a Thai-native demo would either embed Thai text via a multilingual model (`paraphrase-multilingual-MiniLM-L12-v2`) or maintain parallel TH/EN fixtures.
3. **Citation UI in RagFlow.** Real RAG systems show users *which* retrieved sentence each clause of the answer was grounded in. Could overlay highlights on the Retrieve step's sentences when stepped to Answer.
4. **Diversity / negative-feedback toggles in RecommendationsDemo.** Spec §7 mentions the production complications; would make a great optional toggle to demonstrate "what changes when we mix in some exploration."
5. **CI fixture-drift check.** Run `pnpm build:fixtures` in CI on a schedule, diff against committed JSON, fail if drift exceeds a threshold. Spec §7 mentions this as optional. Especially valuable now that there are two fixtures.
6. **Bundle-size budget.** With `sentences.json` joining `words.json`, the per-page JSON payload on `embeddings`, `semantic-search`, and `rag` deserves a Lighthouse-CI guard once that lands in M5.
