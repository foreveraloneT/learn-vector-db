import { describe, it, expect } from 'vitest';
import { generateRecommendationsData, TASTE_AXES } from './data';

describe('TASTE_AXES', () => {
  it('exposes 4 named taste dimensions', () => {
    expect(TASTE_AXES).toHaveLength(4);
    for (const a of TASTE_AXES) expect(typeof a).toBe('string');
  });
});

describe('generateRecommendationsData', () => {
  it('produces 20 users and 30 items by default', () => {
    const d = generateRecommendationsData();
    expect(d.users).toHaveLength(20);
    expect(d.items).toHaveLength(30);
  });

  it('every user and item has a 4-dim vector and a name', () => {
    const d = generateRecommendationsData();
    for (const u of d.users) {
      expect(u.name.length).toBeGreaterThan(0);
      expect(u.taste).toHaveLength(4);
      for (const v of u.taste) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
    for (const it of d.items) {
      expect(it.name.length).toBeGreaterThan(0);
      expect(it.taste).toHaveLength(4);
      for (const v of it.taste) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('is deterministic for a given seed', () => {
    const a = generateRecommendationsData({ seed: 7 });
    const b = generateRecommendationsData({ seed: 7 });
    expect(a).toEqual(b);
  });

  it('produces different data for different seeds', () => {
    const a = generateRecommendationsData({ seed: 1 });
    const b = generateRecommendationsData({ seed: 2 });
    expect(a.users[0].taste).not.toEqual(b.users[0].taste);
  });

  it('honors custom counts', () => {
    const d = generateRecommendationsData({ userCount: 5, itemCount: 8 });
    expect(d.users).toHaveLength(5);
    expect(d.items).toHaveLength(8);
  });
});
