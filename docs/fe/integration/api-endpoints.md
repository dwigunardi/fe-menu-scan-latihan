# Daftar Endpoint API yang Dipakai Frontend

> **Sumber kebenaran**: kode di `src/lib/api/*-api.ts`. Dokumen ini disusun langsung dari kode pada 2026-11-20.
> Jika berbeda dengan dokumen backend di `docs/be/`, **kode frontend yang berlaku** sampai kontraknya disepakati ulang dengan tim backend.
> Saat menambah atau mengubah fungsi di `src/lib/api/`, perbarui tabel ini di PR yang sama.

Base URL: `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:5000/api/v1`).

## Legenda kolom "Transport"

Semua request lewat `apiTransport` → `executePipeline` (lihat [interceptor-pipeline-architecture.md](../architecture/interceptor-pipeline-architecture.md)).

| Nilai | Arti |
| :--- | :--- |
| **E2E** | Default. Bearer token + header `x-handshake-token` + body/response dienkripsi AES-256-GCM. |
| **Plain** | `skipHandshakeToken: true` — tanpa handshake, sehingga body/response **tidak** dienkripsi (hanya TLS). |
| **Plain (file)** | `skipEncryption: true` — upload `multipart/form-data`, file tidak dienkripsi. |

## Auth

| Method | Endpoint | Fungsi | Transport | Catatan |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/auth/handshake` | `performHandshake` | `fetch` langsung | Pertukaran kunci ECDH. Body `{ clientPublicKey, nonce }` (hex). Response `{ serverPublicKey, handshakeToken, expiresIn }`. |
| POST | `/auth/login` | `loginStaff` | Plain | Body `{ email, password }`. |
| POST | `/auth/refresh` | `refreshTokenApi` | Plain | Header `Authorization: Bearer <refreshToken>` + body `{ refreshToken }`. |
| POST | `/auth/onboard` | `onboardStaff` | Plain | Body `{ currentPassword, newPassword, pinCode }`. Response sama dengan login. |
| POST | `/auth/verify-pin` | `verifyStaffPin` | E2E | **⚠️ Belum ada di backend.** Lihat [kontrak di bawah](#kontrak-baru-post-authverify-pin). |

## Menu & Kategori

| Method | Endpoint | Fungsi | Transport |
| :--- | :--- | :--- | :--- |
| GET | `/public/categories?limit=-1` | `getAdminCategories` | E2E |
| POST | `/admin/categories` | `createAdminCategory` | E2E |
| PUT | `/admin/categories/:id` | `updateAdminCategory` | E2E |
| DELETE | `/admin/categories/:id` | `deleteAdminCategory` | E2E |
| GET | `/public/menus?limit=-1[&categoryId=]` | `getAdminMenus` | E2E |
| GET | `/admin/menus?page&limit&search&categoryId…` | `getAdminMenusPaginated` | E2E |
| GET | `/public/menus/:id` | `getAdminMenuDetail` | E2E |
| POST | `/admin/menus` | `createAdminMenu` | E2E |
| PUT | `/admin/menus/:id` | `updateAdminMenu` | E2E |
| PUT | `/admin/menus/:id/status` | `toggleMenuAvailability` | E2E |
| DELETE | `/admin/menus/:id` | `deleteAdminMenu` | E2E |
| POST | `/admin/uploads/image` | `uploadAdminMenuImage`, `uploadMediaImage` | Plain (file) |

## Banner

| Method | Endpoint | Fungsi | Transport |
| :--- | :--- | :--- | :--- |
| GET | `/admin/banners` | `getAdminBanners` | E2E |
| GET | `/public/banners` | `getPublicBanners` | Plain |
| GET | `/admin/banners/:id` | `getAdminBannerById` | E2E |
| POST | `/admin/banners` | `createAdminBanner` | E2E |
| PUT | `/admin/banners/:id` | `updateAdminBanner`, `toggleAdminBannerStatus` | E2E |
| DELETE | `/admin/banners/:id` | `deleteAdminBanner` | E2E |

## Pesanan & Laporan

| Method | Endpoint | Fungsi | Transport |
| :--- | :--- | :--- | :--- |
| GET | `/admin/orders?…` | `getAdminOrders` | E2E |
| PUT | `/admin/orders/:id/status` | `updateAdminOrderStatus` | E2E |
| GET | `/admin/reports/dashboard-overview` | `getAdminDashboardOverview` | E2E |
| GET | `/admin/reports/revenue?…` | `getAdminRevenueReport` | E2E |
| GET | `/admin/reports/top-selling?…` | `getAdminTopSellingReport` | E2E |

## Meja & Zona

| Method | Endpoint | Fungsi | Transport |
| :--- | :--- | :--- | :--- |
| GET | `/admin/tables?limit=-1[&status=]` / `/admin/tables?…` | `getAdminTables`, `getAdminTablesPaginated` | E2E |
| POST | `/admin/tables` | `createAdminTable` | E2E |
| PUT | `/admin/tables/:id` | `updateAdminTable` | E2E |
| POST | `/admin/tables/:id/reset` | `resetAdminTable` | E2E |
| DELETE | `/admin/tables/:id` | `deleteAdminTable` | E2E |
| GET / POST | `/admin/table-zones` | `getAdminTableZones`, `createAdminTableZone` | E2E |
| PUT / DELETE | `/admin/table-zones/:id` | `updateAdminTableZone`, `deleteAdminTableZone` | E2E |

## Shift Kasir

| Method | Endpoint | Fungsi | Transport | Catatan |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/admin/shifts/current` | `getCurrentShift` | E2E | Response boleh `null`. |
| POST | `/admin/shifts/open` | `openShift` | E2E | |
| POST | `/admin/shifts/:id/close` | `closeShift` | E2E | |
| GET | `/admin/shifts?page&limit&startDate&endDate&status` | `getShiftHistory` | E2E | |

