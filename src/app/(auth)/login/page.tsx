'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { loginStaff } from '@/lib/api/auth-api';
import { useAuthStore, UserRole } from '@/store/use-auth-store';
import { notifyApiError } from '@/lib/api/notify-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function StaffLoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, _hasHydrated, user } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Auto redirect if already authenticated
  useEffect(() => {
    if (_hasHydrated && isAuthenticated && user) {
      handleRoleRedirect(user.role);
    }
  }, [_hasHydrated, isAuthenticated, user]);

  // Smart Role-Based Redirect
  const handleRoleRedirect = (role: UserRole) => {
    switch (role) {
      case 'KITCHEN':
      case 'DAPUR':
        router.replace('/kitchen/orders');
        break;
      case 'CASHIER':
      case 'KASIR':
        router.replace('/cashier/tables');
        break;
      case 'WAITER':
      case 'PELAYAN':
        router.replace('/waiter/tables');
        break;
      case 'ADMIN':
      default:
        router.replace('/admin/dashboard');
        break;
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Mohon masukkan username / email dan password');
      return;
    }

    setIsLoading(true);
    const result = await loginStaff({ usernameOrEmail: username, password });
    setIsLoading(false);

    if (result.isLeft()) {
      notifyApiError(result.value);
      return;
    }

    const { user: loggedInUser, accessToken, refreshToken } = result.value;
    setAuth(loggedInUser, accessToken, refreshToken);
    toast.success(`Selamat datang kembali, ${loggedInUser.name}!`);

    handleRoleRedirect(loggedInUser.role);
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
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
              onChange={(e) => setUsername(e.target.value)}
              className="h-11 rounded-2xl bg-stone-50/50 dark:bg-zinc-800/50 border-stone-200 dark:border-zinc-700/80"
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
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-2xl pr-10 bg-stone-50/50 dark:bg-zinc-800/50 border-stone-200 dark:border-zinc-700/80"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300"
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
            className="w-full h-11 rounded-2xl font-bold shadow-md shadow-amber-600/20 mt-2"
          >
            {isLoading ? 'Memverifikasi...' : 'Masuk ke Portal'}
          </Button>
        </form>

        {/* Quick Fill Credentials for Dev/Demo */}
        <div className="w-full mt-6 pt-5 border-t border-stone-100 dark:border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400 dark:text-zinc-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Akun Demo Cepat:
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'AdminPass123!')}
              className="px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/60 hover:border-amber-500 text-[11px] font-medium text-left truncate transition-colors cursor-pointer"
            >
              <Badge variant="outline" className="text-[9px] px-1 py-0 mr-1 bg-amber-50 dark:bg-amber-950 text-amber-600 border-amber-200">
                ADMIN
              </Badge>
              admin
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('kitchen', 'KitchenPass123!')}
              className="px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/60 hover:border-amber-500 text-[11px] font-medium text-left truncate transition-colors cursor-pointer"
            >
              <Badge variant="outline" className="text-[9px] px-1 py-0 mr-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border-emerald-200">
                KITCHEN
              </Badge>
              kitchen
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('cashier', 'CashierPass123!')}
              className="px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/60 hover:border-amber-500 text-[11px] font-medium text-left truncate transition-colors cursor-pointer"
            >
              <Badge variant="outline" className="text-[9px] px-1 py-0 mr-1 bg-blue-50 dark:bg-blue-950 text-blue-600 border-blue-200">
                CASHIER
              </Badge>
              cashier
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('waiter', 'WaiterPass123!')}
              className="px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/60 hover:border-amber-500 text-[11px] font-medium text-left truncate transition-colors cursor-pointer"
            >
              <Badge variant="outline" className="text-[9px] px-1 py-0 mr-1 bg-purple-50 dark:bg-purple-950 text-purple-600 border-purple-200">
                WAITER
              </Badge>
              waiter
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
