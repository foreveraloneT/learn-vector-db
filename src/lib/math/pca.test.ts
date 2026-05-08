import { describe, it, expect } from 'vitest';
import { pca2d } from './pca';
import { mulberry32 } from './random';

describe('pca2d', () => {
  it('returns one [x, y] pair per input row', () => {
    const data = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const projected = pca2d(data, mulberry32(1));
    expect(projected).toHaveLength(3);
    for (const p of projected) expect(p).toHaveLength(2);
  });

  it('separates two clearly-clustered inputs along PC1', () => {
    // Two tight clusters along the first axis; PC1 should align with that axis.
    const cluster = (cx: number) =>
      Array.from({ length: 10 }, (_, i) => [cx + (i % 2) * 0.01, (i % 3) * 0.01, 0]);
    const data = [...cluster(0), ...cluster(10)];
    const projected = pca2d(data, mulberry32(2));

    const left = projected.slice(0, 10).map((p) => p[0]);
    const right = projected.slice(10).map((p) => p[0]);
    const meanLeft = left.reduce((s, x) => s + x, 0) / left.length;
    const meanRight = right.reduce((s, x) => s + x, 0) / right.length;

    expect(Math.abs(meanLeft - meanRight)).toBeGreaterThan(5);
  });

  it('produces deterministic output for a given seed', () => {
    const data = Array.from({ length: 8 }, (_, i) => [Math.sin(i), Math.cos(i), i / 10]);
    const a = pca2d(data, mulberry32(7));
    const b = pca2d(data, mulberry32(7));
    expect(a).toEqual(b);
  });

  it('throws when given fewer than 2 rows', () => {
    expect(() => pca2d([[1, 2, 3]], mulberry32(1))).toThrow(/at least 2/i);
  });

  it('throws when rows have inconsistent lengths', () => {
    expect(() =>
      pca2d(
        [
          [1, 2],
          [3, 4, 5],
        ],
        mulberry32(1),
      ),
    ).toThrow(/length/i);
  });
});
