'use client';

import { useAdminCategoriesQuery } from '@/hooks/queries/use-admin-categories';
import { MenuForm } from '@/components/admin/menu-form';
import { Skeleton } from '@/components/ui/skeleton';
import { RoleGuard } from '@/components/common/role-guard';

export default function CreateMenuPage() {
  const { data: categories = [], isLoading } = useAdminCategoriesQuery();

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      {isLoading ? (
        <div className="space-y-6 max-w-5xl py-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <Skeleton className="h-64 rounded-3xl" />
            </div>
            <div className="lg:col-span-4 space-y-4">
              <Skeleton className="h-80 rounded-3xl" />
            </div>
          </div>
        </div>
      ) : (
        <MenuForm categories={categories} mode="create" />
      )}
    </RoleGuard>
  );
}
