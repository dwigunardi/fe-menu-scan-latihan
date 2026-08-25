'use client';

import React, { useState } from 'react';
import { ROLE } from '@/lib/constants/roles';
import { RoleGuard } from '@/components/common/role-guard';
import {
  StaffTable,
  StaffFormModal,
  StaffPinModal,
} from '@/components/staff';
import { ConfirmationDialog } from '@/components/common/confirmation-dialog';
import { Pagination } from '@/components/common/pagination';
import {
  useAdminStaffPaginatedQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useUpdateStaffPinMutation,
  useDeleteStaffMutation,
} from '@/hooks/queries/use-admin-staff';
import {
  StaffItem,
  CreateStaffInput,
  UpdateStaffInput,
} from '@/lib/validations/staff.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  ShieldCheck,
  Coffee,
  ChefHat,
  ConciergeBell,
} from 'lucide-react';

export default function AdminStaffPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<StaffItem | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [staffForPin, setStaffForPin] = useState<StaffItem | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<StaffItem | null>(null);

  // Queries & Mutations
  const queryParams = {
    page,
    limit,
    search: search || undefined,
    role: selectedRole === 'ALL' ? undefined : selectedRole,
  };

  const { data, isLoading } = useAdminStaffPaginatedQuery(queryParams);
  const createMutation = useCreateStaffMutation();
  const updateMutation = useUpdateStaffMutation();
  const updatePinMutation = useUpdateStaffPinMutation();
  const deleteMutation = useDeleteStaffMutation();

  const staff = data?.items || [];
  const meta = data?.meta || {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // Handlers
  const handleOpenCreateModal = () => {
    setStaffToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item: StaffItem) => {
    setStaffToEdit(item);
    setIsFormModalOpen(true);
  };

  const handleOpenPinModal = (item: StaffItem) => {
    setStaffForPin(item);
    setIsPinModalOpen(true);
  };

  const handleToggleStatus = (item: StaffItem) => {
    updateMutation.mutate({
      id: item.id,
      payload: {
        name: item.name,
        email: item.email,
        phone: item.phone || '',
        role: item.role,
        isActive: !item.isActive,
        dailyShiftHours: item.dailyShiftHours,
      },
    });
  };

  const handleFormSubmitCreate = (input: CreateStaffInput) => {
    createMutation.mutate(input, {
      onSuccess: () => setIsFormModalOpen(false),
    });
  };

  const handleFormSubmitUpdate = (id: string, input: UpdateStaffInput) => {
    updateMutation.mutate(
      { id, payload: input },
      {
        onSuccess: () => setIsFormModalOpen(false),
      }
    );
  };

  const handlePinSubmit = (id: string, pinCode: string) => {
    updatePinMutation.mutate(
      { id, payload: { pinCode } },
      {
        onSuccess: () => setIsPinModalOpen(false),
      }
    );
  };

  const handleConfirmDelete = () => {
    if (!staffToDelete) return;
    deleteMutation.mutate(staffToDelete.id, {
      onSuccess: () => setStaffToDelete(null),
    });
  };

  return (
    <RoleGuard allowedRoles={[ROLE.ADMIN]}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header Title & Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-50 flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              Manajemen Karyawan Cabang
            </h1>
            <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1">
              Kelola akun staf, penugasan role, kontak WhatsApp, dan PIN clock-in workstation
            </p>
          </div>
          <Button
            onClick={handleOpenCreateModal}
            className="h-11 font-bold gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs shrink-0 px-5 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Karyawan
          </Button>
        </div>

        {/* Quick KPI Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Total Karyawan */}
          <div className="rounded-3xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs transition-all hover:shadow-sm">
            <div className="flex items-center justify-between text-stone-500 dark:text-zinc-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Karyawan</span>
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-stone-900 dark:text-zinc-50 font-mono">{meta.totalItems}</div>
            <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-1">Terdaftar di cabang kafe</p>
          </div>

          {/* Kasir Aktif */}
          <div className="rounded-3xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs transition-all hover:shadow-sm">
            <div className="flex items-center justify-between text-stone-500 dark:text-zinc-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Kasir Front POS</span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <Coffee className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-stone-900 dark:text-zinc-50 font-mono">
              {staff.filter((s) => s.role === ROLE.CASHIER && s.isActive).length}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Siap operasional kasir</p>
          </div>

          {/* Kitchen & Barista */}
          <div className="rounded-3xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs transition-all hover:shadow-sm">
            <div className="flex items-center justify-between text-stone-500 dark:text-zinc-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Kitchen & Barista</span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <ChefHat className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-stone-900 dark:text-zinc-50 font-mono">
              {staff.filter((s) => s.role === ROLE.KITCHEN && s.isActive).length}
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">Siap di dapur & bar</p>
          </div>

          {/* PIN Terpasang */}
          <div className="rounded-3xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs transition-all hover:shadow-sm">
            <div className="flex items-center justify-between text-stone-500 dark:text-zinc-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">PIN Terpasang</span>
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                <KeyRound className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-stone-900 dark:text-zinc-50 font-mono">
              {staff.filter((s) => s.pinCodeSet).length}
            </div>
            <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold mt-1">Siap Smart Clock-In</p>
          </div>
        </div>

        {/* Filter & Search Bar Container */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-stone-200/80 dark:border-zinc-800 shadow-xs">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama, email, atau no. WA..."
              className="pl-9 h-10 text-xs rounded-xl bg-stone-50 dark:bg-zinc-800/80 border-stone-200/80 dark:border-zinc-700/80 focus:ring-amber-500"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'Semua Role' },
              { id: ROLE.CASHIER, label: 'Kasir' },
              { id: ROLE.KITCHEN, label: 'Kitchen' },
              { id: ROLE.WAITER, label: 'Pelayan' },
              { id: ROLE.ADMIN, label: 'Manager' },
            ].map((tab) => {
              const isSelected = selectedRole === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(tab.id);
                    setPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-amber-600 dark:bg-amber-600 text-white shadow-xs'
                      : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Staff Table Component */}
        <StaffTable
          staff={staff}
          isLoading={isLoading}
          onEditStaff={handleOpenEditModal}
          onChangePin={handleOpenPinModal}
          onToggleStatus={handleToggleStatus}
          onDeleteStaff={(item) => setStaffToDelete(item)}
        />

        {/* Pagination Controls */}
        {meta.totalPages > 1 && (
          <div className="pt-2">
            <Pagination
              page={page}
              limit={limit}
              totalItems={meta.totalItems}
              totalPages={meta.totalPages}
              hasNextPage={meta.hasNextPage}
              hasPrevPage={meta.hasPrevPage}
              isLoading={isLoading}
              onPageChange={(p) => setPage(p)}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
              itemLabel="karyawan"
            />
          </div>
        )}

        {/* Modal Create / Edit */}
        <StaffFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          staffToEdit={staffToEdit}
          onSubmitCreate={handleFormSubmitCreate}
          onSubmitUpdate={handleFormSubmitUpdate}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />

        {/* Modal Ganti PIN */}
        <StaffPinModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          staff={staffForPin}
          onSubmitPin={handlePinSubmit}
          isSubmitting={updatePinMutation.isPending}
        />

        {/* Dialog Konfirmasi Hapus */}
        <ConfirmationDialog
          isOpen={Boolean(staffToDelete)}
          title="Hapus Akun Karyawan?"
          description={`Apakah Anda yakin ingin menghapus akun ${staffToDelete?.name}? Staf tidak akan dapat login atau melakukan clock-in lagi.`}
          confirmText="Hapus Akun"
          variant="danger"
          isLoading={deleteMutation.isPending}
          onConfirm={handleConfirmDelete}
          onClose={() => setStaffToDelete(null)}
        />
      </div>
    </RoleGuard>
  );
}
