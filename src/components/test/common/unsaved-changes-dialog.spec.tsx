import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UnsavedChangesDialog } from '@/components/common/unsaved-changes-dialog';

const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

describe('UnsavedChangesDialog Component & Guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, '', '/admin/settings/branch');
  });

  it('does not open dialog when isDirty is false', () => {
    render(
      <div>
        <UnsavedChangesDialog isDirty={false} />
        <a href="/admin/dashboard">Ke Dashboard</a>
      </div>
    );

    const link = screen.getByText('Ke Dashboard');
    fireEvent.click(link);

    expect(screen.queryByText(/Perubahan Belum Disimpan/i)).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('intercepts internal link click and opens dialog when isDirty is true', async () => {
    render(
      <div>
        <UnsavedChangesDialog isDirty={true} />
        <a href="/admin/dashboard">Ke Dashboard</a>
      </div>
    );

    const link = screen.getByText('Ke Dashboard');
    fireEvent.click(link);

    // Dialog is visible via Radix Portal
    expect(await screen.findByText('Perubahan Belum Disimpan')).toBeInTheDocument();
    expect(
      screen.getByText(/Anda memiliki perubahan formulir yang belum disimpan/i)
    ).toBeInTheDocument();
  });

  it('closes dialog and stays on page when "Tetap di Sini" is clicked', async () => {
    render(
      <div>
        <UnsavedChangesDialog isDirty={true} />
        <a href="/admin/dashboard">Ke Dashboard</a>
      </div>
    );

    const link = screen.getByText('Ke Dashboard');
    fireEvent.click(link);

    const cancelBtn = await screen.findByRole('button', { name: /Tetap di Sini/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('Perubahan Belum Disimpan')).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('proceeds with navigation when "Lanjutkan Keluar" is clicked', async () => {
    render(
      <div>
        <UnsavedChangesDialog isDirty={true} />
        <a href="/admin/dashboard">Ke Dashboard</a>
      </div>
    );

    const link = screen.getByText('Ke Dashboard');
    fireEvent.click(link);

    const confirmBtn = await screen.findByRole('button', { name: /Lanjutkan Keluar/i });
    fireEvent.click(confirmBtn);

    expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('attaches and detaches beforeunload event listener based on isDirty', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { rerender, unmount } = render(<UnsavedChangesDialog isDirty={true} />);

    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    rerender(<UnsavedChangesDialog isDirty={false} />);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    unmount();
  });
});
