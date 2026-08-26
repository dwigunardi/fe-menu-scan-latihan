import { toast } from 'sonner';
import { ApiError } from './api-error';
import { translateErrorToFriendlyMessage } from './error-translator';

export interface NotifyErrorOptions {
  fallbackMessage?: string;
  onActionClick?: () => void;
}

/**
 * Displays a friendly, accessible Sonner Toast alert for any ApiError or Error.
 */
export function notifyApiError(
  error: ApiError | Error | unknown,
  options?: NotifyErrorOptions
): void {
  const apiError =
    error instanceof ApiError
      ? error
      : error instanceof Error
      ? new ApiError(500, 'Error', error.message)
      : new ApiError(500, 'Error', 'Terjadi kesalahan yang tidak diketahui.');

  const friendly = translateErrorToFriendlyMessage(apiError, options?.fallbackMessage);

  const toastId = `${friendly.title}:${friendly.description}`;

  toast.error(friendly.title, {
    id: toastId,
    description: friendly.description,
    duration: 4500,
    action:
      friendly.actionLabel && options?.onActionClick
        ? {
            label: friendly.actionLabel,
            onClick: options.onActionClick,
          }
        : undefined,
  });
}
