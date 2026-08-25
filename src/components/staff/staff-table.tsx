'use client';

import React from 'react';
import { StaffItem } from '@/lib/validations/staff.schema';
import { ROLE } from '@/lib/constants/roles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
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
  Users,
} from 'lucide-react';
import { getInitials } from '@/lib/utils/get-initials';

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
      <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800/40 gap-1.5 font-bold rounded-full text-xs px-3 py-1">
        <ShieldCheck className="w-3.5 h-3.5" />
        Manager / Admin
      </Badge>
    );
  }

  if (role === ROLE.CASHIER) {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40 gap-1.5 font-bold rounded-full text-xs px-3 py-1">
        <Coffee className="w-3.5 h-3.5" />
        Kasir Front POS
      </Badge>
    );
  }

  if (role === ROLE.KITCHEN) {
    return (
      <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/40 gap-1.5 font-bold rounded-full text-xs px-3 py-1">
        <ChefHat className="w-3.5 h-3.5" />
        Kitchen & Barista
      </Badge>
    );
  }

  return (
    <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200 dark:border-sky-800/40 gap-1.5 font-bold rounded-full text-xs px-3 py-1">
      <ConciergeBell className="w-3.5 h-3.5" />
      Floor Staff / Waiter
    </Badge>
  );
}