## Staf

| Method | Endpoint | Fungsi | Transport |
| :--- | :--- | :--- | :--- |
| GET | `/admin/staff?page&limit&search&role&isActive` | `getAdminStaffPaginated` | E2E |
| POST | `/admin/staff` | `createAdminStaff` | E2E |
| PUT | `/admin/staff/:id` | `updateAdminStaff` | E2E |
| PUT | `/admin/staff/:id/pin` | `updateAdminStaffPin` | E2E |
| DELETE | `/admin/staff/:id` | `deleteAdminStaff` | E2E |

> **Mock fallback (dev saja).** Modul staf dan shift punya data tiruan di `localStorage` untuk development tanpa backend. Fallback ini **mati secara default** dan hanya aktif jika `NEXT_PUBLIC_ENABLE_MOCK_FALLBACK=true`, itupun hanya untuk error jaringan (status 0), 404, dan 501. Error 400/401/403/409/5xx selalu diteruskan ke UI. Lihat `src/lib/api/mock-fallback.ts`.

## Presensi

| Method | Endpoint | Fungsi | Transport |
| :--- | :--- | :--- | :--- |
| GET | `/admin/attendance?…` | `getAdminAttendancePaginated` | E2E |
| GET | `/admin/attendance/summary?…` | `getAdminAttendanceSummary` | E2E |
| POST | `/admin/attendance/clock-in` | `recordClockIn` | E2E |
| POST | `/admin/attendance/clock-out` | `recordClockOut` | E2E |
| POST | `/admin/attendance/leave` | `createLeaveRequest` | E2E |
| PATCH | `/admin/attendance/:id/overtime` | `reviewOvertime` | E2E |
| PATCH | `/admin/attendance/:id/correction` | `correctAttendanceTime` | E2E |

## Pengaturan Cabang & Template Shift

| Method | Endpoint | Fungsi | Transport |
| :--- | :--- | :--- | :--- |
| GET / PUT | `/admin/settings/branch` | `fetchAdminBranchSetting`, `updateAdminBranchSetting` | E2E |
| PUT | `/admin/settings/branch/store-status` | `updateStoreStatus` | E2E |
| GET | `/public/branch/location` | `fetchPublicBranchLocation` | Plain |
| GET / POST | `/admin/settings/shift-templates` | `fetchShiftTemplates`, `createShiftTemplate` | E2E |
| PUT / DELETE | `/admin/settings/shift-templates/:id` | `updateShiftTemplate`, `deleteShiftTemplate` | E2E |
| POST | `/admin/settings/shift-templates/seed-defaults` | `seedDefaultShiftTemplates` | E2E |

## Layanan eksternal

