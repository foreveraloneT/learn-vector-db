import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('../../lib/embeddings/sentences-loader', () => ({
  sentencesFixture: {
    meta: {
      model: 'mock',
      dim: 4,
      sentenceCount: 4,
      queryCount: 2,
      builtAt: '2026-05-08T00:00:00Z',
    },
    sentences: [
      { text: 'Python is great for machine learning.' },
      { text: 'Rust offers memory safety without garbage collection.' },
      { text: 'Sushi is a Japanese rice and fish dish.' },
      { text: 'Marathons are over forty kilometers long.' },
    ],
    queries: [
      { text: 'best language for machine learning', top: [0, 1, 2, 3] },
      { text: 'famous Japanese food', top: [2, 0, 1, 3] },
    ],
  },
}));

import SemanticSearchDemo from './SemanticSearchDemo.svelte';

describe('SemanticSearchDemo', () => {
  it('renders an input and the empty-state hint by default', () => {
    render(SemanticSearchDemo);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByTestId('matched-query').textContent).toMatch(/start typing|type|—/i);
  });

  it('matches user input to the closest canned query', async () => {
    const user = userEvent.setup();
    render(SemanticSearchDemo);
    const input = screen.getByRole('textbox');
    await user.type(input, 'machine learning python');
    expect(screen.getByTestId('matched-query').textContent).toMatch(/machine learning/i);
  });

  it('renders the top-K sentences for the matched query', async () => {
    const user = userEvent.setup();
    render(SemanticSearchDemo);
    await user.type(screen.getByRole('textbox'), 'machine learning');
    const list = screen.getByTestId('result-list').textContent ?? '';
    expect(list).toMatch(/Python/);
  });

  it('switches results when input matches a different query', async () => {
    const user = userEvent.setup();
    render(SemanticSearchDemo);
    const input = screen.getByRole('textbox');
    await user.type(input, 'Japanese');
    const text = screen.getByTestId('matched-query').textContent ?? '';
    expect(text.toLowerCase()).toContain('japanese');
    expect(screen.getByTestId('result-list').textContent).toMatch(/Sushi/);
  });

  it('shows a no-match message when no canned query overlaps', async () => {
    const user = userEvent.setup();
    render(SemanticSearchDemo);
    await user.type(screen.getByRole('textbox'), 'xyzzy plugh');
    expect(screen.getByTestId('matched-query').textContent).toMatch(/no match|couldn't|nothing/i);
  });
});
