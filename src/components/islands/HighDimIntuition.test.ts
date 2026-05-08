import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import HighDimIntuition from './HighDimIntuition.svelte';

describe('HighDimIntuition', () => {
  it('renders a dimension slider with default value 2', () => {
    render(HighDimIntuition);
    const slider = screen.getByLabelText(/dimension slider/i) as HTMLInputElement;
    expect(slider).toBeInTheDocument();
    expect(slider.value).toBe('2');
  });

  it('renders a histogram with 21 bins', () => {
    render(HighDimIntuition);
    const bins = screen.getAllByTestId('histogram-bin');
    expect(bins.length).toBe(21);
  });

  it('mean cosine similarity stays near 0 at high dim', async () => {
    const user = userEvent.setup();
    render(HighDimIntuition);
    const numInput = screen.getByRole('spinbutton', {
      name: /dimension.*numeric/i,
    }) as HTMLInputElement;
    await user.clear(numInput);
    await user.type(numInput, '100');
    const meanText = screen.getByTestId('mean-cosine').textContent ?? '';
    const mean = parseFloat(meanText.replace(/[^-0-9.]/g, ''));
    expect(Math.abs(mean)).toBeLessThan(0.05);
  });
});
