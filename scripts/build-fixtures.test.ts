import { describe, it, expect } from 'vitest';
import { assembleWordsFixture, assembleSentencesFixture } from './build-fixtures';
import { EMBEDDING_WORDS } from './embedding-words';
import { SENTENCES, QUERIES } from './semantic-search-corpus';

/**
 * Fake embedder: assigns each word a deterministic 4-dim vector so the
 * test runs in milliseconds. Cluster shape: each cluster gets a distinct
 * one-hot-ish basis so PCA and neighbor lookup behave predictably.
 */
function fakeEmbedder(): (word: string) => number[] {
  const dims = 4;
  return (word: string) => {
    const idx = EMBEDDING_WORDS.indexOf(word);
    if (idx < 0) throw new Error(`Unknown word: ${word}`);
    const cluster = Math.floor(idx / 8); // 0..3
    const v = new Array(dims).fill(0);
    v[cluster % dims] = 1;
    // Tiny within-cluster jitter so PCA finds meaningful structure.
    v[(cluster + 1) % dims] = (idx % 8) * 0.01;
    return v;
  };
}

describe('assembleWordsFixture', () => {
  it('produces one entry per input word in the same order', async () => {
    const fixture = await assembleWordsFixture(EMBEDDING_WORDS, fakeEmbedder(), { seed: 1 });
    expect(fixture.words).toHaveLength(EMBEDDING_WORDS.length);
    fixture.words.forEach((entry, i) => {
      expect(entry.word).toBe(EMBEDDING_WORDS[i]);
    });
  });

  it('includes 2D coords for every entry', async () => {
    const fixture = await assembleWordsFixture(EMBEDDING_WORDS, fakeEmbedder(), { seed: 1 });
    for (const entry of fixture.words) {
      expect(typeof entry.x).toBe('number');
      expect(typeof entry.y).toBe('number');
      expect(Number.isFinite(entry.x)).toBe(true);
      expect(Number.isFinite(entry.y)).toBe(true);
    }
  });

  it('includes top-K neighbor indices that are in-range and exclude self', async () => {
    const K = 5;
    const fixture = await assembleWordsFixture(EMBEDDING_WORDS, fakeEmbedder(), { seed: 1, k: K });
    fixture.words.forEach((entry, i) => {
      expect(entry.neighbors).toHaveLength(K);
      for (const j of entry.neighbors) {
        expect(j).toBeGreaterThanOrEqual(0);
        expect(j).toBeLessThan(EMBEDDING_WORDS.length);
        expect(j).not.toBe(i);
      }
      // Neighbors should be unique.
      expect(new Set(entry.neighbors).size).toBe(K);
    });
  });

  it('groups intra-cluster neighbors together with the fake embedder', async () => {
    const fixture = await assembleWordsFixture(EMBEDDING_WORDS, fakeEmbedder(), { seed: 1, k: 3 });
    // The fake embedder makes every cluster a one-hot basis; the top-3
    // neighbors of any word should all live in the same cluster of 8 (or 6
    // for the last cluster).
    fixture.words.forEach((entry, i) => {
      const cluster = Math.floor(i / 8);
      for (const j of entry.neighbors) {
        expect(Math.floor(j / 8)).toBe(cluster);
      }
    });
  });

  it('records the embedding dimension and model name in the metadata', async () => {
    const fixture = await assembleWordsFixture(EMBEDDING_WORDS, fakeEmbedder(), {
      seed: 1,
      modelName: 'fake-test-embedder',
    });
    expect(fixture.meta.dim).toBe(4);
    expect(fixture.meta.model).toBe('fake-test-embedder');
    expect(fixture.meta.count).toBe(EMBEDDING_WORDS.length);
  });

  it('produces deterministic output for a given seed', async () => {
    const a = await assembleWordsFixture(EMBEDDING_WORDS, fakeEmbedder(), { seed: 42 });
    const b = await assembleWordsFixture(EMBEDDING_WORDS, fakeEmbedder(), { seed: 42 });
    // builtAt may differ — strip it for comparison.
    expect({ ...a, meta: { ...a.meta, builtAt: '' } }).toEqual({
      ...b,
      meta: { ...b.meta, builtAt: '' },
    });
  });
});

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
