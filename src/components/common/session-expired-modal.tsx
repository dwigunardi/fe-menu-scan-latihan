'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/use-auth-store';
import { reloginStaff } from '@/lib/api/auth-api';
import { notifyApiError } from '@/lib/api/notify-error';
import { useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from '@/lib/query-keys';
import { Lock, LogOut, Eye, EyeOff, ShieldAlert, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export function SessionExpiredModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isReauthModalOpen, closeReauthModal, logout } = useAuthStore();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isReauthModalOpen) return null;

  const handleRelogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('Mohon masukkan kata sandi staf.');
      return;
    }

    setIsLoading(true);
    const result = await reloginStaff(password);
    setIsLoading(false);

    if (result.isLeft()) {
      notifyApiError(result.value);
      return;
    }

    toast.success('Sesi berhasil diperpanjang! Melanjutkan pekerjaan Anda.');
    setPassword('');
    closeReauthModal();
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
  };

  const handleLogout = () => {
    logout();
    closeReauthModal();
    router.replace('/login');
  };

  return (
    <Dialog open={isReauthModalOpen} onOpenChange={(open) => !open && handleLogout()}>
      <DialogContent
        className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-zinc-900 border-2 border-amber-600/30 shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center sm:text-left space-y-1.5">
          <div className="mx-auto sm:mx-0 h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-1">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-stone-900 dark:text-zinc-100">
            Sesi Staf Berakhir
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500 dark:text-zinc-400">
            Masa berlaku sesi login Anda telah habis demi keamanan. Masukkan kata sandi untuk melanjutkan tanpa kehilangan pekerjaan Anda.
          </DialogDescription>
        </DialogHeader>

        {/* User profile pill */}
        {user && (
          <div className="p-3 rounded-2xl bg-stone-100 dark:bg-zinc-800/70 flex items-center gap-3 border border-stone-200/60 dark:border-zinc-700/60">
            <div className="h-9 w-9 rounded-xl bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
              <UserCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-stone-800 dark:text-zinc-200 truncate">
                {user.name}
              </p>
              <p className="text-[11px] text-stone-400 dark:text-zinc-400">
                {user.email || user.username} ({user.role})
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleRelogin} className="space-y-4 pt-2">
          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-amber-600" />
              Kata Sandi Staf
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 text-sm rounded-xl pr-10"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-stone-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoading}
              className="text-xs rounded-xl text-stone-500 hover:text-red-600"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Ganti Akun
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !password}
              className="text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              {isLoading ? 'Memverifikasi...' : 'Lanjutkan Sesi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
