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
