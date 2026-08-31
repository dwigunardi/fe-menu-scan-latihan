'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowRightLeft,
  QrCode,
  KeyRound,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAdminStaffPaginatedQuery } from '@/hooks/queries/use-admin-staff';
import { useAuthStore } from '@/store/use-auth-store';
import { toast } from 'sonner';
import { StaffItem } from '@/lib/validations/staff.schema';
import { ROLE } from '@/lib/constants/roles';

const ShiftHandoverSchema = z.object({
  incomingStaffId: z.string().min(1, 'Pilih staf pengganti'),
  pinCode: z.string().regex(/^\d{4}$/, 'PIN harus berupa 4 angka'),
  handoverNotes: z.string().optional(),
});

type ShiftHandoverInput = z.infer<typeof ShiftHandoverSchema>;

export interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ShiftHandoverModal({
  isOpen,
  onClose,
  onSuccess,
}: ShiftHandoverModalProps) {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();
  const { data: staffData } = useAdminStaffPaginatedQuery({ limit: 100 });
  const staffList: StaffItem[] = staffData?.items || [];

  const [activeTab, setActiveTab] = useState<'pin' | 'magic-link'>('pin');
  const [copiedLink, setCopiedLink] = useState(false);

  const availableStaff = staffList.filter(
    (s) => s.isActive && s.id !== user?.id && s.role !== ROLE.ADMIN
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShiftHandoverInput>({
    resolver: zodResolver(ShiftHandoverSchema),
    defaultValues: {
      incomingStaffId: '',
      pinCode: '',
      handoverNotes: '',
    },
  });

  const selectedStaffId = watch('incomingStaffId');
  const incomingStaff = staffList.find((s) => s.id === selectedStaffId);

  // Generate dynamic handover link
  const handoverSessionLink = typeof window !== 'undefined'
    ? `${window.location.origin}/handover?session=${user?.id || 'workstation'}&ts=${Date.now()}`
    : 'https://kumpulcafe.com/handover';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(handoverSessionLink);
      setCopiedLink(true);
      toast.success('Magic Link sesi handover berhasil disalin!');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.error('Gagal menyalin link');
    }
  };

  const onSubmit = async (data: ShiftHandoverInput) => {
    if (!incomingStaff) {
      toast.error('Data staf pengganti tidak ditemukan');
      return;
    }

    // Update the local auth store with the new staff profile
    if (user) {
      setAuth(
        {
          ...user,
          id: incomingStaff.id,
          name: incomingStaff.name,
          email: incomingStaff.email,
          role: incomingStaff.role,
        },
        accessToken || 'session-token',
        refreshToken
      );
    }

    toast.success(
      `Serah terima shift berhasil! Selamat bertugas, ${incomingStaff.name}.`,
      { duration: 4000 }
    );

    reset();
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-stone-900 dark:text-zinc-50">
                Serah Terima Shift (Handover)
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500 dark:text-zinc-400">
                Ganti staf yang bertugas tanpa logout sesi kasir/dapur
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Selection */}
        <div className="flex rounded-xl bg-stone-100 dark:bg-zinc-800/80 p-1 gap-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('pin')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'pin'
                ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-50 shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Input PIN Cepat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('magic-link')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'magic-link'
                ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-50 shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            Magic QR / Link
          </button>
        </div>

        {/* TAB 1: PIN Form */}
        {activeTab === 'pin' ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            {/* Current Staff Card */}
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700 text-xs flex justify-between items-center">
              <div>
                <p className="text-stone-400 text-[11px]">Staf Saat Ini:</p>
                <p className="font-bold text-stone-900 dark:text-zinc-100">{user?.name || 'Kasir Aktif'}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                {user?.role || 'CASHIER'}
              </span>
            </div>

            {/* Select Incoming Staff */}
            <div className="space-y-1.5">
              <Label htmlFor="incomingStaffId" className="text-xs font-medium text-stone-700 dark:text-zinc-300">
                Pilih Staf Pengganti <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={selectedStaffId}
                onValueChange={(val) => setValue('incomingStaffId', val, { shouldValidate: true })}
              >
                <SelectTrigger id="incomingStaffId" className="w-full">
                  <SelectValue placeholder="Pilih nama staf pengganti..." />
                </SelectTrigger>
                <SelectContent>
                  {availableStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      <div className="flex items-center justify-between w-full gap-3">
                        <span>{staff.name}</span>
                        <span className="text-[10px] text-stone-400 font-mono">[{staff.role}]</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.incomingStaffId && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.incomingStaffId.message}
                </p>
              )}
            </div>

            {/* PIN Code Input */}
            <div className="space-y-1.5">
              <Label htmlFor="pinCode" className="text-xs font-medium text-stone-700 dark:text-zinc-300">
                PIN 4-Digit Staf Pengganti <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="pinCode"
                type="password"
                maxLength={4}
                placeholder="••••"
                {...register('pinCode')}
                className="text-center tracking-widest text-lg font-mono bg-white dark:bg-zinc-900"
              />
              {errors.pinCode && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.pinCode.message}
                </p>
              )}
            </div>

            {/* Handover Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="handoverNotes" className="text-xs font-medium text-stone-700 dark:text-zinc-300">
                Catatan Serah Terima (Opsional)
              </Label>
              <Textarea
                id="handoverNotes"
                rows={2}
                placeholder="Contoh: Sisa kas laci Rp 500.000 sudah dicek bersama..."
                {...register('handoverNotes')}
                className="text-xs resize-none"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Konfirmasi Handover
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* TAB 2: Magic Link / QR Code */
          <div className="space-y-4 pt-1 text-center">
            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200 dark:border-zinc-700/80 flex flex-col items-center gap-3">
              <div className="w-36 h-36 rounded-xl bg-white dark:bg-zinc-900 p-2.5 shadow-sm border border-stone-200/80 dark:border-zinc-700 flex items-center justify-center">
                <div className="text-center space-y-1">
                  <QrCode className="w-20 h-20 text-stone-800 dark:text-zinc-200 mx-auto" />
                  <p className="text-[9px] font-mono text-stone-400">SCAN QR HANDOVER</p>
                </div>
              </div>
              <p className="text-xs text-stone-600 dark:text-zinc-300 max-w-xs">
                Minta staf pengganti scan QR di atas menggunakan kamera smartphone untuk verifikasi PIN mandiri.
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                readOnly
                value={handoverSessionLink}
                className="text-xs font-mono bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 truncate"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyLink}
                className="shrink-0 gap-1.5 text-xs"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'Tersalin' : 'Salin'}
              </Button>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="w-full">
                Tutup
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
