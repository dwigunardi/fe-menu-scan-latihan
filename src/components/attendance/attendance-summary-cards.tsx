'use client';

import { Users, CheckCircle2, AlertTriangle, CalendarOff, UserX } from 'lucide-react';
import { AttendanceSummaryData } from '@/lib/validations/attendance.schema';
import { cn } from '@/lib/utils/cn';

interface AttendanceSummaryCardsProps {
  summary?: AttendanceSummaryData;
  isLoading?: boolean;
}

export function AttendanceSummaryCards({ summary, isLoading }: AttendanceSummaryCardsProps) {
  const cards = [
    {
      title: 'Total Staf Hari Ini',
      value: summary?.totalStaff ?? 0,
      suffix: 'orang',
      icon: Users,
      iconColor: 'text-stone-600 dark:text-zinc-400',
      bgColor: 'bg-stone-50 dark:bg-zinc-800/60 border-stone-200/80 dark:border-zinc-800',
      indicatorText: `${summary?.attendanceRatePercent ?? 0}% Tingkat Kehadiran`,
      indicatorColor: 'text-stone-500 dark:text-zinc-400',
    },
    {
      title: 'Hadir Tepat Waktu',
      value: summary?.onTimeCount ?? 0,
      suffix: 'staf',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/40',
      indicatorText: 'Disiplin Sesuai Jam',
      indicatorColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Terlambat',
      value: summary?.lateCount ?? 0,
      suffix: 'staf',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/40',
      indicatorText: 'Lewat Batas Toleransi',
      indicatorColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Izin / Sakit / Cuti',
      value: summary?.leaveCount ?? 0,
      suffix: 'staf',
      icon: CalendarOff,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200/80 dark:border-indigo-800/40',
      indicatorText: 'Tercatat Resmi',
      indicatorColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      title: 'Belum Hadir / Alpa',
      value: summary?.absentCount ?? 0,
      suffix: 'staf',
      icon: UserX,
      iconColor: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-800/40',
      indicatorText: 'Belum Clock-In',
      indicatorColor: 'text-rose-600 dark:text-rose-400',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-28 rounded-3xl bg-stone-100 dark:bg-zinc-800/60 animate-pulse border border-stone-200/60 dark:border-zinc-800"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={cn(
              'p-4 rounded-3xl border transition-all duration-200 flex flex-col justify-between shadow-2xs',
              card.bgColor
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600 dark:text-zinc-400 line-clamp-1">
                {card.title}
              </span>
              <Icon className={cn('w-4 h-4 shrink-0', card.iconColor)} />
            </div>

            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-stone-900 dark:text-zinc-100 tracking-tight">
                {card.value}
              </span>
              <span className="text-xs font-semibold text-stone-500 dark:text-zinc-400">
                {card.suffix}
              </span>
            </div>

            <p className={cn('text-[11px] font-bold line-clamp-1', card.indicatorColor)}>
              {card.indicatorText}
            </p>
          </div>
        );
      })}
    </div>
  );
}
