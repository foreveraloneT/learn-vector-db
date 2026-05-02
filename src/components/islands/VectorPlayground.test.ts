import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import VectorPlayground from './VectorPlayground.svelte';

describe('VectorPlayground', () => {
  it('renders accessible x and y inputs', () => {
    render(VectorPlayground);
    expect(screen.getByLabelText(/^x/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^y/i)).toBeInTheDocument();
  });

  it('shows the L2 magnitude for the default vector (3, 2)', () => {
    render(VectorPlayground);
    // sqrt(13) ≈ 3.61
    expect(screen.getByTestId('magnitude').textContent).toMatch(/3\.61/);
  });

  it('shows the L1 norm for the default vector (3, 2)', () => {
    render(VectorPlayground);
    // |3| + |2| = 5
    expect(screen.getByTestId('l1norm').textContent).toMatch(/5\.00/);
  });

  it('updates magnitude when x is changed', async () => {
    const user = userEvent.setup();
    render(VectorPlayground);
    const x = screen.getByLabelText(/^x/i) as HTMLInputElement;
    await user.clear(x);
    await user.type(x, '0');
    // Now (0, 2) → magnitude 2
    expect(screen.getByTestId('magnitude').textContent).toMatch(/2\.00/);
  });

  it('updates L1 norm when y is changed to a negative value', async () => {
    const user = userEvent.setup();
    render(VectorPlayground);
    const y = screen.getByLabelText(/^y/i) as HTMLInputElement;
    await user.clear(y);
    await user.type(y, '-4');
    // (3, -4) → |3| + |-4| = 7
    expect(screen.getByTestId('l1norm').textContent).toMatch(/7\.00/);
  });
});
