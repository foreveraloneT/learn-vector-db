import { dot, normalize, scale, sub, type Vec } from './vec';

const ITERS = 200;
const EPS = 1e-12;

function columnMeans(data: number[][]): number[] {
  const dim = data[0].length;
  const means = new Array(dim).fill(0);
  for (const row of data) {
    for (let j = 0; j < dim; j++) means[j] += row[j];
  }
  for (let j = 0; j < dim; j++) means[j] /= data.length;
  return means;
}

function center(data: number[][], means: number[]): number[][] {
  return data.map((row) => sub(row, means));
}

/**
 * Computes (X^T X) v without materializing the dim x dim covariance matrix:
 * for each row r, accumulate (r . v) * r into the output.
 */
function covMul(centered: number[][], v: Vec): number[] {
  const dim = v.length;
  const out = new Array(dim).fill(0);
  for (const row of centered) {
    const s = dot(row, v);
    for (let j = 0; j < dim; j++) out[j] += s * row[j];
  }
  return out;
}

function powerIterate(centered: number[][], rng: () => number, iters = ITERS): number[] {
  const dim = centered[0].length;
  let v: number[] = new Array(dim);
  for (let i = 0; i < dim; i++) v[i] = rng() - 0.5;
  v = normalize(v);
  for (let k = 0; k < iters; k++) {
    const next = covMul(centered, v);
    let mag = 0;
    for (let j = 0; j < dim; j++) mag += next[j] * next[j];
    mag = Math.sqrt(mag);
    if (mag < EPS) return v; // degenerate input — keep the current direction
    for (let j = 0; j < dim; j++) next[j] /= mag;
    v = next;
  }
  return v;
}

function deflate(centered: number[][], pc: Vec): number[][] {
  return centered.map((row) => {
    const s = dot(row, pc);
    return sub(row, scale(pc, s));
  });
}

/**
 * Project rows of `data` onto their first two principal components.
 * Returns one `[x, y]` pair per row in the same order as the input.
 *
 * `rng` is a seeded PRNG (see `mulberry32`); seeding makes the projection
 * deterministic across runs, which matters because the result is committed
 * as a fixture.
 */
export function pca2d(data: number[][], rng: () => number): [number, number][] {
  if (data.length < 2) throw new Error('PCA needs at least 2 rows');
  const dim = data[0].length;
  for (const row of data) {
    if (row.length !== dim) {
      throw new Error(`Inconsistent row length: ${row.length} vs ${dim}`);
    }
  }
  const means = columnMeans(data);
  const centered = center(data, means);
  const pc1 = powerIterate(centered, rng);
  const deflated = deflate(centered, pc1);
  const pc2 = powerIterate(deflated, rng);
  return centered.map((row) => [dot(row, pc1), dot(row, pc2)]);
}
