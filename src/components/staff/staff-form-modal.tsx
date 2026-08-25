'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  StaffItem,
  CreateStaffInput,
  CreateStaffInputSchema,
  UpdateStaffInput,
  UpdateStaffInputSchema,
  StaffRole,
} from '@/lib/validations/staff.schema';
import { ROLE } from '@/lib/constants/roles';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  UserPlus,
  Edit2,
  Mail,
  Phone,
  Lock,
  KeyRound,
  Clock,
  ShieldCheck,
  Coffee,
  ChefHat,
  ConciergeBell,
} from 'lucide-react';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffToEdit?: StaffItem | null;
  onSubmitCreate: (data: CreateStaffInput) => void;
  onSubmitUpdate: (id: string, data: UpdateStaffInput) => void;
  isSubmitting: boolean;
}

export function StaffFormModal({
  isOpen,
  onClose,
  staffToEdit,
  onSubmitCreate,
  onSubmitUpdate,
  isSubmitting,
}: StaffFormModalProps) {
  const isEditMode = Boolean(staffToEdit);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateStaffInput>({
    resolver: zodResolver(isEditMode ? UpdateStaffInputSchema : CreateStaffInputSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: ROLE.CASHIER as StaffRole,
      password: '',
      pinCode: '',
      dailyShiftHours: 8,
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (staffToEdit) {
      reset({
        name: staffToEdit.name,
        email: staffToEdit.email,
        phone: staffToEdit.phone || '',
        role: staffToEdit.role,
        password: '',
        pinCode: '',
        dailyShiftHours: staffToEdit.dailyShiftHours,
      });
      return;
    }

    reset({
      name: '',
      email: '',
      phone: '',
      role: ROLE.CASHIER as StaffRole,
      password: '',
      pinCode: '',
      dailyShiftHours: 8,
    });
  }, [staffToEdit, reset, isOpen]);

  const onFormSubmit = (data: CreateStaffInput) => {
    if (isEditMode && staffToEdit) {
      onSubmitUpdate(staffToEdit.id, {
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        role: data.role,
        isActive: staffToEdit.isActive,
        dailyShiftHours: data.dailyShiftHours,
      });
      return;
    }

    onSubmitCreate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden border-border rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              {isEditMode ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {isEditMode ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEditMode
                  ? 'Perbarui data profil, kontak, dan penugasan role staf'
                  : 'Daftarkan profil staf baru, atur role, dan tentukan PIN clock-in'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="px-6 py-5 space-y-4">
          {/* Nama Lengkap */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-foreground">
              Nama Lengkap Karyawan <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Contoh: Ahmad Syahripudin"
              {...register('name')}
              className="h-10 text-sm"
            />
            {errors.name && (
              <p className="text-xs text-rose-500">{errors.name.message}</p>
            )}
          </div>

          {/* Grid Email & WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                Email Login <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="ahmad@kumpulcafe.com"
                {...register('email')}
                className="h-10 text-sm"
              />
              {errors.email && (
                <p className="text-xs text-rose-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                No. WhatsApp
              </Label>
              <Input
                id="phone"
                placeholder="081234567890"
                {...register('phone')}
                className="h-10 text-sm font-mono"
              />
              {errors.phone && (
                <p className="text-xs text-rose-500">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Role & Hak Akses <span className="text-rose-500">*</span>
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { id: ROLE.CASHIER, label: 'Kasir', icon: Coffee, color: 'text-emerald-600 dark:text-emerald-400' },
                { id: ROLE.KITCHEN, label: 'Kitchen / Barista', icon: ChefHat, color: 'text-amber-600 dark:text-amber-400' },
                { id: ROLE.WAITER, label: 'Pelayan', icon: ConciergeBell, color: 'text-sky-600 dark:text-sky-400' },
                { id: ROLE.ADMIN, label: 'Manager / Admin', icon: ShieldCheck, color: 'text-indigo-600 dark:text-indigo-400' },
              ].map((r) => {
                const IconComponent = r.icon;
                const isSelected = selectedRole === r.id;

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setValue('role', r.id as StaffRole)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-xs font-semibold text-foreground'
                        : 'border-border bg-card hover:bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 mb-1.5 ${isSelected ? r.color : 'text-muted-foreground'}`} />
                    <span className="text-xs">{r.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.role && (
              <p className="text-xs text-rose-500">{errors.role.message}</p>
            )}
          </div>

          {/* Password & PIN (Hanya saat Create) */}
          {!isEditMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  Password Akun <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 6 karakter"
                  {...register('password')}
                  className="h-10 text-sm"
                />
                {errors.password && (
                  <p className="text-xs text-rose-500">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pinCode" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                  PIN Clock-In (4 Angka)
                </Label>
                <Input
                  id="pinCode"
                  type="password"
                  maxLength={4}
                  placeholder="Contoh: 1234"
                  {...register('pinCode')}
                  className="h-10 text-sm font-mono text-center tracking-widest"
                />
                {errors.pinCode && (
                  <p className="text-xs text-rose-500">{errors.pinCode.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Standar Jam Kerja Harian */}
          <div className="space-y-1.5">
            <Label htmlFor="dailyShiftHours" className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              Target Jam Kerja Harian
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="dailyShiftHours"
                type="number"
                min={1}
                max={24}
                {...register('dailyShiftHours', { valueAsNumber: true })}
                className="h-10 text-sm w-32 font-mono"
              />
              <span className="text-xs text-muted-foreground">Jam per hari (Standar: 8 jam)</span>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 font-semibold px-6"
            >
              {isSubmitting
                ? 'Menyimpan...'
                : isEditMode
                ? 'Simpan Perubahan'
                : 'Daftarkan Karyawan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
