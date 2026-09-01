'use client';

import Link from 'next/link';
import { RoleGuard } from '@/components/common/role-guard';
import { ROLE } from '@/store/use-auth-store';
import { useAdminBranchSettingQuery } from '@/hooks/queries/use-admin-settings';
import { useShiftTemplatesQuery } from '@/hooks/queries/use-admin-shift-templates';
import { StoreStatusBanner } from '@/components/common/store-status-banner';
import {
  Settings,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <RoleGuard allowedRoles={[ROLE.ADMIN]}>
      <AdminSettingsHubContent />
    </RoleGuard>
  );
}

function AdminSettingsHubContent() {
  const { data: setting, isLoading: isSettingLoading } = useAdminBranchSettingQuery();
  const { data: templates = [], isLoading: isTemplatesLoading } = useShiftTemplatesQuery();

  const isLoading = isSettingLoading || isTemplatesLoading;

  const SETTINGS_CARDS = [
    {
      id: 'branch',
      title: 'Identitas Cabang & Geofence GPS',
      description: 'Atur titik koordinat GPS kafe pada peta interaktif, radius batas aman absensi karyawan (50m - 500m), dan alamat kontak resmi.',
      icon: MapPin,
      href: '/admin/settings/branch',
      badge: setting ? `${setting.geofenceRadius}m Radius Geofence` : 'Geofence GPS',
      accentColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      hoverBorder: 'hover:border-emerald-500/50',
    },
    {
      id: 'shifts',
      title: 'Master Template Shift Karyawan',
      description: 'Kelola template master shift kerja (Pagi, Middle, Closing), jam kerja efektif, alokasi waktu istirahat, dan sinkronisasi ke jam toko.',
      icon: Clock,
      href: '/admin/settings/shifts',
      badge: `${templates.length} Template Shift Aktif`,
      accentColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
      hoverBorder: 'hover:border-amber-500/50',
    },
    {
      id: 'policies',
      title: 'Kebijakan Operasional Toko',
      description: 'Pilih mode operasional toko (POS Kasir / Jam Digital), toleransi keterlambatan presensi, saklar buka/tutup darurat, dan jam buka mingguan.',
      icon: ShieldCheck,
      href: '/admin/settings/policies',
      badge: setting ? `${setting.openTime} - ${setting.closeTime}` : 'Kebijakan Toko',
      accentColor: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
      hoverBorder: 'hover:border-blue-500/50',
    },
  ];

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
                Pusat Konfigurasi & Pengaturan Toko
              </h1>
            </div>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Kelola seluruh konfigurasi master cabang, geofence, shift, dan kebijakan operasional secara terpusat.
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

        {/* Quick Summary Strip */}
        {setting && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500">
                Nama Cabang
              </span>
              <p className="text-xs font-bold text-stone-900 dark:text-zinc-100 truncate">
                {setting.name}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500">
                Jam Operasional
              </span>
              <p className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
                {setting.openTime} - {setting.closeTime}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500">
                Radius Geofence
              </span>
              <p className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {setting.geofenceRadius} Meter
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-zinc-500">
                Toleransi Telat
              </span>
              <p className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">
                {setting.lateGracePeriod ?? 15} Menit
              </p>
            </div>
          </div>
        )}

        {/* 3 Dedicated Sub-Route Navigation Cards */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-3xl space-y-3">
            <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
            <p className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
              Memuat modul pengaturan toko...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SETTINGS_CARDS.map((card) => {
              const Icon = card.icon;

              return (
                <Link key={card.id} href={card.href} className="group block">
                  <div
                    className={`h-full p-6 rounded-3xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs transition-all duration-200 hover:shadow-md ${card.hoverBorder} flex flex-col justify-between space-y-4`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div
                          className={`h-11 w-11 rounded-2xl flex items-center justify-center border ${card.accentColor}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-[11px] font-bold font-mono px-2.5 py-1 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300">
                          {card.badge}
                        </span>
                      </div>

                      <div>
                        <h2 className="text-base font-bold text-stone-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {card.title}
                        </h2>
                        <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                      <span>Buka Pengaturan</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
