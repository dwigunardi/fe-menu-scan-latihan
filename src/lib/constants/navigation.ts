import { ComponentType } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  UtensilsCrossed,
  Grid2X2,
  BookOpen,
  Tags,
  Image as ImageIcon,
  Clock,
  Users,
  CalendarCheck,
  Settings,
  LucideIcon,
} from 'lucide-react';
import { UserRole, ROLE, ROLE_GROUPS } from './roles';

export type NavCategory = 'operasional' | 'katalog' | 'manajemen' | 'pengaturan';

export interface NavigationItem {
  id?: string;
  title: string;
  shortTitle?: string;
  href: string;
  icon: LucideIcon | ComponentType<{ className?: string }>;
  allowedRoles: UserRole[] | readonly UserRole[];
  category?: NavCategory;
  isMobilePrimary?: boolean;
  description?: string;
}

export const APP_NAVIGATION_ITEMS: NavigationItem[] = [
  // --- OPERASIONAL ---
  {
    id: 'dashboard',
    title: 'Dashboard Omset',
    shortTitle: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    allowedRoles: [ROLE.ADMIN],
    category: 'operasional',
    isMobilePrimary: true,
    description: 'Ringkasan omset dan analitik harian',
  },
  {
    id: 'kds-kitchen',
    title: 'Kitchen Display (KDS)',
    shortTitle: 'KDS Dapur',
    href: '/kitchen/orders',
    icon: UtensilsCrossed,
    allowedRoles: ROLE_GROUPS.KITCHEN_OR_ADMIN,
    category: 'operasional',
    isMobilePrimary: true,
    description: 'Antrean pesanan dapur & barista real-time',
  },
  {
    id: 'cashier-tables',
    title: 'Workstation Kasir',
    shortTitle: 'Kasir',
    href: '/cashier/tables',
    icon: Grid2X2,
    allowedRoles: [ROLE.CASHIER, ROLE.KASIR],
    category: 'operasional',
    isMobilePrimary: true,
    description: 'Point of Sales & kelola pesanan meja',
  },
  {
    id: 'waiter-tables',
    title: 'Denah Meja Pelayan',
    shortTitle: 'Pelayan',
    href: '/waiter/tables',
    icon: Grid2X2,
    allowedRoles: [ROLE.WAITER, ROLE.PELAYAN],
    category: 'operasional',
    isMobilePrimary: true,
    description: 'Pencatatan pesanan & status meja tamu',
  },
  {
    id: 'admin-tables',
    title: 'Denah Meja & Kasir',
    shortTitle: 'Denah Meja',
    href: '/admin/tables',
    icon: Grid2X2,
    allowedRoles: [ROLE.ADMIN],
    category: 'operasional',
    isMobilePrimary: true,
    description: 'Tata letak meja dan live status kasir',
  },
  {
    id: 'orders-log',
    title: 'Log Pesanan Admin',
    shortTitle: 'Log Pesanan',
    href: '/admin/orders',
    icon: UtensilsCrossed,
    allowedRoles: [ROLE.ADMIN],
    category: 'operasional',
    isMobilePrimary: false,
    description: 'Riwayat seluruh pesanan & transaksi',
  },

  // --- KATALOG ---
  {
    id: 'menus',
    title: 'Katalog Menu',
    shortTitle: 'Menu',
    href: '/admin/menus',
    icon: BookOpen,
    allowedRoles: [ROLE.ADMIN],
    category: 'katalog',
    isMobilePrimary: true,
    description: 'Daftar produk, harga, dan ketersediaan stok',
  },
  {
    id: 'categories',
    title: 'Kategori Menu',
    shortTitle: 'Kategori',
    href: '/admin/categories',
    icon: Tags,
    allowedRoles: [ROLE.ADMIN],
    category: 'katalog',
    isMobilePrimary: false,
    description: 'Pengelompokan menu makanan & minuman',
  },

  // --- MANAJEMEN ---
  {
    id: 'shifts',
    title: 'Shift & Kasir',
    shortTitle: 'Shift Kasir',
    href: '/admin/shifts',
    icon: Clock,
    allowedRoles: [ROLE.ADMIN, ROLE.CASHIER, ROLE.KASIR],
    category: 'manajemen',
    isMobilePrimary: false,
    description: 'Buka tutup shift kasir & cetak Z-Report',
  },
  {
    id: 'attendance',
    title: 'Presensi Staf',
    shortTitle: 'Presensi',
    href: '/admin/attendance',
    icon: CalendarCheck,
    allowedRoles: [ROLE.ADMIN],
    category: 'manajemen',
    isMobilePrimary: false,
    description: 'Monitoring absensi GPS & review lembur staf',
  },
  {
    id: 'staff',
    title: 'Manajemen Staf',
    shortTitle: 'Staf',
    href: '/admin/staff',
    icon: Users,
    allowedRoles: [ROLE.ADMIN],
    category: 'manajemen',
    isMobilePrimary: false,
    description: 'Kelola akun karyawan, peran, dan PIN',
  },
  {
    id: 'reports',
    title: 'Laporan Penjualan',
    shortTitle: 'Laporan',
    href: '/admin/reports',
    icon: BarChart3,
    allowedRoles: [ROLE.ADMIN],
    category: 'manajemen',
    isMobilePrimary: false,
    description: 'Analisis pendapatan, metode bayar & performa',
  },

  // --- SISTEM & PENGATURAN ---
  {
    id: 'banners',
    title: 'Banner Promo',
    shortTitle: 'Banner',
    href: '/admin/banners',
    icon: ImageIcon,
    allowedRoles: [ROLE.ADMIN],
    category: 'pengaturan',
    isMobilePrimary: false,
    description: 'Manajemen spanduk promosi di menu pelanggan',
  },
  {
    id: 'settings',
    title: 'Pengaturan Cabang',
    shortTitle: 'Pengaturan',
    href: '/admin/settings',
    icon: Settings,
    allowedRoles: [ROLE.ADMIN],
    category: 'pengaturan',
    isMobilePrimary: false,
    description: 'Geofence GPS, jam operasional & mode toko',
  },
];

/**
 * Filter all navigation items allowed for a given user role.
 */
export function getNavItemsForRole(role?: UserRole | null): NavigationItem[] {
  if (!role) return [];
  return APP_NAVIGATION_ITEMS.filter((item) => item.allowedRoles.includes(role));
}

/**
 * Get the quick primary items for the bottom navigation bar (Max 4 items).
 */
export function getMobilePrimaryNavItems(role?: UserRole | null): NavigationItem[] {
  const allowed = getNavItemsForRole(role);
  const primary = allowed.filter((item) => item.isMobilePrimary);
  return primary.slice(0, 4);
}

/**
 * Get all secondary items that go inside the "Lainnya" Drawer sheet.
 */
export function getMobileMoreNavItems(role?: UserRole | null): NavigationItem[] {
  const allowed = getNavItemsForRole(role);
  const primary = getMobilePrimaryNavItems(role);
  const primaryHrefs = new Set(primary.map((p) => p.href));
  return allowed.filter((item) => !primaryHrefs.has(item.href));
}
