import { describe, it, expect } from 'vitest';
import { topicCardConfig } from './topic-card';

describe('topicCardConfig', () => {
  it('uses the topic title as the card title', () => {
    const cfg = topicCardConfig({
      title: 'Vector',
      summary: 'A vector is an arrow.',
      group: 'math',
      locale: 'en',
    });
    expect(cfg.title).toBe('Vector');
  });

  it('uses the topic summary as the description', () => {
    const cfg = topicCardConfig({
      title: 'Vector',
      summary: 'A vector is an arrow.',
      group: 'math',
      locale: 'en',
    });
    expect(cfg.description).toBe('A vector is an arrow.');
  });

  it('uses a locale-appropriate group label as the eyebrow text', () => {
    expect(topicCardConfig({ title: 'X', summary: 'y', group: 'math', locale: 'en' }).eyebrow).toBe(
      'Math foundations',
    );
    expect(
      topicCardConfig({ title: 'X', summary: 'y', group: 'vector-db', locale: 'en' }).eyebrow,
    ).toBe('Vector databases');
    expect(
      topicCardConfig({ title: 'X', summary: 'y', group: 'real-world', locale: 'th' }).eyebrow,
    ).toBe('ตัวอย่างจริง');
  });

  it('emits the canonical 1200×630 dimensions', () => {
    const cfg = topicCardConfig({ title: 'X', summary: 'y', group: 'math', locale: 'en' });
    expect(cfg.width).toBe(1200);
    expect(cfg.height).toBe(630);
  });

  it('emits a brand-coloured background', () => {
    const cfg = topicCardConfig({ title: 'X', summary: 'y', group: 'math', locale: 'en' });
    expect(cfg.bgGradient).toBeDefined();
    expect(cfg.bgGradient!.length).toBeGreaterThanOrEqual(2);
  });
});