| Layanan | Dipakai di | Catatan |
| :--- | :--- | :--- |
| OpenStreetMap Nominatim | `src/lib/utils/geocoding.ts` | Reverse-geocoding alamat cabang. Memakai `fetch` langsung (bukan pipeline) karena domain pihak ketiga. |

> Nama fungsi di tabel ini mengikuti ekspor di `src/lib/api/`; untuk detail parameter dan schema Zod respons, buka file modulnya.

---

## Kontrak baru: `POST /auth/verify-pin`

Dipakai oleh exit guard mode kiosk (`src/components/kiosk/kiosk-exit-dialog.tsx`) untuk memastikan hanya kasir yang sedang login yang bisa keluar dari mode kiosk.

- **Auth**: Bearer token user yang sedang login (role kasir/admin). PIN yang diverifikasi adalah PIN milik user tersebut.
- **Transport**: E2E (handshake + body terenkripsi), karena PIN adalah kredensial.
- **Request body**: `{ "pinCode": "1234" }` (4 digit).
- **Response 200**: `{ "valid": true }` atau `{ "valid": false }`.
- **PIN salah → `200 { valid: false }` atau `400`, BUKAN `401`.** `401` berarti sesi kasir kedaluwarsa, dan frontend akan menjalankan alur silent refresh / modal login ulang.
- **Rate limit (disarankan)**: kunci sementara setelah beberapa kali gagal, balas `429`. Frontend sudah menampilkan pesan khusus untuk `429`.

Selama endpoint ini belum ada (404), dialog menampilkan *"Verifikasi PIN belum tersedia di server."* dan **tidak** mengizinkan keluar dari kiosk.

---

## Status di kode backend (dicek 2026-11-20)

Dicocokkan langsung dengan controller di repo `be-menu-scan-latihan` (`src/modules/**/*.controller.ts`). Semua endpoint di dokumen ini sudah ada di backend, **kecuali**:

| Endpoint yang dipanggil FE | Status backend | Dampak |
| :--- | :--- | :--- |
| `/admin/shifts/*` (current, open, `:id/close`, riwayat) | ❌ Belum ada controller shift | Halaman `/admin/shifts` error (sebelumnya tertutup data mock) |
| `POST /auth/verify-pin` | ❌ Belum ada | Kasir tidak bisa keluar dari mode kiosk |
| `PATCH /admin/attendance/:id/overtime` | ❌ Belum ada | Review lembur gagal |
| `PATCH /admin/attendance/:id/correction` | ❌ Belum ada | Koreksi presensi gagal |

Daftar tugas untuk backend ditulis di repo backend: `be-menu-scan-latihan/docs/handoff/2026-11-20-fe-audit-handoff.md`.

---

## Perbedaan dengan dokumen di `docs/be/` (snapshot)

Dokumen backend yang disalin ke `docs/be/` sudah tertinggal dari kode backend-nya sendiri. Kode backend **sudah cocok** dengan FE untuk poin-poin di bawah (method `PUT` diterima bersama `PATCH`, path presensi `/admin/attendance/*` dengan `staffId`/`latitude`/`longitude`, `/admin/staff/:id/pin`, `/admin/settings/branch`). Yang perlu diperbarui adalah dokumennya.

| Area | Frontend (kode) | Dokumen backend (snapshot) |
| :--- | :--- | :--- |
| Update status pesanan & menu | `PUT` | `PATCH` di `frontend-integration-guide.md` dan wireframe API (roadmap backend sendiri menyebut `PUT`) |
| Presensi | `/admin/attendance/*` dengan field `staffId`, `clockInLat`, `isWithinGeofence` | `/staff/attendance/*` dan `/admin/attendance/overview\|logs\|:id/approve` dengan field `userId`, `clockInLatitude`, `isWithinRadius` |
| Tutup shift | `POST /admin/shifts/:id/close` | `/admin/shifts/close` |
| Reset PIN staf | `PUT /admin/staff/:id/pin` | `/admin/staff/:id/password` |
| Pengaturan cabang | `/admin/settings/branch` | `/admin/settings` |
| Belum terdokumentasi di backend | `/auth/onboard`, `/auth/verify-pin`, `/admin/settings/shift-templates[/seed-defaults]`, `/admin/uploads/image` | — |
