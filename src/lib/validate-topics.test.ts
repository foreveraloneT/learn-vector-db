import { describe, it, expect } from 'vitest';
import { validateTopicParity, type ValidatableTopic } from './validate-topics';

const okTopics: ValidatableTopic[] = [
  { slug: 'vector', locale: 'th', order: 1, interactiveComponent: undefined },
  { slug: 'vector', locale: 'en', order: 1, interactiveComponent: undefined },
];

describe('validateTopicParity', () => {
  it('passes when every slug has both locales and orders are unique per locale', () => {
    const result = validateTopicParity(okTopics, ['VectorPlayground']);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('fails when a slug is missing in one locale', () => {
    const topics: ValidatableTopic[] = [
      { slug: 'vector', locale: 'th', order: 1 },
      // no en/vector
    ];
    const result = validateTopicParity(topics, []);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Missing translation: slug "vector" exists in th but not en');
  });

  it('fails on duplicate order within a locale', () => {
    const topics: ValidatableTopic[] = [
      { slug: 'vector', locale: 'th', order: 1 },
      { slug: 'vector-operations', locale: 'th', order: 1 },
      { slug: 'vector', locale: 'en', order: 1 },
      { slug: 'vector-operations', locale: 'en', order: 2 },
    ];
    const result = validateTopicParity(topics, []);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('Duplicate order 1 in locale "th"'))).toBe(true);
  });

  it('fails when interactiveComponent name is not in the registry', () => {
    const topics: ValidatableTopic[] = [
      { slug: 'vector', locale: 'th', order: 1, interactiveComponent: 'NopeComponent' },
      { slug: 'vector', locale: 'en', order: 1, interactiveComponent: 'NopeComponent' },
    ];
    const result = validateTopicParity(topics, ['VectorPlayground']);
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes('Unknown interactiveComponent "NopeComponent"')),
    ).toBe(true);
  });

  it('passes when interactiveComponent name is in the registry', () => {
    const topics: ValidatableTopic[] = [
      { slug: 'vector', locale: 'th', order: 1, interactiveComponent: 'VectorPlayground' },
      { slug: 'vector', locale: 'en', order: 1, interactiveComponent: 'VectorPlayground' },
    ];
    const result = validateTopicParity(topics, ['VectorPlayground']);
    expect(result.ok).toBe(true);
  });
});
