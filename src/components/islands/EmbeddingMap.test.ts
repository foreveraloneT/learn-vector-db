import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('../../lib/embeddings/words-loader', () => ({
  wordsFixture: {
    meta: { model: 'mock', dim: 4, count: 4, builtAt: '2026-05-07T00:00:00Z' },
    words: [
      { word: 'cat', x: -1, y: 1, neighbors: [1] },
      { word: 'dog', x: -1.1, y: 1.1, neighbors: [0] },
      { word: 'pizza', x: 1, y: -1, neighbors: [3] },
      { word: 'burger', x: 1.1, y: -1.1, neighbors: [2] },
    ],
  },
}));

import EmbeddingMap from './EmbeddingMap.svelte';

describe('EmbeddingMap', () => {
  it('renders one focusable button per word', () => {
    render(EmbeddingMap);
    expect(screen.getByRole('button', { name: /cat/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dog/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pizza/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /burger/i })).toBeInTheDocument();
  });

  it('shows the empty-selection hint by default', () => {
    render(EmbeddingMap);
    expect(screen.getByTestId('selected-word').textContent).toMatch(/hover|none|—/i);
  });

  it('updates the selection readout when a word is clicked', async () => {
    const user = userEvent.setup();
    render(EmbeddingMap);
    await user.click(screen.getByRole('button', { name: /cat/i }));
    expect(screen.getByTestId('selected-word').textContent).toMatch(/cat/i);
  });

  it('lists pre-computed neighbors of the selected word', async () => {
    const user = userEvent.setup();
    render(EmbeddingMap);
    await user.click(screen.getByRole('button', { name: /cat/i }));
    expect(screen.getByTestId('neighbor-list').textContent).toMatch(/dog/i);
  });

  it('switches the neighbor list when a different word is selected', async () => {
    const user = userEvent.setup();
    render(EmbeddingMap);
    await user.click(screen.getByRole('button', { name: /pizza/i }));
    expect(screen.getByTestId('neighbor-list').textContent).toMatch(/burger/i);
    expect(screen.getByTestId('neighbor-list').textContent).not.toMatch(/dog/i);
  });
});
