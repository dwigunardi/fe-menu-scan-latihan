import { describe, it, expect } from 'vitest';
import { adminQueryKeys } from '@/lib/query-keys';

describe('adminQueryKeys', () => {
  it('generates consistent keys for all admin resources', () => {
    expect(adminQueryKeys.all).toEqual(['admin']);
    expect(adminQueryKeys.categories()).toEqual(['admin', 'categories']);
    expect(adminQueryKeys.tables()).toEqual(['admin', 'tables', 'ALL']);
    expect(adminQueryKeys.tables('VACANT')).toEqual(['admin', 'tables', 'VACANT']);
    expect(adminQueryKeys.tablesPaginated({ page: 1 })).toEqual(['admin', 'tables', 'paginated', { page: 1 }]);
    expect(adminQueryKeys.dashboardStats()).toEqual(['admin', 'dashboard', 'stats']);
    expect(adminQueryKeys.menuDetail('menu-123')).toEqual(['admin', 'menus', 'detail', 'menu-123']);
  });

  it('handles optional categoryId for menus query keys', () => {
    expect(adminQueryKeys.menus()).toEqual(['admin', 'menus', 'ALL']);
    expect(adminQueryKeys.menus('cat-snack')).toEqual(['admin', 'menus', 'cat-snack']);
  });

  it('handles optional status for orders query keys', () => {
    expect(adminQueryKeys.orders()).toEqual(['admin', 'orders', 'ALL']);
    expect(adminQueryKeys.orders('PAID')).toEqual(['admin', 'orders', 'PAID']);
  });
});
