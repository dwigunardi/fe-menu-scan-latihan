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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, CheckCircle2, XCircle, Edit3, Loader2, AlertCircle } from 'lucide-react';
import {
  AttendanceItem,
  OvertimeReviewInput,
  OvertimeReviewSchema,
} from '@/lib/validations/attendance.schema';
import { useReviewOvertimeMutation } from '@/hooks/queries/use-admin-attendance';

export interface OvertimeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendance: AttendanceItem | null;
}

export function OvertimeReviewModal({
  isOpen,
  onClose,
  attendance,
}: OvertimeReviewModalProps) {
  const reviewMutation = useReviewOvertimeMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OvertimeReviewInput>({
    resolver: zodResolver(OvertimeReviewSchema),
    defaultValues: {
      status: 'APPROVED',
      approvedMinutes: attendance?.overtimeMinutes || 0,
      notes: '',
    },
  });

  const selectedStatus = watch('status');

  useEffect(() => {
    if (attendance) {
      reset({
        status: 'APPROVED',
        approvedMinutes: attendance.overtimeMinutes || 0,
        notes: attendance.overtimeNotes || '',
      });
    }
  }, [attendance, reset]);

  if (!attendance) return null;

  const initialOvertimeMinutes = attendance.overtimeMinutes || 0;
  const hours = Math.floor(initialOvertimeMinutes / 60);
  const mins = initialOvertimeMinutes % 60;
  const formattedOvertime = `${hours > 0 ? `${hours} jam ` : ''}${mins} menit`;

  const onSubmit = async (data: OvertimeReviewInput) => {
    await reviewMutation.mutateAsync({
      id: attendance.id,
      payload: {
        status: data.status,
        approvedMinutes:
          data.status === 'OVERRIDDEN'
            ? Number(data.approvedMinutes)
            : data.status === 'APPROVED'
            ? initialOvertimeMinutes
            : 0,
        notes: data.notes?.trim() || undefined,
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
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-stone-900 dark:text-zinc-50">
                Review Lembur (Overtime)
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500 dark:text-zinc-400">
                Verifikasi atau koreksi jam lembur untuk staf kafe
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Staff Info Card */}
          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200 dark:border-zinc-700/60 space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm text-stone-900 dark:text-zinc-100">
                  {attendance.staffName}
                </p>
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  Role: <span className="font-medium text-stone-700 dark:text-zinc-300">{attendance.staffRole}</span>
                  {attendance.actingRole && (
                    <span className="ml-1 text-amber-600 dark:text-amber-400 font-medium">
                      ({attendance.actingRole})
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  ⚡ +{formattedOvertime}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-stone-200/60 dark:border-zinc-700/60 text-stone-600 dark:text-zinc-300">
              <div>
                <span className="text-stone-400">Jam Masuk:</span> {attendance.clockInTime || '-'}
              </div>
              <div>
                <span className="text-stone-400">Jam Pulang:</span> {attendance.clockOutTime || 'Masih Bekerja'}
              </div>
            </div>
          </div>

          {/* Status Decision Select */}
          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-xs font-medium text-stone-700 dark:text-zinc-300">
              Keputusan Supervisor / Admin
            </Label>
            <Select
              value={selectedStatus}
              onValueChange={(val: 'APPROVED' | 'REJECTED' | 'OVERRIDDEN') =>
                setValue('status', val)
              }
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Pilih tindakan..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APPROVED">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Setujui Penuh (ACC {formattedOvertime})</span>
                  </div>
                </SelectItem>
                <SelectItem value="OVERRIDDEN">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-blue-500" />
                    <span>Koreksi Durasi Manual (Override Menit)</span>
                  </div>
                </SelectItem>
                <SelectItem value="REJECTED">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>Tolak Lembur (Dihitung 8 Jam Reguler)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Manual Minutes Input if OVERRIDDEN */}
          {selectedStatus === 'OVERRIDDEN' && (
            <div className="space-y-1.5 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 animate-in fade-in-50">
              <Label
                htmlFor="approvedMinutes"
                className="text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Durasi Lembur yang Disetujui (Menit)
              </Label>
              <Input
                id="approvedMinutes"
                type="number"
                min="0"
                step="5"
                placeholder="Contoh: 60"
                {...register('approvedMinutes', { valueAsNumber: true })}
                className="bg-white dark:bg-zinc-900"
              />
              {errors.approvedMinutes && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.approvedMinutes.message}
                </p>
              )}
              <p className="text-[11px] text-blue-700 dark:text-blue-300">
                Gunakan jika sebagian waktu lembur dipakai istirahat makan atau tidak produktif.
              </p>
            </div>
          )}

          {/* Notes / Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-medium text-stone-700 dark:text-zinc-300">
              Catatan Admin (Opsional)
            </Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Contoh: Pengganti shift sore izin sakit, lembur disetujui..."
              {...register('notes')}
              className="text-xs resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || reviewMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || reviewMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {(isSubmitting || reviewMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Simpan Keputusan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
