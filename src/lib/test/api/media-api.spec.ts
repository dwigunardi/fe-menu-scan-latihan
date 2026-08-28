import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadMediaImage } from '@/lib/api/media-api';
import { useAuthStore } from '@/store/use-auth-store';
import { ErrorCode } from '@/lib/api/error-codes';

describe('Media API Client (uploadMediaImage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
  });

  it('uploads media image successfully with auth token', async () => {
    useAuthStore.getState().setAuth(
      { id: '1', name: 'Admin', role: 'ADMIN' },
      'test-jwt-token'
    );

    const mockFile = new File(['dummy-content'], 'test-image.jpg', { type: 'image/jpeg' });
    const mockResponse = {
      data: {
        url: 'http://localhost:5000/uploads/test-image.jpg',
        filename: 'test-image.jpg',
        size: 1024,
        mimeType: 'image/jpeg',
        width: 1200,
        height: 675,
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await uploadMediaImage(mockFile);
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.url).toBe('http://localhost:5000/uploads/test-image.jpg');
      expect(result.value.width).toBe(1200);
    }
  });

  it('uploads media image without token and uses payload fallbacks', async () => {
    const mockFile = new File(['content'], 'custom.png', { type: 'image/png' });
    const mockResponse = {
      url: 'http://localhost:5000/uploads/custom.png',
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await uploadMediaImage(mockFile);
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.filename).toBe('custom.png');
      expect(result.value.mimeType).toBe('image/png');
    }
  });

  it('returns ApiError Left when server responds with error status and json', async () => {
    const mockFile = new File(['bad-content'], 'bad.exe', { type: 'application/octet-stream' });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        code: ErrorCode.FILE_TOO_LARGE,
        message: 'Ukuran file melebihi batas 2MB.',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await uploadMediaImage(mockFile);
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.statusCode).toBe(400);
      expect(result.value.message).toBe('Ukuran file melebihi batas 2MB.');
    }
  });

  it('returns ApiError Left when fetch rejects with network exception', async () => {
    const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network disconnected'));
    vi.stubGlobal('fetch', fetchMock);

    const result = await uploadMediaImage(mockFile);
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.statusCode).toBe(500);
      expect(result.value.message).toContain('Network disconnected');
    }
  });
});
