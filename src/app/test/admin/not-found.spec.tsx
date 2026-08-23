import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AdminNotFound from '@/app/(admin)/admin/not-found';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/unknown-section',
}));

describe('AdminNotFound (Admin 404)', () => {
  it('renders incident card with requested path and action buttons', () => {
    render(<AdminNotFound />);

    expect(screen.getByText('Halaman Admin Tidak Ditemukan')).toBeInTheDocument();
    expect(screen.getByText('HTTP 404')).toBeInTheDocument();
    expect(screen.getByText('/admin/unknown-section')).toBeInTheDocument();

    const dashboardBtn = screen.getByRole('button', { name: /Kembali ke Dashboard/i });
    expect(dashboardBtn.closest('a')).toHaveAttribute('href', '/admin/dashboard');

    const menusBtn = screen.getByRole('button', { name: /Katalog Menu/i });
    expect(menusBtn.closest('a')).toHaveAttribute('href', '/admin/menus');
  });

  it('triggers back navigation on history button click', async () => {
    const historyBackSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const user = userEvent.setup();

    render(<AdminNotFound />);

    const backBtn = screen.getByRole('button', { name: /Kembali ke menu sebelumnya/i });
    await user.click(backBtn);

    expect(historyBackSpy).toHaveBeenCalled();
    historyBackSpy.mockRestore();
  });
});
