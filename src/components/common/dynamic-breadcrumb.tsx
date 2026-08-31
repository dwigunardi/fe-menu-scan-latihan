'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Store } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useAuthStore, ROLE, UserRole } from '@/store/use-auth-store';

/**
 * Route namespace prefixes that serve as access containers rather than standalone pages.
 * Stripped from intermediate clickable trails to prevent navigating to non-existent or restricted group routes.
 */
const NAMESPACE_PREFIXES = new Set(['admin', 'cashier', 'kitchen', 'waiter']);

/**
 * Human-friendly title dictionary for known application segments.
 */
const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard Omset',
  settings: 'Pengaturan Cabang & Geofence',
  attendance: 'Presensi & Absensi Karyawan',
  shifts: 'Shift & Kasir',
  staff: 'Manajemen Staf',
  menus: 'Katalog Menu',
  categories: 'Kategori Menu',
  tables: 'Denah Meja & Kasir',
  orders: 'Log Pesanan',
  reports: 'Laporan Penjualan',
  banners: 'Banner Promo',
  create: 'Tambah Baru',
  edit: 'Edit Data',
  detail: 'Detail',
};

/**
 * Resolves the authorized root landing page per staff role.
 */
function getRootHrefForRole(role?: UserRole | null): string {
  switch (role) {
    case ROLE.ADMIN:
      return '/admin/dashboard';
    case ROLE.CASHIER:
    case ROLE.KASIR:
      return '/cashier/tables';
    case ROLE.KITCHEN:
    case ROLE.DAPUR:
      return '/kitchen/orders';
    case ROLE.WAITER:
    case ROLE.PELAYAN:
      return '/waiter/tables';
    default:
      return '/login';
  }
}

interface DynamicBreadcrumbProps {
  className?: string;
  rootLabel?: string;
}

export function DynamicBreadcrumb({
  className,
  rootLabel = 'Kumpul Cafe',
}: DynamicBreadcrumbProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (!pathname || pathname === '/' || pathname === '/login') {
    return null;
  }

  const rawSegments = pathname.split('/').filter(Boolean);
  if (rawSegments.length === 0) {
    return null;
  }

  // Determine role-safe root href
  const safeRootHref = getRootHrefForRole(user?.role);

  // Extract namespace prefix (e.g. 'admin') and sub-segments
  const hasNamespace = NAMESPACE_PREFIXES.has(rawSegments[0]?.toLowerCase());
  const prefix = hasNamespace ? rawSegments[0] : '';
  const contentSegments = hasNamespace ? rawSegments.slice(1) : rawSegments;

  // Build hardened items with valid, accessible hrefs
  const items = contentSegments.map((segment, index) => {
    const isLast = index === contentSegments.length - 1;
    // Reconstruct valid absolute path: e.g. prefix 'admin' + 'menus' -> '/admin/menus'
    const pathParts = prefix ? [prefix, ...contentSegments.slice(0, index + 1)] : contentSegments.slice(0, index + 1);
    const href = `/${pathParts.join('/')}`;

    // Format display label
    const rawLabel = ROUTE_LABELS[segment.toLowerCase()];
    const isId = /^[0-9a-fA-F-]+$/.test(segment) || !isNaN(Number(segment));
    const label = rawLabel || (isId ? `#${segment.slice(0, 6)}` : segment.charAt(0).toUpperCase() + segment.slice(1));

    return {
      label,
      href,
      isLast,
    };
  });

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {/* Role-Safe Root Landing Link */}
        <BreadcrumbItem>
          <BreadcrumbLink href={safeRootHref} className="flex items-center gap-1.5 font-semibold text-stone-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400">
            <Store className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>{rootLabel}</span>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {items.map((item) => (
          <React.Fragment key={item.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage className="font-bold text-stone-900 dark:text-zinc-100">
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
