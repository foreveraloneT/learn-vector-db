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
