'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Eye, EyeOff, Lock, User, ShieldCheck, Crown, Receipt, Coffee, ConciergeBell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore, UserRole } from '@/store/use-auth-store';
import { loginStaff } from '@/lib/api/auth-api';
import { notifyApiError } from '@/lib/api/notify-error';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [username, setUsername] = useState('admin@menuscan.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Smart Role-Based Redirect
  const handleRoleRedirect = (role: UserRole) => {
    switch (role) {
      case 'KITCHEN':
        router.replace('/admin/orders');
        break;
      case 'CASHIER':
      case 'WAITER':
        router.replace('/admin/tables');
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

    const { accessToken, user } = result.value;
    setAuth(user, accessToken);
    toast.success(`Selamat datang kembali, ${user.name} (${user.role})!`);
    handleRoleRedirect(user.role);
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4 bg-[#FAF7F2] dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-7 sm:p-8 border border-stone-200/80 dark:border-zinc-800 shadow-xl shadow-stone-200/50 dark:shadow-black/40 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-600/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-white">
            Kumpul Cafe
          </h1>
          <p className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">
            STAFF & MANAGEMENT PORTAL
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-stone-700 dark:text-zinc-300">
              Email / Username Staf
            </Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                placeholder="admin@menuscan.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
              />
              <User className="h-4 w-4 absolute left-3.5 top-3.5 text-stone-400 dark:text-zinc-500" />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-stone-700 dark:text-zinc-300">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="��������"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 font-mono"
              />
              <Lock className="h-4 w-4 absolute left-3.5 top-3.5 text-stone-400 dark:text-zinc-500" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-700 dark:text-zinc-500 dark:hover:text-zinc-200 cursor-pointer"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full mt-2" isLoading={isLoading}>
            Masuk Portal Staf
          </Button>
        </form>

        {/* 1-Click Quick Demo Login Presets */}
        <div className="pt-4 border-t border-stone-200/80 dark:border-zinc-800 space-y-3">
          <div className="flex items-center gap-1.5 justify-center text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
            <span>1-Click Quick Demo Login</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@menuscan.com', 'admin123')}
              className="p-3 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/60 text-left hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                <Crown className="h-3.5 w-3.5 text-amber-600" />
                <span>Super Admin</span>
              </div>
              <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono block mt-0.5">
                admin / admin123
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('cashier@menuscan.com', 'cashier123')}
              className="p-3 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/60 text-left hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                <span>Kasir Meja</span>
              </div>
              <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono block mt-0.5">
                cashier / cashier123
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('kitchen@menuscan.com', 'kitchen123')}
              className="p-3 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/60 text-left hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                <Coffee className="h-3.5 w-3.5 text-amber-600" />
                <span>Barista Dapur</span>
              </div>
              <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono block mt-0.5">
                kitchen / kitchen123
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('waiter@menuscan.com', 'waiter123')}
              className="p-3 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/60 text-left hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                <ConciergeBell className="h-3.5 w-3.5 text-blue-600" />
                <span>Pelayan</span>
              </div>
              <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono block mt-0.5">
                waiter / waiter123
              </span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
