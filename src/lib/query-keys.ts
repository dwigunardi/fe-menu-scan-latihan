export const adminQueryKeys = {
  all: ['admin'] as const,
  menus: (categoryId?: string) => ['admin', 'menus', categoryId || 'ALL'] as const,
  menusPaginated: (params: Record<string, unknown> = {}) =>
    ['admin', 'menus', 'paginated', params] as const,
  menuDetail: (id: string) => ['admin', 'menus', 'detail', id] as const,
  categories: () => ['admin', 'categories'] as const,
  banners: (params: Record<string, unknown> = {}) => ['admin', 'banners', params] as const,
  bannerDetail: (id: string) => ['admin', 'banners', 'detail', id] as const,
  publicBanners: () => ['public', 'banners'] as const,
  tables: (status?: string) => ['admin', 'tables', status || 'ALL'] as const,
  tablesPaginated: (params: Record<string, unknown> = {}) =>
    ['admin', 'tables', 'paginated', params] as const,
  tableZones: () => ['admin', 'table-zones'] as const,
  orders: (status?: string) => ['admin', 'orders', status || 'ALL'] as const,
  ordersPaginated: (params: Record<string, unknown> = {}) =>
    ['admin', 'orders', 'paginated', params] as const,
  dashboardStats: () => ['admin', 'dashboard', 'stats'] as const,
  reportsOverview: () => ['admin', 'reports', 'overview'] as const,
  reportsRevenue: (params: Record<string, unknown> = {}) =>
    ['admin', 'reports', 'revenue', params] as const,
  reportsTopSelling: (params: Record<string, unknown> = {}) =>
    ['admin', 'reports', 'top-selling', params] as const,
  shiftsCurrent: () => ['admin', 'shifts', 'current'] as const,
  shiftsHistory: (params: Record<string, unknown> = {}) =>
    ['admin', 'shifts', 'history', params] as const,
  staff: () => ['admin', 'staff'] as const,
  staffPaginated: (params: Record<string, unknown> = {}) =>
    ['admin', 'staff', 'paginated', params] as const,
};


