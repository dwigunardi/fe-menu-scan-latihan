'use client';

import { Calendar, Clock, CalendarDays, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getTodayRange, getPastDaysRange, getCurrentMonthRange } from '@/lib/utils/date-helpers';

export type DateFilterPreset = 'today' | '7d' | '30d' | 'month' | 'custom';

export interface DateFilterValue {
  preset: DateFilterPreset;
  startDate?: string;
  endDate?: string;
}

interface ReportDateFilterProps {
  value: DateFilterValue;
  onChange: (val: DateFilterValue) => void;
  disabled?: boolean;
}

export function ReportDateFilter({ value, onChange, disabled }: ReportDateFilterProps) {
  const handleSelectPreset = (preset: DateFilterPreset) => {
    if (preset === 'today') {
      const { startDate, endDate } = getTodayRange();
      onChange({ preset, startDate, endDate });
    } else if (preset === '7d') {
      const { startDate, endDate } = getPastDaysRange(7);
      onChange({ preset, startDate, endDate });
    } else if (preset === '30d') {
      const { startDate, endDate } = getPastDaysRange(30);
      onChange({ preset, startDate, endDate });
    } else if (preset === 'month') {
      const { startDate, endDate } = getCurrentMonthRange();
      onChange({ preset, startDate, endDate });
    } else if (preset === 'custom') {
      onChange({ preset, startDate: value.startDate, endDate: value.endDate });
    }
  };

  const handleCustomStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (!rawVal) return;
    const startIso = new Date(`${rawVal}T00:00:00`).toISOString();
    onChange({ ...value, preset: 'custom', startDate: startIso });
  };

  const handleCustomEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (!rawVal) return;
    const endIso = new Date(`${rawVal}T23:59:59.999`).toISOString();
    onChange({ ...value, preset: 'custom', endDate: endIso });
  };

  const formatToInputDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2 bg-stone-100/80 dark:bg-zinc-800/80 rounded-2xl border border-stone-200/80 dark:border-zinc-700/80 backdrop-blur-md">
      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSelectPreset('today')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all',
            value.preset === 'today'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
              : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200 hover:bg-stone-200/60 dark:hover:bg-zinc-700/60'
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          Hari Ini
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSelectPreset('7d')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all',
            value.preset === '7d'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
              : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200 hover:bg-stone-200/60 dark:hover:bg-zinc-700/60'
          )}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          7 Hari Terakhir
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSelectPreset('month')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all',
            value.preset === 'month'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
              : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200 hover:bg-stone-200/60 dark:hover:bg-zinc-700/60'
          )}
        >
          <Calendar className="w-3.5 h-3.5" />
          Bulan Ini
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSelectPreset('custom')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all',
            value.preset === 'custom'
              ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
              : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200 hover:bg-stone-200/60 dark:hover:bg-zinc-700/60'
          )}
        >
          <CalendarRange className="w-3.5 h-3.5" />
          Kustom
        </button>
      </div>

      {/* Custom Date Pickers */}
      {value.preset === 'custom' && (
        <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200 dark:border-zinc-700">
          <input
            type="date"
            aria-label="Start date"
            disabled={disabled}
            value={formatToInputDate(value.startDate)}
            onChange={handleCustomStartChange}
            className="px-2.5 py-1 text-xs rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <span className="text-xs text-stone-400">s/d</span>
          <input
            type="date"
            aria-label="End date"
            disabled={disabled}
            value={formatToInputDate(value.endDate)}
            onChange={handleCustomEndChange}
            className="px-2.5 py-1 text-xs rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      )}
    </div>
  );
}
