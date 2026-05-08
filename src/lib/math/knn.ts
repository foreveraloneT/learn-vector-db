import { euclidean } from './metrics';
import type { Vec } from './vec';

export interface KnnResult {
  indices: number[];
  distances: number[];
}

export interface GreedyResult extends KnnResult {
  /** Sequence of node indices visited from `entry` to the converged node. */
  path: number[];
}

export function exactKnn(points: readonly Vec[], query: Vec, k: number): KnnResult {
  if (k <= 0) throw new Error('k must be positive');
  const scored = points.map((p, i) => ({ i, d: euclidean(p, query) }));
  scored.sort((a, b) => a.d - b.d);
  const trimmed = scored.slice(0, Math.min(k, points.length));
  return {
    indices: trimmed.map((s) => s.i),
    distances: trimmed.map((s) => s.d),
  };
}

/**
 * Builds an undirected k-NN graph over `points`. Each entry is the union of
 * its outgoing top-k neighbors and any other point that includes it among
 * its top-k — guaranteeing edge symmetry.
 */
export function buildKnnGraph(points: readonly Vec[], k: number): number[][] {
  const out: Set<number>[] = points.map(() => new Set<number>());
  for (let i = 0; i < points.length; i++) {
    const top = exactKnn(points, points[i], k + 1)
      .indices.filter((j) => j !== i)
      .slice(0, k);
    for (const j of top) {
      out[i].add(j);
      out[j].add(i); // symmetric union
    }
  }
  return out.map((set) => [...set]);
}

/**
 * Greedy graph search: from `entry`, repeatedly hop to the neighbor closest
 * to `query` until no neighbor improves the distance. Returns the top-k
 * closest *visited* points and the sequence of hops.
 */
export function greedyGraphKnn(
  points: readonly Vec[],
  graph: readonly number[][],
  entry: number,
  query: Vec,
  k: number,
): GreedyResult {
  if (k <= 0) throw new Error('k must be positive');
  if (entry < 0 || entry >= points.length) throw new Error(`entry ${entry} out of range`);

  const visited = new Set<number>([entry]);
  const path: number[] = [entry];
  let current = entry;
  let currentDist = euclidean(points[entry], query);

  while (true) {
    let bestNext = -1;
    let bestDist = currentDist;
    for (const j of graph[current]) {
      if (visited.has(j)) continue;
      const d = euclidean(points[j], query);
      if (d < bestDist) {
        bestDist = d;
        bestNext = j;
      }
    }
    if (bestNext === -1) break;
    visited.add(bestNext);
    path.push(bestNext);
    current = bestNext;
    currentDist = bestDist;
  }

  // Top-k among visited nodes (so we always return at most k results).
  const scored = [...visited].map((i) => ({ i, d: euclidean(points[i], query) }));
  scored.sort((a, b) => a.d - b.d);
  const trimmed = scored.slice(0, Math.min(k, scored.length));
  return {
    indices: trimmed.map((s) => s.i),
    distances: trimmed.map((s) => s.d),
    path,
  };
}
