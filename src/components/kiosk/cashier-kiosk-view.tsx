'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { KioskHeader } from './kiosk-header';
import { KioskStaffGrid } from './kiosk-staff-grid';
import { KioskPinModal } from './kiosk-pin-modal';
import { KioskExitDialog } from './kiosk-exit-dialog';
import { KioskSuccessOverlay } from './kiosk-success-overlay';
import { usePublicBranchLocationQuery } from '@/hooks/queries/use-admin-settings';
import {
  useKioskRosterQuery,
  useClockInMutation,
  useClockOutMutation,
} from '@/hooks/queries/use-admin-attendance';
import { KioskRosterItem } from '@/lib/validations/kiosk.schema';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ATTENDANCE_TYPE, AttendanceType } from '@/lib/constants/attendance';
import { checkGeofence, GeofenceCheckResult } from '@/lib/utils/haversine';
import { useAuthStore, ROLE } from '@/store/use-auth-store';
import { useKioskLockStore } from '@/store/use-kiosk-lock-store';
import { toast } from 'sonner';
import { signOutStaff } from '@/lib/api/auth-api';
import { ApiError } from '@/lib/api/api-error';
import { useWibToday } from '@/hooks/use-wib-today';
import { getRateLimitMessage } from '@/lib/api/error-translator';

/** Message for a failed kiosk clock-in/out, shown under the PIN pad. */
function describeClockError(err: unknown): string {
  // 429 = the staff PIN is locked (shared with verify-pin) or the request was throttled
  if (err instanceof ApiError && err.statusCode === 429) {
    return getRateLimitMessage(err) ?? 'Terlalu banyak percobaan. Tunggu sebentar.';
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String(err.message);
  }
  return 'PIN salah atau gagal melakukan presensi';
}

