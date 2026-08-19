import { http, HttpResponse } from 'msw';
import {
  generateClientKeyPair,
  exportPublicKeyHex,
  importServerPublicKey,
  deriveSessionKey,
  decryptPayload,
} from '../../lib/crypto/ecdh';

const API_BASE = 'http://localhost:5000/api/v1';

export const mockCategories = [
  { id: 'cat-1', name: 'Makanan Utama', slug: 'makanan-utama', sortOrder: 1, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'cat-2', name: 'Minuman Segar', slug: 'minuman-segar', sortOrder: 2, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
];

export const mockMenus = [
  {
    id: 'menu-1',
    name: 'Nasi Goreng Spesial',
    description: 'Nasi goreng dengan telur dan ayam',
    price: 35000,
    promoPrice: null,
    imageUrl: 'https://example.com/nasgor.jpg',
    rating: 4.8,
    reviewCount: 24,
    isAvailable: true,
    isBestSeller: true,
    isRecommended: true,
    categoryId: 'cat-1',
    category: { id: 'cat-1', name: 'Makanan Utama' },
    variantGroups: [],
  },
  {
    id: 'menu-2',
    name: 'Es Teh Manis',
    description: 'Teh melati manis segar',
    price: 8000,
    promoPrice: null,
    imageUrl: 'https://example.com/esteh.jpg',
    rating: 4.9,
    reviewCount: 50,
    isAvailable: true,
    isBestSeller: false,
    isRecommended: false,
    categoryId: 'cat-2',
    category: { id: 'cat-2', name: 'Minuman Segar' },
    variantGroups: [],
  },
];

let serverKeyPair: CryptoKeyPair | null = null;
let currentServerSessionKey: CryptoKey | null = null;

async function getOrCreateServerKeyPair(): Promise<CryptoKeyPair> {
  if (!serverKeyPair) {
    serverKeyPair = await generateClientKeyPair();
  }
  return serverKeyPair;
}

async function extractRequestBody(request: Request): Promise<any> {
  try {
    const raw = (await request.json()) as any;
    if (raw && raw.encrypted && currentServerSessionKey) {
      return await decryptPayload(raw, currentServerSessionKey);
    }
    return raw;
  } catch {
    return {};
  }
}

export const handlers = [
  // Auth Handshake
  http.post(`${API_BASE}/auth/handshake`, async ({ request }) => {
    const keyPair = await getOrCreateServerKeyPair();
    const serverPublicKeyHex = await exportPublicKeyHex(keyPair.publicKey);

    try {
      const body = (await request.json()) as any;
      if (body?.clientPublicKey && body?.nonce) {
        const importedClientPub = await importServerPublicKey(body.clientPublicKey);
        currentServerSessionKey = await deriveSessionKey(
          keyPair.privateKey,
          importedClientPub,
          body.nonce
        );
      }
    } catch {
      // Ignore parse error in handshake
    }

    return HttpResponse.json({
      statusCode: 200,
      message: 'Handshake successful',
      data: {
        serverPublicKey: serverPublicKeyHex,
        handshakeToken: 'test-handshake-token-xyz',
        expiresIn: 7200,
      },
    });
  }),

  // Auth Login
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = await extractRequestBody(request);
    if (body.email === 'admin@menuscan.com' && body.password === 'password123') {
      return HttpResponse.json({
        statusCode: 200,
        message: 'Login successful',
        data: {
          accessToken: 'fake-jwt-token-123',
          user: {
            id: 'user-1',
            name: 'Admin Cafe',
            email: 'admin@menuscan.com',
            role: 'ADMIN',
          },
        },
      });
    }
    return HttpResponse.json(
      {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Email atau password salah',
      },
      { status: 401 }
    );
  }),

  // Categories API
  http.get(`${API_BASE}/public/categories`, () => {
    return HttpResponse.json({
      statusCode: 200,
      data: mockCategories,
    });
  }),

  http.post(`${API_BASE}/admin/categories`, async ({ request }) => {
    const body = await extractRequestBody(request);
    const newCat = {
      id: `cat-${Date.now()}`,
      name: body.name || 'Kategori Baru',
      slug: body.name ? body.name.toLowerCase().replace(/\s+/g, '-') : 'kategori',
      sortOrder: body.sortOrder || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({
      statusCode: 201,
      message: 'Category created',
      data: newCat,
    });
  }),

  http.patch(`${API_BASE}/admin/categories/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await extractRequestBody(request);
    const updated = {
      id,
      name: body.name || 'Updated Category',
      sortOrder: body.sortOrder || 1,
      createdAt: '2026-01-01',
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({
      statusCode: 200,
      message: 'Category updated',
      data: updated,
    });
  }),

  http.delete(`${API_BASE}/admin/categories/:id`, () => {
    return HttpResponse.json({
      statusCode: 200,
      message: 'Category deleted',
      data: { success: true },
    });
  }),

  // Menus API
  http.get(`${API_BASE}/public/menus`, ({ request }) => {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId');
    if (categoryId) {
      return HttpResponse.json({
        statusCode: 200,
        data: mockMenus.filter((m) => m.categoryId === categoryId),
      });
    }
    return HttpResponse.json({
      statusCode: 200,
      data: mockMenus,
    });
  }),

  http.post(`${API_BASE}/admin/menus`, async ({ request }) => {
    const body = await extractRequestBody(request);
    const newMenu = {
      ...body,
      id: `menu-${Date.now()}`,
      rating: 5.0,
      reviewCount: 0,
      variantGroups: body.variantGroups || [],
    };
    return HttpResponse.json({
      statusCode: 201,
      message: 'Menu item created',
      data: newMenu,
    });
  }),

  http.patch(`${API_BASE}/admin/menus/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await extractRequestBody(request);
    return HttpResponse.json({
      statusCode: 200,
      message: 'Menu updated',
      data: { id, ...body },
    });
  }),

  http.patch(`${API_BASE}/admin/menus/:id/status`, async ({ params, request }) => {
    const { id } = params;
    const body = await extractRequestBody(request);
    return HttpResponse.json({
      statusCode: 200,
      message: 'Status updated',
      data: { id, isAvailable: body.isAvailable },
    });
  }),

  http.delete(`${API_BASE}/admin/menus/:id`, () => {
    return HttpResponse.json({
      statusCode: 200,
      message: 'Menu deleted',
      data: { success: true },
    });
  }),
];
