import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import DashboardNotFound from '@/app/(dashboard)/not-found';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/unknown-section',
}));

describe('DashboardNotFound (Dashboard 404)', () => {
  it('renders incident card with requested path and action buttons', () => {
    render(<DashboardNotFound />);

    expect(screen.getByText('Halaman Portal Tidak Ditemukan')).toBeInTheDocument();
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

    render(<DashboardNotFound />);

    const backBtn = screen.getByRole('button', { name: /Kembali ke menu sebelumnya/i });
    await user.click(backBtn);

    expect(historyBackSpy).toHaveBeenCalled();
    historyBackSpy.mockRestore();
  });
});
