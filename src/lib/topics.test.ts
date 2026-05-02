import { describe, it, expect } from 'vitest';
import { getNeighbors, groupTopicsForSidebar, type TopicSummary } from './topics';

const sample: TopicSummary[] = [
  { slug: 'vector', title: 'Vector', group: 'math', order: 1, locale: 'en' },
  { slug: 'vector-operations', title: 'Vector ops', group: 'math', order: 2, locale: 'en' },
  { slug: 'distance-similarity', title: 'Distance', group: 'math', order: 3, locale: 'en' },
  { slug: 'embeddings', title: 'Embeddings', group: 'vector-db', order: 6, locale: 'en' },
  { slug: 'semantic-search', title: 'Semantic', group: 'real-world', order: 9, locale: 'en' },
];

describe('getNeighbors', () => {
  it('returns null prev and the next topic at order 1', () => {
    const { prev, next } = getNeighbors(sample, 1);
    expect(prev).toBeNull();
    expect(next?.slug).toBe('vector-operations');
  });

  it('returns prev and next when not at boundary', () => {
    const { prev, next } = getNeighbors(sample, 2);
    expect(prev?.slug).toBe('vector');
    expect(next?.slug).toBe('distance-similarity');
  });

  it('returns null next at the last topic', () => {
    const { prev, next } = getNeighbors(sample, 9);
    expect(prev?.slug).toBe('embeddings');
    expect(next).toBeNull();
  });

  it('handles non-contiguous orders (gaps allowed)', () => {
    const { prev, next } = getNeighbors(sample, 3);
    expect(prev?.slug).toBe('vector-operations');
    expect(next?.slug).toBe('embeddings'); // skips order 4 and 5 — they don't exist
  });
});

describe('groupTopicsForSidebar', () => {
  it('groups by group and sorts by order within each group', () => {
    const groups = groupTopicsForSidebar(sample);
    expect(groups).toHaveLength(3);
    expect(groups[0].group).toBe('math');
    expect(groups[0].topics.map((t) => t.slug)).toEqual([
      'vector',
      'vector-operations',
      'distance-similarity',
    ]);
    expect(groups[1].group).toBe('vector-db');
    expect(groups[2].group).toBe('real-world');
  });

  it('preserves the canonical group order even if input is shuffled', () => {
    const shuffled = [...sample].reverse();
    const groups = groupTopicsForSidebar(shuffled);
    expect(groups.map((g) => g.group)).toEqual(['math', 'vector-db', 'real-world']);
  });

  it('omits groups with no topics', () => {
    const onlyMath = sample.filter((t) => t.group === 'math');
    const groups = groupTopicsForSidebar(onlyMath);
    expect(groups).toHaveLength(1);
    expect(groups[0].group).toBe('math');
  });
});
