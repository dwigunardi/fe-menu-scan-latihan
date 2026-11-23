'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRightLeft, Loader2, AlertCircle, Wallet } from 'lucide-react';
import { useAdminStaffPaginatedQuery } from '@/hooks/queries/use-admin-staff';
import { useCurrentShiftQuery } from '@/hooks/queries/use-admin-shifts';
import { useAuthStore } from '@/store/use-auth-store';
import { loginStaff } from '@/lib/api/auth-api';
import { notifyApiError } from '@/lib/api/notify-error';
import { toast } from 'sonner';
import { StaffItem } from '@/lib/validations/staff.schema';
import { ROLE, getRoleHomePath } from '@/lib/constants/roles';

const ShiftHandoverSchema = z.object({
  incomingStaffId: z.string().min(1, 'Pilih staf pengganti'),
  password: z.string().min(1, 'Password staf pengganti wajib diisi'),
});

type ShiftHandoverInput = z.infer<typeof ShiftHandoverSchema>;

export interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Hands the workstation over to another staff member.
 *
 * The incoming staff signs in with their own account (POST /auth/login), and the session is
 * replaced with their tokens, so everything done afterwards is recorded under their name.
 * A cashier who still holds an open cash drawer must close that shift first (Z-Report).
 */
export function ShiftHandoverModal({
  isOpen,
  onClose,
  onSuccess,
}: Readonly<ShiftHandoverModalProps>) {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const { data: staffData } = useAdminStaffPaginatedQuery({ limit: 100 });
  const staffList: StaffItem[] = staffData?.items || [];

  // Only cashiers hold a cash drawer; kitchen and waiter staff hand over without a shift check
  const isCashier = user?.role === ROLE.CASHIER || user?.role === ROLE.KASIR;
  const { data: currentShift, isLoading: isShiftLoading } = useCurrentShiftQuery({
    enabled: isOpen && isCashier,
  });
  const ownsOpenShift =
    isCashier && currentShift?.status === 'OPEN' && currentShift.staffId === user?.id;

  const availableStaff = staffList.filter(
    (s) => s.isActive && s.id !== user?.id && s.role !== ROLE.ADMIN
  );

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShiftHandoverInput>({
    resolver: zodResolver(ShiftHandoverSchema),
    defaultValues: {
      incomingStaffId: '',
      password: '',
    },
  });

  const selectedStaffId = watch('incomingStaffId');
  const incomingStaff = staffList.find((s) => s.id === selectedStaffId);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleGoToShifts = () => {
    handleClose();
    router.push('/admin/shifts');
  };

  const onSubmit = async (data: ShiftHandoverInput) => {
    if (!incomingStaff) {
      toast.error('Data staf pengganti tidak ditemukan');
      return;
    }

    const result = await loginStaff({
      usernameOrEmail: incomingStaff.email,
      password: data.password,
    });

    if (result.isLeft()) {
      if (result.value.statusCode === 401) {
        setError('password', { message: 'Password staf pengganti salah.' });
      } else {
        notifyApiError(result.value);
      }
      return;
    }

    // Replace the whole session (profile AND tokens) with the incoming staff's own login
    const { user: incomingUser, accessToken, refreshToken } = result.value;
    setAuth(incomingUser, accessToken, refreshToken);

    toast.success(`Serah terima berhasil. Selamat bertugas, ${incomingUser.name}.`, {
      duration: 4000,
    });

    handleClose();
    onSuccess?.();
    // The incoming staff may have a different role, so land on their own home page
    router.replace(getRoleHomePath(incomingUser.role));
  };

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
                Staf pengganti masuk dengan akunnya sendiri di perangkat ini
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isCashier && isShiftLoading ? (
          <div className="py-8 flex items-center justify-center text-xs text-stone-500 dark:text-zinc-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memeriksa shift kas...
          </div>
        ) : ownsOpenShift ? (
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex gap-3">
              <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-stone-900 dark:text-zinc-100">
                  Tutup shift kas Anda terlebih dahulu
                </p>
                <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                  Laci kas masih terbuka atas nama Anda. Hitung kas fisik dan tutup shift (Z-Report)
                  sebelum serah terima, lalu staf pengganti membuka shift baru.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleClose}>
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleGoToShifts}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Buka Halaman Shift
              </Button>
            </DialogFooter>
          </div>
        ) : (
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

            {/* Incoming Staff Password */}
            <div className="space-y-1.5">
              <Label htmlFor="handoverPassword" className="text-xs font-medium text-stone-700 dark:text-zinc-300">
                Password Staf Pengganti <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="handoverPassword"
                type="password"
                autoComplete="off"
                placeholder="Diisi oleh staf pengganti"
                {...register('password')}
                className="bg-white dark:bg-zinc-900"
              />
              {errors.password && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password.message}
                </p>
              )}
              {incomingStaff && (
                <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                  Masuk sebagai <span className="font-mono">{incomingStaff.email}</span>. Semua aksi
                  setelah ini tercatat atas nama {incomingStaff.name}.
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
