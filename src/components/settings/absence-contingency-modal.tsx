'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  UserCheck,
  QrCode,
  Store,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useAdminStaffPaginatedQuery } from '@/hooks/queries/use-admin-staff';
import { useUpdateStoreStatusMutation } from '@/hooks/queries/use-admin-settings';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { StaffItem } from '@/lib/validations/staff.schema';

export interface AbsenceContingencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  openTime?: string;
  lateGracePeriod?: number;
}

export function AbsenceContingencyModal({
  isOpen,
  onClose,
  openTime = '08:00',
  lateGracePeriod = 15,
}: AbsenceContingencyModalProps) {
  const router = useRouter();
  const { data: staffData } = useAdminStaffPaginatedQuery({ limit: 100 });
  const staffList: StaffItem[] = staffData?.items || [];
  const updateStatusMutation = useUpdateStoreStatusMutation();

  const [selectedOption, setSelectedOption] = useState<'ACTING_CASHIER' | 'QRIS_ONLY' | 'EMERGENCY_CLOSE'>('ACTING_CASHIER');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [emergencyReason, setEmergencyReason] = useState<string>('');

  const availableStaff = staffList.filter((s: StaffItem) => s.isActive && s.role !== 'ADMIN');

  const handleAssignActingCashier = () => {
    if (!selectedStaffId) {
      toast.error('Pilih staf pengganti terlebih dahulu.');
      return;
    }

    const staff = staffList.find((s: StaffItem) => s.id === selectedStaffId);
    toast.success(
      `Staf ${staff?.name} telah didelegasikan sebagai Kasir Pengganti untuk sesi hari ini!`
    );
    onClose();
    router.push('/admin/shifts');
  };

  const handleOpenQrisOnly = async () => {
    await updateStatusMutation.mutateAsync({
      isStoreOpen: true,
      storeMode: 'QRIS_ONLY',
    });
    onClose();
  };

  const handleEmergencyClose = async () => {
    await updateStatusMutation.mutateAsync({
      isStoreOpen: false,
      storeMode: 'EMERGENCY_CLOSED',
      emergencyReason: emergencyReason.trim() || 'Tutup sementara untuk pemeliharaan operasional',
    });
    onClose();
  };

  const handleExecuteAction = async () => {
    if (selectedOption === 'ACTING_CASHIER') {
      handleAssignActingCashier();
      return;
    }

    if (selectedOption === 'QRIS_ONLY') {
      await handleOpenQrisOnly();
      return;
    }

    if (selectedOption === 'EMERGENCY_CLOSE') {
      await handleEmergencyClose();
      return;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !updateStatusMutation.isPending && onClose()}>
      <DialogContent className="w-[94vw] sm:max-w-xl p-0 overflow-hidden rounded-3xl border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <DialogHeader className="p-4 sm:p-6 pb-3 border-b border-stone-100 dark:border-zinc-800 text-left">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-stone-900 dark:text-zinc-50">
                Peringatan Operasional: Kasir Belum Hadir
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500 dark:text-zinc-400">
                Waktu operasional ({openTime} + toleransi {lateGracePeriod}m) terlewati namun belum ada shift kasir yang dibuka.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-stone-600 dark:text-zinc-300 font-medium">
            Pilih tindakan kontingensi operasional terbaik untuk menjaga layanan kafe:
          </p>

          <div className="space-y-2.5">
            {/* Option A: Assign Acting Cashier */}
            <div
              onClick={() => setSelectedOption('ACTING_CASHIER')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedOption === 'ACTING_CASHIER'
                  ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 ring-2 ring-amber-500/20'
                  : 'border-stone-200/80 dark:border-zinc-800 hover:border-stone-300 bg-white dark:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-900 dark:text-zinc-100">
                      Opsi A: Tunjuk Staf Pengganti (Acting Cashier)
                    </h4>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
                      Direkomendasikan
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Delegasikan hak kasir sementara ke Barista/Waiter yang sudah di lokasi. Role asli tidak berubah di database.
                  </p>

                  {selectedOption === 'ACTING_CASHIER' && (
                    <div className="pt-2.5 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                      <Label className="text-[11px] font-semibold text-stone-700 dark:text-zinc-300 block">
                        Pilih Staf di Lokasi:
                      </Label>
                      <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                        <SelectTrigger className="h-9.5 text-xs rounded-xl">
                          <SelectValue placeholder="-- Pilih Staf Pengganti --" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {availableStaff.map((s: StaffItem) => (
                            <SelectItem key={s.id} value={s.id} className="text-xs">
                              {s.name} ({s.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Option B: Open as QRIS / Self-Service Only */}
            <div
              onClick={() => setSelectedOption('QRIS_ONLY')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedOption === 'QRIS_ONLY'
                  ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                  : 'border-stone-200/80 dark:border-zinc-800 hover:border-stone-300 bg-white dark:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                  <QrCode className="h-4 w-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-xs font-bold text-stone-900 dark:text-zinc-100">
                    Opsi B: Buka Mode Mandiri (QRIS Only)
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Toko tetap dibuka untuk pesanan QR meja, namun pembayaran tunai di kasir dinonaktifkan (hanya bayar QRIS langsung).
                  </p>
                </div>
              </div>
            </div>

            {/* Option C: Emergency Close */}
            <div
              onClick={() => setSelectedOption('EMERGENCY_CLOSE')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedOption === 'EMERGENCY_CLOSE'
                  ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 ring-2 ring-rose-500/20'
                  : 'border-stone-200/80 dark:border-zinc-800 hover:border-stone-300 bg-white dark:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                  <Store className="h-4 w-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-xs font-bold text-stone-900 dark:text-zinc-100">
                    Opsi C: Tutup Kafe Hari Ini
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Tandai toko tutup sementara dan tampilkan banner permohonan maaf ramah di menu digital pelanggan.
                  </p>

                  {selectedOption === 'EMERGENCY_CLOSE' && (
                    <div className="pt-2.5 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                      <Label className="text-[11px] font-semibold text-stone-700 dark:text-zinc-300 block">
                        Pesan untuk Pelanggan (Opsional):
                      </Label>
                      <Textarea
                        value={emergencyReason}
                        onChange={(e) => setEmergencyReason(e.target.value)}
                        placeholder="Contoh: Kafe tutup sementara hari ini untuk pemeliharaan operasional..."
                        className="text-xs rounded-xl h-18 resize-none bg-white dark:bg-zinc-800"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 px-4 sm:px-6 border-t border-stone-100 dark:border-zinc-800 bg-stone-50/80 dark:bg-zinc-900/90 flex items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={updateStatusMutation.isPending}
            className="rounded-xl text-xs h-9.5 cursor-pointer"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleExecuteAction}
            disabled={updateStatusMutation.isPending}
            className="rounded-xl text-xs h-9.5 px-4 font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-xs"
          >
            {updateStatusMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
            )}
            Eksekusi Tindakan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
