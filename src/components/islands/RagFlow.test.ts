import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

vi.mock('../../lib/embeddings/sentences-loader', () => ({
  sentencesFixture: {
    meta: {
      model: 'mock',
      dim: 4,
      sentenceCount: 4,
      queryCount: 0,
      builtAt: '2026-05-08T00:00:00Z',
    },
    sentences: [
      { text: 'Sentence zero.' },
      { text: 'Sentence one.' },
      { text: 'Sentence two.' },
      { text: 'Sentence three.' },
    ],
    queries: [],
  },
}));

vi.mock('../../lib/rag/canned', () => ({
  CANNED_RAG_RUNS: [
    {
      question: 'Question A?',
      retrieved: [0, 1],
      answer: 'Answer A.',
    },
    {
      question: 'Question B?',
      retrieved: [2, 3],
      answer: 'Answer B.',
    },
  ],
}));

import RagFlow from './RagFlow.svelte';

describe('RagFlow', () => {
  it('starts on step 1 (Question)', () => {
    render(RagFlow);
    expect(screen.getByTestId('step-label').textContent).toMatch(/question/i);
    expect(screen.getByTestId('step-body').textContent).toMatch(/Question A/);
  });

  it('advances to step 2 (Embed) on Next', async () => {
    const user = userEvent.setup();
    render(RagFlow);
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByTestId('step-label').textContent).toMatch(/embed/i);
  });

  it('shows retrieved sentences on step 3 (Retrieve)', async () => {
    const user = userEvent.setup();
    render(RagFlow);
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByTestId('step-label').textContent).toMatch(/retrieve/i);
    const body = screen.getByTestId('step-body').textContent ?? '';
    expect(body).toMatch(/Sentence zero/);
    expect(body).toMatch(/Sentence one/);
  });

  it('shows the canned answer on step 4 (Answer)', async () => {
    const user = userEvent.setup();
    render(RagFlow);
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByTestId('step-label').textContent).toMatch(/answer/i);
    expect(screen.getByTestId('step-body').textContent).toMatch(/Answer A/);
  });

  it('disables Next on the last step', async () => {
    const user = userEvent.setup();
    render(RagFlow);
    const nextBtn = screen.getByRole('button', { name: /next/i }) as HTMLButtonElement;
    await user.click(nextBtn);
    await user.click(nextBtn);
    await user.click(nextBtn);
    expect(nextBtn.disabled).toBe(true);
  });

  it('disables Prev on the first step', () => {
    render(RagFlow);
    const prevBtn = screen.getByRole('button', { name: /prev|previous/i }) as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
  });

  it('switches the active run when the dropdown changes and resets to step 1', async () => {
    const user = userEvent.setup();
    render(RagFlow);
    // Advance, then switch run
    await user.click(screen.getByRole('button', { name: /next/i }));
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    await user.selectOptions(select, '1');
    expect(screen.getByTestId('step-label').textContent).toMatch(/question/i);
    expect(screen.getByTestId('step-body').textContent).toMatch(/Question B/);
  });
});
