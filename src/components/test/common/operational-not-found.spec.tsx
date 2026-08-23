import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { OperationalNotFound } from '@/components/common/operational-not-found';

describe('OperationalNotFound', () => {
  it('renders default workstation return button and custom description', () => {
    render(
      <OperationalNotFound
        workstationTitle="Kitchen Display (KDS)"
        backUrl="/admin/orders"
        description="Pesanan ini sudah selesai."
      />
    );

    expect(screen.getByText('Halaman Tidak Ditemukan')).toBeInTheDocument();
    expect(screen.getByText('Pesanan ini sudah selesai.')).toBeInTheDocument();
    
    const returnBtn = screen.getByRole('button', { name: /Kembali ke Kitchen Display \(KDS\)/i });
    expect(returnBtn).toBeInTheDocument();

    const link = returnBtn.closest('a');
    expect(link).toHaveAttribute('href', '/admin/orders');
  });

  it('renders custom backLabel when provided', () => {
    render(
      <OperationalNotFound
        workstationTitle="Denah Meja"
        backUrl="/admin/tables"
        backLabel="Kembali ke Layar Kasir Meja"
      />
    );

    expect(screen.getByText('Kembali ke Layar Kasir Meja')).toBeInTheDocument();
  });

  it('triggers window.history.back when clicking back link', async () => {
    const historyBackSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const user = userEvent.setup();

    render(
      <OperationalNotFound
        workstationTitle="Kitchen Display (KDS)"
        backUrl="/admin/orders"
      />
    );

    const backButton = screen.getByRole('button', { name: /Kembali ke layar sebelumnya/i });
    await user.click(backButton);

    expect(historyBackSpy).toHaveBeenCalled();
    historyBackSpy.mockRestore();
  });
});
