'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Edit3, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';
import {
  AttendanceItem,
  AttendanceCorrectionInput,
  AttendanceCorrectionSchema,
} from '@/lib/validations/attendance.schema';
import { useCorrectAttendanceMutation } from '@/hooks/queries/use-admin-attendance';

export interface AttendanceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendance: AttendanceItem | null;
}

export function AttendanceCorrectionModal({
  isOpen,
  onClose,
  attendance,
}: AttendanceCorrectionModalProps) {
  const correctMutation = useCorrectAttendanceMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AttendanceCorrectionInput>({
    resolver: zodResolver(AttendanceCorrectionSchema),
    defaultValues: {
      clockOutTime: attendance?.clockOutTime || '22:00',
      notes: '',
    },
  });

  useEffect(() => {
    if (attendance) {
      reset({
        clockOutTime: attendance.clockOutTime || '22:00',
        notes: '',
      });
    }
  }, [attendance, reset]);

  if (!attendance) return null;

  const onSubmit = async (data: AttendanceCorrectionInput) => {
    await correctMutation.mutateAsync({
      id: attendance.id,
      payload: {
        clockOutTime: data.clockOutTime.trim(),
        notes: data.notes.trim(),
      },
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-stone-900 dark:text-zinc-50">
                Koreksi Jam Pulang Staf
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500 dark:text-zinc-400">
                Sesuaikan jam kepulangan sebenarnya bagi staf yang terkena Auto-Cutoff
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Staff Info Banner */}
          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200 dark:border-zinc-700/60 space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm text-stone-900 dark:text-zinc-100">
                  {attendance.staffName}
                </p>
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  Tanggal: <span className="font-medium text-stone-700 dark:text-zinc-300">{attendance.date}</span>
                </p>
              </div>
              {attendance.isAutoClosed && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  ⚠️ Auto-Cutoff Sistem
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-stone-200/60 dark:border-zinc-700/60 text-stone-600 dark:text-zinc-300">
              <div>
                <span className="text-stone-400">Jam Masuk:</span> {attendance.clockInTime || '-'}
              </div>
              <div>
                <span className="text-stone-400">Jam Pulang Tercatat:</span> {attendance.clockOutTime || '-'}
              </div>
            </div>
          </div>

          {/* Clock Out Time Input */}
          <div className="space-y-1.5">
            <Label htmlFor="clockOutTime" className="text-xs font-medium text-stone-700 dark:text-zinc-300">
              Jam Pulang Sebenarnya (HH:mm)
            </Label>
            <Input
              id="clockOutTime"
              type="time"
              {...register('clockOutTime')}
              className="bg-white dark:bg-zinc-900"
            />
            {errors.clockOutTime && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.clockOutTime.message}
              </p>
            )}
          </div>

          {/* Reason / Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-medium text-stone-700 dark:text-zinc-300">
              Alasan Koreksi <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Contoh: Staf lupa clock-out karena buru-buru closing..."
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
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || correctMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || correctMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {(isSubmitting || correctMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Simpan Koreksi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
