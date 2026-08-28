'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarOff, Loader2, Save, User, Calendar } from 'lucide-react';
import {
  LeaveRequestInput,
  LeaveRequestInputSchema,
} from '@/lib/validations/attendance.schema';
import { useAdminStaffPaginatedQuery } from '@/hooks/queries/use-admin-staff';
import { useCreateLeaveRequestMutation } from '@/hooks/queries/use-admin-attendance';
import { LEAVE_TYPE, LEAVE_TYPE_LABELS } from '@/lib/constants/attendance';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeaveRequestModal({ isOpen, onClose }: LeaveRequestModalProps) {
  const { data: staffData } = useAdminStaffPaginatedQuery({ limit: 50 });
  const createLeaveMutation = useCreateLeaveRequestMutation();

  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeaveRequestInput>({
    resolver: zodResolver(LeaveRequestInputSchema),
    defaultValues: {
      staffId: '',
      leaveType: LEAVE_TYPE.SICK,
      startDate: todayStr,
      endDate: todayStr,
      reason: '',
    },
  });

  const onSubmit = async (data: LeaveRequestInput) => {
    try {
      await createLeaveMutation.mutateAsync(data);
      reset();
      onClose();
    } catch {
      // Error handled in mutation
    }
  };

  const activeStaffList = (staffData?.items || []).filter((s) => s.isActive);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl">
        <div className="p-5 border-b border-stone-200/80 dark:border-zinc-800 bg-stone-50/70 dark:bg-zinc-800/40">
          <DialogHeader className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 w-fit">
              <CalendarOff className="w-3.5 h-3.5" />
              Pencatatan Izin & Ketidakhadiran
            </span>
            <DialogTitle className="text-lg font-black text-stone-900 dark:text-zinc-100">
              Form Izin / Sakit / Cuti Staf
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500 dark:text-zinc-400">
              Catat permohonan ketidakhadiran resmi agar tidak terhitung sebagai alpa di rekapitulasi.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Staff Select */}
          <div className="space-y-1.5">
            <Label htmlFor="leave-staff-select" className="text-xs font-bold text-stone-700 dark:text-zinc-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-600" />
              <span>Nama Karyawan *</span>
            </Label>
            <select
              id="leave-staff-select"
              {...register('staffId')}
              className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
            >
              <option value="">-- Pilih Nama Staf --</option>
              {activeStaffList.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} ({staff.role})
                </option>
              ))}
            </select>
            {errors.staffId && (
              <p className="text-[11px] text-rose-500 font-medium">{errors.staffId.message}</p>
            )}
          </div>

          {/* Leave Type Select */}
          <div className="space-y-1.5">
            <Label htmlFor="leave-type-select" className="text-xs font-bold text-stone-700 dark:text-zinc-300">
              Kategori Ketidakhadiran *
            </Label>
            <select
              id="leave-type-select"
              {...register('leaveType')}
              className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
            >
              {Object.entries(LEAVE_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            {errors.leaveType && (
              <p className="text-[11px] text-rose-500 font-medium">{errors.leaveType.message}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="leave-start-date" className="text-xs font-bold text-stone-700 dark:text-zinc-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>Tanggal Mulai *</span>
              </Label>
              <Input
                id="leave-start-date"
                type="date"
                {...register('startDate')}
                className="h-10 text-xs rounded-xl font-mono"
              />
              {errors.startDate && (
                <p className="text-[11px] text-rose-500 font-medium">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="leave-end-date" className="text-xs font-bold text-stone-700 dark:text-zinc-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>Tanggal Selesai *</span>
              </Label>
              <Input
                id="leave-end-date"
                type="date"
                {...register('endDate')}
                className="h-10 text-xs rounded-xl font-mono"
              />
              {errors.endDate && (
                <p className="text-[11px] text-rose-500 font-medium">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Reason Textarea */}
          <div className="space-y-1.5">
            <Label htmlFor="leave-reason" className="text-xs font-bold text-stone-700 dark:text-zinc-300">
              Alasan & Keterangan Tambahan *
            </Label>
            <Textarea
              id="leave-reason"
              {...register('reason')}
              placeholder="Contoh: Sakit demam berdarah dan istirahat rawat jalan sesuai anjuran dokter"
              className="text-xs rounded-xl min-h-[80px] resize-none"
            />
            {errors.reason && (
              <p className="text-[11px] text-rose-500 font-medium">{errors.reason.message}</p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-semibold h-10 px-4"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createLeaveMutation.isPending}
              className="rounded-xl text-xs font-bold h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
            >
              {createLeaveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1.5" />
              )}
              <span>Simpan Izin Staf</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
