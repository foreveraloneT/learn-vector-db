export type Vec = readonly number[];

function assertSameLength(a: Vec, b: Vec): void {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }
}

export function add(a: Vec, b: Vec): number[] {
  assertSameLength(a, b);
  const out: number[] = new Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] + b[i];
  return out;
}

export function sub(a: Vec, b: Vec): number[] {
  assertSameLength(a, b);
  const out: number[] = new Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] - b[i];
  return out;
}

export function scale(v: Vec, k: number): number[] {
  const out: number[] = new Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] * k;
  return out;
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
  for (let i = 0; i < v.length; i++) sum += Math.abs(v[i]);
  return sum;
}

export function normalize(v: Vec): number[] {
  const m = magnitude(v);
  if (m === 0) throw new Error('Cannot normalize zero vector');
  const out: number[] = new Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / m;
  return out;
}
