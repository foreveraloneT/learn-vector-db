import wordsJson from './words.json';

/**
 * Shape of a single word entry in the committed fixture.
 *
 * Kept in sync with `WordEntry` in `scripts/build-fixtures.ts` — when the
 * pipeline schema changes, update both. The duplication is deliberate: the
 * runtime should not import from `scripts/`.
 */
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
    builtAt: string;
  };
  words: WordEntry[];
}

export const wordsFixture: WordsFixture = wordsJson as WordsFixture;
