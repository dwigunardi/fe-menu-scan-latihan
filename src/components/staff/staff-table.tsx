'use client';

import React from 'react';
import { StaffItem } from '@/lib/validations/staff.schema';
import { ROLE } from '@/lib/constants/roles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  KeyRound,
  Edit2,
  Trash2,
  MessageCircle,
  ShieldCheck,
  Coffee,
  ChefHat,
  ConciergeBell,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface StaffTableProps {
  staff: StaffItem[];
  isLoading: boolean;
  onEditStaff: (staff: StaffItem) => void;
  onChangePin: (staff: StaffItem) => void;
  onToggleStatus: (staff: StaffItem) => void;
  onDeleteStaff: (staff: StaffItem) => void;
}

function getRoleBadge(role: string) {
  if (role === ROLE.ADMIN) {
    return (
      <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50 gap-1.5 font-medium">
        <ShieldCheck className="w-3.5 h-3.5" />
        Manager / Admin
      </Badge>
    );
  }

  if (role === ROLE.CASHIER) {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 gap-1.5 font-medium">
        <Coffee className="w-3.5 h-3.5" />
        Kasir
      </Badge>
    );
  }

  if (role === ROLE.KITCHEN) {
    return (
      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50 gap-1.5 font-medium">
        <ChefHat className="w-3.5 h-3.5" />
        Kitchen / Barista
      </Badge>
    );
  }

  return (
    <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/50 gap-1.5 font-medium">
      <ConciergeBell className="w-3.5 h-3.5" />
      Pelayan / Waiter
    </Badge>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function StaffTable({
  staff,
  isLoading,
  onEditStaff,
  onChangePin,
  onToggleStatus,
  onDeleteStaff,
}: StaffTableProps) {
  if (isLoading) {
    return (
      <div className="w-full bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-medium">Memuat data karyawan...</p>
        </div>
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="w-full bg-card rounded-2xl border border-border shadow-xs overflow-hidden p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
          <Coffee className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Tidak Ada Karyawan Ditemukan</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Belum ada akun karyawan yang sesuai dengan kriteria pencarian atau filter yang dipilih.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
              <th className="py-3.5 px-4 font-semibold text-xs tracking-wider uppercase">Karyawan</th>
              <th className="py-3.5 px-4 font-semibold text-xs tracking-wider uppercase">Role & Hak Akses</th>
              <th className="py-3.5 px-4 font-semibold text-xs tracking-wider uppercase">Kontak WhatsApp</th>
              <th className="py-3.5 px-4 font-semibold text-xs tracking-wider uppercase">PIN Clock-In</th>
              <th className="py-3.5 px-4 font-semibold text-xs tracking-wider uppercase">Status Akun</th>
              <th className="py-3.5 px-4 font-semibold text-xs tracking-wider uppercase text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {staff.map((item) => {
              const formattedPhone = item.phone ? item.phone.replace(/[^0-9]/g, '') : null;
              const waLink = formattedPhone
                ? `https://wa.me/${formattedPhone.startsWith('0') ? '62' + formattedPhone.substring(1) : formattedPhone}`
                : null;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-muted/20 transition-colors group"
                >
                  {/* Karyawan Profile */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center shrink-0 border border-primary/20">
                        {getInitials(item.name)}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          {item.name}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          {item.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4">
                    {getRoleBadge(item.role)}
                  </td>

                  {/* WhatsApp */}
                  <td className="py-3.5 px-4">
                    {item.phone ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-foreground font-medium">
                          {item.phone}
                        </span>
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            title="Kirim pesan WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Belum diisi</span>
                    )}
                  </td>

                  {/* PIN Status */}
                  <td className="py-3.5 px-4">
                    {item.pinCodeSet ? (
                      <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40 gap-1 font-mono text-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        PIN Aktif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border gap-1 font-mono text-xs">
                        <XCircle className="w-3 h-3" />
                        Belum Ada
                      </Badge>
                    )}
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <Switch
                        checked={item.isActive}
                        onCheckedChange={() => onToggleStatus(item)}
                      />
                      <span
                        className={`text-xs font-medium ${
                          item.isActive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {item.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Set/Reset PIN */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onChangePin(item)}
                        className="h-8 w-8 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                        title="Ubah PIN 4-Digit"
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>

                      {/* Edit */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditStaff(item)}
                        className="h-8 w-8 text-foreground/70 hover:bg-muted"
                        title="Edit Profil"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>

                      {/* Delete */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteStaff(item)}
                        className="h-8 w-8 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                        title="Hapus Akun"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
