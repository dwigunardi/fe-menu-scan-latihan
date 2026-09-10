'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { KioskHeader } from './kiosk-header';
import { KioskStaffGrid } from './kiosk-staff-grid';
import { KioskPinModal } from './kiosk-pin-modal';
import { KioskExitDialog } from './kiosk-exit-dialog';
import { KioskSuccessOverlay } from './kiosk-success-overlay';
import { usePublicBranchLocationQuery } from '@/hooks/queries/use-admin-settings';
import { useAdminStaffPaginatedQuery } from '@/hooks/queries/use-admin-staff';
import {
  useAdminAttendancePaginatedQuery,
  useClockInMutation,
  useClockOutMutation,
} from '@/hooks/queries/use-admin-attendance';
import { StaffItem } from '@/lib/validations/staff.schema';
import { AttendanceItem } from '@/lib/validations/attendance.schema';
import { ATTENDANCE_TYPE, AttendanceType } from '@/lib/constants/attendance';
import { checkGeofence, GeofenceCheckResult } from '@/lib/utils/haversine';
import { useAuthStore, ROLE } from '@/store/use-auth-store';
import { toast } from 'sonner';

export function CashierKioskView() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Queries
  const { data: branchSetting } = usePublicBranchLocationQuery();
  const { data: staffData, isLoading: isStaffLoading } = useAdminStaffPaginatedQuery({
    limit: 100,
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const { data: attendanceData } = useAdminAttendancePaginatedQuery({
    limit: 100,
    startDate: todayStr,
    endDate: todayStr,
  });

  // Mutations
  const clockInMutation = useClockInMutation();
  const clockOutMutation = useClockOutMutation();

  // Mode state: Clock In vs Clock Out
  const [mode, setMode] = useState<AttendanceType>(ATTENDANCE_TYPE.CLOCK_IN);

  // Active staff selection & PIN modal state
  const [selectedStaff, setSelectedStaff] = useState<StaffItem | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [pinErrorMessage, setPinErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Exit Dialog state
  const [isExitDialogOpen, setIsExitDialogOpen] = useState<boolean>(false);

  // Success Overlay state
  const [isSuccessOverlayOpen, setIsSuccessOverlayOpen] = useState<boolean>(false);
  const [successStaff, setSuccessStaff] = useState<StaffItem | null>(null);
  const [successMode, setSuccessMode] = useState<AttendanceType>(ATTENDANCE_TYPE.CLOCK_IN);

  // GPS Geolocation state
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geofenceResult, setGeofenceResult] = useState<GeofenceCheckResult | null>(null);

  const branchLat = branchSetting?.latitude ?? -6.2297465;
  const branchLon = branchSetting?.longitude ?? 106.8557342;
  const branchRadius = branchSetting?.geofenceRadius ?? 100;

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
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserCoords({ lat, lon });

        const result = checkGeofence(lat, lon, branchLat, branchLon, branchRadius);
        setGeofenceResult(result);
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
  }, [branchLat, branchLon, branchRadius]);

  // Request location on mount
  useEffect(() => {
    requestGpsPosition();
  }, [requestGpsPosition]);

  // Re-calculate geofence when branch settings load
  useEffect(() => {
    if (userCoords && branchSetting?.latitude && branchSetting?.longitude) {
      const res = checkGeofence(
        userCoords.lat,
        userCoords.lon,
        branchSetting.latitude,
        branchSetting.longitude,
        branchSetting.geofenceRadius || 100
      );
      setGeofenceResult(res);
    }
  }, [userCoords, branchSetting]);

  // Map today's attendance for quick lookup
  const activeAttendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceItem>();
    attendanceData?.items?.forEach((item) => {
      map.set(item.staffId, item);
    });
    return map;
  }, [attendanceData?.items]);

  // Staff card click
  const handleSelectStaff = (staff: StaffItem) => {
    setSelectedStaff(staff);
    setPinErrorMessage(null);
    setIsPinModalOpen(true);
  };

  // Submit PIN
  const handleSubmitPin = async (enteredPin: string) => {
    if (!selectedStaff) return;

    // Fallback coordinates: if GPS is denied or unavailable on desktop/kiosk, use branch coordinates
    const lat = userCoords?.lat ?? branchLat;
    const lon = userCoords?.lon ?? branchLon;

    // Check geofence if actual user coords are present
    if (userCoords && geofenceResult && !geofenceResult.isInside) {
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
      const apiErrMessage =
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'PIN salah atau gagal melakukan presensi';
      setPinErrorMessage(apiErrMessage);
    }
  };

  // Exit Kiosk Handler (Protected by Exit PIN Dialog)
  const handleConfirmExit = () => {
    setIsExitDialogOpen(false);
    toast.success('Keluar dari mode kios. Kembali ke workstation kasir.');
    // Return to cashier tables or admin dashboard
    if (user?.role === ROLE.ADMIN) {
      router.push('/admin/tables');
    } else {
      router.push('/cashier/tables');
    }
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
        <KioskStaffGrid
          staffList={staffData?.items || []}
          activeAttendanceMap={activeAttendanceMap}
          mode={mode}
          onModeChange={setMode}
          onSelectStaff={handleSelectStaff}
          isLoading={isStaffLoading}
        />
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
      />

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
