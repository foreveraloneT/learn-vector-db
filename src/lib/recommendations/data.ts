import { mulberry32 } from '../math/random';

export const TASTE_AXES: readonly string[] = [
  'adventurous',
  'traditional',
  'technical',
  'artistic',
] as const;

export interface RecEntity {
  name: string;
  taste: number[];
}

export interface RecData {
  users: RecEntity[];
  items: RecEntity[];
  axes: readonly string[];
}

export interface GenerateOptions {
  seed?: number;
  userCount?: number;
  itemCount?: number;
}

const DEFAULT_SEED = 11;
const DEFAULT_USERS = 20;
const DEFAULT_ITEMS = 30;

function tasteVec(rng: () => number): number[] {
  return [rng(), rng(), rng(), rng()];
}

function userName(i: number): string {
  return `User ${String.fromCharCode('A'.charCodeAt(0) + i)}`;
}

function itemName(i: number): string {
  return `Item ${String(i + 1).padStart(2, '0')}`;
}

export function generateRecommendationsData(opts: GenerateOptions = {}): RecData {
  const seed = opts.seed ?? DEFAULT_SEED;
  const userCount = opts.userCount ?? DEFAULT_USERS;
  const itemCount = opts.itemCount ?? DEFAULT_ITEMS;
  const rng = mulberry32(seed);
  const users: RecEntity[] = [];
  for (let i = 0; i < userCount; i++) {
    users.push({ name: userName(i), taste: tasteVec(rng) });
  }
  const items: RecEntity[] = [];
  for (let i = 0; i < itemCount; i++) {
    items.push({ name: itemName(i), taste: tasteVec(rng) });
  }
  return { users, items, axes: TASTE_AXES };
}
