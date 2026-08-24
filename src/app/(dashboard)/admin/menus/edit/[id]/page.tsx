'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAdminMenuDetailQuery } from '@/hooks/queries/use-admin-menus';
import { useAdminCategoriesQuery } from '@/hooks/queries/use-admin-categories';
import { MenuForm } from '@/components/admin/menu-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { RoleGuard } from '@/components/common/role-guard';
import { ROLE } from '@/lib/constants/roles';

export default function EditMenuPage() {
  const params = useParams();
  const router = useRouter();
  const menuId = typeof params?.id === 'string' ? params.id : '';

  const { data: menu, isLoading: isMenuLoading, isError } = useAdminMenuDetailQuery(menuId);
  const { data: categories = [], isLoading: isCatLoading } = useAdminCategoriesQuery();

  const isLoading = isMenuLoading || isCatLoading;

  return (
    <RoleGuard allowedRoles={[ROLE.ADMIN]}>
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
      ) : isError || !menu ? (
        <div className="py-16 text-center space-y-4">
          <h2 className="text-xl font-bold text-stone-800 dark:text-zinc-200">
            Menu Tidak Ditemukan
          </h2>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Menu yang ingin diedit tidak ditemukan atau telah dihapus dari sistem.
          </p>
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/menus')}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Kembali ke Katalog
          </Button>
        </div>
      ) : (
        <MenuForm initialData={menu} categories={categories} mode="edit" />
      )}
    </RoleGuard>
  );
}
