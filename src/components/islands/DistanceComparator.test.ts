import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import DistanceComparator from './DistanceComparator.svelte';

describe('DistanceComparator', () => {
  it('shows three metrics for the default points', () => {
    render(DistanceComparator);
    // defaults: p = (3, 0), q = (0, 4)
    // euclidean = 5, manhattan = 7, cosine sim = 0
    expect(screen.getByTestId('euclidean').textContent).toMatch(/5\.00/);
    expect(screen.getByTestId('manhattan').textContent).toMatch(/7\.00/);
    expect(screen.getByTestId('cosine').textContent).toMatch(/0\.00/);
  });

  it('updates all three metrics when p moves to the origin', async () => {
    const user = userEvent.setup();
    render(DistanceComparator);
    const px = screen.getByLabelText(/p\.x/i) as HTMLInputElement;
    const py = screen.getByLabelText(/p\.y/i) as HTMLInputElement;
    await user.clear(px);
    await user.type(px, '0');
    await user.clear(py);
    await user.type(py, '0');
    // p = (0, 0), q = (0, 4) → euclidean = 4, manhattan = 4, cosine = 0 (zero vec)
    expect(screen.getByTestId('euclidean').textContent).toMatch(/4\.00/);
    expect(screen.getByTestId('manhattan').textContent).toMatch(/4\.00/);
    expect(screen.getByTestId('cosine').textContent).toMatch(/0\.00/);
  });

  it('shows cosine = 1 when p and q point the same way', async () => {
    const user = userEvent.setup();
    render(DistanceComparator);
    const qx = screen.getByLabelText(/q\.x/i) as HTMLInputElement;
    const qy = screen.getByLabelText(/q\.y/i) as HTMLInputElement;
    await user.clear(qx);
    await user.type(qx, '6');
    await user.clear(qy);
    await user.type(qy, '0');
    // p = (3, 0), q = (6, 0) → same direction → cosine sim = 1
    expect(screen.getByTestId('cosine').textContent).toMatch(/1\.00/);
  });
});
