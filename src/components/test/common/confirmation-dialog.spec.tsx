import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { Trash2, AlertTriangle, Info, AlertCircle } from 'lucide-react';

describe('ConfirmationDialog Component', () => {
  it('does not render content when isOpen is false', () => {
    render(
      <ConfirmationDialog
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Hapus Item"
      />
    );

    expect(screen.queryByText('Hapus Item')).not.toBeInTheDocument();
  });

  it('renders title, description, and contextual children when isOpen is true', () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Konfirmasi Keluar Akun"
        description="Sesi Anda akan segera diakhiri."
      >
        <div data-testid="custom-context">Detail Pengguna: Admin</div>
      </ConfirmationDialog>
    );

    expect(screen.getByText('Konfirmasi Keluar Akun')).toBeInTheDocument();
    expect(screen.getByText('Sesi Anda akan segera diakhiri.')).toBeInTheDocument();
    expect(screen.getByTestId('custom-context')).toBeInTheDocument();
  });

  it('renders with danger variant and default danger styles', () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        variant="danger"
        title="Hapus Kategori"
        confirmText="Ya, Hapus"
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Ya, Hapus/i });
    expect(confirmBtn).toBeInTheDocument();
    expect(confirmBtn).toHaveClass('bg-red-600');
  });

  it('renders with warning variant styles', () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        variant="warning"
        title="Peringatan Perubahan"
        confirmText="Lanjutkan"
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Lanjutkan/i });
    expect(confirmBtn).toBeInTheDocument();
    expect(confirmBtn).toHaveClass('bg-amber-600');
  });

  it('renders with info variant styles', () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        variant="info"
        title="Informasi Sinkronisasi"
        confirmText="Mengerti"
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Mengerti/i });
    expect(confirmBtn).toBeInTheDocument();
    expect(confirmBtn).toHaveClass('bg-blue-600');
  });

  it('triggers onClose when Batal is clicked', () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <ConfirmationDialog
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Batal Aksi"
        cancelText="Batalkan"
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Batalkan/i });
    fireEvent.click(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleConfirm).not.toHaveBeenCalled();
  });

  it('triggers onConfirm when confirm button is clicked', async () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <ConfirmationDialog
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Konfirmasi Aksi"
        confirmText="Ya, Setuju"
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Ya, Setuju/i });
    fireEvent.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables buttons and displays loading text when isLoading is true', () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Menghapus Data"
        isLoading={true}
        loadingText="Sedang Menghapus..."
      />
    );

    expect(screen.getByText('Sedang Menghapus...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Batal/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Sedang Menghapus.../i })).toBeDisabled();
  });
});
