'use client';

import { useState } from 'react';
import {
  Store,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAdminBranchSettingQuery } from '@/hooks/queries/use-admin-settings';
import { AbsenceContingencyModal } from '@/components/settings/absence-contingency-modal';
import { Button } from '@/components/ui/button';
import { STORE_MODE } from '@/lib/constants/branch-settings';

export function StoreStatusBanner() {
  const { data: setting } = useAdminBranchSettingQuery();
  const [isContingencyModalOpen, setIsContingencyModalOpen] = useState(false);

  if (!setting) return null;

  // Render emergency alert if closed due to emergency or closed in shift mode
  const isEmergency = setting.storeMode === STORE_MODE.EMERGENCY_CLOSED;
  const isQrisOnly = setting.storeMode === STORE_MODE.QRIS_ONLY;

  return (
    <>
      {isEmergency && (
        <div className="bg-rose-500/10 dark:bg-rose-950/40 border-b border-rose-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>
              <strong>Pemberitahuan:</strong> Toko sedang ditutup sementara (
              {setting.emergencyReason || 'Pemeliharaan Operasional'}).
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsContingencyModalOpen(true)}
            className="h-7 text-[11px] font-bold border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 rounded-lg cursor-pointer shrink-0"
          >
            Ubah Status
          </Button>
        </div>
      )}

      {isQrisOnly && (
        <div className="bg-blue-500/10 dark:bg-blue-950/40 border-b border-blue-500/30 px-4 py-2 flex items-center justify-between text-xs text-blue-700 dark:text-blue-300">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              <strong>Mode Mandiri (QRIS Only):</strong> Meja QR aktif menerima pesanan mandiri tanpa kasir tunai.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsContingencyModalOpen(true)}
            className="h-7 text-[11px] font-bold border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-lg cursor-pointer shrink-0"
          >
            Kelola
          </Button>
        </div>
      )}

      <AbsenceContingencyModal
        isOpen={isContingencyModalOpen}
        onClose={() => setIsContingencyModalOpen(false)}
        openTime={setting.openTime}
        lateGracePeriod={setting.lateGracePeriod}
      />
    </>
  );
}
