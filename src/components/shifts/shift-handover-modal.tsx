'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
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
import { ArrowRightLeft, Loader2, AlertCircle, Wallet } from 'lucide-react';
import { useHandoverCandidatesQuery } from '@/hooks/queries/use-handover';
import { useCurrentShiftQuery } from '@/hooks/queries/use-admin-shifts';
import { useAuthStore } from '@/store/use-auth-store';
import { handoverShift } from '@/lib/api/auth-api';
import { ApiError } from '@/lib/api/api-error';
import { ErrorCode } from '@/lib/api/error-codes';
import { getRateLimitMessage } from '@/lib/api/error-translator';
import { notifyApiError } from '@/lib/api/notify-error';
import { HandoverInput, HandoverInputSchema } from '@/lib/validations/handover.schema';
import { ROLE, getRoleHomePath } from '@/lib/constants/roles';
import { toast } from 'sonner';

export interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Hands this device over to another staff member (POST /auth/handover).
 *
 * The incoming staff proves who they are with their own PIN. The backend revokes the outgoing
 * staff's session and returns a new one for the incoming staff, which replaces the stored session
 * (profile and tokens), so everything done afterwards is recorded under their name.
 * The outgoing staff must close their open cash drawer shift first (409 SHIFT_STILL_OPEN).
 */
