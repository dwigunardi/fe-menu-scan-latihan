'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  MessageCircle,
  User,
  ShieldCheck,
  IdCard,
  KeyRound,
} from 'lucide-react';
import { StaffItem } from '@/lib/validations/staff.schema';
import { toast } from 'sonner';

interface StaffCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffItem | null;
  temporaryPassword?: string;
}

export function StaffCredentialModal({
  isOpen,
  onClose,
  staff,
  temporaryPassword = '',
}: StaffCredentialModalProps) {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!staff) return null;

  const staffUsername = staff.email.split('@')[0] || staff.email;

  const credentialText = `Halo ${staff.name}, Selamat bergabung di tim Kumpul Cafe! ☕
Akun operasional Anda telah aktif:
- NIK / ID: ${staff.employeeId || '-'}
- Posisi / Role: ${staff.role}
- Email / Username: ${staff.email}
- Password Sementara: ${temporaryPassword}

Silakan login di sistem dan selesaikan aktivasi akun (ganti password pribadi & buat PIN presensi Anda). Terima kasih!`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(credentialText);
      setIsCopied(true);
      toast.success('Kredensial staf berhasil disalin ke clipboard');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      toast.error('Gagal menyalin kredensial');
    }
  };

  const handleSendWhatsApp = () => {
    if (!staff.phone) {
      toast.error('Nomor WhatsApp karyawan belum diisi');
      return;
    }

    // Sanitize phone number to digits only
    let cleanPhone = staff.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const encodedText = encodeURIComponent(credentialText);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 border border-stone-200 dark:border-zinc-800 shadow-2xl">
        <DialogHeader className="text-center sm:text-left space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1 shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-black text-stone-900 dark:text-zinc-100">
            Karyawan Berhasil Didaftarkan! 🎉
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
            Akun staf baru telah dibuat. Berikan kredensial sementara ini kepada staf yang bersangkutan untuk menyelesaikan aktivasi akun pertama kali.
          </DialogDescription>
        </DialogHeader>

        {/* Credential Card */}
        <div className="my-2 p-4 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-stone-50/70 dark:bg-zinc-800/40 space-y-3 shadow-2xs">
          {/* Header Info */}
          <div className="flex items-center justify-between gap-2 border-b border-stone-200/80 dark:border-zinc-700/60 pb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 font-black text-xs flex items-center justify-center shrink-0 border border-amber-500/20">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-stone-900 dark:text-zinc-100 truncate">
                  {staff.name}
                </h4>
                {staff.employeeId && (
                  <p className="text-[11px] font-mono text-stone-500 dark:text-zinc-400 flex items-center gap-1">
                    <IdCard className="w-3 h-3 text-stone-400" />
                    <span>NIK: {staff.employeeId}</span>
                  </p>
                )}
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shrink-0">
              {staff.role}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-stone-500 dark:text-zinc-400">Email / Username:</span>
              <span className="font-semibold font-mono text-stone-900 dark:text-zinc-100 truncate max-w-[200px]">
                {staff.email}
              </span>
            </div>

            {/* Temporary Password Display */}
            <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-stone-200 dark:border-zinc-700">
              <div className="flex items-center gap-1.5 min-w-0">
                <KeyRound className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-stone-500 dark:text-zinc-400">Password Sementara:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-stone-900 dark:text-zinc-100">
                  {showPassword ? temporaryPassword : '••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 cursor-pointer"
                  title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-stone-500 dark:text-zinc-400">Status Akun:</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Menunggu Aktivasi Onboarding</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {staff.phone && (
            <Button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer transition-all active:scale-98"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Kirim Kredensial via WhatsApp Staf</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="w-full h-10 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border-stone-300 dark:border-zinc-700 cursor-pointer transition-all active:scale-98"
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600">Kredensial Berhasil Disalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-stone-500" />
                <span>Salin Kredensial Lengkap</span>
              </>
            )}
          </Button>
        </div>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-900 cursor-pointer"
          >
            Tutup & Selesai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
