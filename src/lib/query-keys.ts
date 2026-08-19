export const adminQueryKeys = {
  all: ['admin'] as const,
  menus: (categoryId?: string) => ['admin', 'menus', categoryId || 'ALL'] as const,
  menusPaginated: (params: Record<string, unknown> = {}) =>
    ['admin', 'menus', 'paginated', params] as const,
  menuDetail: (id: string) => ['admin', 'menus', 'detail', id] as const,
  categories: () => ['admin', 'categories'] as const,
  tables: () => ['admin', 'tables'] as const,
  orders: (status?: string) => ['admin', 'orders', status || 'ALL'] as const,
  dashboardStats: () => ['admin', 'dashboard', 'stats'] as const,
};
