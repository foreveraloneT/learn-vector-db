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
