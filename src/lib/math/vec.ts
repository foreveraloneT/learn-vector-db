export type Vec = readonly number[];

function assertSameLength(a: Vec, b: Vec): void {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }
}

export function add(a: Vec, b: Vec): number[] {
  assertSameLength(a, b);
  return a.map((v, i) => v + b[i]);
}

export function sub(a: Vec, b: Vec): number[] {
  assertSameLength(a, b);
  return a.map((v, i) => v - b[i]);
}

export function scale(v: Vec, k: number): number[] {
  return v.map((x) => x * k);
}

export function dot(a: Vec, b: Vec): number {
  assertSameLength(a, b);
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

export function magnitude(v: Vec): number {
  return Math.sqrt(dot(v, v));
}

export function l1norm(v: Vec): number {
  let sum = 0;
  for (const x of v) sum += Math.abs(x);
  return sum;
}

export function normalize(v: Vec): number[] {
  const m = magnitude(v);
  if (m === 0) throw new Error('Cannot normalize zero vector');
  return v.map((x) => x / m);
}
