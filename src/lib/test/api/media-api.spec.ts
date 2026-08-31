import { describe, it, expect, beforeEach } from 'vitest';
import { uploadMediaImage } from '@/lib/api/media-api';
import { useAuthStore } from '@/store/use-auth-store';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import { ErrorCode } from '@/lib/api/error-codes';

const API_BASE = 'http://localhost:5000/api/v1';

describe('Media API Client (uploadMediaImage)', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('uploads media image successfully with auth token', async () => {
    useAuthStore.getState().setAuth(
      { id: '1', name: 'Admin', role: 'ADMIN' },
      'test-jwt-token'
    );

    const mockFile = new File(['dummy-content'], 'test-image.jpg', { type: 'image/jpeg' });

    server.use(
      http.post(`${API_BASE}/admin/uploads/image`, () => {
        return HttpResponse.json({
          statusCode: 201,
          data: {
            url: 'http://localhost:5000/uploads/test-image.jpg',
            filename: 'test-image.jpg',
            size: 1024,
            mimeType: 'image/jpeg',
            width: 1200,
            height: 675,
          },
        });
      })
    );

    const result = await uploadMediaImage(mockFile);
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.url).toBe('http://localhost:5000/uploads/test-image.jpg');
      expect(result.value.width).toBe(1200);
    }
  });

  it('uploads media image without token and uses payload fallbacks', async () => {
    const mockFile = new File(['content'], 'custom.png', { type: 'image/png' });

    server.use(
      http.post(`${API_BASE}/admin/uploads/image`, () => {
        return HttpResponse.json({
          statusCode: 200,
          data: {
            url: 'http://localhost:5000/uploads/custom.png',
            filename: 'custom.png',
            size: 512,
            mimeType: 'image/png',
          },
        });
      })
    );

    const result = await uploadMediaImage(mockFile);
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.filename).toBe('custom.png');
      expect(result.value.mimeType).toBe('image/png');
    }
  });

  it('returns ApiError Left when server responds with error status and json', async () => {
    const mockFile = new File(['bad-content'], 'bad.exe', { type: 'application/octet-stream' });

    server.use(
      http.post(`${API_BASE}/admin/uploads/image`, () => {
        return HttpResponse.json(
          {
            code: ErrorCode.FILE_TOO_LARGE,
            message: 'Ukuran file melebihi batas 2MB.',
          },
          { status: 400 }
        );
      })
    );

    const result = await uploadMediaImage(mockFile);
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.statusCode).toBe(400);
      expect(result.value.message).toBe('Ukuran file melebihi batas 2MB.');
    }
  });

  it('returns ApiError Left when fetch rejects with network exception', async () => {
    const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    server.use(
      http.post(`${API_BASE}/admin/uploads/image`, () => {
        return HttpResponse.error();
      })
    );

    const result = await uploadMediaImage(mockFile);
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.statusCode).toBe(0);
      expect(result.value.errorTitle).toBe('Network Error');
    }
  });
});
