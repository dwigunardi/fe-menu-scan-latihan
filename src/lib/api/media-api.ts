import { apiTransport } from './api-transport';
import { Either } from './either';
import { ApiError } from './api-error';
import {
  UploadMediaResultSchema,
  UploadMediaResult,
} from '../validations/media.schema';

export type { UploadMediaResult };

/**
 * Uploads an image file to backend via multipart/form-data POST /admin/uploads/image
 */
export async function uploadMediaImage(
  file: File
): Promise<Either<ApiError, UploadMediaResult>> {
  const formData = new FormData();
  formData.append('file', file);

  return apiTransport('/admin/uploads/image', UploadMediaResultSchema, {
    method: 'POST',
    body: formData,
    skipEncryption: true,
  });
}
