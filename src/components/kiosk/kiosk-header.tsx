'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Lock,
  Maximize2,
  Minimize2,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { GeofenceCheckResult } from '@/lib/utils/haversine';
import { cn } from '@/lib/utils/cn';

interface KioskHeaderProps {
  branchName?: string;
  geofenceResult: GeofenceCheckResult | null;
  isLocating: boolean;
  gpsError: string | null;
  onExitClick: () => void;
}

export function KioskHeader({
  branchName = 'Kumpul Cafe',
  geofenceResult,
  isLocating,
  gpsError,
  onExitClick,
}: KioskHeaderProps) {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
      setDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <header className="h-20 sm:h-22 px-4 sm:px-8 border-b border-stone-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl flex items-center justify-between gap-4 sticky top-0 z-30 transition-colors shadow-sm">
      {/* Brand & Outlet Name */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 shrink-0">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-lg sm:text-xl text-stone-900 dark:text-zinc-50 truncate tracking-tight">
              {branchName}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
              KIOS PRESENSI
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-zinc-400 truncate">
            Terminal Absensi Bersama • Outlet Counter POS
          </p>
        </div>
      </div>

      {/* Center Live Clock (Prominent on Tablet / Desktop) */}
      <div className="hidden md:flex flex-col items-center justify-center px-4 py-1.5 rounded-2xl bg-stone-100/80 dark:bg-zinc-800/80 border border-stone-200/60 dark:border-zinc-700/60 shadow-inner">
        <div className="flex items-center gap-2 font-mono text-xl sm:text-2xl font-black text-stone-900 dark:text-zinc-100 tracking-wider">
          <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-pulse" />
          <span>{timeStr || '00:00:00 WIB'}</span>
        </div>
        <span className="text-[11px] font-medium text-stone-500 dark:text-zinc-400">
          {dateStr || 'Memuat waktu...'}
        </span>
      </div>

      {/* Right Controls: Geofence Badge, Fullscreen, and Exit Kiosk */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Geofence Status Badge */}
        <div
          className={cn(
            'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors',
            isLocating
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              : geofenceResult?.isInside
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          )}
        >
          {isLocating ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              <span>Cek GPS...</span>
            </>
          ) : geofenceResult?.isInside ? (
            <>
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Di Area Kafe ({geofenceResult.distanceMeters}m)</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span>
                {gpsError ? 'GPS Nonaktif' : `Di Luar (${geofenceResult?.distanceMeters ?? '?'}m)`}
              </span>
            </>
          )}
        </div>

        {/* Fullscreen Button */}
        <SimpleTooltip content={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh (Kios)'} side="bottom">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="h-10 w-10 p-0 rounded-xl border-stone-300 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 cursor-pointer"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </SimpleTooltip>

        {/* Exit Kiosk Security Guard Button */}
        <SimpleTooltip content="Buka Kunci / Kembali ke Meja Kasir (Perlu PIN)" side="bottom">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onExitClick}
            className="h-10 px-3.5 sm:px-4 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 gap-2 cursor-pointer transition-all"
            id="kiosk-exit-button"
          >
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar Kios</span>
          </Button>
        </SimpleTooltip>
      </div>
    </header>
  );
}
