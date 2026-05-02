import { describe, it, expect } from 'vitest';
import { mulberry32, randomUnitVector, randomUnitVectors } from './random';
import { magnitude } from './vec';

describe('mulberry32', () => {
  it('produces deterministic output for a given seed', () => {
    const r1 = mulberry32(42);
    const r2 = mulberry32(42);
    const a = [r1(), r1(), r1()];
    const b = [r2(), r2(), r2()];
    expect(a).toEqual(b);
  });
  it('produces values in [0, 1)', () => {
    const r = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('produces different sequences for different seeds', () => {
    const r1 = mulberry32(1);
    const r2 = mulberry32(2);
    expect(r1()).not.toBe(r2());
  });
});

describe('randomUnitVector', () => {
  it('returns a vector of the requested dimension', () => {
    const v = randomUnitVector(7, mulberry32(1));
    expect(v).toHaveLength(7);
  });
  it('returns a unit vector', () => {
    const v = randomUnitVector(10, mulberry32(123));
    expect(magnitude(v)).toBeCloseTo(1, 10);
  });
  it('is deterministic for a given seed', () => {
    const a = randomUnitVector(5, mulberry32(99));
    const b = randomUnitVector(5, mulberry32(99));
    expect(a).toEqual(b);
  });
});

describe('randomUnitVectors', () => {
  it('returns n vectors of the requested dimension', () => {
    const vs = randomUnitVectors(20, 4, mulberry32(7));
    expect(vs).toHaveLength(20);
    for (const v of vs) {
      expect(v).toHaveLength(4);
      expect(magnitude(v)).toBeCloseTo(1, 10);
    }
  });
  it('is deterministic for a given seed', () => {
    const a = randomUnitVectors(5, 3, mulberry32(2));
    const b = randomUnitVectors(5, 3, mulberry32(2));
    expect(a).toEqual(b);
  });
});
