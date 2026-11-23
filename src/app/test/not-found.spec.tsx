import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import RootNotFound from '@/app/not-found';

describe('RootNotFound (Public 404)', () => {
  it('renders 404 badge, friendly headline, animated cup, and action links', () => {
    render(<RootNotFound />);

    expect(screen.getByText(/Error 404 • Halaman Tidak Ditemukan/i)).toBeInTheDocument();
    expect(screen.getByText(/Ups! Racikan Halaman Tidak Ditemukan/i)).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();

    // The public menu route does not exist yet, so the 404 page must not link to it.
    expect(screen.queryByRole('button', { name: /Buka Menu Kafe/i })).not.toBeInTheDocument();

    const homeButton = screen.getByRole('button', { name: /Halaman Depan/i });
    expect(homeButton.closest('a')).toHaveAttribute('href', '/');
  });

  it('navigates back on back hint click', async () => {
    const historyBackSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const user = userEvent.setup();

    render(<RootNotFound />);

    const backBtn = screen.getByRole('button', { name: /Kembali ke halaman sebelumnya/i });
    await user.click(backBtn);

    expect(historyBackSpy).toHaveBeenCalled();
    historyBackSpy.mockRestore();
  });
});
