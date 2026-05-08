import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import RecommendationsDemo from './RecommendationsDemo.svelte';

describe('RecommendationsDemo', () => {
  it('renders a user picker with 20 options', () => {
    render(RecommendationsDemo);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.options.length).toBe(20);
  });

  it('shows the active user name in the picker', () => {
    render(RecommendationsDemo);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.options[select.selectedIndex].textContent).toMatch(/User A/);
  });

  it("renders the active user's 4 taste-axis labels", () => {
    render(RecommendationsDemo);
    expect(screen.getByText(/adventurous/i)).toBeInTheDocument();
    expect(screen.getByText(/traditional/i)).toBeInTheDocument();
    expect(screen.getByText(/technical/i)).toBeInTheDocument();
    expect(screen.getByText(/artistic/i)).toBeInTheDocument();
  });

  it('renders 5 recommendations with similarity scores', () => {
    render(RecommendationsDemo);
    const list = screen.getByTestId('rec-list');
    expect(list.querySelectorAll('li').length).toBe(5);
    // Each list item should mention an Item NN and contain a score.
    for (const li of list.querySelectorAll('li')) {
      expect(li.textContent).toMatch(/Item \d{2}/);
      expect(li.textContent).toMatch(/0\.\d{2}/);
    }
  });

  it('updates the recommendation list when a different user is selected', async () => {
    const user = userEvent.setup();
    render(RecommendationsDemo);
    const before = screen.getByTestId('rec-list').textContent;
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    await user.selectOptions(select, select.options[5].value);
    const after = screen.getByTestId('rec-list').textContent;
    expect(after).not.toBe(before);
  });

  it('orders recommendations by similarity (descending)', () => {
    render(RecommendationsDemo);
    const list = screen.getByTestId('rec-list');
    const scores: number[] = [];
    for (const li of list.querySelectorAll('li')) {
      const m = li.textContent?.match(/0\.\d{2}/);
      if (m) scores.push(Number(m[0]));
    }
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });
});
