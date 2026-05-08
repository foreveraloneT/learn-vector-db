/// <reference types="node" />
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { mulberry32 } from '../src/lib/math/random';
import { pca2d } from '../src/lib/math/pca';
import { exactKnn } from '../src/lib/math/knn';
import { cosineSimilarity } from '../src/lib/math/metrics';
import { EMBEDDING_WORDS } from './embedding-words';
import { SENTENCES, QUERIES } from './semantic-search-corpus';

const DEFAULT_MODEL = 'Xenova/all-MiniLM-L6-v2';
const DEFAULT_K = 5;

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../src/lib/embeddings/words.json');

export interface WordEntry {
  word: string;
  x: number;
  y: number;
  neighbors: number[];
}

export interface WordsFixture {
  meta: {
    model: string;
    dim: number;
    count: number;
    /** ISO-8601 timestamp; helpful for debugging without affecting determinism. */
    builtAt: string;
  };
  words: WordEntry[];
}

export interface AssembleOptions {
  seed: number;
  k?: number;
  modelName?: string;
}

export type Embedder = (word: string) => number[] | Promise<number[]>;

/**
 * Pure assembly: takes a word list and an embedder, returns the fixture.
 * Tested with a fake embedder; production uses an @xenova/transformers
 * embedder built in `main`.
 */
export async function assembleWordsFixture(
  words: readonly string[],
  embed: Embedder,
  opts: AssembleOptions,
): Promise<WordsFixture> {
  const k = opts.k ?? DEFAULT_K;
  const modelName = opts.modelName ?? DEFAULT_MODEL;

  // 1. Embed every word in input order.
  const embeddings: number[][] = [];
  for (const word of words) {
    const v = await embed(word);
    embeddings.push(v);
  }
  const dim = embeddings[0]?.length ?? 0;

  // 2. PCA-project to 2D for the scatter.
  const projected = pca2d(embeddings, mulberry32(opts.seed));

  // 3. Pre-compute top-k neighbors in the *original* (high-dim) space.
  const neighbors: number[][] = embeddings.map((vec, i) => {
    const result = exactKnn(embeddings, vec, k + 1);
    return result.indices.filter((j) => j !== i).slice(0, k);
  });

  return {
    meta: {
      model: modelName,
      dim,
      count: words.length,
      builtAt: new Date().toISOString(),
    },
    words: words.map((word, i) => ({
      word,
      x: projected[i][0],
      y: projected[i][1],
      neighbors: neighbors[i],
    })),
  };
}

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

/**
 * Lazily build the production embedder. Imported on demand so the test file
 * never pulls in @xenova/transformers (the model download would balloon the
 * Vitest run).
 */
async function buildXenovaEmbedder(modelName: string): Promise<Embedder> {
  const { pipeline } = await import('@xenova/transformers');
  const extractor = await pipeline('feature-extraction', modelName);
  return async (word: string) => {
    const output = await extractor(word, { pooling: 'mean', normalize: true });
    return Array.from(output.data as Float32Array);
  };
}

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
  await writeFile(SENTENCES_OUTPUT_PATH, JSON.stringify(sentencesFixture, null, 2) + '\n', 'utf-8');
  console.log(
    `[build-fixtures] Wrote ${SENTENCES_OUTPUT_PATH} (${sentencesFixture.sentences.length} sentences, ${sentencesFixture.queries.length} queries, ${sentencesFixture.meta.dim}-dim)`,
  );
}

// Run main() only when invoked as a script (not when imported by tests).
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
