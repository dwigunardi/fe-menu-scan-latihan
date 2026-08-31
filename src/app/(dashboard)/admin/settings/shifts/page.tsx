'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RoleGuard } from '@/components/common/role-guard';
import { ROLE } from '@/store/use-auth-store';
import { useAdminBranchSettingQuery, useUpdateBranchSettingMutation } from '@/hooks/queries/use-admin-settings';
import {
  useShiftTemplatesQuery,
  useDeleteShiftTemplateMutation,
  useSeedDefaultShiftTemplatesMutation,
} from '@/hooks/queries/use-admin-shift-templates';
import { ShiftTemplateModal } from '@/components/settings/shift-template-modal';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { StoreStatusBanner } from '@/components/common/store-status-banner';
import { ShiftTemplateItem } from '@/lib/validations/shift-template.schema';
import {
  Clock,
  ArrowLeft,
  Plus,
  Sparkles,
  Trash2,
  Edit2,
  Coffee,
  Loader2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminShiftsSettingsPage() {
  return (
    <RoleGuard allowedRoles={[ROLE.ADMIN]}>
      <AdminShiftsSettingsContent />
    </RoleGuard>
  );
}

const BADGE_COLOR_MAP: Record<string, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
};

function AdminShiftsSettingsContent() {
  const { data: setting, isLoading: isSettingLoading } = useAdminBranchSettingQuery();
  const { data: templates = [], isLoading: isTemplatesLoading, refetch } = useShiftTemplatesQuery();

  const updateBranchMutation = useUpdateBranchSettingMutation();
  const deleteMutation = useDeleteShiftTemplateMutation();
  const seedMutation = useSeedDefaultShiftTemplatesMutation();

  // Local Store Hours Form
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [isHoursDirty, setIsHoursDirty] = useState(false);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<ShiftTemplateItem | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<ShiftTemplateItem | null>(null);
  const [isSeedConfirmOpen, setIsSeedConfirmOpen] = useState(false);

  React.useEffect(() => {
    if (setting) {
      setOpenTime(setting.openTime || '08:00');
      setCloseTime(setting.closeTime || '22:00');
    }
  }, [setting]);

  const handleSaveStoreHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setting || !openTime || !closeTime) return;

    await updateBranchMutation.mutateAsync({
      name: setting.name,
      address: setting.address,
      latitude: setting.latitude,
      longitude: setting.longitude,
      geofenceRadius: setting.geofenceRadius,
      openTime,
      closeTime,
      lateGracePeriod: setting.lateGracePeriod,
      storeMode: setting.storeMode,
      timezone: setting.timezone,
      phone: setting.phone,
      email: setting.email,
      schedules: setting.schedules,
    });
    setIsHoursDirty(false);
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    await deleteMutation.mutateAsync(templateToDelete.id);
    setTemplateToDelete(null);
  };

  const handleConfirmSeed = async () => {
    await seedMutation.mutateAsync({
      openTime: openTime || '08:00',
      closeTime: closeTime || '22:00',
    });
    setIsSeedConfirmOpen(false);
  };

  const calculateNetHours = (start: string, end: string, breakMins: number) => {
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let totalMinutes = (eH * 60 + eM) - (sH * 60 + sM);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Cross midnight
    const netMins = Math.max(0, totalMinutes - breakMins);
    const hours = Math.floor(netMins / 60);
    const mins = netMins % 60;
    return mins > 0 ? `${hours}j ${mins}m` : `${hours} Jam`;
  };

  const isLoading = isSettingLoading || isTemplatesLoading;

  return (
    <div className="flex flex-col min-h-screen">
      <StoreStatusBanner />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link href="/admin/settings">
            <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs font-semibold gap-1.5 text-stone-600 dark:text-zinc-400 hover:text-amber-600">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Pusat Pengaturan
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-50">
                Master Shift & Jam Operasional Toko
              </h1>
            </div>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Kelola template shift kerja karyawan, jam operasional buka-tutup kafe, dan alokasi waktu istirahat.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSeedConfirmOpen(true)}
              disabled={seedMutation.isPending}
              className="h-9 px-3 text-xs font-bold gap-1.5 rounded-xl border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Sesuaikan dengan Jam Toko
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setTemplateToEdit(null);
                setIsModalOpen(true);
              }}
              className="h-9 px-3.5 text-xs font-bold gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-sm shadow-amber-600/20"
            >
              <Plus className="h-4 w-4" />
              Tambah Master Shift
            </Button>
          </div>
        </div>

        {/* 1. Store Hours Card */}
        <div className="p-5 rounded-2xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Jam Buka & Tutup Cabang Kafe
              </h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                Jam operasional default kafe yang menjadi batas acuan shift opening dan closing
              </p>
            </div>

            {isHoursDirty && (
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md animate-pulse">
                Ada perubahan belum disimpan
              </span>
            )}
          </div>

          <form onSubmit={handleSaveStoreHours} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="store-open-time" className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                Jam Buka (Opening)
              </Label>
              <Input
                id="store-open-time"
                type="time"
                value={openTime}
                onChange={(e) => {
                  setOpenTime(e.target.value);
                  setIsHoursDirty(true);
                }}
                className="h-9 text-xs font-mono font-bold rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="store-close-time" className="text-xs font-semibold text-stone-700 dark:text-zinc-300">
                Jam Tutup (Closing)
              </Label>
              <Input
                id="store-close-time"
                type="time"
                value={closeTime}
                onChange={(e) => {
                  setCloseTime(e.target.value);
                  setIsHoursDirty(true);
                }}
                className="h-9 text-xs font-mono font-bold rounded-xl"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={!isHoursDirty || updateBranchMutation.isPending}
              className="h-9 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
            >
              {updateBranchMutation.isPending ? 'Menyimpan...' : 'Simpan Jam Toko'}
            </Button>
          </form>
        </div>

        {/* 2. Master Shift Templates List */}
        <div className="p-5 rounded-2xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
              <Coffee className="h-4 w-4 text-amber-600" />
              Daftar Master Template Shift Kerja
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
              Template shift ini akan digunakan saat menyusun roster jadwal mingguan karyawan di modul Staf
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-2">
              <Loader2 className="h-6 w-6 text-amber-600 animate-spin" />
              <p className="text-xs text-stone-500">Memuat template shift...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 border border-dashed border-stone-200 dark:border-zinc-800 rounded-2xl space-y-3">
              <AlertCircle className="h-8 w-8 text-stone-400" />
              <p className="text-xs text-stone-500">Belum ada master shift yang terdaftar.</p>
              <Button
                size="sm"
                onClick={() => setIsSeedConfirmOpen(true)}
                className="text-xs font-bold rounded-xl bg-amber-600 text-white"
              >
                Auto-Generate Shift Standar
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-stone-200/80 dark:border-zinc-800 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50/80 dark:bg-zinc-800/60 text-stone-500 dark:text-zinc-400 font-bold border-b border-stone-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Nama Shift</th>
                    <th className="py-3 px-4">Kode</th>
                    <th className="py-3 px-4">Jam Kerja</th>
                    <th className="py-3 px-4">Istirahat</th>
                    <th className="py-3 px-4">Jam Efektif</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/60 font-medium">
                  {templates.map((tmpl) => {
                    const badgeClass = BADGE_COLOR_MAP[tmpl.colorBadge] || BADGE_COLOR_MAP.emerald;
                    const netHours = calculateNetHours(tmpl.startTime, tmpl.endTime, tmpl.breakMinutes);

                    return (
                      <tr key={tmpl.id} className="hover:bg-stone-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeClass}`}>
                              {tmpl.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-stone-700 dark:text-zinc-300">
                            {tmpl.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            {tmpl.startTime} - {tmpl.endTime}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-stone-600 dark:text-zinc-400">
                          {tmpl.breakMinutes > 0 ? `${tmpl.breakMinutes} Menit` : 'Tanpa Istirahat'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-stone-900 dark:text-zinc-100">
                            {netHours}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              tmpl.isActive
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : 'bg-stone-100 dark:bg-zinc-800 text-stone-500'
                            }`}
                          >
                            {tmpl.isActive ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setTemplateToEdit(tmpl);
                                setIsModalOpen(true);
                              }}
                              className="h-8 w-8 text-stone-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setTemplateToDelete(tmpl)}
                              className="h-8 w-8 text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Shift Template Create/Edit Modal */}
      <ShiftTemplateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTemplateToEdit(null);
        }}
        templateToEdit={templateToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(templateToDelete)}
        title="Hapus Master Shift Template"
        description={`Apakah Anda yakin ingin menghapus template '${templateToDelete?.name}'? Template yang dihapus tidak dapat dipulihkan.`}
        confirmText="Ya, Hapus Template"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setTemplateToDelete(null)}
      />

      {/* Auto-Seed Sync Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isSeedConfirmOpen}
        title="Sinkronkan Template Shift Standar"
        description={`Sistem akan membuat 3 template shift standar (Pagi: ${openTime}-16:00, Middle: 11:00-19:00, Sore: 14:00-${closeTime}) yang otomatis selaras dengan jam buka kafe.`}
        confirmText="Sinkronkan Sekarang"
        cancelText="Batal"
        variant="info"
        isLoading={seedMutation.isPending}
        onConfirm={handleConfirmSeed}
        onClose={() => setIsSeedConfirmOpen(false)}
      />
    </div>
  );
}
