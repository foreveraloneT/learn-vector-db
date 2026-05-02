import { describe, it, expect } from 'vitest';
import { euclidean, manhattan, cosineSimilarity, cosineDistance } from './metrics';

describe('euclidean', () => {
  it('returns 0 for identical points', () => {
    expect(euclidean([1, 2], [1, 2])).toBe(0);
  });
  it('returns the L2 distance', () => {
    expect(euclidean([0, 0], [3, 4])).toBe(5);
  });
  it('throws on length mismatch', () => {
    expect(() => euclidean([1], [1, 2])).toThrow(/length/i);
  });
});

describe('manhattan', () => {
  it('returns 0 for identical points', () => {
    expect(manhattan([1, 2], [1, 2])).toBe(0);
  });
  it('returns the L1 distance', () => {
    expect(manhattan([0, 0], [3, 4])).toBe(7);
  });
  it('handles negative coords', () => {
    expect(manhattan([-1, -1], [1, 1])).toBe(4);
  });
});

describe('cosineSimilarity', () => {
  it('returns 1 for identical direction', () => {
    expect(cosineSimilarity([1, 0], [2, 0])).toBeCloseTo(1, 10);
  });
  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 10);
  });
  it('returns -1 for opposite direction', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 10);
  });
  it('returns 0 when either vector is zero', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
    expect(cosineSimilarity([1, 1], [0, 0])).toBe(0);
  });
});

describe('cosineDistance', () => {
  it('returns 0 for identical direction', () => {
    expect(cosineDistance([1, 0], [2, 0])).toBeCloseTo(0, 10);
  });
  it('returns 1 for orthogonal vectors', () => {
    expect(cosineDistance([1, 0], [0, 1])).toBeCloseTo(1, 10);
  });
  it('returns 2 for opposite direction', () => {
    expect(cosineDistance([1, 0], [-1, 0])).toBeCloseTo(2, 10);
  });
});
