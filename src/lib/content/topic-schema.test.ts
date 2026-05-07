import { describe, it, expect } from 'vitest';
import { topicSchema } from './topic-schema';

const minimalValid = {
  title: 'Vector',
  slug: 'vector',
  group: 'math' as const,
  order: 1,
  locale: 'th' as const,
  summary: 'A vector is an arrow.',
};

describe('topicSchema', () => {
  it('accepts a minimal valid topic and applies defaults', () => {
    const parsed = topicSchema.parse(minimalValid);
    expect(parsed.hasInteractive).toBe(false);
    expect(parsed.hasMath).toBe(false);
    expect(parsed.interactiveComponent).toBeUndefined();
    expect(parsed.updated).toBeUndefined();
  });

  it('rejects an unknown group', () => {
    expect(() => topicSchema.parse({ ...minimalValid, group: 'recipes' })).toThrow();
  });

  it('rejects an unknown locale', () => {
    expect(() => topicSchema.parse({ ...minimalValid, locale: 'fr' })).toThrow();
  });

  it('rejects a non-integer order', () => {
    expect(() => topicSchema.parse({ ...minimalValid, order: 1.5 })).toThrow();
  });

  it('rejects a non-positive order', () => {
    expect(() => topicSchema.parse({ ...minimalValid, order: 0 })).toThrow();
    expect(() => topicSchema.parse({ ...minimalValid, order: -1 })).toThrow();
  });

  it('rejects a missing required field', () => {
    const { summary: _drop, ...withoutSummary } = minimalValid;
    expect(() => topicSchema.parse(withoutSummary)).toThrow();
  });

  it('accepts an interactive topic with a component name', () => {
    const parsed = topicSchema.parse({
      ...minimalValid,
      hasInteractive: true,
      interactiveComponent: 'VectorPlayground',
    });
    expect(parsed.hasInteractive).toBe(true);
    expect(parsed.interactiveComponent).toBe('VectorPlayground');
  });

  it('coerces an updated date string into a Date instance', () => {
    const parsed = topicSchema.parse({ ...minimalValid, updated: '2026-05-07' });
    expect(parsed.updated).toBeInstanceOf(Date);
    expect(parsed.updated?.toISOString()).toMatch(/^2026-05-07T/);
  });
});
