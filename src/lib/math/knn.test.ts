import { describe, it, expect } from 'vitest';
import { exactKnn, buildKnnGraph, greedyGraphKnn } from './knn';

const grid = [
  [0, 0],
  [1, 0],
  [2, 0],
  [0, 1],
  [1, 1],
  [2, 1],
  [0, 2],
  [1, 2],
  [2, 2],
];

describe('exactKnn', () => {
  it('returns the k nearest indices in ascending distance', () => {
    const result = exactKnn(grid, [0.1, 0.1], 3);
    expect(result.indices).toEqual([0, 1, 3]);
    // (1, 0) and (0, 1) are equidistant from (0.1, 0.1), so the second and
    // third distances tie — strict less-than would be wrong here.
    expect(result.distances[0]).toBeLessThan(result.distances[1]);
    expect(result.distances[1]).toBeLessThanOrEqual(result.distances[2]);
  });

  it('returns at most points.length results when k exceeds the dataset', () => {
    const result = exactKnn(grid, [0, 0], 100);
    expect(result.indices).toHaveLength(grid.length);
  });

  it('throws when k is non-positive', () => {
    expect(() => exactKnn(grid, [0, 0], 0)).toThrow(/positive/i);
  });
});

describe('buildKnnGraph', () => {
  it('produces one non-empty neighbor list per point', () => {
    const g = buildKnnGraph(grid, 3);
    expect(g).toHaveLength(grid.length);
    // After the symmetric-union step, lists can exceed k. With ties on a
    // regular grid, a central node can collect every other node as a
    // neighbor, so the only meaningful bound is N - 1.
    for (const list of g) {
      expect(list.length).toBeGreaterThan(0);
      expect(list.length).toBeLessThanOrEqual(grid.length - 1);
    }
  });

  it('does not include the point itself in its own neighbor list', () => {
    const g = buildKnnGraph(grid, 4);
    g.forEach((list, i) => {
      expect(list).not.toContain(i);
    });
  });

  it('makes the graph undirected (edges symmetric after union)', () => {
    const g = buildKnnGraph(grid, 2);
    for (let i = 0; i < g.length; i++) {
      for (const j of g[i]) {
        expect(g[j]).toContain(i);
      }
    }
  });

  it("contains each node's original top-k as a subset of its neighbor list", () => {
    const g = buildKnnGraph(grid, 3);
    g.forEach((list, i) => {
      const directTop = exactKnn(grid, grid[i], 4)
        .indices.filter((j) => j !== i)
        .slice(0, 3);
      for (const j of directTop) expect(list).toContain(j);
    });
  });
});

describe('greedyGraphKnn', () => {
  it('finds the exact nearest point in a small grid', () => {
    const graph = buildKnnGraph(grid, 3);
    const result = greedyGraphKnn(grid, graph, 8, [0.1, 0.1], 1);
    expect(result.indices).toEqual([0]);
    expect(result.path[0]).toBe(8); // started at the entry
    expect(result.path[result.path.length - 1]).toBe(0); // ended at the answer
  });

  it('records the hop path including the entry node', () => {
    const graph = buildKnnGraph(grid, 3);
    const result = greedyGraphKnn(grid, graph, 0, [2, 2], 1);
    expect(result.path[0]).toBe(0);
    expect(result.path.length).toBeGreaterThan(1);
  });

  it('returns at most k indices', () => {
    const graph = buildKnnGraph(grid, 4);
    const result = greedyGraphKnn(grid, graph, 0, [1, 1], 3);
    expect(result.indices.length).toBeLessThanOrEqual(3);
  });

  it('throws when entry is out of range', () => {
    const graph = buildKnnGraph(grid, 3);
    expect(() => greedyGraphKnn(grid, graph, 999, [0, 0], 1)).toThrow(/entry/i);
  });
});
