'use client';

import Link from 'next/link';
import { DollarSign, ShoppingBag, Users, TrendingUp, BookOpen, UtensilsCrossed, Grid2X2 } from 'lucide-react';
import { RoleGuard } from '@/components/common/role-guard';
import { ROLE } from '@/lib/constants/roles';

export default function AdminDashboardPage() {
  return (
    <RoleGuard allowedRoles={[ROLE.ADMIN]}>
      <div className="space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-50">
            Dashboard Omset & Operasional
          </h1>
          <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
            Ringkasan performa penjualan dan status operasional Kumpul Cafe hari ini.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Omset Hari Ini</span>
              <DollarSign className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold font-mono text-stone-900 dark:text-zinc-100">
              Rp 4.280.000
            </p>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +14.2% dari kemarin
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Pesanan</span>
              <ShoppingBag className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold font-mono text-stone-900 dark:text-zinc-100">
              142 Pesanan
            </p>
            <span className="text-[11px] font-semibold text-stone-500">
              Rata-rata Rp 30.140 / tiket
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Kapasitas Meja</span>
              <Grid2X2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold font-mono text-stone-900 dark:text-zinc-100">
              7 / 10 Terisi
            </p>
            <span className="text-[11px] font-semibold text-amber-600">
              70% Tingkat Keterisian
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Antrian KDS</span>
              <UtensilsCrossed className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold font-mono text-stone-900 dark:text-zinc-100">
              4 Sedang Disiapkan
            </p>
            <span className="text-[11px] font-semibold text-stone-500">
              Est. waktu tunggu: 8 Menit
            </span>
          </div>
        </div>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/menus"
            className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:border-amber-500 transition-all space-y-2 group"
          >
            <BookOpen className="h-6 w-6 text-amber-600" />
            <h3 className="font-bold text-base text-stone-900 dark:text-zinc-100 group-hover:text-amber-600">
              Katalog Menu & Variasi
            </h3>
            <p className="text-xs text-stone-500">
              Kelola kustomisasi topping, harga promo, dan stok ketersediaan menu secara live.
            </p>
          </Link>

          <Link
            href="/admin/tables"
            className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:border-amber-500 transition-all space-y-2 group"
          >
            <Grid2X2 className="h-6 w-6 text-emerald-600" />
            <h3 className="font-bold text-base text-stone-900 dark:text-zinc-100 group-hover:text-emerald-600">
              Denah Meja & Kasir
            </h3>
            <p className="text-xs text-stone-500">
              Visual floor plan meja kafe dan tombol 1-tap reset sesi meja.
            </p>
          </Link>

          <Link
            href="/kitchen/orders"
            className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:border-amber-500 transition-all space-y-2 group"
          >
            <UtensilsCrossed className="h-6 w-6 text-blue-600" />
            <h3 className="font-bold text-base text-stone-900 dark:text-zinc-100 group-hover:text-blue-600">
              Kitchen Display System (KDS)
            </h3>
            <p className="text-xs text-stone-500">
              Monitor antrian pesanan dapur dengan live bell audio chimes.
            </p>
          </Link>
        </div>
      </div>
    </RoleGuard>
  );
}
