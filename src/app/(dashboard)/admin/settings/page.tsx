'use client';

import { RoleGuard } from '@/components/common/role-guard';
import { ROLE } from '@/store/use-auth-store';
import { useAdminBranchSettingQuery } from '@/hooks/queries/use-admin-settings';
import { BranchSettingsForm } from '@/components/settings/branch-settings-form';
import { StoreStatusBanner } from '@/components/common/store-status-banner';
import { Settings, MapPin, Store, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminSettingsPage() {
  return (
    <RoleGuard allowedRoles={[ROLE.ADMIN]}>
      <AdminSettingsContent />
    </RoleGuard>
  );
}

function AdminSettingsContent() {
  const { data: setting, isLoading, isError, refetch } = useAdminBranchSettingQuery();

  return (
    <div className="flex flex-col min-h-screen">
      <StoreStatusBanner />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Settings className="h-5 w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-50">
                Pengaturan Cabang & Geofence
              </h1>
            </div>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Konfigurasi lokasi fisik, radius absensi pintar, jam operasional, dan mode penerimaan pesanan.
            </p>
          </div>

          {/* Quick Status Pill */}
          {setting && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs text-xs font-bold self-start sm:self-auto">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  setting.isStoreOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="text-stone-800 dark:text-zinc-200">
                {setting.isStoreOpen ? 'Toko BUKA' : 'Toko TUTUP'}
              </span>
              <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md font-mono">
                {setting.storeMode}
              </span>
            </div>
          )}
        </div>

        {/* Body Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
            <p className="text-xs text-stone-500 font-medium">Memuat pengaturan cabang...</p>
          </div>
        ) : isError || !setting ? (
          <div className="p-8 rounded-3xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Gagal Memuat Pengaturan Cabang
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400">
                Terjadi kendala saat mengambil data konfigurasi dari server.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => refetch()}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
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
