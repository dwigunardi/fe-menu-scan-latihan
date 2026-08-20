import { http, HttpResponse } from 'msw';
import {
  generateClientKeyPair,
  exportPublicKeyHex,
  importServerPublicKey,
  deriveSessionKey,
  decryptPayload,
} from '../../lib/crypto/ecdh';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export const mockCategories = [
  { id: 'cat-1', name: 'Makanan Utama', slug: 'makanan-utama', sortOrder: 1, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: 'cat-2', name: 'Minuman Segar', slug: 'minuman-segar', sortOrder: 2, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
];

export const mockMenus = [
  {
    id: 'menu-1',
    name: 'Nasi Goreng Spesial',
    description: 'Nasi goreng dengan telur dan ayam suwir',
    price: 28000,
    promoPrice: 25000,
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19',
    rating: 4.8,
    reviewCount: 42,
    isAvailable: true,
    isBestSeller: true,
    isRecommended: false,
    categoryId: 'cat-1',
    category: mockCategories[0],
    variantGroups: [],
  },
  {
    id: 'menu-2',
    name: 'Es Kopi Gula Aren',
    description: 'Kopi espresso dengan gula aren murni',
    price: 18000,
    promoPrice: null,
    imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772',
    rating: 4.9,
    reviewCount: 88,
    isAvailable: true,
    isBestSeller: true,
    isRecommended: true,
    categoryId: 'cat-2',
    category: mockCategories[1],
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

/**
 * MSW Network Interceptors
 */
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
            username: 'admin',
            name: 'Admin Cafe',
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
      data: {
        items: mockCategories,
        meta: {
          page: 1,
          limit: -1,
          totalItems: mockCategories.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
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
    const filtered = categoryId && categoryId !== 'ALL'
      ? mockMenus.filter((m) => m.categoryId === categoryId)
      : mockMenus;
    return HttpResponse.json({
      statusCode: 200,
      data: {
        items: filtered,
        meta: {
          page: 1,
          limit: -1,
          totalItems: filtered.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    });
  }),

  http.get(`${API_BASE}/admin/menus`, ({ request }) => {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId');
    const search = url.searchParams.get('search')?.toLowerCase();
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;

    let filtered = [...mockMenus];
    if (categoryId && categoryId !== 'ALL') {
      filtered = filtered.filter((m) => m.categoryId === categoryId);
    }
    if (search) {
      filtered = filtered.filter((m) => m.name.toLowerCase().includes(search));
    }

    const totalItems = filtered.length;
    const totalPages = limit === -1 ? 1 : Math.ceil(totalItems / limit) || 1;
    const items = limit === -1 ? filtered : filtered.slice((page - 1) * limit, page * limit);

    return HttpResponse.json({
      statusCode: 200,
      data: {
        items,
        meta: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: limit === -1 ? false : page < totalPages,
          hasPrevPage: limit === -1 ? false : page > 1,
        },
      },
    });
  }),

  http.get(`${API_BASE}/public/menus/:id`, ({ params }) => {
    const { id } = params;
    const menu = mockMenus.find((m) => m.id === id);
    if (!menu) {
      return HttpResponse.json({ statusCode: 404, message: 'Menu tidak ditemukan' }, { status: 404 });
    }
    return HttpResponse.json({
      statusCode: 200,
      data: menu,
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
    const existing = mockMenus.find((m) => m.id === id) || mockMenus[0];
    const updated = {
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({
      statusCode: 200,
      message: 'Menu updated',
      data: updated,
    });
  }),

  http.patch(`${API_BASE}/admin/menus/:id/status`, async ({ params, request }) => {
    const { id } = params;
    const body = await extractRequestBody(request);
    const existing = mockMenus.find((m) => m.id === id) || mockMenus[0];
    const updated = {
      ...existing,
      id,
      isAvailable: body.isAvailable,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({
      statusCode: 200,
      message: 'Status updated',
      data: updated,
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
