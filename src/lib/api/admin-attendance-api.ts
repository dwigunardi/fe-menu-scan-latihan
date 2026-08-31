import { hardenedFetch } from './hardened-fetch';
import { Either } from './either';
import { ApiError } from './api-error';
import {
  AttendanceItem,
  AttendanceItemSchema,
  ClockInInput,
  ClockOutInput,
  LeaveRequestInput,
  LeaveResponse,
  LeaveResponseSchema,
  AttendanceQueryParams,
  AttendanceSummaryData,
  AttendanceSummarySchema,
  AttendancePaginatedResponse,
  AttendancePaginatedResponseSchema,
  OvertimeReviewInput,
  AttendanceCorrectionInput,
} from '../validations/attendance.schema';

const BASE_URL = '/admin/attendance';

export async function getAdminAttendancePaginated(
  params: AttendanceQueryParams = {}
): Promise<Either<ApiError, AttendancePaginatedResponse>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.status) searchParams.set('status', params.status);
  if (params.role) searchParams.set('role', params.role);
  if (params.search) searchParams.set('search', params.search);

  const url = `${BASE_URL}?${searchParams.toString()}`;
  return hardenedFetch(url, AttendancePaginatedResponseSchema, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function getAdminAttendanceSummary(
  params: { date?: string } = {}
): Promise<Either<ApiError, AttendanceSummaryData>> {
  const searchParams = new URLSearchParams();
  if (params.date) searchParams.set('date', params.date);

  const url = `${BASE_URL}/summary?${searchParams.toString()}`;
  return hardenedFetch(url, AttendanceSummarySchema, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function recordClockIn(
  payload: ClockInInput
): Promise<Either<ApiError, AttendanceItem>> {
  return hardenedFetch(`${BASE_URL}/clock-in`, AttendanceItemSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function recordClockOut(
  payload: ClockOutInput
): Promise<Either<ApiError, AttendanceItem>> {
  return hardenedFetch(`${BASE_URL}/clock-out`, AttendanceItemSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function createLeaveRequest(
  payload: LeaveRequestInput
): Promise<Either<ApiError, LeaveResponse>> {
  return hardenedFetch(`${BASE_URL}/leave`, LeaveResponseSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function reviewOvertime(
  id: string,
  payload: OvertimeReviewInput
): Promise<Either<ApiError, AttendanceItem>> {
  return hardenedFetch(`${BASE_URL}/${id}/overtime`, AttendanceItemSchema, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function correctAttendanceTime(
  id: string,
  payload: AttendanceCorrectionInput
): Promise<Either<ApiError, AttendanceItem>> {
  return hardenedFetch(`${BASE_URL}/${id}/correction`, AttendanceItemSchema, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
