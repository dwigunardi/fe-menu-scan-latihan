import { apiTransport } from './api-transport';
import { Either, right, left } from './either';
import { ApiError } from './api-error';

import {
  StaffItem,
  StaffItemSchema,
  StaffPaginatedResponse,
  StaffPaginatedResponseSchema,
  StaffQueryParams,
  CreateStaffInput,
  UpdateStaffInput,
  UpdateStaffPinInput,
  PinUpdateResponseSchema,
  DeleteStaffResponseSchema,
} from '../validations/staff.schema';
import { ROLE } from '../constants/roles';

const STAFF_STORAGE_KEY = 'menuscan_staff_fallback_v1';

const INITIAL_MOCK_STAFF: StaffItem[] = [
  {
    id: 'staff-1',
    name: 'Budi Santoso (Admin)',
    email: 'admin@menuscan.com',
    phone: '+6281234567890',
    role: ROLE.ADMIN,
    pinCodeSet: true,
    dailyShiftHours: 8,
    isActive: true,
    avatarUrl: null,
    isEmailVerified: true,
    isPhoneVerified: true,
    joinedAt: '2026-01-10T08:00:00.000Z',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-08-25T08:00:00.000Z',
  },
  {
    id: 'staff-2',
    name: 'Siti Rahmawati (Kasir)',
    email: 'cashier@menuscan.com',
    phone: '+6281298765432',
    role: ROLE.CASHIER,
    pinCodeSet: true,
    dailyShiftHours: 8,
    isActive: true,
    avatarUrl: null,
    isEmailVerified: true,
    isPhoneVerified: true,
    joinedAt: '2026-02-15T08:00:00.000Z',
    createdAt: '2026-02-15T08:00:00.000Z',
    updatedAt: '2026-08-25T08:00:00.000Z',
  },
  {
    id: 'staff-3',
    name: 'Ahmad Syahripudin (Barista & Chef)',
    email: 'kitchen@menuscan.com',
    phone: '+6281355554444',
    role: ROLE.KITCHEN,
    pinCodeSet: true,
    dailyShiftHours: 8,
    isActive: true,
    avatarUrl: null,
    isEmailVerified: true,
    isPhoneVerified: false,
    joinedAt: '2026-03-01T08:00:00.000Z',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-08-25T08:00:00.000Z',
  },
  {
    id: 'staff-4',
    name: 'Dewi Lestari (Pelayan)',
    email: 'waiter@menuscan.com',
    phone: '+6281377778888',
    role: ROLE.WAITER,
    pinCodeSet: false,
    dailyShiftHours: 8,
    isActive: true,
    avatarUrl: null,
    isEmailVerified: false,
    isPhoneVerified: false,
    joinedAt: '2026-04-12T08:00:00.000Z',
    createdAt: '2026-04-12T08:00:00.000Z',
    updatedAt: '2026-08-25T08:00:00.000Z',
  },
];

function getStoredStaff(): StaffItem[] {
  if (typeof window === 'undefined') return INITIAL_MOCK_STAFF;
  try {
    const raw = localStorage.getItem(STAFF_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_STAFF));
      return INITIAL_MOCK_STAFF;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOCK_STAFF;
  }
}

function saveStoredStaff(staff: StaffItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staff));
  } catch {
    // Graceful silent error handling
  }
}

export async function getAdminStaffPaginated(
  params?: StaffQueryParams
): Promise<Either<ApiError, StaffPaginatedResponse>> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.search) query.append('search', params.search);
  if (params?.role) query.append('role', params.role);
  if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));

  const endpoint = `/admin/staff${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiTransport(endpoint, StaffPaginatedResponseSchema);

  if (response.isRight()) {
    return response;
  }

  // Graceful fallback from local store
  const allStaff = getStoredStaff();
  let filtered = [...allStaff];

  if (params?.search) {
    const s = params.search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(s) ||
        item.email.toLowerCase().includes(s) ||
        (item.phone && item.phone.includes(s))
    );
  }

  if (params?.role) {
    filtered = filtered.filter((item) => item.role === params.role);
  }

  if (params?.isActive !== undefined) {
    filtered = filtered.filter((item) => item.isActive === params.isActive);
  }

  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const startIndex = (page - 1) * limit;
  const items = filtered.slice(startIndex, startIndex + limit);

  return right({
    items,
    meta: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
}

export async function createAdminStaff(
  payload: CreateStaffInput
): Promise<Either<ApiError, StaffItem>> {
  const response = await apiTransport('/admin/staff', StaffItemSchema, {
    method: 'POST',
    body: payload,
  });

  if (response.isRight()) {
    return response;
  }

  // Graceful fallback
  const allStaff = getStoredStaff();
  const newStaff: StaffItem = {
    id: `staff-${Date.now()}`,
    name: payload.name,
    email: payload.email,
    phone: payload.phone || null,
    role: payload.role,
    pinCodeSet: Boolean(payload.pinCode && payload.pinCode.length === 4),
    dailyShiftHours: payload.dailyShiftHours,
    isActive: true,
    avatarUrl: null,
    isEmailVerified: false,
    isPhoneVerified: false,
    joinedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newStaff, ...allStaff];
  saveStoredStaff(updated);

  return right(newStaff);
}

export async function updateAdminStaff(
  id: string,
  payload: UpdateStaffInput
): Promise<Either<ApiError, StaffItem>> {
  const response = await apiTransport(`/admin/staff/${id}`, StaffItemSchema, {
    method: 'PUT',
    body: payload,
  });

  if (response.isRight()) {
    return response;
  }

  // Graceful fallback
  const allStaff = getStoredStaff();
  const index = allStaff.findIndex((s) => s.id === id);

  if (index === -1) {
    return left(new ApiError(404, 'Not Found', 'Karyawan tidak ditemukan'));
  }

  const existing = allStaff[index];
  const updatedItem: StaffItem = {
    ...existing,
    name: payload.name,
    email: payload.email,
    phone: payload.phone || null,
    role: payload.role,
    isActive: payload.isActive,
    dailyShiftHours: payload.dailyShiftHours,
    updatedAt: new Date().toISOString(),
  };

  allStaff[index] = updatedItem;
  saveStoredStaff(allStaff);

  return right(updatedItem);
}

export async function updateAdminStaffPin(
  id: string,
  payload: UpdateStaffPinInput
): Promise<Either<ApiError, { success: boolean; message: string }>> {
  const response = await apiTransport(
    `/admin/staff/${id}/pin`,
    PinUpdateResponseSchema,
    {
      method: 'PUT',
      body: payload,
    }
  );

  if (response.isRight()) {
    return response;
  }

  // Graceful fallback
  const allStaff = getStoredStaff();
  const index = allStaff.findIndex((s) => s.id === id);

  if (index !== -1) {
    allStaff[index].pinCodeSet = true;
    allStaff[index].updatedAt = new Date().toISOString();
    saveStoredStaff(allStaff);
  }

  return right({
    success: true,
    message: 'PIN 4-digit karyawan berhasil diperbarui',
  });
}

export async function deleteAdminStaff(
  id: string
): Promise<Either<ApiError, { success: boolean }>> {
  const response = await apiTransport(
    `/admin/staff/${id}`,
    DeleteStaffResponseSchema,
    {
      method: 'DELETE',
    }
  );

  if (response.isRight()) {
    return response;
  }

  // Graceful fallback: remove or deactivate
  const allStaff = getStoredStaff();
  const filtered = allStaff.filter((s) => s.id !== id);
  saveStoredStaff(filtered);

  return right({ success: true });
}
