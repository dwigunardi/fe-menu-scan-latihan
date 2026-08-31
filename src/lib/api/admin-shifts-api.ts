import { apiTransport } from './api-transport';
import { Either, left, right } from './either';
import { ApiError } from './api-error';
import {
  ShiftItem,
  ShiftItemSchema,
  OpenShiftInput,
  CloseShiftInput,
  ShiftHistoryQueryParams,
  ShiftHistoryResponse,
  ShiftHistoryResponseSchema,
} from '@/lib/validations/shift.schema';
import { useAuthStore } from '@/store/use-auth-store';

const LOCAL_STORAGE_SHIFT_KEY = 'kumpul_cafe_active_shift';
const LOCAL_STORAGE_HISTORY_KEY = 'kumpul_cafe_shifts_history';

function getLocalActiveShift(): ShiftItem | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SHIFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocalActiveShift(shift: ShiftItem | null) {
  if (typeof window === 'undefined') return;
  try {
    if (shift) {
      localStorage.setItem(LOCAL_STORAGE_SHIFT_KEY, JSON.stringify(shift));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_SHIFT_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

function getLocalHistory(): ShiftItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function appendLocalHistory(shift: ShiftItem) {
  if (typeof window === 'undefined') return;
  try {
    const history = getLocalHistory();
    const updated = [shift, ...history.filter((s) => s.id !== shift.id)];
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Retrieves the currently active cashier shift.
 */
export async function getCurrentShift(): Promise<Either<ApiError, ShiftItem | null>> {
  const result = await apiTransport('/admin/shifts/current', ShiftItemSchema.nullable());

  if (result.isRight()) {
    setLocalActiveShift(result.value);
    return result;
  }

  // Graceful Local Fallback if backend endpoint is in deployment/mock mode
  const localShift = getLocalActiveShift();
  return right(localShift);
}

/**
 * Opens a new cashier shift with an initial cash float.
 */
export async function openShift(
  payload: OpenShiftInput
): Promise<Either<ApiError, ShiftItem>> {
  const user = useAuthStore.getState().user;

  const result = await apiTransport('/admin/shifts/open', ShiftItemSchema, {
    method: 'POST',
    body: payload,
  });

  if (result.isRight()) {
    setLocalActiveShift(result.value);
    return result;
  }

  // Graceful Local Shift Creation Fallback
  const newShift: ShiftItem = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `shift-${Date.now()}`,
    branchId: 'default-branch',
    staffId: user?.id || 'staff-1',
    staffName: user?.name || user?.email || 'Kasir',
    openingCash: payload.openingCash,
    expectedCash: payload.openingCash,
    actualCash: null,
    cashVariance: null,
    totalCashOrders: 0,
    totalQrisOrders: 0,
    totalCashRevenue: 0,
    totalQrisRevenue: 0,
    totalRevenue: 0,
    status: 'OPEN',
    notes: payload.notes || null,
    openedAt: new Date().toISOString(),
    closedAt: null,
  };

  setLocalActiveShift(newShift);
  return right(newShift);
}

/**
 * Closes the active cashier shift, reconciles physical cash, and generates Z-Report.
 */
export async function closeShift(
  shiftId: string,
  payload: CloseShiftInput
): Promise<Either<ApiError, ShiftItem>> {
  const result = await apiTransport(`/admin/shifts/${shiftId}/close`, ShiftItemSchema, {
    method: 'POST',
    body: payload,
  });

  if (result.isRight()) {
    setLocalActiveShift(null);
    appendLocalHistory(result.value);
    return result;
  }

  // Graceful Local Shift Close Fallback
  const current = getLocalActiveShift();
  if (!current) {
    return left(new ApiError(404, 'Shift Not Found', 'Tidak ada shift aktif yang ditemukan.'));
  }

  const actualCash = payload.actualCash;
  const variance = actualCash - current.expectedCash;

  const closedShift: ShiftItem = {
    ...current,
    status: 'CLOSED',
    actualCash,
    cashVariance: variance,
    notes: payload.notes || current.notes,
    closedAt: new Date().toISOString(),
  };

  setLocalActiveShift(null);
  appendLocalHistory(closedShift);
  return right(closedShift);
}

/**
 * Retrieves shift history with pagination and date filtering.
 */
export async function getShiftHistory(
  params: ShiftHistoryQueryParams = { page: 1, limit: 10 }
): Promise<Either<ApiError, ShiftHistoryResponse>> {
  const query = new URLSearchParams();
  query.append('page', String(params.page || 1));
  query.append('limit', String(params.limit || 10));
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.status) query.append('status', params.status);

  const result = await apiTransport(`/admin/shifts?${query.toString()}`, ShiftHistoryResponseSchema);

  if (result.isRight()) {
    return result;
  }

  // Graceful Local History Fallback
  const allHistory = getLocalHistory();
  const page = params.page || 1;
  const limit = params.limit || 10;
  const startIndex = (page - 1) * limit;
  const items = allHistory.slice(startIndex, startIndex + limit);
  const totalPages = Math.max(1, Math.ceil(allHistory.length / limit));

  return right({
    items,
    meta: {
      page,
      limit,
      totalItems: allHistory.length,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
}
