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

export const mockTables = [
  {
    id: 'table-1',
    tableNumber: 'T-01',
    capacity: 4,
    status: 'VACANT',
    activeGuestName: null,
    currentSessionId: null,
    qrCodeUrl: 'http://localhost:3000/scan?table=T-01',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'table-2',
    tableNumber: 'T-02',
    capacity: 2,
    status: 'OCCUPIED',
    activeGuestName: 'Budi Santoso',
    currentSessionId: 'sess-123',
    qrCodeUrl: 'http://localhost:3000/scan?table=T-02',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

export const mockOrders = [
  {
    id: 'ord-1',
    orderNumber: 'ORD-20260820-001',
    tableId: 'table-1',
    table: { id: 'table-1', number: '01' },
    tableNumber: '01',
    customerName: 'Budi Santoso',
    status: 'PENDING',
    totalAmount: 52000,
    paidAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    orderItems: [
      {
        id: 'oi-1',
        menuItemId: 'menu-1',
        menuNameSnapshot: 'Kopi Susu Gula Aren',
        priceSnapshot: 22000,
        quantity: 2,
        subtotal: 44000,
        notes: 'Less sugar, no ice',
        selectedVariants: [
          {
            id: 'v-1',
            groupNameSnapshot: 'Ukuran',
            optionNameSnapshot: 'Large',
            extraPriceSnapshot: 4000,
          },
        ],
      },
      {
        id: 'oi-2',
        menuItemId: 'menu-2',
        menuNameSnapshot: 'Kentang Goreng',
        priceSnapshot: 8000,
        quantity: 1,
        subtotal: 8000,
        notes: null,
        selectedVariants: [],
      },
    ],
  },
  {
    id: 'ord-2',
    orderNumber: 'ORD-20260820-002',
    tableId: 'table-2',
    table: { id: 'table-2', number: '02' },
    tableNumber: '02',
    customerName: 'Siti Rahma',
    status: 'PREPARING',
    totalAmount: 35000,
    paidAt: null,
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    updatedAt: new Date().toISOString(),
    orderItems: [
      {
        id: 'oi-3',
        menuItemId: 'menu-1',
        menuNameSnapshot: 'Croissant Coklat',
        priceSnapshot: 35000,
        quantity: 1,
        subtotal: 35000,
        notes: null,
        selectedVariants: [],
      },
    ],
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
  // ─── ADMIN UPLOADS ───
  http.post(`${API_BASE}/admin/uploads/image`, async () => {
    return HttpResponse.json({
      data: {
        url: '/uploads/menus/menu-test-12345.webp',
        filename: 'menu-test-12345.webp',
        size: 102400,
        mimeType: 'image/webp',
      },
    });
  }),

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
    if (
      (body.email === 'admin@menuscan.com' || body.email === 'admin') &&
      (body.password === 'password123' || body.password === 'admin123')
    ) {
      return HttpResponse.json({
        statusCode: 200,
        message: 'Login successful',
        data: {
          accessToken: 'fake-jwt-token-123',
          refreshToken: 'fake-refresh-token-456',
          user: {
            id: 'user-1',
            username: 'admin',
            email: 'admin@menuscan.com',
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

  // Auth Refresh Token
  http.post(`${API_BASE}/auth/refresh`, async ({ request }) => {
    const body = await extractRequestBody(request);
    const authHeader = request.headers.get('Authorization');
    const token = body.refreshToken || authHeader?.replace('Bearer ', '');

    if (token === 'expired-refresh-token') {
      return HttpResponse.json(
        {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid or revoked refresh token',
        },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      statusCode: 200,
      message: 'Tokens renewed',
      data: {
        accessToken: 'renewed-access-token-789',
        refreshToken: 'renewed-refresh-token-789',
      },
    });
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

  http.put(`${API_BASE}/admin/categories/:id`, async ({ params, request }) => {
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

  http.put(`${API_BASE}/admin/menus/:id`, async ({ params, request }) => {
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

  http.put(`${API_BASE}/admin/menus/:id/status`, async ({ params, request }) => {
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

  
  // Table Zones API
  http.get(`${API_BASE}/admin/table-zones`, () => {
    return HttpResponse.json({
      statusCode: 200,
      data: [
        {
          id: 'zone-1',
          name: 'Indoor (AC Non-Smoking)',
          description: 'Area berpendingin ruangan',
          color: 'blue',
          sortOrder: 1,
          tableCount: 4,
          vacantCount: 3,
          occupiedCount: 1,
          totalCapacity: 16,
        },
        {
          id: 'zone-2',
          name: 'Outdoor (Garden Smoking)',
          description: 'Area taman merokok',
          color: 'emerald',
          sortOrder: 2,
          tableCount: 4,
          vacantCount: 4,
          occupiedCount: 0,
          totalCapacity: 14,
        },
        {
          id: 'zone-3',
          name: 'VIP Lounge / Meeting',
          description: 'Ruang privat eksklusif',
          color: 'amber',
          sortOrder: 3,
          tableCount: 2,
          vacantCount: 1,
          occupiedCount: 1,
          totalCapacity: 18,
        },
      ],
    });
  }),

  http.post(`${API_BASE}/admin/table-zones`, async ({ request }) => {
    const body = await extractRequestBody(request);
    const newZone = {
      id: `zone-${Date.now()}`,
      name: body.name || 'New Zone',
      description: body.description || null,
      color: body.color || 'amber',
      sortOrder: body.sortOrder || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({
      statusCode: 201,
      message: 'Zone created',
      data: newZone,
    });
  }),

  http.put(`${API_BASE}/admin/table-zones/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await extractRequestBody(request);
    const updatedZone = {
      id,
      name: body.name || 'Updated Zone',
      description: body.description || null,
      color: body.color || 'amber',
      sortOrder: body.sortOrder || 1,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({
      statusCode: 200,
      message: 'Zone updated',
      data: updatedZone,
    });
  }),

  http.delete(`${API_BASE}/admin/table-zones/:id`, () => {
    return HttpResponse.json({
      statusCode: 200,
      message: 'Zone deleted',
      data: { success: true },
    });
  }),

  // Tables API
  http.get(`${API_BASE}/admin/tables`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search')?.toLowerCase();
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;

    let filtered = [...mockTables];
    if (status && status !== 'ALL') {
      filtered = filtered.filter((t) => t.status === status);
    }
    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.tableNumber.toLowerCase().includes(search) ||
          (t.activeGuestName && t.activeGuestName.toLowerCase().includes(search))
      );
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

  http.post(`${API_BASE}/admin/tables`, async ({ request }) => {
    const body = await extractRequestBody(request);
    const newTable = {
      id: `table-${Date.now()}`,
      tableNumber: body.tableNumber || 'T-99',
      capacity: Number(body.capacity) || 4,
      status: 'VACANT',
      activeGuestName: null,
      currentSessionId: null,
      qrCodeUrl: `http://localhost:3000/scan?table=${body.tableNumber || 'T-99'}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({
      statusCode: 201,
      message: 'Table created',
      data: newTable,
    });
  }),

  http.put(`${API_BASE}/admin/tables/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await extractRequestBody(request);
    const existing = mockTables.find((t) => t.id === id) || mockTables[0];
    const updated = {
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({
      statusCode: 200,
      message: 'Table updated',
      data: updated,
    });
  }),
  http.patch(`${API_BASE}/admin/tables/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await extractRequestBody(request);
    const existing = mockTables.find((t) => t.id === id) || mockTables[0];
    const updated = {
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({
      statusCode: 200,
      message: 'Table updated',
      data: updated,
    });
  }),

  http.post(`${API_BASE}/admin/tables/:id/reset`, ({ params }) => {
    const { id } = params;
    const existing = mockTables.find((t) => t.id === id) || mockTables[0];
    const reset = {
      ...existing,
      status: 'VACANT',
      activeGuestName: null,
      currentSessionId: null,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({
      statusCode: 200,
      message: 'Table session reset successfully',
      data: reset,
    });
  }),

  http.delete(`${API_BASE}/admin/tables/:id`, () => {
    return HttpResponse.json({
      statusCode: 200,
      message: 'Table deleted',
      data: { success: true },
    });
  }),

  // Orders API
  http.get(`${API_BASE}/admin/orders`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search')?.toLowerCase();
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 20;

    let filtered = [...mockOrders];

    if (status && status !== 'ALL') {
      filtered = filtered.filter((o) => o.status === status);
    }

    if (search) {
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(search) ||
          o.customerName.toLowerCase().includes(search)
      );
    }

    const total = filtered.length;
    const items = limit === -1 ? filtered : filtered.slice((page - 1) * limit, page * limit);

    return HttpResponse.json({
      statusCode: 200,
      data: {
        items,
        meta: {
          page,
          limit,
          totalItems: total,
          totalPages: limit === -1 ? 1 : Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      },
    });
  }),

  http.put(`${API_BASE}/admin/orders/:id/status`, async ({ params, request }) => {
    const { id } = params;
    const body = await extractRequestBody(request);
    const existing = mockOrders.find((o) => o.id === id) || mockOrders[0];
    const updated = {
      ...existing,
      status: body.status || 'PREPARING',
      paidAt: body.status === 'PAID' ? new Date().toISOString() : existing.paidAt,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({
      statusCode: 200,
      message: 'Order status updated',
      data: updated,
    });
  }),
  http.patch(`${API_BASE}/admin/orders/:id/status`, async ({ params, request }) => {
    const { id } = params;
    const body = await extractRequestBody(request);
    const existing = mockOrders.find((o) => o.id === id) || mockOrders[0];
    const updated = {
      ...existing,
      status: body.status || 'PREPARING',
      paidAt: body.status === 'PAID' ? new Date().toISOString() : existing.paidAt,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({
      statusCode: 200,
      message: 'Order status updated',
      data: updated,
    });
  }),

  // ==================== BANNERS & MEDIA HANDLERS ====================
  http.get(`${API_BASE}/public/banners`, () => {
    const active = mockBanners.filter((b) => b.isActive);
    return HttpResponse.json({
      statusCode: 200,
      data: active,
    });
  }),

  http.get(`${API_BASE}/admin/banners`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase();
    const isActiveParam = url.searchParams.get('isActive');

    let result = [...mockBanners];
    if (isActiveParam !== null && isActiveParam !== undefined && isActiveParam !== '') {
      const isAct = isActiveParam === 'true';
      result = result.filter((b) => b.isActive === isAct);
    }
    if (search) {
      result = result.filter((b) => b.title.toLowerCase().includes(search));
    }

    return HttpResponse.json({
      statusCode: 200,
      data: result,
    });
  }),

  http.get(`${API_BASE}/admin/banners/:id`, ({ params }) => {
    const { id } = params;
    const found = mockBanners.find((b) => b.id === id);
    if (!found) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Banner tidak ditemukan' },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      statusCode: 200,
      data: found,
    });
  }),

  http.post(`${API_BASE}/admin/banners`, async ({ request }) => {
    const body = await extractRequestBody(request);
    const newBanner = {
      id: `ban-${Date.now()}`,
      title: body.title || 'Promo Baru',
      description: body.description || null,
      imageUrl:
        body.imageUrl ||
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&h=675&fit=crop',
      targetUrl: body.targetUrl || null,
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockBanners.push(newBanner);
    return HttpResponse.json(
      {
        statusCode: 201,
        message: 'Banner berhasil dibuat',
        data: newBanner,
      },
      { status: 201 }
    );
  }),

  http.put(`${API_BASE}/admin/banners/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await extractRequestBody(request);
    const index = mockBanners.findIndex((b) => b.id === id);
    if (index === -1) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Banner tidak ditemukan' },
        { status: 404 }
      );
    }
    mockBanners[index] = {
      ...mockBanners[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({
      statusCode: 200,
      message: 'Banner berhasil diperbarui',
      data: mockBanners[index],
    });
  }),

  http.delete(`${API_BASE}/admin/banners/:id`, ({ params }) => {
    const { id } = params;
    const index = mockBanners.findIndex((b) => b.id === id);
    if (index !== -1) {
      mockBanners.splice(index, 1);
    }
    return HttpResponse.json({
      statusCode: 200,
      message: 'Banner berhasil dihapus',
      data: { success: true, id },
    });
  }),

  http.post(`${API_BASE}/admin/uploads/image`, () => {
    return HttpResponse.json(
      {
        statusCode: 201,
        message: 'Foto berhasil diunggah',
        data: {
          url: '/uploads/menus/menu-mock-123.webp',
          filename: 'menu-mock-123.webp',
          size: 180000,
          mimeType: 'image/webp',
          width: 1200,
          height: 675,
        },
      },
      { status: 201 }
    );
  }),
];

export const mockBanners = [
  {
    id: 'ban-1',
    title: 'Diskon Kopi 50% Weekend',
    description: 'Beli 1 gratis 1 untuk semua varian espresso',
    imageUrl: '/banners/banner-coffee.jpg',
    targetUrl: '/menu?category=cat-2',
    isActive: true,
    sortOrder: 1,
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 'ban-2',
    title: 'Sarapan Lezat Croissant',
    description: 'Nikmati paket sarapan kopi + pastry hemat 30%',
    imageUrl: '/banners/banner-pastry.jpg',
    targetUrl: '/menu?category=cat-1',
    isActive: true,
    sortOrder: 2,
    createdAt: '2026-08-20T11:00:00Z',
    updatedAt: '2026-08-20T11:00:00Z',
  },
  {
    id: 'ban-3',
    title: 'Cashback 30% QRIS',
    description: 'Bayar non-tunai lebih praktis dan hemat',
    imageUrl: '/banners/banner-qris.jpg',
    targetUrl: '/menu',
    isActive: false,
    sortOrder: 3,
    createdAt: '2026-08-20T12:00:00Z',
    updatedAt: '2026-08-20T12:00:00Z',
  },
];
