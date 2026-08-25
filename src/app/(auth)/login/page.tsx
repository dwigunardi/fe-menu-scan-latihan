'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Sparkles,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Crown,
  Receipt,
  Coffee,
  ConciergeBell,
} from 'lucide-react';
import { toast } from 'sonner';
import { loginStaff } from '@/lib/api/auth-api';
import { useAuthStore, UserRole, ROLE } from '@/store/use-auth-store';
import { notifyApiError } from '@/lib/api/notify-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LoginInput,
  LoginInputSchema,
} from '@/lib/validations/auth.schema';

type LoginPresetType = 'form' | 'admin' | 'cashier' | 'kitchen' | 'waiter';

export default function StaffLoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, _hasHydrated, user } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [loadingPreset, setLoadingPreset] = useState<LoginPresetType | null>(null);

  const isLoading = loadingPreset !== null;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Auto redirect if already authenticated
  useEffect(() => {
    if (_hasHydrated && isAuthenticated && user) {
      handleRoleRedirect(user.role);
    }
  }, [_hasHydrated, isAuthenticated, user]);

  // Smart Role-Based Redirect
  const handleRoleRedirect = (role: UserRole) => {
    switch (role) {
      case ROLE.KITCHEN:
      case ROLE.DAPUR:
        router.replace('/kitchen/orders');
        break;
      case ROLE.CASHIER:
      case ROLE.KASIR:
        router.replace('/cashier/tables');
        break;
      case ROLE.WAITER:
      case ROLE.PELAYAN:
        router.replace('/waiter/tables');
        break;
      case ROLE.ADMIN:
      default:
        router.replace('/admin/dashboard');
        break;
    }
  };

  const executeLogin = async (u: string, p: string, presetType: LoginPresetType) => {
    setLoadingPreset(presetType);
    const result = await loginStaff({ usernameOrEmail: u, password: p });
    setLoadingPreset(null);

    if (result.isLeft()) {
      notifyApiError(result.value);
      return;
    }

    const { user: loggedInUser, accessToken, refreshToken } = result.value;
    setAuth(loggedInUser, accessToken, refreshToken);
    toast.success(`Selamat datang kembali, ${loggedInUser.name}!`);

    handleRoleRedirect(loggedInUser.role);
  };

  const onFormSubmit = async (data: LoginInput) => {
    await executeLogin(data.username, data.password, 'form');
  };

  const handleQuickLogin = (u: string, p: string, presetType: LoginPresetType) => {
    setValue('username', u);
    setValue('password', p);
    executeLogin(u, p, presetType);
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4 sm:p-6 bg-[#FAF7F2] dark:bg-zinc-950 text-foreground transition-colors relative overflow-hidden">
      {/* Background Decorative Blob */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-zinc-800 shadow-xl shadow-stone-900/5 dark:shadow-black/20 flex flex-col items-center relative z-10">
        {/* Brand Icon Header */}
        <div className="h-14 w-14 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-600/30 mb-4 animate-in zoom-in-95 duration-200">
          <Sparkles className="h-7 w-7" />
        </div>

        <div className="text-center space-y-1.5 mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
            Portal Staf Kumpul Cafe
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400">
            Masuk untuk mengakses Kitchen Display, Kasir, atau Manajemen.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="w-full space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 dark:text-zinc-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-amber-600" />
              Username / Email
            </label>
            <Input
              type="text"
              placeholder="Masukkan username staf..."
              disabled={isLoading}
              {...register('username')}
              className="h-11 rounded-2xl bg-stone-50/50 dark:bg-zinc-800/50 border-stone-200 dark:border-zinc-700/80 transition-all duration-200"
              autoFocus
            />
            {errors.username && (
              <p className="text-xs font-medium text-rose-500">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-amber-600" />
              Kata Sandi
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi..."
                disabled={isLoading}
                {...register('password')}
                className="h-11 rounded-2xl pr-10 bg-stone-50/50 dark:bg-zinc-800/50 border-stone-200 dark:border-zinc-700/80 transition-all duration-200"
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300 disabled:opacity-50"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-rose-500">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            isLoading={loadingPreset === 'form'}
            loadingText="Memverifikasi Akun..."
            className="w-full h-11 rounded-2xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 mt-2 transition-all duration-200 active:scale-[0.98]"
          >
            Masuk ke Portal
          </Button>
        </form>

        {/* 1-Click Quick Demo Login Presets */}
        <div className="w-full mt-6 pt-4 border-t border-stone-200/80 dark:border-zinc-800 space-y-3">
          <div className="flex items-center gap-1.5 justify-center text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
            <span>1-Click Quick Demo Login</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Super Admin */}
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => handleQuickLogin('admin@menuscan.com', 'admin123', 'admin')}
              className={`h-auto p-3 rounded-2xl border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/60 text-left flex flex-col items-start justify-start gap-0.5 transition-all duration-200 cursor-pointer group shadow-2xs w-full whitespace-normal active:scale-[0.97] ${
                loadingPreset === 'admin'
                  ? 'ring-2 ring-amber-500/40 border-amber-500 bg-amber-50/70 dark:bg-amber-950/30'
                  : 'hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
              }`}
            >
              <div className="flex items-center gap-1.5 w-full">
                <Crown className="h-4 w-4 text-purple-600 shrink-0" />
                <span className="font-bold text-xs text-stone-900 dark:text-zinc-100">Super Admin</span>
              </div>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-mono">admin@menuscan.com</span>
            </Button>

            {/* Kasir POS */}
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => handleQuickLogin('cashier@menuscan.com', 'cashier123', 'cashier')}
              className={`h-auto p-3 rounded-2xl border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/60 text-left flex flex-col items-start justify-start gap-0.5 transition-all duration-200 cursor-pointer group shadow-2xs w-full whitespace-normal active:scale-[0.97] ${
                loadingPreset === 'cashier'
                  ? 'ring-2 ring-emerald-500/40 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30'
                  : 'hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
              }`}
            >
              <div className="flex items-center gap-1.5 w-full">
                <Receipt className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-xs text-stone-900 dark:text-zinc-100">Kasir Front POS</span>
              </div>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-mono">cashier@menuscan.com</span>
            </Button>

            {/* Dapur KDS */}
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => handleQuickLogin('kitchen@menuscan.com', 'kitchen123', 'kitchen')}
              className={`h-auto p-3 rounded-2xl border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/60 text-left flex flex-col items-start justify-start gap-0.5 transition-all duration-200 cursor-pointer group shadow-2xs w-full whitespace-normal active:scale-[0.97] ${
                loadingPreset === 'kitchen'
                  ? 'ring-2 ring-amber-500/40 border-amber-500 bg-amber-50/70 dark:bg-amber-950/30'
                  : 'hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
              }`}
            >
              <div className="flex items-center gap-1.5 w-full">
                <Coffee className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="font-bold text-xs text-stone-900 dark:text-zinc-100">Kitchen & Bar</span>
              </div>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-mono">kitchen@menuscan.com</span>
            </Button>

            {/* Pelayan / Waiter */}
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => handleQuickLogin('waiter@menuscan.com', 'waiter123', 'waiter')}
              className={`h-auto p-3 rounded-2xl border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/60 text-left flex flex-col items-start justify-start gap-0.5 transition-all duration-200 cursor-pointer group shadow-2xs w-full whitespace-normal active:scale-[0.97] ${
                loadingPreset === 'waiter'
                  ? 'ring-2 ring-sky-500/40 border-sky-500 bg-sky-50/70 dark:bg-sky-950/30'
                  : 'hover:border-sky-500 dark:hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/20'
              }`}
            >
              <div className="flex items-center gap-1.5 w-full">
                <ConciergeBell className="h-4 w-4 text-sky-600 shrink-0" />
                <span className="font-bold text-xs text-stone-900 dark:text-zinc-100">Pelayan (Floor)</span>
              </div>
              <span className="text-[10px] text-stone-400 dark:text-zinc-500 font-mono">waiter@menuscan.com</span>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
