import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import DashboardNotFound from '@/app/(dashboard)/not-found';
import * as navigationModule from 'next/navigation';

let mockCurrentPath = '/admin/unknown-section';
vi.mock('next/navigation', () => ({
  usePathname: () => mockCurrentPath,
}));

describe('DashboardNotFound (Dashboard 404)', () => {
  it('renders incident card with requested path and action buttons', () => {
    mockCurrentPath = '/admin/unknown-section';
    render(<DashboardNotFound />);

    expect(screen.getByText('Halaman Portal Tidak Ditemukan')).toBeInTheDocument();
    expect(screen.getByText('HTTP 404')).toBeInTheDocument();
    expect(screen.getByText('/admin/unknown-section')).toBeInTheDocument();

    const dashboardBtn = screen.getByRole('button', { name: /Kembali ke Dashboard/i });
    expect(dashboardBtn.closest('a')).toHaveAttribute('href', '/admin/dashboard');

    const menusBtn = screen.getByRole('button', { name: /Katalog Menu/i });
    expect(menusBtn.closest('a')).toHaveAttribute('href', '/admin/menus');
  });

  it('renders fallback path when pathname is empty', () => {
    mockCurrentPath = '';
    render(<DashboardNotFound />);

    expect(screen.getByText('/dashboard/*')).toBeInTheDocument();
  });

  it('triggers back navigation on history button click', async () => {
    mockCurrentPath = '/admin/unknown-section';
    const historyBackSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const user = userEvent.setup();

    render(<DashboardNotFound />);

    const backBtn = screen.getByRole('button', { name: /Kembali ke menu sebelumnya/i });
    await user.click(backBtn);

    expect(historyBackSpy).toHaveBeenCalled();
    historyBackSpy.mockRestore();
  });
});
