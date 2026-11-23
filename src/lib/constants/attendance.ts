export const ATTENDANCE_STATUS = {
  ON_TIME: 'ON_TIME',
  LATE: 'LATE',
  EARLY_LEAVE: 'EARLY_LEAVE',
  COMPLETED: 'COMPLETED',
  SICK: 'SICK',
  LEAVE: 'LEAVE',
  ABSENT: 'ABSENT',
} as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

export const LEAVE_TYPE = {
  SICK: 'SICK',
  ANNUAL_LEAVE: 'ANNUAL_LEAVE',
  URGENT_MATTER: 'URGENT_MATTER',
  OTHER: 'OTHER',
} as const;

export type LeaveType = (typeof LEAVE_TYPE)[keyof typeof LEAVE_TYPE];

export const LEAVE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type LeaveStatus = (typeof LEAVE_STATUS)[keyof typeof LEAVE_STATUS];

export const ATTENDANCE_TYPE = {
  CLOCK_IN: 'CLOCK_IN',
  CLOCK_OUT: 'CLOCK_OUT',
} as const;

export type AttendanceType = (typeof ATTENDANCE_TYPE)[keyof typeof ATTENDANCE_TYPE];

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, { label: string; bgClass: string; textClass: string; dotClass: string }> = {
  [ATTENDANCE_STATUS.ON_TIME]: {
    label: 'Tepat Waktu',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    dotClass: 'bg-emerald-500',
  },
  [ATTENDANCE_STATUS.LATE]: {
    label: 'Terlambat',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
    textClass: 'text-amber-700 dark:text-amber-300',
    dotClass: 'bg-amber-500',
  },
  [ATTENDANCE_STATUS.EARLY_LEAVE]: {
    label: 'Pulang Cepat',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
    textClass: 'text-blue-700 dark:text-blue-300',
    dotClass: 'bg-blue-500',
  },
  [ATTENDANCE_STATUS.COMPLETED]: {
    label: 'Shift Selesai',
    bgClass: 'bg-stone-100 dark:bg-zinc-800/60 border-stone-200 dark:border-zinc-700',
    textClass: 'text-stone-700 dark:text-zinc-300',
    dotClass: 'bg-stone-500',
  },
  [ATTENDANCE_STATUS.SICK]: {
    label: 'Sakit',
    bgClass: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60',
    textClass: 'text-purple-700 dark:text-purple-300',
    dotClass: 'bg-purple-500',
  },
  [ATTENDANCE_STATUS.LEAVE]: {
    label: 'Izin / Cuti',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60',
    textClass: 'text-indigo-700 dark:text-indigo-300',
    dotClass: 'bg-indigo-500',
  },
  [ATTENDANCE_STATUS.ABSENT]: {
    label: 'Alpa / Belum Hadir',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60',
    textClass: 'text-rose-700 dark:text-rose-300',
    dotClass: 'bg-rose-500',
  },
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  [LEAVE_TYPE.SICK]: 'Sakit (Surat Dokter)',
  [LEAVE_TYPE.ANNUAL_LEAVE]: 'Cuti Tahunan',
  [LEAVE_TYPE.URGENT_MATTER]: 'Keperluan Mendesak / Darurat',
  [LEAVE_TYPE.OTHER]: 'Izin Lainnya',
};
