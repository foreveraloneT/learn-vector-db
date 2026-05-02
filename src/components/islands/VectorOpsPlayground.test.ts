import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import VectorOpsPlayground from './VectorOpsPlayground.svelte';

describe('VectorOpsPlayground', () => {
  it('renders four numeric inputs (a.x, a.y, b.x, b.y)', () => {
    render(VectorOpsPlayground);
    expect(screen.getByLabelText(/a\.x/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/a\.y/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/b\.x/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/b\.y/i)).toBeInTheDocument();
  });

  it('defaults to Add and shows a + b', () => {
    render(VectorOpsPlayground);
    // defaults: a=(2,1), b=(1,2) → result (3, 3)
    expect(screen.getByTestId('result').textContent).toMatch(/3\.00.*3\.00/);
  });

  it('switches to Sub and updates the result', async () => {
    const user = userEvent.setup();
    render(VectorOpsPlayground);
    await user.click(screen.getByLabelText(/subtract/i));
    // a=(2,1), b=(1,2) → a - b = (1, -1)
    expect(screen.getByTestId('result').textContent).toMatch(/1\.00.*-1\.00/);
  });

  it('switches to Dot and shows a scalar', async () => {
    const user = userEvent.setup();
    render(VectorOpsPlayground);
    await user.click(screen.getByLabelText(/dot/i));
    // a=(2,1) · b=(1,2) = 4
    expect(screen.getByTestId('result-scalar').textContent).toMatch(/4\.00/);
  });

  it('switches to Scale and respects the k slider', async () => {
    const user = userEvent.setup();
    render(VectorOpsPlayground);
    await user.click(screen.getByLabelText(/scale/i));
    // default k = 1, a = (2, 1) → (2, 1)
    expect(screen.getByTestId('result').textContent).toMatch(/2\.00.*1\.00/);
    const kInput = screen.getByLabelText(/^k/i) as HTMLInputElement;
    await user.clear(kInput);
    await user.type(kInput, '2');
    expect(screen.getByTestId('result').textContent).toMatch(/4\.00.*2\.00/);
  });
});
