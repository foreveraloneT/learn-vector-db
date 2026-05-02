/**
 * Mulberry32 PRNG: small, fast, good enough for visualization.
 * Returns a function that yields values in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Standard-normal sample via Box-Muller. Each call yields one number.
 */
function gaussian(rng: () => number): number {
  const u1 = Math.max(rng(), Number.EPSILON);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Uniform-on-sphere sample: draw n iid Gaussians, then normalize.
 * Falls back to e₀ = [1, 0, …] on the astronomically rare zero draw.
 */
export function randomUnitVector(dim: number, rng: () => number): number[] {
  const raw: number[] = new Array(dim);
  for (let i = 0; i < dim; i++) raw[i] = gaussian(rng);
  const m = Math.sqrt(raw.reduce((s, x) => s + x * x, 0));
  if (m === 0) {
    const fallback = new Array(dim).fill(0);
    fallback[0] = 1;
    return fallback;
  }
  return raw.map((x) => x / m);
}

export function randomUnitVectors(n: number, dim: number, rng: () => number): number[][] {
  const out: number[][] = new Array(n);
  for (let i = 0; i < n; i++) out[i] = randomUnitVector(dim, rng);
  return out;
}
