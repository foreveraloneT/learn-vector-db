import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ThemeToggle from './ThemeToggle.svelte';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('renders a button with an accessible label', () => {
    render(ThemeToggle);
    expect(screen.getByRole('button', { name: /theme/i })).toBeInTheDocument();
  });

  it('adds the `dark` class to <html> when toggled on', async () => {
    const user = userEvent.setup();
    render(ThemeToggle);
    await user.click(screen.getByRole('button', { name: /theme/i }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes the `dark` class when toggled twice', async () => {
    const user = userEvent.setup();
    render(ThemeToggle);
    const btn = screen.getByRole('button', { name: /theme/i });
    await user.click(btn);
    await user.click(btn);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists the choice to localStorage', async () => {
    const user = userEvent.setup();
    render(ThemeToggle);
    await user.click(screen.getByRole('button', { name: /theme/i }));
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('reads the initial theme from localStorage on mount', () => {
    localStorage.setItem('theme', 'dark');
    render(ThemeToggle);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
