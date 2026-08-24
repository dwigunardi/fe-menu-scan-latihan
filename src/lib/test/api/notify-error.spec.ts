import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notifyApiError } from '@/lib/api/notify-error';
import { ApiError } from '@/lib/api/api-error';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('notifyApiError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('notifies for ApiError instances', () => {
    const error = new ApiError(404, 'Not Found', 'Data menu tidak ditemukan');
    notifyApiError(error);

    expect(toast.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        duration: 4500,
      })
    );
  });

  it('notifies for generic JS Error instances', () => {
    const error = new Error('Database connection failed');
    notifyApiError(error);

    expect(toast.error).toHaveBeenCalled();
  });

  it('notifies for unknown error objects', () => {
    notifyApiError('some mysterious string error');

    expect(toast.error).toHaveBeenCalled();
  });

  it('attaches action click callback when provided', () => {
    const onActionClick = vi.fn();
    const error = ApiError.networkError();

    notifyApiError(error, { onActionClick });

    expect(toast.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        action: expect.objectContaining({
          label: expect.any(String),
          onClick: onActionClick,
        }),
      })
    );
  });
});
