import { Metadata } from 'next';
import { AttendanceView } from '@/components/attendance';
import { RoleGuard } from '@/components/common/role-guard';
import { ROLE } from '@/lib/constants/roles';

export const metadata: Metadata = {
  title: 'Presensi & Absensi Karyawan | Admin Kumpul Cafe',
  description: 'Sistem presensi kehadiran staf berbasis geolokasi 100m dan rekapitulasi jam kerja.',
};

export default function AdminAttendancePage() {
  return (
    <RoleGuard allowedRoles={[ROLE.ADMIN]}>
      <AttendanceView />
    </RoleGuard>
  );
}
