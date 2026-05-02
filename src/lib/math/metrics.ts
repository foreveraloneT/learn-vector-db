import { dot, magnitude, sub, l1norm, type Vec } from './vec';

export function euclidean(a: Vec, b: Vec): number {
  return magnitude(sub(a, b));
}

export function manhattan(a: Vec, b: Vec): number {
  return l1norm(sub(a, b));
}

export function cosineSimilarity(a: Vec, b: Vec): number {
  const ma = magnitude(a);
  const mb = magnitude(b);
  if (ma === 0 || mb === 0) return 0;
  return dot(a, b) / (ma * mb);
}

export function cosineDistance(a: Vec, b: Vec): number {
  return 1 - cosineSimilarity(a, b);
}
