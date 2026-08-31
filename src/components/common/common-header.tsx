'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/use-auth-store';
import { useSidebarStore } from '@/store/use-sidebar-store';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { ClockInModal } from '@/components/attendance/clock-in-modal';
import { ShiftHandoverModal } from '@/components/shifts/shift-handover-modal';
import { ROLE } from '@/lib/constants/roles';

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
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);

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
      <header className="h-16 px-3 sm:px-5 lg:px-6 border-b border-stone-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Desktop/Tablet Sidebar Toggle in Header */}
          <SimpleTooltip content={mounted && isCollapsed ? 'Perlebar Sidebar' : 'Kecilkan Sidebar'} side="bottom">
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden md:flex h-8.5 w-8.5 rounded-xl border border-stone-200 dark:border-zinc-800 items-center justify-center text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            >
              {mounted && isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </SimpleTooltip>

          <div className="flex items-center gap-2 text-xs">
            <span className="hidden sm:inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span className="font-bold text-stone-800 dark:text-zinc-200 truncate">
              {breadcrumb || portalTitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Presensi (Clock In/Out) Trigger */}
          <SimpleTooltip content="Presensi Masuk / Pulang (GPS Geofence)" side="bottom">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsClockInModalOpen(true)}
              className="h-8.5 px-2.5 sm:px-3 text-xs font-semibold text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer"
            >
              <Clock className="h-3.5 w-3.5 sm:mr-1 shrink-0" />
              <span className="hidden md:inline">Presensi</span>
            </Button>
          </SimpleTooltip>

          {/* Quick Shift Handover (Ganti Shift) Trigger */}
          {user?.role !== ROLE.ADMIN && (
            <SimpleTooltip content="Serah Terima Shift Kasir / Staf" side="bottom">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHandoverModalOpen(true)}
                className="h-8.5 px-2.5 sm:px-3 text-xs font-semibold text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer"
              >
                <ArrowRightLeft className="h-3.5 w-3.5 sm:mr-1 shrink-0" />
                <span className="hidden md:inline">Ganti Shift</span>
              </Button>
            </SimpleTooltip>
          )}

          {/* Next-Themes Dynamic Toggle */}
          <SimpleTooltip content={mounted && resolvedTheme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'} side="bottom">
            <button
              type="button"
              onClick={toggleTheme}
              className="h-8.5 w-8.5 rounded-xl border border-stone-200 dark:border-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer shrink-0"
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

          {/* Staff Role Pill - Adaptive on Tablet/Desktop */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800 text-xs shrink-0">
            <span className="hidden lg:inline font-bold text-stone-800 dark:text-zinc-200 max-w-[100px] truncate">
              {user?.name || user?.username || 'Staff'}
            </span>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100/80 dark:bg-amber-950 px-2 py-0.5 rounded-full uppercase">
              {user?.role || 'STAFF'}
            </span>
          </div>

          {/* Logout Button */}
          <SimpleTooltip content="Keluar dari Akun" side="bottom">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLogoutModalOpen(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900 text-xs h-8.5 px-2.5 sm:px-3 transition-colors active:scale-95 cursor-pointer shrink-0"
            >
              <LogOut className="h-3.5 w-3.5 lg:mr-1 shrink-0" />
              <span className="hidden lg:inline">Keluar</span>
            </Button>
          </SimpleTooltip>
        </div>
      </header>

      {/* Clock In / Out Modal */}
      <ClockInModal
        isOpen={isClockInModalOpen}
        onClose={() => setIsClockInModalOpen(false)}
      />

      {/* Shift Handover Modal */}
      <ShiftHandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
      />

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