export function StaffTable({
  staff,
  isLoading,
  onEditStaff,
  onChangePin,
  onToggleStatus,
  onDeleteStaff,
}: StaffTableProps) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200/80 dark:border-zinc-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto scrollbar-thin">
          <Table className="min-w-[850px] w-full text-left text-sm border-collapse">
            <TableHeader className="bg-amber-600 dark:bg-amber-600">
              <TableRow className="border-b border-amber-700/60 dark:border-amber-700/80 bg-amber-600 dark:bg-amber-600 hover:bg-amber-600 dark:hover:bg-amber-600">
                <TableHead className="py-3.5 px-4 min-w-[260px] text-white dark:text-white font-bold">
                  Karyawan
                </TableHead>
                <TableHead className="py-3.5 px-4 min-w-[180px] text-white dark:text-white font-bold">
                  Role & Hak Akses
                </TableHead>
                <TableHead className="py-3.5 px-4 min-w-[170px] text-white dark:text-white font-bold">
                  Kontak WhatsApp
                </TableHead>
                <TableHead className="py-3.5 px-4 min-w-[140px] text-center text-white dark:text-white font-bold">
                  PIN Clock-In
                </TableHead>
                <TableHead className="py-3.5 px-4 min-w-[130px] text-center text-white dark:text-white font-bold">
                  Status Akun
                </TableHead>
                {/* Sticky Right Action Column */}
                <TableHead className="py-3.5 px-4 sticky right-0 z-20 bg-amber-600 dark:bg-amber-600 text-white dark:text-white font-bold min-w-[130px] text-right whitespace-nowrap shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.15)] dark:shadow-[-2px_0_8px_-2px_rgba(0,0,0,0.4)]">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-stone-100 dark:border-zinc-800/60">
                    <TableCell className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-2xl" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4"><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                    <TableCell className="py-4 px-4"><Skeleton className="h-6 w-32 rounded-full" /></TableCell>
                    <TableCell className="py-4 px-4 text-center"><Skeleton className="h-6 w-20 mx-auto rounded-full" /></TableCell>
                    <TableCell className="py-4 px-4 text-center"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
                    <TableCell className="py-4 px-4 sticky right-0 z-10 bg-white dark:bg-zinc-900 min-w-[130px] text-right shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[-2px_0_8px_-2px_rgba(0,0,0,0.4)]">
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center text-stone-400 dark:text-zinc-500">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30 text-amber-600" />
                    <h4 className="text-sm font-bold text-stone-700 dark:text-zinc-300">Tidak Ada Karyawan Ditemukan</h4>
                    <p className="text-xs text-stone-400 dark:text-zinc-500 mt-1 max-w-sm mx-auto">
                      Belum ada data staf yang sesuai dengan kata kunci pencarian atau filter yang dipilih.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((item) => {
                  const formattedPhone = item.phone ? item.phone.replace(/[^0-9]/g, '') : null;
                  const waLink = formattedPhone
                    ? `https://wa.me/${formattedPhone.startsWith('0') ? '62' + formattedPhone.substring(1) : formattedPhone}`
                    : null;

                  return (
                    <TableRow
                      key={item.id}
                      className="border-b border-stone-100 dark:border-zinc-800/60 hover:bg-stone-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                    >
                      {/* Profil Karyawan */}
                      <TableCell className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xs">
                            {getInitials(item.name)}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900 dark:text-zinc-100 text-sm">
                              {item.name}
                            </div>
                            <div className="text-xs text-stone-500 dark:text-zinc-400 font-mono mt-0.5">
                              {item.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Role Badge */}
                      <TableCell className="py-3.5 px-4">
                        {getRoleBadge(item.role)}
                      </TableCell>

                      {/* Kontak WhatsApp */}
                      <TableCell className="py-3.5 px-4">
                        {item.phone ? (
                          <a
                            href={waLink || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-xs font-mono font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-xs"
                            title="Chat WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{item.phone}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-stone-400 dark:text-zinc-500 italic">Belum diisi</span>
                        )}
                      </TableCell>

                      {/* Status PIN 4-Digit */}
                      <TableCell className="py-3.5 px-4 text-center">
                        {item.pinCodeSet ? (
                          <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40 gap-1.5 font-bold text-[11px] rounded-full px-2.5 py-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            PIN Aktif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 border-stone-200 dark:border-zinc-700 gap-1.5 text-[11px] rounded-full px-2.5 py-0.5">
                            <XCircle className="w-3 h-3 text-stone-400" />
                            Belum Ada
                          </Badge>
                        )}
                      </TableCell>

                      {/* Status Switch Toggle */}
                      <TableCell className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <Switch
                            checked={item.isActive}
                            onCheckedChange={() => onToggleStatus(item)}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                          <span
                            className={`text-xs font-bold ${
                              item.isActive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-stone-400 dark:text-zinc-500'
                            }`}
                          >
                            {item.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </TableCell>

                      {/* Sticky Right Aksi Column */}
                      <TableCell className="py-3.5 px-4 sticky right-0 z-10 bg-white dark:bg-zinc-900 min-w-[130px] text-right shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[-2px_0_8px_-2px_rgba(0,0,0,0.4)]">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ubah PIN */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onChangePin(item)}
                            className="h-8 w-8 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                            title="Ubah PIN 4-Digit"
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>

                          {/* Edit Profil */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditStaff(item)}
                            className="h-8 w-8 rounded-xl text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800"
                            title="Edit Profil"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>

                          {/* Hapus */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteStaff(item)}
                            className="h-8 w-8 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                            title="Hapus Akun"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ))
        ) : staff.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 text-center text-stone-400">
            <p className="text-xs font-semibold">Tidak ada karyawan ditemukan</p>
          </div>
        ) : (
          staff.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs space-y-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/20">
                    {getInitials(item.name)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-zinc-100">{item.name}</h4>
                    <p className="text-xs text-stone-500 dark:text-zinc-400 font-mono">{item.email}</p>
                  </div>
                </div>
                <div className="shrink-0">{getRoleBadge(item.role)}</div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.isActive}
                    onCheckedChange={() => onToggleStatus(item)}
                    className="data-[state=checked]:bg-emerald-500 scale-90"
                  />
                  <span className={item.isActive ? 'text-emerald-600 font-bold' : 'text-stone-400'}>
                    {item.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onChangePin(item)}
                    className="h-7 text-xs rounded-lg px-2 gap-1 text-amber-600 border-amber-200 dark:border-amber-800"
                  >
                    <KeyRound className="w-3 h-3" />
                    PIN
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditStaff(item)}
                    className="h-7 text-xs rounded-lg px-2"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeleteStaff(item)}
                    className="h-7 text-xs rounded-lg px-2 text-rose-600 border-rose-200 dark:border-rose-800"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
