'use client';

import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { AttendanceItem } from '@/lib/validations/attendance.schema';
import { ATTENDANCE_STATUS_LABELS, AttendanceStatus } from '@/lib/constants/attendance';
import { Pagination } from '@/components/common/pagination';
import { cn } from '@/lib/utils/cn';

interface AttendanceTableProps {
  items: AttendanceItem[];
  isLoading?: boolean;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  limit?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export function AttendanceTable({
  items,
  isLoading,
  totalItems,
  currentPage,
  totalPages,
  limit = 10,
  hasNextPage = false,
  hasPrevPage = false,
  onPageChange,
  onLimitChange = () => {},
}: AttendanceTableProps) {
  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '--:--';
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  const formatDuration = (minutes?: number | null) => {
    if (!minutes || minutes <= 0) return '-';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins} mnt`;
    return `${hrs} jam ${mins > 0 ? `${mins} mnt` : ''}`;
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200/80 dark:border-zinc-800 animate-pulse">
        <div className="h-6 w-48 bg-stone-200 dark:bg-zinc-800 rounded-md mx-auto mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-stone-100 dark:bg-zinc-800/60 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200/80 dark:border-zinc-800 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-stone-900 dark:text-zinc-100">
          Belum Ada Data Presensi
        </h3>
        <p className="text-xs text-stone-500 dark:text-zinc-400 max-w-sm mx-auto">
          Tidak ditemukan log presensi kehadiran untuk kriteria filter atau periode tanggal ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-zinc-800 bg-stone-50/75 dark:bg-zinc-800/50 text-[11px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Karyawan</th>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Clock-In</th>
                <th className="py-3.5 px-4">Clock-Out</th>
                <th className="py-3.5 px-4">Durasi</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Geofence GPS</th>
                <th className="py-3.5 px-4">Catatan / Alasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/70 dark:divide-zinc-800/70">
              {items.map((item) => {
                const statusMeta =
                  ATTENDANCE_STATUS_LABELS[item.status as AttendanceStatus] ||
                  ATTENDANCE_STATUS_LABELS.ON_TIME;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-stone-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Staff Name & Role */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold flex items-center justify-center text-xs shrink-0">
                          {item.staffName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 dark:text-zinc-100 line-clamp-1">
                            {item.staffName}
                          </p>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 border border-stone-200/60 dark:border-zinc-700">
                            {item.staffRole}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 font-mono font-medium text-stone-700 dark:text-zinc-300 whitespace-nowrap">
                      {item.date}
                    </td>

                    {/* Clock-In Time */}
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatTime(item.clockInTime)}
                    </td>

                    {/* Clock-Out Time */}
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-700 dark:text-zinc-300">
                      {formatTime(item.clockOutTime)}
                    </td>

                    {/* Work Duration */}
                    <td className="py-3.5 px-4 font-medium text-stone-600 dark:text-zinc-400 whitespace-nowrap">
                      {formatDuration(item.workDurationMinutes)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border',
                          statusMeta.bgClass,
                          statusMeta.textClass
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusMeta.dotClass)} />
                        {statusMeta.label}
                      </span>
                    </td>

                    {/* Geofence Distance */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.clockInDistanceMeters !== null && item.clockInDistanceMeters !== undefined ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border',
                            item.isWithinGeofence
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          )}
                        >
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{item.clockInDistanceMeters}m</span>
                        </span>
                      ) : (
                        <span className="text-stone-400 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Notes & Leave Reasons */}
                    <td className="py-3.5 px-4 text-stone-500 dark:text-zinc-400 text-xs max-w-xs truncate">
                      {item.leaveReason || item.notes || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Pagination
          page={currentPage}
          limit={limit}
          totalItems={totalItems}
          totalPages={totalPages}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          itemLabel="presensi"
        />
      )}
    </div>
  );
}