export function CashierKioskView() {
  const router = useRouter();
  const { user } = useAuthStore();
  const lockKiosk = useKioskLockStore((state) => state.lock);
  const unlockKiosk = useKioskLockStore((state) => state.unlock);

  // Entering the kiosk locks this device to it until a verified exit PIN or a logout
  useEffect(() => {
    lockKiosk();
  }, [lockKiosk]);

  // Queries
  const { data: branchSetting } = usePublicBranchLocationQuery();
  // Staff cards + today's attendance in one call, open to cashiers (GET /admin/staff and
  // GET /admin/attendance are ADMIN-only). The WIB day is in the query key so the roster reloads
  // at midnight WIB; the backend decides which day "today" is.
  const todayWib = useWibToday();
  const {
    data: rosterData,
    isLoading: isRosterLoading,
    isError: isRosterError,
    isFetching: isRosterFetching,
    refetch: refetchRoster,
  } = useKioskRosterQuery(todayWib);
  const roster = rosterData ?? [];
  // A failed background refetch keeps the last roster, so only block the grid when nothing loaded
  const rosterFailedToLoad = isRosterError && !rosterData;
  const rosterRefreshFailed = isRosterError && Boolean(rosterData);

  // Mutations
  const clockInMutation = useClockInMutation();
  const clockOutMutation = useClockOutMutation();

  // Mode state: Clock In vs Clock Out
  const [mode, setMode] = useState<AttendanceType>(ATTENDANCE_TYPE.CLOCK_IN);

  // Active staff selection & PIN modal state
  const [selectedStaff, setSelectedStaff] = useState<KioskRosterItem | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [pinErrorMessage, setPinErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Exit Dialog state
  const [isExitDialogOpen, setIsExitDialogOpen] = useState<boolean>(false);

  // Success Overlay state
  const [isSuccessOverlayOpen, setIsSuccessOverlayOpen] = useState<boolean>(false);
  const [successStaff, setSuccessStaff] = useState<KioskRosterItem | null>(null);
  const [successMode, setSuccessMode] = useState<AttendanceType>(ATTENDANCE_TYPE.CLOCK_IN);

  // GPS Geolocation state
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);

  const branchLat = branchSetting?.latitude ?? -6.2297465;
  const branchLon = branchSetting?.longitude ?? 106.8557342;
  const branchRadius = branchSetting?.geofenceRadius ?? 100;

  // Geofence is derived from the latest GPS fix and the latest branch settings.
  const geofenceResult = useMemo<GeofenceCheckResult | null>(() => {
    if (!userCoords) return null;
    if (branchSetting?.latitude && branchSetting?.longitude) {
      return checkGeofence(
        userCoords.lat,
        userCoords.lon,
        branchSetting.latitude,
        branchSetting.longitude,
        branchSetting.geofenceRadius || 100
      );
    }
    return checkGeofence(userCoords.lat, userCoords.lon, branchLat, branchLon, branchRadius);
  }, [userCoords, branchSetting, branchLat, branchLon, branchRadius]);

  // Request GPS
  const requestGpsPosition = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Browser tidak mendukung pendeteksian lokasi GPS.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Izin akses lokasi GPS ditolak oleh browser.');
        } else {
          setGpsError('Sinyal GPS lokasi tidak terdeteksi.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Request location on mount (external system sync)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- starts an external geolocation request; isLocating/gpsError mirror that request's status
    requestGpsPosition();
  }, [requestGpsPosition]);

  // Staff card click
  const handleSelectStaff = (staff: KioskRosterItem) => {
    setSelectedStaff(staff);
    setPinErrorMessage(null);
    setIsPinModalOpen(true);
  };

  // Submit PIN
  const handleSubmitPin = async (enteredPin: string) => {
    if (!selectedStaff) return;

    // A real GPS fix is required. Sending the branch coordinates instead would always pass the
    // backend geofence check, so attendance could be recorded from anywhere.
    if (!userCoords) {
      setPinErrorMessage(
        'Lokasi GPS belum terdeteksi. Izinkan akses lokasi di browser, lalu coba lagi.'
      );
      requestGpsPosition();
      return;
    }
    const { lat, lon } = userCoords;

    if (geofenceResult && !geofenceResult.isInside) {
      setPinErrorMessage(
        `Di luar radius outlet (${geofenceResult.distanceMeters}m > ${branchRadius}m)`
      );
      return;
    }

    setIsSubmitting(true);
    setPinErrorMessage(null);

    try {
      if (mode === ATTENDANCE_TYPE.CLOCK_IN) {
        await clockInMutation.mutateAsync({
          staffId: selectedStaff.id,
          pinCode: enteredPin,
          latitude: lat,
          longitude: lon,
        });
      } else {
        await clockOutMutation.mutateAsync({
          staffId: selectedStaff.id,
          pinCode: enteredPin,
          latitude: lat,
          longitude: lon,
        });
      }

      // Success
      setIsSubmitting(false);
      setIsPinModalOpen(false);

      // Trigger Celebration Overlay
      setSuccessStaff(selectedStaff);
      setSuccessMode(mode);
      setIsSuccessOverlayOpen(true);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setPinErrorMessage(describeClockError(err));
    }
  };

  // Exit Kiosk Handler (Protected by Exit PIN Dialog)
  const handleConfirmExit = () => {
    setIsExitDialogOpen(false);
    // Release the lock before navigating, otherwise KioskLockGuard sends us straight back
    unlockKiosk();
    toast.success('Keluar dari mode kios. Kembali ke workstation kasir.');
    // Return to cashier tables or admin dashboard
    if (user?.role === ROLE.ADMIN) {
      router.push('/admin/tables');
    } else {
      router.push('/cashier/tables');
    }
  };

  // Escape hatch when the PIN cannot be verified (forgotten PIN, server unavailable). Logging out
  // releases the lock; getting back into the POS still requires signing in with a password.
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogoutFromKiosk = async () => {
    if (isSigningOut) return;
    // Blocks the kiosk (overlay below) until the session is gone, so nobody clocks in on it meanwhile
    setIsSigningOut(true);
    setIsExitDialogOpen(false);
    // Revokes the refresh token on the server, then clears the local session (which also
    // releases the kiosk lock via the auth store subscription)
    await signOutStaff();
    toast.success('Berhasil keluar dari sesi akun');
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex flex-col font-sans transition-colors select-none">
      {/* Kiosk Header */}
      <KioskHeader
        branchName={branchSetting?.name || 'Kumpul Cafe'}
        geofenceResult={geofenceResult}
        isLocating={isLocating}
        gpsError={gpsError}
        onExitClick={() => setIsExitDialogOpen(true)}
      />

      {/* Main Content Area: Staff Grid */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col">
        {rosterFailedToLoad ? (
          <div className="max-w-md mx-auto mt-12 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/60 text-center space-y-3">
            <p className="font-bold text-stone-900 dark:text-zinc-100">Daftar staf gagal dimuat</p>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Periksa koneksi ke server, lalu muat ulang.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void refetchRoster()}
              disabled={isRosterFetching}
            >
              Muat Ulang
            </Button>
          </div>
        ) : (
          <>
            {rosterRefreshFailed && (
              <div className="max-w-7xl mx-auto w-full mb-4 px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
                <span>Gagal memperbarui daftar staf. Menampilkan data terakhir.</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void refetchRoster()}
                  disabled={isRosterFetching}
                  className="h-7 text-xs shrink-0"
                >
                  Muat Ulang
                </Button>
              </div>
            )}
            <KioskStaffGrid
              staffList={roster}
              mode={mode}
              onModeChange={setMode}
              onSelectStaff={handleSelectStaff}
              isLoading={isRosterLoading}
            />
          </>
        )}
      </main>

      {/* PIN Verification Modal */}
      <KioskPinModal
        isOpen={isPinModalOpen}
        staff={selectedStaff}
        mode={mode}
        isSubmitting={isSubmitting}
        errorMessage={pinErrorMessage}
        onClose={() => {
          setIsPinModalOpen(false);
          setSelectedStaff(null);
        }}
        onSubmitPin={handleSubmitPin}
      />

      {/* Exit Security Dialog */}
      <KioskExitDialog
        isOpen={isExitDialogOpen}
        onClose={() => setIsExitDialogOpen(false)}
        onConfirmExit={handleConfirmExit}
        onLogout={handleLogoutFromKiosk}
      />

      {/* Signing out: blocks the kiosk until the session has been ended */}
      {isSigningOut && (
        <div
          role="status"
          className="fixed inset-0 z-100 flex items-center justify-center bg-stone-950/60 backdrop-blur-sm"
        >
          <div className="px-6 py-4 rounded-2xl bg-white dark:bg-zinc-900 text-sm font-bold text-stone-800 dark:text-zinc-100 flex items-center gap-2 shadow-xl">
            <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
            Mengakhiri sesi...
          </div>
        </div>
      )}

      {/* Celebration Success Overlay */}
      <KioskSuccessOverlay
        isOpen={isSuccessOverlayOpen}
        staff={successStaff}
        mode={successMode}
        onDismiss={() => {
          setIsSuccessOverlayOpen(false);
          setSuccessStaff(null);
        }}
      />
    </div>
  );
}
