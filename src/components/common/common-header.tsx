'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Sun, Moon, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/use-auth-store';
import { useSidebarStore } from '@/store/use-sidebar-store';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';

interface CommonHeaderProps {
  portalTitle?: string;
  breadcrumb?: string;
}

export function CommonHeader({
  portalTitle = 'Portal Operasional',
  breadcrumb,
}: CommonHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { isCollapsed, toggleCollapse } = useSidebarStore();
  const [mounted, setMounted] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
    toast.success('Berhasil keluar dari sesi akun');
    router.replace('/login');
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <header className="h-18 px-4 sm:px-6 border-b border-stone-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          {/* Desktop Sidebar Toggle in Header */}
          <SimpleTooltip content={mounted && isCollapsed ? 'Perlebar Sidebar' : 'Kecilkan Sidebar'} side="bottom">
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden md:flex h-9 w-9 rounded-xl border border-stone-200 dark:border-zinc-800 items-center justify-center text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {mounted && isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </SimpleTooltip>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-stone-400 dark:text-zinc-500">
              Kumpul Cafe /
            </span>
            <span className="font-bold text-stone-800 dark:text-zinc-200">
              {breadcrumb || portalTitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Next-Themes Dynamic Toggle */}
          <SimpleTooltip content={mounted && resolvedTheme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'} side="bottom">
            <button
              type="button"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
            >
              {mounted ? (
                resolvedTheme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-400 animate-in spin-in-180 duration-300" />
                ) : (
                  <Moon className="h-4 w-4 text-stone-600 animate-in spin-in-180 duration-300" />
                )
              ) : (
                <div className="h-4 w-4" />
              )}
            </button>
          </SimpleTooltip>

          {/* Staff Role Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800 text-xs">
            <span className="font-bold text-stone-800 dark:text-zinc-200">
              {user?.name || user?.username || 'Staff'}
            </span>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100/80 dark:bg-amber-950 px-2 py-0.5 rounded-full uppercase">
              {user?.role || 'STAFF'}
            </span>
          </div>

          {/* Logout Button (Triggers Confirmation Modal) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLogoutModalOpen(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900 text-xs h-9 px-3 transition-colors active:scale-95 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 mr-1" />
            <span>Keluar</span>
          </Button>
        </div>
      </header>

      {/* Reusable Confirmation Dialog for Logout */}
      <ConfirmationDialog
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        variant="danger"
        icon={LogOut}
        title="Konfirmasi Keluar Akun"
        description="Apakah Anda yakin ingin mengakhiri sesi kerja staf saat ini? Anda harus memasukkan kredensial login kembali untuk mengakses portal."
        confirmText="Ya, Keluar Akun"
        cancelText="Batal"
      >
        {user && (
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/80 dark:border-zinc-800 flex items-center justify-between">
            <div className="space-y-0.5 text-left">
              <p className="text-xs font-bold text-stone-900 dark:text-zinc-100">
                {user.name}
              </p>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400 font-mono">
                {user.username || user.email || 'user'}
              </p>
            </div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100/80 dark:bg-amber-950 px-2.5 py-1 rounded-full uppercase border border-amber-200 dark:border-amber-900">
              {user.role}
            </span>
          </div>
        )}
      </ConfirmationDialog>
    </>
  );
}
