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
  IdCard,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';

function generateSecureTemporaryPassword(): string {
  if (typeof window === 'undefined' || !window.crypto?.getRandomValues) {
    return 'Kumpul#2026';
  }
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const numbers = '23456789';
  const all = upper + lower + numbers;

  const randomBytes = new Uint8Array(10);
  window.crypto.getRandomValues(randomBytes);

  let pass =
    upper[randomBytes[0] % upper.length] +
    lower[randomBytes[1] % lower.length] +
    numbers[randomBytes[2] % numbers.length];

  for (let i = 3; i < 10; i++) {
    pass += all[randomBytes[i] % all.length];
  }
  return pass;
}

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffToEdit?: StaffItem | null;
  onSubmitCreate: (data: CreateStaffInput, temporaryPassword?: string) => void;
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
  const [showPassword, setShowPassword] = React.useState<boolean>(false);

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
      employeeId: '',
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
  const currentPassword = watch('password');

  const handleRegeneratePassword = () => {
    const newPass = generateSecureTemporaryPassword();
    setValue('password', newPass, { shouldValidate: true });
  };

  useEffect(() => {
    if (staffToEdit) {
      reset({
        employeeId: staffToEdit.employeeId || '',
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
      employeeId: '',
      name: '',
      email: '',
      phone: '',
      role: ROLE.CASHIER as StaffRole,
      password: generateSecureTemporaryPassword(),
      pinCode: '',
      dailyShiftHours: 8,
    });
  }, [staffToEdit, reset, isOpen]);

  const onFormSubmit = (data: CreateStaffInput) => {
    if (isEditMode && staffToEdit) {
      onSubmitUpdate(staffToEdit.id, {
        employeeId: data.employeeId || undefined,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        role: data.role,
        isActive: staffToEdit.isActive,
        dailyShiftHours: data.dailyShiftHours,
      });
      return;
    }

    onSubmitCreate(data, data.password);
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
          {/* NIK / ID Karyawan & Nama Lengkap */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="employeeId" className="text-xs font-semibold text-foreground flex items-center gap-1">
                <IdCard className="w-3.5 h-3.5 text-muted-foreground" />
                NIK / ID Karyawan
              </Label>
              <Input
                id="employeeId"
                placeholder="Contoh: KC-001"
                {...register('employeeId')}
                className="h-10 text-sm font-mono uppercase"
              />
              {errors.employeeId && (
                <p className="text-xs text-rose-500">{errors.employeeId.message}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
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

          {/* Password Sementara & Informasi Onboarding (Hanya saat Create) */}
          {!isEditMode && (
            <div className="p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-500/5 dark:bg-amber-500/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Password Sementara (Auto-Generated) *</span>
                </Label>
                <button
                  type="button"
                  onClick={handleRegeneratePassword}
                  className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Generate Ulang</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password sementara"
                    {...register('password')}
                    className="h-10 text-sm font-mono tracking-wider pr-10 bg-white dark:bg-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-500">{errors.password.message}</p>
              )}
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                💡 Password sementara ini dapat disalin atau dikirimkan via WhatsApp ke staf setelah pendaftaran. Staf wajib mengganti password dan membuat PIN 4-digit saat pertama kali login.
              </p>
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
