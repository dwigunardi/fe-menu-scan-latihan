'use client';

import React from 'react';
import Link from 'next/link';
import { RoleGuard } from '@/components/common/role-guard';
import { ROLE } from '@/store/use-auth-store';
import { useAdminBranchSettingQuery } from '@/hooks/queries/use-admin-settings';
import { BranchSettingsForm } from '@/components/settings/branch-settings-form';
import { StoreStatusBanner } from '@/components/common/store-status-banner';
import { MapPin, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminBranchSettingsPage() {
  return (
    <RoleGuard allowedRoles={[ROLE.ADMIN]}>
      <AdminBranchSettingsContent />
    </RoleGuard>
  );
}

function AdminBranchSettingsContent() {
  const { data: setting, isLoading, isError, refetch } = useAdminBranchSettingQuery();

  return (
    <div className="flex flex-col min-h-screen">
      <StoreStatusBanner />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link href="/admin/settings">
            <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs font-semibold gap-1.5 text-stone-600 dark:text-zinc-400 hover:text-amber-600">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Pusat Pengaturan
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-50">
                Identitas Cabang & Geofence GPS
              </h1>
            </div>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Atur lokasi titik koordinat GPS cabang kafe, radius geofence presensi, dan alamat kontak fisik.
            </p>
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-3xl space-y-3">
            <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
            <p className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
              Memuat konfigurasi geofence cabang...
            </p>
          </div>
        ) : isError || !setting ? (
          <div className="flex flex-col items-center justify-center py-16 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-3xl text-center p-6 space-y-3">
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Gagal Memuat Pengaturan Cabang
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 max-w-sm">
                Terjadi kesalahan saat menghubungi server backend. Silakan coba kembali.
              </p>
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="text-xs font-bold border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl"
            >
              Coba Lagi
            </Button>
          </div>
        ) : (
          <BranchSettingsForm initialData={setting} />
        )}
      </div>
    </div>
  );
}
