import { useAuthStore } from '@/store/use-auth-store';
import { Either, left, right } from './either';
import { ApiError } from './api-error';
import { ErrorCode } from './error-codes';

export interface UploadMediaResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * Uploads an image file to backend via multipart/form-data POST /admin/uploads/image
 */
export async function uploadMediaImage(
  file: File
): Promise<Either<ApiError, UploadMediaResult>> {
  const token = useAuthStore.getState().accessToken;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/admin/uploads/image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return left(
        new ApiError(
          res.status,
          'Upload Failed',
          json?.message || 'Gagal mengunggah gambar ke server.',
          {
            code: (json?.code as ErrorCode) || ErrorCode.BAD_REQUEST,
          }
        )
      );
    }

    const payload = json?.data || json;

    return right({
      url: payload.url,
      filename: payload.filename || file.name,
      size: payload.size || file.size,
      mimeType: payload.mimeType || file.type,
      width: payload.width,
      height: payload.height,
    });
  } catch (err: any) {
    return left(
      new ApiError(
        500,
        'Network Error',
        err.message || 'Koneksi ke server upload gagal.',
        {
          code: ErrorCode.NETWORK_OFFLINE,
        }
      )
    );
  }
}
