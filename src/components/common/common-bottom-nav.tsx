'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import {
  Menu,
  X,
  Clock,
  ArrowRightLeft,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore, ROLE } from '@/store/use-auth-store';
import { cn } from '@/lib/utils/cn';
import {
  getMobilePrimaryNavItems,
  getMobileMoreNavItems,
  NavigationItem,
} from '@/lib/constants/navigation';
import { ClockInModal } from '@/components/attendance/clock-in-modal';
import { ShiftHandoverModal } from '@/components/shifts/shift-handover-modal';
import { toast } from 'sonner';

export function CommonBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Quick Action Modals
  const [isClockInOpen, setIsClockInOpen] = useState(false);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  const primaryItems = getMobilePrimaryNavItems(user?.role);
  const moreItems = getMobileMoreNavItems(user?.role);

  // Check if current active route is inside the "More" drawer
  const isCurrentInMore = moreItems.some(
    (item) =>
      pathname === item.href ||
      (item.href !== '/admin' && pathname.startsWith(item.href))
  );

  const handleConfirmLogout = () => {
    setIsDrawerOpen(false);
    logout();
    toast.success('Berhasil keluar dari sesi akun');
    router.replace('/login');
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      setIsDrawerOpen(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-stone-200/80 dark:border-zinc-800 px-2 py-1.5 safe-area-pb shadow-lg shadow-black/10">
        <nav className="grid grid-cols-5 items-center max-w-lg mx-auto">
          {/* Primary Quick Tabs (Up to 4) */}
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-2xl transition-all relative',
                  isActive
                    ? 'text-amber-600 dark:text-amber-400 font-bold'
                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100'
                )}
              >
                <div
                  className={cn(
                    'p-1.5 rounded-xl transition-all duration-200 relative',
                    isActive && 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-active-dot"
                      className="absolute -top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-amber-500"
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium leading-none truncate max-w-[62px]">
                  {item.shortTitle || item.title}
                </span>
              </Link>
            );
          })}

          {/* 5th Tab: "Lainnya" Trigger Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-2xl transition-all relative cursor-pointer',
              isDrawerOpen || isCurrentInMore
                ? 'text-amber-600 dark:text-amber-400 font-bold'
                : 'text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100'
            )}
          >
            <div
              className={cn(
                'p-1.5 rounded-xl transition-all duration-200 relative',
                (isDrawerOpen || isCurrentInMore) && 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              )}
            >
              <Menu className="h-5 w-5 shrink-0" />
              {isCurrentInMore && !isDrawerOpen && (
                <span className="absolute -top-0.5 right-0.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-medium leading-none truncate">
              Lainnya
            </span>
          </button>
        </nav>
      </div>

      {/* Smooth Motion Bottom Sheet Drawer ("Menu Lainnya") */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
            />

            {/* Sheet Content Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.15}
              onDragEnd={handleDragEnd}
              className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white dark:bg-zinc-900 rounded-t-3xl border-t border-stone-200/80 dark:border-zinc-800 max-h-[85vh] flex flex-col shadow-2xl safe-area-pb overflow-hidden"
            >
              {/* Drag Handle & Header */}
              <div className="pt-3 pb-2 px-5 flex flex-col items-center shrink-0 border-b border-stone-100 dark:border-zinc-800/80">
                <div className="w-12 h-1.5 bg-stone-300 dark:bg-zinc-700 rounded-full mb-3 cursor-grab active:cursor-grabbing" />
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-stone-900 dark:text-zinc-100">
                        Menu Navigasi Lengkap
                      </h3>
                      <p className="text-[10px] text-stone-500 dark:text-zinc-400">
                        {user.name} ({user.role})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="h-8 w-8 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-500 hover:text-stone-900 dark:hover:text-zinc-100 flex items-center justify-center cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Body with Grid of Modules */}
              <div className="p-4 overflow-y-auto space-y-4 flex-1">
                {/* Quick Action Shortcuts Bar */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setIsClockInOpen(true);
                    }}
                    className="p-2.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 text-left flex items-center gap-2.5 cursor-pointer active:scale-98 transition-all"
                  >
                    <div className="h-8 w-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-stone-900 dark:text-zinc-100 block">
                        Presensi GPS
                      </span>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 block">
                        Masuk / Pulang
                      </span>
                    </div>
                  </button>

                  {user.role !== ROLE.ADMIN ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        setIsHandoverOpen(true);
                      }}
                      className="p-2.5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 text-left flex items-center gap-2.5 cursor-pointer active:scale-98 transition-all"
                    >
                      <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <ArrowRightLeft className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-stone-900 dark:text-zinc-100 block">
                          Ganti Shift
                        </span>
                        <span className="text-[10px] text-blue-700 dark:text-blue-400 block">
                          Serah Terima
                        </span>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
                      }}
                      className="p-2.5 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/60 text-left flex items-center gap-2.5 cursor-pointer active:scale-98 transition-all"
                    >
                      <div className="h-8 w-8 rounded-xl bg-stone-200 dark:bg-zinc-700 text-stone-700 dark:text-zinc-200 flex items-center justify-center shrink-0">
                        {mounted && resolvedTheme === 'dark' ? (
                          <Sun className="h-4 w-4 text-amber-400" />
                        ) : (
                          <Moon className="h-4 w-4 text-stone-700" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-stone-900 dark:text-zinc-100 block">
                          Tema Aplikasi
                        </span>
                        <span className="text-[10px] text-stone-500 dark:text-zinc-400 block">
                          {mounted && resolvedTheme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}
                        </span>
                      </div>
                    </button>
                  )}
                </div>

                {/* Secondary Modules Grid */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider px-1 block">
                    Modul & Pengaturan
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {moreItems.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        pathname === item.href ||
                        (item.href !== '/admin' && pathname.startsWith(item.href));

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsDrawerOpen(false)}
                          className={cn(
                            'p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer',
                            isActive
                              ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                              : 'border-stone-200/80 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800/60 text-stone-700 dark:text-zinc-300'
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
                                isActive
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400'
                              )}
                            >
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <div className="truncate">
                              <span className="text-xs font-bold block truncate">
                                {item.title}
                              </span>
                              {item.description && (
                                <span className="text-[10px] text-stone-500 dark:text-zinc-400 block truncate">
                                  {item.description}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-stone-400 shrink-0 ml-2" />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Logout Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmLogout}
                    className="w-full h-11 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition-colors cursor-pointer active:scale-98"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Keluar dari Sesi Akun</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick Trigger Modals */}
      <ClockInModal
        isOpen={isClockInOpen}
        onClose={() => setIsClockInOpen(false)}
      />
      <ShiftHandoverModal
        isOpen={isHandoverOpen}
        onClose={() => setIsHandoverOpen(false)}
      />
    </>
  );
}
