import { describe, it, expect } from 'vitest';
import { add, sub, scale, dot, magnitude, l1norm, normalize } from './vec';

describe('add', () => {
  it('adds element-wise', () => {
    expect(add([1, 2], [3, 4])).toEqual([4, 6]);
  });
  it('works on n-dim vectors', () => {
    expect(add([1, 2, 3], [10, 20, 30])).toEqual([11, 22, 33]);
  });
  it('throws on length mismatch', () => {
    expect(() => add([1, 2], [3, 4, 5])).toThrow(/length/i);
  });
});

describe('sub', () => {
  it('subtracts element-wise', () => {
    expect(sub([5, 7], [1, 2])).toEqual([4, 5]);
  });
  it('throws on length mismatch', () => {
    expect(() => sub([1], [2, 3])).toThrow(/length/i);
  });
});

describe('scale', () => {
  it('multiplies each element by k', () => {
    expect(scale([1, 2, 3], 2)).toEqual([2, 4, 6]);
  });
  it('handles negative scalar', () => {
    expect(scale([1, -2], -1)).toEqual([-1, 2]);
  });
  it('handles zero scalar', () => {
    expect(scale([4, 5], 0)).toEqual([0, 0]);
  });
});

describe('dot', () => {
  it('returns the dot product', () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
  });
  it('returns 0 for orthogonal vectors', () => {
    expect(dot([1, 0], [0, 1])).toBe(0);
  });
  it('throws on length mismatch', () => {
    expect(() => dot([1, 2], [3])).toThrow(/length/i);
  });
});

describe('magnitude', () => {
  it('returns the L2 norm', () => {
    expect(magnitude([3, 4])).toBe(5);
  });
  it('returns 0 for the zero vector', () => {
    expect(magnitude([0, 0, 0])).toBe(0);
  });
  it('handles n-dim', () => {
    expect(magnitude([1, 1, 1, 1])).toBeCloseTo(2, 10);
  });
});

describe('l1norm', () => {
  it('returns the sum of absolute values', () => {
    expect(l1norm([1, -2, 3])).toBe(6);
  });
  it('returns 0 for the zero vector', () => {
    expect(l1norm([0, 0])).toBe(0);
  });
});

describe('normalize', () => {
  it('returns a unit vector', () => {
    const n = normalize([3, 4]);
    expect(magnitude(n)).toBeCloseTo(1, 10);
    expect(n).toEqual([0.6, 0.8]);
  });
  it('throws on the zero vector', () => {
    expect(() => normalize([0, 0])).toThrow(/zero/i);
  });
});
