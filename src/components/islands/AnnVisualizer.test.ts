import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import AnnVisualizer from './AnnVisualizer.svelte';

describe('AnnVisualizer', () => {
  it('renders an exact-search readout and a greedy-search readout', () => {
    render(AnnVisualizer);
    expect(screen.getByTestId('exact-top')).toBeInTheDocument();
    expect(screen.getByTestId('greedy-top')).toBeInTheDocument();
  });

  it('shows a finite, non-negative hop count for the default query', () => {
    render(AnnVisualizer);
    const hops = Number(screen.getByTestId('greedy-hops').textContent);
    // Greedy always converges (no node is its own neighbor), so hops is bounded
    // by N. We avoid asserting `> 0` because a default query that happens to
    // sit closest to the entry node would converge in zero hops.
    expect(Number.isFinite(hops)).toBe(true);
    expect(hops).toBeGreaterThanOrEqual(0);
    expect(hops).toBeLessThan(200);
  });

  it('shows accuracy as a value between 0 and 1', () => {
    render(AnnVisualizer);
    const acc = Number(screen.getByTestId('greedy-accuracy').textContent);
    expect(acc).toBeGreaterThanOrEqual(0);
    expect(acc).toBeLessThanOrEqual(1);
  });

  it('updates the readouts when the query position changes', async () => {
    const user = userEvent.setup();
    render(AnnVisualizer);
    const before = screen.getByTestId('greedy-top').textContent;
    const qx = screen.getByLabelText(/query.*x/i) as HTMLInputElement;
    await user.clear(qx);
    await user.type(qx, '4');
    const after = screen.getByTestId('greedy-top').textContent;
    expect(after).not.toBe(before);
  });

  it('updates the exact top-K when the query moves to a different corner', async () => {
    const user = userEvent.setup();
    render(AnnVisualizer);
    const beforeExact = screen.getByTestId('exact-top').textContent;
    const qx = screen.getByLabelText(/query.*x/i) as HTMLInputElement;
    const qy = screen.getByLabelText(/query.*y/i) as HTMLInputElement;
    // Move from default (2, 2) to the opposite corner so the nearest
    // neighbors must be different points: with 200 uniform points in
    // [-5, 5]^2, the top-5 around (-4, -4) cannot overlap with the top-5
    // around (2, 2).
    await user.clear(qx);
    await user.type(qx, '-4');
    await user.clear(qy);
    await user.type(qy, '-4');
    const afterExact = screen.getByTestId('exact-top').textContent;
    expect(afterExact).not.toBe(beforeExact);
  });
});
