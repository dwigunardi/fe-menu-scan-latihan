'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { RoleGuard } from '@/components/common/role-guard';
import { BannerForm } from '@/components/admin/banner-form';
import { useAdminBannerDetailQuery } from '@/hooks/queries/use-admin-banners';
import { Button } from '@/components/ui/button';

interface EditBannerPageProps {
  params: Promise<{ id: string }>;
}

export default function EditBannerPage({ params }: EditBannerPageProps) {
  const resolvedParams = use(params);
  const bannerId = resolvedParams.id;

  const { data: banner, isLoading, error } = useAdminBannerDetailQuery(bannerId);

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          <p className="text-xs font-semibold text-stone-600 dark:text-zinc-400">
            Memuat data banner promosi...
          </p>
        </div>
      ) : error || !banner ? (
        <div className="p-8 text-center rounded-3xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 max-w-md mx-auto space-y-4 my-12">
          <AlertCircle className="h-10 w-10 text-red-600 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-stone-900 dark:text-zinc-100">
              Banner Tidak Ditemukan
            </h2>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Data banner yang Anda cari mungkin telah dihapus atau ID tidak valid.
            </p>
          </div>
          <Link href="/admin/banners">
            <Button variant="outline" className="rounded-2xl text-xs font-semibold">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Kembali ke Manajemen Banner
            </Button>
          </Link>
        </div>
      ) : (
        <BannerForm mode="edit" initialData={banner} />
      )}
    </RoleGuard>
  );
}
