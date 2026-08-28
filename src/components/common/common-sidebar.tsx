'use client';

import { ComponentType, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

import { useAuthStore, UserRole, ROLE } from '@/store/use-auth-store';
import { useSidebarStore } from '@/store/use-sidebar-store';
import { cn } from '@/lib/utils/cn';
import { SimpleTooltip } from '@/components/ui/tooltip';

export interface CommonNavItem {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  allowedRoles: UserRole[] | readonly UserRole[];
}

const defaultNavItems: CommonNavItem[] = [
  // Admin Specific
  {
    title: 'Dashboard Omset',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    allowedRoles: [ROLE.ADMIN],
  },
  {
    title: 'Laporan Penjualan',
    href: '/admin/reports',
    icon: BarChart3,
    allowedRoles: [ROLE.ADMIN],
  },
  {
    title: 'Log Pesanan Admin',
    href: '/admin/orders',
    icon: UtensilsCrossed,
    allowedRoles: [ROLE.ADMIN],
  },
  {
    title: 'Denah Meja & Kasir',
    href: '/admin/tables',
    icon: Grid2X2,
    allowedRoles: [ROLE.ADMIN],
  },
  {
    title: 'Katalog Menu',
    href: '/admin/menus',
    icon: BookOpen,
    allowedRoles: [ROLE.ADMIN],
  },
  {
    title: 'Kategori Menu',
    href: '/admin/categories',
    icon: Tags,
    allowedRoles: [ROLE.ADMIN],
  },
  {
    title: 'Shift & Kasir',
    href: '/admin/shifts',
    icon: Clock,
    allowedRoles: [ROLE.ADMIN, ROLE.CASHIER, ROLE.KASIR],
  },
  {
    title: 'Manajemen Staf',
    href: '/admin/staff',
    icon: Users,
    allowedRoles: [ROLE.ADMIN],
  },
  {
    title: 'Presensi Staf',
    href: '/admin/attendance',
    icon: CalendarCheck,
    allowedRoles: [ROLE.ADMIN],
  },
  {
    title: 'Banner Promo',
    href: '/admin/banners',
    icon: ImageIcon,
    allowedRoles: [ROLE.ADMIN],
  },
  {
    title: 'Pengaturan Cabang',
    href: '/admin/settings',
    icon: Settings,
    allowedRoles: [ROLE.ADMIN],
  },


  // Kitchen Specific
  {
    title: 'Kitchen Display (KDS)',
    href: '/kitchen/orders',
    icon: UtensilsCrossed,
    allowedRoles: [ROLE.KITCHEN, ROLE.DAPUR],
  },

  // Cashier Specific
  {
    title: 'Denah Meja & Kasir',
    href: '/cashier/tables',
    icon: Grid2X2,
    allowedRoles: [ROLE.CASHIER, ROLE.KASIR],
  },
  {
    title: 'Monitor Antrean KDS',
    href: '/kitchen/orders',
    icon: UtensilsCrossed,
    allowedRoles: [ROLE.CASHIER, ROLE.KASIR],
  },

  // Waiter Specific
  {
    title: 'Denah Meja Pelayan',
    href: '/waiter/tables',
    icon: Grid2X2,
    allowedRoles: [ROLE.WAITER, ROLE.PELAYAN],
  },
];

interface CommonSidebarProps {
  brandTitle?: string;
  portalSubtitle?: string;
  customNavItems?: CommonNavItem[];
}

export function CommonSidebar({
  brandTitle = 'Kumpul Cafe',
  portalSubtitle = 'OPERATIONAL PORTAL',
  customNavItems,
}: CommonSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { isCollapsed, toggleCollapse } = useSidebarStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navList = customNavItems || defaultNavItems;
  const filteredNavItems = navList.filter((item) => {
    if (!user) return false;
    return item.allowedRoles.includes(user.role);
  });

  const collapsed = mounted ? isCollapsed : false;
  const userName = user?.name || user?.username || 'Staff';
  const userRole = user?.role || 'STAFF';

  return (
    <aside
      className={cn(
        'shrink-0 border-r border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between hidden md:flex h-full overflow-hidden transition-all duration-300 ease-in-out relative z-20',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Brand Header */}
        <div
          className={cn(
            'h-18 px-4 flex items-center border-b border-stone-100 dark:border-zinc-800/80 transition-all duration-300 shrink-0',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/30 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="truncate animate-in fade-in duration-200">
                <span className="font-extrabold text-base text-stone-900 dark:text-zinc-50 block leading-tight truncate">
                  {brandTitle}
                </span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider block">
                  {portalSubtitle}
                </span>
              </div>
            )}
          </div>

          {/* Collapse Toggle Button */}
          {!collapsed && (
            <SimpleTooltip content="Kecilkan Sidebar" side="right">
              <button
                type="button"
                onClick={toggleCollapse}
                className="h-8 w-8 rounded-xl border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </SimpleTooltip>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <SimpleTooltip content="Perlebar Sidebar" side="right">
              <button
                type="button"
                onClick={toggleCollapse}
                className="h-8 w-8 rounded-xl border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-500 hover:text-amber-600 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            </SimpleTooltip>
          </div>
        )}

        {/* Navigation List */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto overflow-x-hidden">
          {!collapsed && (
            <div className="px-3 py-1.5 text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider animate-in fade-in duration-200">
              Menu Navigasi
            </div>
          )}

          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <SimpleTooltip key={item.href} content={collapsed ? item.title : undefined} side="right">
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center rounded-2xl text-sm font-semibold transition-all group relative',
                    collapsed
                      ? 'justify-center h-11 w-11 mx-auto'
                      : 'gap-3 px-3.5 py-2.5',
                    isActive
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold shadow-xs'
                      : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-50 dark:hover:bg-zinc-800/60 hover:text-stone-900 dark:hover:text-zinc-100'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-colors',
                      isActive
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-stone-400 group-hover:text-stone-700 dark:group-hover:text-zinc-200'
                    )}
                  />
                  {!collapsed && (
                    <span className="truncate animate-in fade-in duration-200">
                      {item.title}
                    </span>
                  )}
                  {isActive && collapsed && (
                    <span className="absolute -left-1.5 h-6 w-1 rounded-r-full bg-amber-600" />
                  )}
                </Link>
              </SimpleTooltip>
            );
          })}
        </nav>

        {/* Role Badge Footer */}
        <div
          className={cn(
            'p-3 border-t border-stone-100 dark:border-zinc-800 m-3 rounded-2xl bg-stone-50/80 dark:bg-zinc-800/40 transition-all duration-300 shrink-0',
            collapsed ? 'flex justify-center' : 'flex items-center justify-between'
          )}
        >
          {!collapsed ? (
            <>
              <div className="truncate animate-in fade-in duration-200">
                <span className="text-xs font-bold text-stone-900 dark:text-zinc-100 block truncate">
                  {userName}
                </span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">
                  {userRole}
                </span>
              </div>
              <SimpleTooltip content="Status: Online" side="top">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 shrink-0 cursor-default" />
              </SimpleTooltip>
            </>
          ) : (
            <SimpleTooltip content={`${userName} (${userRole})`} side="right">
              <div className="h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 cursor-default" />
            </SimpleTooltip>
          )}
        </div>
      </div>
    </aside>
  );
}
