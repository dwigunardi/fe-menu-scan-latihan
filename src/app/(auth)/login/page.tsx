'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { loginStaff } from '@/lib/api/auth-api';
import { useAuthStore, UserRole, ROLE } from '@/store/use-auth-store';
import { notifyApiError } from '@/lib/api/notify-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type LoginPresetType = 'form' | 'admin' | 'cashier' | 'kitchen' | 'waiter';

export default function StaffLoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, _hasHydrated, user } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingPreset, setLoadingPreset] = useState<LoginPresetType | null>(null);

  const isLoading = loadingPreset !== null;

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

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Mohon masukkan username / email dan password');
      return;
    }

    await executeLogin(username, password, 'form');
  };

  const handleQuickLogin = (u: string, p: string, presetType: LoginPresetType) => {
    setUsername(u);
    setPassword(p);
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
        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-amber-600" />
              Username / Email
            </label>
            <Input
              type="text"
              placeholder="Masukkan username staf..."
              value={username}
              disabled={isLoading}
              onChange={(e) => setUsername(e.target.value)}
              className="h-11 rounded-2xl bg-stone-50/50 dark:bg-zinc-800/50 border-stone-200 dark:border-zinc-700/80 transition-all duration-200"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-amber-600" />
              Kata Sandi
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi..."
                value={password}
                disabled={isLoading}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-2xl pr-10 bg-stone-50/50 dark:bg-zinc-800/50 border-stone-200 dark:border-zinc-700/80 transition-all duration-200"
                required
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
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            isLoading={loadingPreset === 'form'}
            loadingText="Memverifikasi Akun..."
            className="w-full h-11 rounded-2xl font-bold shadow-md shadow-amber-600/20 mt-2 transition-all duration-200 active:scale-[0.98]"
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
              <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                {loadingPreset === 'admin' ? (
                  <Loader2 className="h-3.5 w-3.5 text-amber-600 animate-spin shrink-0" />
                ) : (
                  <Crown className="h-3.5 w-3.5 text-amber-600 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                )}
                <span>Super Admin</span>
              </div>
              <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono block">
                {loadingPreset === 'admin' ? 'Memverifikasi...' : 'admin / admin123'}
              </span>
            </Button>

            {/* Kasir Meja */}
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => handleQuickLogin('cashier@menuscan.com', 'cashier123', 'cashier')}
              className={`h-auto p-3 rounded-2xl border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/60 text-left flex flex-col items-start justify-start gap-0.5 transition-all duration-200 cursor-pointer group shadow-2xs w-full whitespace-normal active:scale-[0.97] ${
                loadingPreset === 'cashier'
                  ? 'ring-2 ring-emerald-500/40 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30'
                  : 'hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                {loadingPreset === 'cashier' ? (
                  <Loader2 className="h-3.5 w-3.5 text-emerald-600 animate-spin shrink-0" />
                ) : (
                  <Receipt className="h-3.5 w-3.5 text-emerald-600 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                )}
                <span>Kasir Meja</span>
              </div>
              <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono block">
                {loadingPreset === 'cashier' ? 'Memverifikasi...' : 'cashier / cashier123'}
              </span>
            </Button>

            {/* Barista Dapur */}
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
              <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                {loadingPreset === 'kitchen' ? (
                  <Loader2 className="h-3.5 w-3.5 text-amber-600 animate-spin shrink-0" />
                ) : (
                  <Coffee className="h-3.5 w-3.5 text-amber-600 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                )}
                <span>Barista Dapur</span>
              </div>
              <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono block">
                {loadingPreset === 'kitchen' ? 'Memverifikasi...' : 'kitchen / kitchen123'}
              </span>
            </Button>

            {/* Pelayan */}
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => handleQuickLogin('waiter@menuscan.com', 'waiter123', 'waiter')}
              className={`h-auto p-3 rounded-2xl border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/60 text-left flex flex-col items-start justify-start gap-0.5 transition-all duration-200 cursor-pointer group shadow-2xs w-full whitespace-normal active:scale-[0.97] ${
                loadingPreset === 'waiter'
                  ? 'ring-2 ring-blue-500/40 border-blue-500 bg-blue-50/70 dark:bg-blue-950/30'
                  : 'hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                {loadingPreset === 'waiter' ? (
                  <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin shrink-0" />
                ) : (
                  <ConciergeBell className="h-3.5 w-3.5 text-blue-600 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                )}
                <span>Pelayan</span>
              </div>
              <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono block">
                {loadingPreset === 'waiter' ? 'Memverifikasi...' : 'waiter / waiter123'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