export function ShiftHandoverModal({
  isOpen,
  onClose,
  onSuccess,
}: Readonly<ShiftHandoverModalProps>) {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const {
    data: candidates = [],
    isLoading: isCandidatesLoading,
    isError: isCandidatesError,
    isFetching: isCandidatesFetching,
    refetch: refetchCandidates,
  } = useHandoverCandidatesQuery({ enabled: isOpen });

  // Pre-check the cash drawer for cashiers; the backend enforces it for every role (409)
  const isCashier = user?.role === ROLE.CASHIER || user?.role === ROLE.KASIR;
  const { data: currentShift, isLoading: isShiftLoading } = useCurrentShiftQuery({
    enabled: isOpen && isCashier,
  });
  const [backendSaysShiftOpen, setBackendSaysShiftOpen] = useState(false);
  const mustCloseShift =
    backendSaysShiftOpen ||
    (isCashier && currentShift?.status === 'OPEN' && currentShift.staffId === user?.id);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HandoverInput>({
    resolver: zodResolver(HandoverInputSchema),
    defaultValues: {
      incomingStaffId: '',
      pinCode: '',
      notes: '',
    },
  });

  const selectedStaffId = watch('incomingStaffId');
  const incomingStaff = candidates.find((s) => s.id === selectedStaffId);

  const handleClose = () => {
    reset();
    setBackendSaysShiftOpen(false);
    onClose();
  };

  const handleGoToShifts = () => {
    handleClose();
    router.push('/admin/shifts');
  };

  const handleHandoverError = (error: ApiError) => {
    if (error.code === ErrorCode.SHIFT_STILL_OPEN) {
      setBackendSaysShiftOpen(true);
      return;
    }
    if (error.statusCode === 429) {
      setError('pinCode', {
        message: getRateLimitMessage(error) ?? 'Terlalu banyak percobaan. Tunggu sebentar.',
      });
      return;
    }
    if (error.statusCode === 400) {
      // Wrong PIN ("PIN staf pengganti salah."), or the incoming staff cannot take over yet
      setError('pinCode', { message: error.message });
      return;
    }
    if (error.statusCode === 404) {
      // The incoming staff was deactivated meanwhile: drop the stale choice and refresh the list
      setValue('incomingStaffId', '');
      setError('incomingStaffId', {
        message: 'Staf ini tidak lagi bisa menerima serah terima. Pilih staf lain.',
      });
      void refetchCandidates();
      return;
    }
    notifyApiError(error);
  };

  const onSubmit = async (data: HandoverInput) => {
    const result = await handoverShift({
      incomingStaffId: data.incomingStaffId,
      pinCode: data.pinCode,
      notes: data.notes?.trim() || undefined,
    });

    if (result.isLeft()) {
      handleHandoverError(result.value);
      return;
    }

    // Replace the whole session (profile AND tokens); the old session was revoked by the backend
    const { user: incomingUser, accessToken } = result.value;
    setAuth(incomingUser, accessToken);

    toast.success(`Serah terima berhasil. Selamat bertugas, ${incomingUser.name}.`, {
      duration: 4000,
    });

    handleClose();
    onSuccess?.();
    // The incoming staff may have a different role, so land on their own home page
    router.replace(getRoleHomePath(incomingUser.role));
  };

  const isChecking = isCashier && isShiftLoading;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && handleClose()}>
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
                Staf pengganti memasukkan PIN miliknya untuk mengambil alih perangkat ini
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isChecking && (
          <div className="py-8 flex items-center justify-center text-xs text-stone-500 dark:text-zinc-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memeriksa shift kas...
          </div>
        )}

        {!isChecking && mustCloseShift && (
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex gap-3">
              <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-stone-900 dark:text-zinc-100">
                  Tutup shift kas Anda terlebih dahulu
                </p>
                <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                  {isCashier
                    ? 'Laci kas masih terbuka atas nama Anda. Hitung kas fisik dan tutup shift (Z-Report) sebelum serah terima, lalu staf pengganti membuka shift baru.'
                    : 'Masih ada shift kas terbuka atas nama Anda. Minta admin menutup shift tersebut sebelum serah terima.'}
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleClose}>
                {isCashier ? 'Batal' : 'Tutup'}
              </Button>
              {/* /admin/shifts is for cashiers and admins only */}
              {isCashier && (
                <Button
                  type="button"
                  onClick={handleGoToShifts}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Buka Halaman Shift
                </Button>
              )}
            </DialogFooter>
          </div>
        )}

        {!isChecking && !mustCloseShift && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            {/* Current Staff Card */}
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700 text-xs flex justify-between items-center">
              <div>
                <p className="text-stone-400 text-[11px]">Staf Saat Ini:</p>
                <p className="font-bold text-stone-900 dark:text-zinc-100">{user?.name || 'Staf Aktif'}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                {user?.role}
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
                  <SelectValue
                    placeholder={isCandidatesLoading ? 'Memuat daftar staf...' : 'Pilih nama staf pengganti...'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      <div className="flex items-center justify-between w-full gap-3">
                        <span>{staff.name}</span>
                        <span className="text-[10px] text-stone-400 font-mono">[{staff.role}]</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isCandidatesError && (
                <div className="flex items-center justify-between gap-2 text-[11px] text-rose-600 dark:text-rose-400">
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    Gagal memuat daftar staf.
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void refetchCandidates()}
                    disabled={isCandidatesFetching}
                    className="h-7 text-[11px]"
                  >
                    {isCandidatesFetching && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    Coba lagi
                  </Button>
                </div>
              )}
              {!isCandidatesLoading && !isCandidatesError && candidates.length === 0 && (
                <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                  Belum ada staf lain yang bisa menerima serah terima (staf aktif, sudah onboarding,
                  dan sudah punya PIN).
                </p>
              )}
              {errors.incomingStaffId && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.incomingStaffId.message}
                </p>
              )}
            </div>

            {/* Incoming Staff PIN */}
            <div className="space-y-1.5">
              <Label htmlFor="handoverPin" className="text-xs font-medium text-stone-700 dark:text-zinc-300">
                PIN 4-Digit Staf Pengganti <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="handoverPin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
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
              {incomingStaff && (
                <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                  Semua aksi setelah ini tercatat atas nama {incomingStaff.name}.
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
                placeholder="Contoh: Meja 5 menunggu pesanan tambahan..."
                {...register('notes')}
                className="text-xs resize-none"
              />
              {errors.notes && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.notes.message}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Konfirmasi Serah Terima
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
