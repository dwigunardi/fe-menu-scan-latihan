'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, ROLE, UserRole } from '@/store/use-auth-store';
import { AuthGuard } from '@/components/common/auth-guard';
import { onboardStaff } from '@/lib/api/auth-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Coffee,
  ChefHat,
  ConciergeBell,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Delete,
  Check,
  Shield,
  UtensilsCrossed,
  Receipt,
  Clock,
  IdCard,
} from 'lucide-react';

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingContent />
    </AuthGuard>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Step 2: PIN State
  const [pinCode, setPinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password validation checks
  const isLengthValid = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasDigit = /\d/.test(newPassword);
  const isDifferentFromCurrent = newPassword !== currentPassword && newPassword.length > 0;
  const isPassMatching = newPassword === confirmPassword && confirmPassword.length > 0;

  const isStep1Valid =
    currentPassword.length > 0 &&
    isLengthValid &&
    hasUppercase &&
    hasLowercase &&
    hasDigit &&
    isDifferentFromCurrent &&
    isPassMatching;

  // PIN validation checks
  const isPin4Digits = pinCode.length === 4;
  const isPinRepetitive = /^(.)\1{3}$/.test(pinCode);
  const isPinSequential = [
    '0123',
    '1234',
    '2345',
    '3456',
    '4567',
    '5678',
    '6789',
    '9876',
    '8765',
    '7654',
    '6543',
    '5432',
    '4321',
    '3210',
  ].includes(pinCode);
  const isPinSecure = isPin4Digits && !isPinRepetitive && !isPinSequential;

  // Handlers
  const handleKeypadPress = (num: string) => {
    if (pinCode.length < 4) {
      setPinCode((prev) => prev + num);
    }
  };

  const handleKeypadBackspace = () => {
    setPinCode((prev) => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setPinCode('');
  };

  const handleProceedToStep2 = () => {
    if (!isStep1Valid) {
      toast.error('Pastikan seluruh kriteria password baru terpenuhi dan cocok');
      return;
    }
    setCurrentStep(2);
  };

  const handleSubmitOnboarding = async () => {
    if (!isPinSecure) {
      toast.error('PIN 4 digit tidak boleh berulang (1111) atau berurutan (1234)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onboardStaff({
        currentPassword,
        newPassword,
        pinCode,
      });

      if (res.isLeft()) {
        toast.error(res.value.message || 'Gagal menyelesaikan onboarding');
        return;
      }

      toast.success('Aktivasi akun berhasil! Selamat datang di Kumpul Cafe');
      setCurrentStep(3);
    } catch {
      toast.error('Terjadi kesalahan saat memproses aktivasi akun');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishAndNavigate = () => {
    const role = user?.role;
    switch (role) {
      case ROLE.CASHIER:
      case ROLE.KASIR:
        router.replace('/cashier/tables');
        break;
      case ROLE.KITCHEN:
      case ROLE.DAPUR:
        router.replace('/kitchen/orders');
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

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#FAF7F2] dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-amber-500 selection:text-white">
      {/* Top Navbar */}
      <header className="w-full border-b border-stone-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-600/20">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-stone-900 dark:text-zinc-50 block leading-tight">
              Kumpul Cafe
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400">
              Aktivasi Akun Staf
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 dark:bg-zinc-800/60 border border-stone-200/80 dark:border-zinc-700/60 text-xs">
              <span className="font-bold text-stone-700 dark:text-zinc-300">{user.name}</span>
              {user.employeeId && (
                <span className="text-[10px] font-mono text-stone-500 dark:text-zinc-400 flex items-center gap-0.5">
                  <IdCard className="w-3 h-3 text-stone-400" />
                  {user.employeeId}
                </span>
              )}
              <Badge variant="outline" className="text-[10px] font-mono font-bold px-1.5 py-0 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                {user.role}
              </Badge>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100 gap-1.5 rounded-xl cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ganti Akun</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 max-w-2xl w-full mx-auto">
        {/* Progress Stepper Header */}
        <div className="w-full mb-6 sm:mb-8">
          <div className="flex items-center justify-between relative mb-2">
            {/* Connecting Bar */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-stone-200 dark:bg-zinc-800 -translate-y-1/2 z-0 rounded-full" />
            <div
              className="absolute top-1/2 left-0 h-1 bg-amber-600 -translate-y-1/2 z-0 rounded-full transition-all duration-500 ease-out"
              style={{
                width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
              }}
            />

            {/* Step 1 Indicator */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-sm ${
                  currentStep > 1
                    ? 'bg-amber-600 text-white'
                    : currentStep === 1
                    ? 'bg-amber-600 text-white ring-4 ring-amber-500/20'
                    : 'bg-white dark:bg-zinc-800 text-stone-400 border border-stone-200 dark:border-zinc-700'
                }`}
              >
                {currentStep > 1 ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <span className="text-[11px] font-bold mt-1.5 text-stone-700 dark:text-zinc-300">
                Ganti Sandi
              </span>
            </div>

            {/* Step 2 Indicator */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-sm ${
                  currentStep > 2
                    ? 'bg-amber-600 text-white'
                    : currentStep === 2
                    ? 'bg-amber-600 text-white ring-4 ring-amber-500/20'
                    : 'bg-white dark:bg-zinc-800 text-stone-400 border border-stone-200 dark:border-zinc-700'
                }`}
              >
                {currentStep > 2 ? <Check className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
              </div>
              <span className="text-[11px] font-bold mt-1.5 text-stone-700 dark:text-zinc-300">
                PIN Presensi
              </span>
            </div>

            {/* Step 3 Indicator */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-sm ${
                  currentStep === 3
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20'
                    : 'bg-white dark:bg-zinc-800 text-stone-400 border border-stone-200 dark:border-zinc-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold mt-1.5 text-stone-700 dark:text-zinc-300">
                Briefing Peran
              </span>
            </div>
          </div>
        </div>

        {/* STEP 1: PASSWORD CHANGE */}
        {currentStep === 1 && (
          <div className="w-full bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-zinc-800 shadow-xl space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-stone-900 dark:text-zinc-50">
                Ganti Password Akun Anda 🔐
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Untuk keamanan operasional kafe, masukkan password sementara yang Anda terima dari Admin, lalu tentukan password pribadi baru Anda.
              </p>
            </div>

            <div className="space-y-4">
              {/* Password Sementara */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                  Password Sementara Saat Ini <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showCurrentPass ? 'text' : 'password'}
                    placeholder="Masukkan password dari admin"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-11 text-sm font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Baru */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                  Password Baru Pribadi <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="Min. 8 karakter (huruf besar, kecil, angka)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 text-sm font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-zinc-800/40 border border-stone-200/80 dark:border-zinc-800 space-y-1.5 text-xs">
                <span className="font-bold text-[11px] text-stone-600 dark:text-zinc-300 uppercase tracking-wider block">
                  Kriteria Keamanan Sandi:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${isLengthValid ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-stone-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Minimal 8 karakter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-stone-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ada huruf besar (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-stone-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ada huruf kecil (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-stone-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ada angka (0-9)</span>
                  </div>
                </div>
              </div>

              {/* Konfirmasi Password */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                  Konfirmasi Password Baru <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirmPass ? 'text' : 'password'}
                    placeholder="Ketik ulang password baru Anda"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 text-sm font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && !isPassMatching && (
                  <p className="text-[11px] text-rose-500 font-medium">Konfirmasi password belum cocok</p>
                )}
              </div>
            </div>

            <Button
              type="button"
              disabled={!isStep1Valid}
              onClick={handleProceedToStep2}
              className="w-full h-12 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
            >
              <span>Lanjut ke Pengaturan PIN Presensi</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* STEP 2: PIN SETUP */}
        {currentStep === 2 && (
          <div className="w-full bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-zinc-800 shadow-xl space-y-6 animate-in fade-in slide-in-from-right-3 duration-300">
            <div className="text-center max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-stone-900 dark:text-zinc-50">
                Buat 4-Digit PIN Presensi 🔢
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 leading-relaxed">
                PIN ini digunakan untuk clock-in presensi cepat dan membuka workstation di kafe. Jangan bagikan PIN ini ke staf lain.
              </p>
            </div>

            {/* PIN Indicators Display */}
            <div className="flex justify-center items-center gap-3.5 my-3">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pinCode.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center font-mono text-2xl font-black transition-all duration-200 ${
                      isFilled
                        ? 'border-amber-600 bg-amber-500/10 text-amber-600 dark:text-amber-400 scale-105 shadow-xs'
                        : 'border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800/40 text-stone-300'
                    }`}
                  >
                    {isFilled ? '•' : ''}
                  </div>
                );
              })}
            </div>

            {/* OWASP PIN Security Alerts */}
            {isPinRepetitive && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>PIN tidak boleh menggunakan 4 angka yang sama (contoh: 1111, 0000).</span>
              </div>
            )}

            {isPinSequential && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>PIN tidak boleh berupa angka berurutan (contoh: 1234, 4321).</span>
              </div>
            )}

            {/* Interactive Keypad */}
            <div className="max-w-[280px] mx-auto grid grid-cols-3 gap-2.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="h-13 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/80 dark:border-zinc-700/60 hover:bg-amber-500/10 hover:border-amber-500/40 text-stone-900 dark:text-zinc-100 font-bold text-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleKeypadClear}
                className="h-13 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/80 dark:border-zinc-700/60 hover:bg-stone-100 text-stone-500 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-13 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/80 dark:border-zinc-700/60 hover:bg-amber-500/10 hover:border-amber-500/40 text-stone-900 dark:text-zinc-100 font-bold text-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="h-13 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/80 dark:border-zinc-700/60 hover:bg-stone-100 text-stone-500 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                disabled={isSubmitting}
                className="h-12 rounded-2xl px-5 text-xs font-bold"
              >
                Kembali
              </Button>
              <Button
                type="button"
                disabled={!isPinSecure || isSubmitting}
                onClick={handleSubmitOnboarding}
                className="flex-1 h-12 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                    <span>Mengaktifkan Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Simpan & Aktivasi Akun</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: ROLE BRIEFING & FINISH */}
        {currentStep === 3 && (
          <div className="w-full bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-zinc-800 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center mx-auto mb-3 shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40 mb-2 font-bold">
                Aktivasi Akun Berhasil
              </Badge>
              <h2 className="text-2xl font-black text-stone-900 dark:text-zinc-50">
                Selamat Datang di Tim! ☕🎉
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                Password pribadi dan PIN presensi Anda telah aktif. Berikut adalah ringkasan tugas dan workstation kerja Anda:
              </p>
            </div>

            {/* Role Dynamic Guide Card */}
            <RoleBriefingCard role={user?.role} />

            <Button
              type="button"
              onClick={handleFinishAndNavigate}
              className="w-full h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/25 cursor-pointer transition-all active:scale-98"
            >
              <span>Mulai Bertugas Sekarang 🚀</span>
            </Button>
          </div>
        )}
      </main>

      {/* Footer copyright */}
      <footer className="w-full py-4 text-center text-[11px] text-stone-400 dark:text-zinc-600">
        Kumpul Cafe POS & Kitchen Management System &bull; Zero-Trust Protected
      </footer>
    </div>
  );
}

function RoleBriefingCard({ role }: { role?: UserRole }) {
  if (role === ROLE.CASHIER || role === ROLE.KASIR) {
    return (
      <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
              Workstation: Kasir Front POS
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Pusat transaksi tamu, kasir, dan pembayaran
            </p>
          </div>
        </div>
        <div className="space-y-2 text-xs text-stone-700 dark:text-zinc-300">
          <div className="flex items-start gap-2">
            <Receipt className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Buka Meja & POS:</strong> Catat pesanan tamu dine-in / takeaway dengan sistem kalkulasi pajak & diskon otomatis.</span>
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Multi-Payment:</strong> Menerima pembayaran Tunai, QRIS Dinamis instan, dan Kartu Debit.</span>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Presensi PIN:</strong> Lakukan clock-in di awal shift dengan PIN 4-digit yang baru Anda buat.</span>
          </div>
        </div>
      </div>
    );
  }

  if (role === ROLE.KITCHEN || role === ROLE.DAPUR) {
    return (
      <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">
              Workstation: Kitchen & Barista KDS
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Layar antrean persiapan makanan dan minuman
            </p>
          </div>
        </div>
        <div className="space-y-2 text-xs text-stone-700 dark:text-zinc-300">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span><strong>Tiket KDS Realtime:</strong> Pesanan masuk berdering otomatis dengan timer durasi masak hijau-kuning-merah.</span>
          </div>
          <div className="flex items-start gap-2">
            <UtensilsCrossed className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span><strong>Status Hidangan:</strong> Ubah status dari <em>Sedang Dimasak</em> menjadi <em>Siap Disajikan</em> dengan sekali klik.</span>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span><strong>Menu Habis:</strong> Matikan ketersediaan menu jika bahan baku dapur habis.</span>
          </div>
        </div>
      </div>
    );
  }

  if (role === ROLE.WAITER || role === ROLE.PELAYAN) {
    return (
      <div className="p-5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-900/40 space-y-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
            <ConciergeBell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-sky-900 dark:text-sky-200">
              Workstation: Pelayan & Denah Meja
            </h4>
            <p className="text-xs text-sky-700 dark:text-sky-400">
              Manajemen area tamu dan koordinasi hidangan
            </p>
          </div>
        </div>
        <div className="space-y-2 text-xs text-stone-700 dark:text-zinc-300">
          <div className="flex items-start gap-2">
            <Coffee className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <span><strong>Denah Meja Aktif:</strong> Pantau meja yang terisi tamu, pesanan aktif, atau meja butuh dibersihkan.</span>
          </div>
          <div className="flex items-start gap-2">
            <UtensilsCrossed className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <span><strong>Penyajian Cepat:</strong> Dapatkan notifikasi saat hidangan di dapur telah selesai diracik.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 space-y-3.5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-purple-900 dark:text-purple-200">
            Workstation: Manager / Admin Kafe
          </h4>
          <p className="text-xs text-purple-700 dark:text-purple-400">
            Pusat operasional, laporan omset, dan manajemen staf
          </p>
        </div>
      </div>
      <div className="space-y-2 text-xs text-stone-700 dark:text-zinc-300">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <span><strong>Dashboard Analitik:</strong> Pantau penjualan hari ini, jam sibuk, dan stok menu kafe.</span>
        </div>
        <div className="flex items-start gap-2">
          <IdCard className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <span><strong>Manajemen Staf:</strong> Atur akun staf baru, jam kerja harian, dan monitoring presensi cabang.</span>
        </div>
      </div>
    </div>
  );
}
