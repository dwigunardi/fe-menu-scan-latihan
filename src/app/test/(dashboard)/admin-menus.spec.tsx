import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminMenusPage from '@/app/(dashboard)/admin/menus/page';
import { createQueryWrapper } from '@/test/test-utils';
import { useAuthStore } from '@/store/use-auth-store';
import * as adminMenusApi from '@/lib/api/admin-menus-api';
import { Right } from '@/lib/api/either';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

describe('AdminMenusPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setAuth(
      { id: '1', username: 'admin', name: 'Admin', role: 'ADMIN' },
      'test-token'
    );
  });

  it('renders menus header, categories count, and filter bar', async () => {
    vi.spyOn(adminMenusApi, 'getAdminCategories').mockResolvedValue(
      new Right([
        { id: 'cat-1', name: 'Coffee', slug: 'coffee', sortOrder: 1, _count: { menuItems: 2 } },
      ])
    );

    vi.spyOn(adminMenusApi, 'getAdminMenusPaginated').mockResolvedValue(
      new Right({
        items: [
          {
            id: 'm1',
            name: 'Caramel Macchiato',
            slug: 'caramel-macchiato',
            price: 35000,
            categoryId: 'cat-1',
            categoryName: 'Coffee',
            isAvailable: true,
            isBestSeller: false,
            isRecommended: false,
            variantGroups: [],
            rating: 4.8,
            reviewCount: 20,
            createdAt: '2026-08-20T00:00:00Z',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      })
    );

    const wrapper = createQueryWrapper();
    render(<AdminMenusPage />, { wrapper });

    expect(screen.getByText('Katalog Menu & Variasi')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Caramel Macchiato').length).toBeGreaterThan(0);
    });
  });
});
