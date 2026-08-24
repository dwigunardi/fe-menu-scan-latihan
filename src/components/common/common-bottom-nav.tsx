'use client';

import { ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Grid2X2,
  BookOpen,
} from 'lucide-react';
import { useAuthStore, UserRole } from '@/store/use-auth-store';
import { cn } from '@/lib/utils/cn';

interface MobileNavItem {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
}

const mobileNavItems: MobileNavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['ADMIN'],
  },
  {
    title: 'KDS Dapur',
    href: '/kitchen/orders',
    icon: UtensilsCrossed,
    allowedRoles: ['KITCHEN', 'DAPUR', 'CASHIER', 'KASIR', 'ADMIN'],
  },
  {
    title: 'Kasir',
    href: '/cashier/tables',
    icon: Grid2X2,
    allowedRoles: ['CASHIER', 'KASIR'],
  },
  {
    title: 'Pelayan',
    href: '/waiter/tables',
    icon: Grid2X2,
    allowedRoles: ['WAITER', 'PELAYAN'],
  },
  {
    title: 'Denah Meja',
    href: '/admin/tables',
    icon: Grid2X2,
    allowedRoles: ['ADMIN'],
  },
  {
    title: 'Menu',
    href: '/admin/menus',
    icon: BookOpen,
    allowedRoles: ['ADMIN'],
  },
];

export function CommonBottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const filteredItems = mobileNavItems.filter((item) => {
    if (!user) return false;
    return item.allowedRoles.includes(user.role);
  });

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-stone-200/80 dark:border-zinc-800 px-4 py-2 safe-area-pb shadow-lg shadow-black/5">
      <nav className="flex items-center justify-around max-w-md mx-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all relative',
                isActive
                  ? 'text-amber-600 dark:text-amber-500 font-bold'
                  : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100'
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-xl transition-colors',
                  isActive && 'bg-amber-50 dark:bg-amber-950/60'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium leading-none">
                {item.title}
              </span>
              {isActive && (
                <span className="absolute -top-1 h-1 w-6 rounded-full bg-amber-600" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
