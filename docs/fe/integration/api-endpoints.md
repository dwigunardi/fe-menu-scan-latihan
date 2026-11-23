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
| POST | `/auth/verify-pin` | `verifyStaffPin` | E2E | ✅ Ada di `main` backend (commit `c2b72cc`). Body `{ pinCode }` → `200 { valid }`. Lihat [kontrak](#kontrak-post-authverify-pin). |

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

> **Bayar tunai butuh shift terbuka** (backend branch `feat/cashier-shift-payment`). `PUT /admin/orders/:id/status` dengan `status: 'PAID'` dibalas `409` jika belum ada shift kasir yang dibuka. Body menerima field opsional `paymentMethod: 'CASH' | 'QRIS'` (default `CASH`). FE saat ini hanya mengirim `{ status }`, jadi semua pelunasan dari POS tercatat tunai. Lihat [Perubahan perilaku backend](#perubahan-perilaku-backend-2026-11-21-shift--pembayaran).

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
| GET | `/admin/shifts/current` | `getCurrentShift` | E2E | `data: null` jika laci kas tertutup. Total dihitung live. |
| POST | `/admin/shifts/open` | `openShift` | E2E | Body `{ openingCash, notes? }` → `201`. `409` jika sudah ada shift terbuka (satu per cabang). |
| POST | `/admin/shifts/:id/close` | `closeShift` | E2E | Body `{ actualCash, notes? }` → `200` + snapshot Z-Report. `403` jika bukan pembuka shift atau ADMIN, `404` tidak ditemukan, `409` sudah ditutup. |
| GET | `/admin/shifts?page&limit&startDate&endDate&status` | `getShiftHistory` | E2E | `limit` 1–100. Tanggal `YYYY-MM-DD` (hari WIB) atau ISO datetime; filter berdasarkan `openedAt`. |

Role: `ADMIN` dan `CASHIER`. Respons cocok dengan `ShiftItemSchema` (`src/lib/validations/shift.schema.ts`). Backend menambahkan `closedById`, `closedByName`, `openingNotes`, `closingNotes`; field tambahan ini dibuang oleh Zod di FE sampai dibutuhkan. `notes` = `closingNotes ?? openingNotes`, `expectedCash = openingCash + totalCashRevenue`, `cashVariance = actualCash - expectedCash`.

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

| Method | Endpoint | Fungsi | Transport | Respons |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/admin/attendance?…` | `getAdminAttendancePaginated` | E2E | `{ items: AttendanceItem[], meta }` |
| GET | `/admin/attendance/summary?…` | `getAdminAttendanceSummary` | E2E | `AttendanceSummarySchema` (+ `date`, dibuang Zod). `attendanceRatePercent` = hadir ÷ staf aktif × 100. |
| POST | `/admin/attendance/clock-in` | `recordClockIn` | E2E | `AttendanceItem` |
| POST | `/admin/attendance/clock-out` | `recordClockOut` | E2E | `AttendanceItem` |
| POST | `/admin/attendance/leave` | `createLeaveRequest` | E2E | `{ success: true, message }` |
| PATCH | `/admin/attendance/:id/overtime` | `reviewOvertime` | E2E | `AttendanceItem`. Hanya ADMIN. Lihat [kontrak](#kontrak-review-lembur--koreksi-presensi). |
| PATCH | `/admin/attendance/:id/correction` | `correctAttendanceTime` | E2E | `AttendanceItem`. Hanya ADMIN. Lihat [kontrak](#kontrak-review-lembur--koreksi-presensi). |

Respons dicocokkan dengan `AttendanceItemSchema` (`src/lib/validations/attendance.schema.ts`) pada 2026-11-21: enum status, role, dan field nullable cocok. Format waktu:

- `clockInTime` / `clockOutTime`: **ISO datetime UTC**. Tampilkan dengan `formatTimeWib()` (`src/lib/utils/date-helpers.ts`), jangan dirender mentah.
- `date`: tanggal **WIB** `YYYY-MM-DD`.
- `isAutoClosed` selalu `false` dan `actingRole` selalu `null` (belum ada di backend).

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

## Kontrak: serah terima shift (`/auth/handover`)

Dipakai oleh `ShiftHandoverModal` (tombol "Ganti Shift" untuk semua role kecuali ADMIN). Backend: commit `e048b97` di branch BE `feat/shift-handover-pin` (**belum di `main` backend**). Tanpa backend ini, modal serah terima gagal memuat daftar staf.

| Method | Endpoint | Fungsi | Transport | Catatan |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/auth/handover/candidates` | `getHandoverCandidates` (`useHandoverCandidatesQuery`) | E2E | Semua role yang sudah onboarding. `[{ id, employeeId, name, role: CASHIER\|KITCHEN\|WAITER, avatarUrl }]`: staf aktif, sudah onboarding, punya PIN, bukan ADMIN, bukan user saat ini. |
| POST | `/auth/handover` | `handoverShift` | E2E | Body `{ incomingStaffId, pinCode, notes? (≤500) }`. Respons sama dengan login (`LoginResponseSchema`). FE mengganti profil **dan** token di store, lalu mengarahkan ke halaman role staf pengganti. |

Backend mencabut refresh token staf yang keluar; access token lamanya masih berlaku hingga kedaluwarsa (maks 15 menit) tapi tidak dipakai lagi oleh FE.

| Respons | Tampilan di FE |
| :--- | :--- |
| `400` PIN salah ("PIN staf pengganti salah."), penerima = diri sendiri, penerima belum onboarding / tanpa PIN, body tidak valid. **Tidak pernah `401`.** | Pesan backend di bawah input PIN; sesi tetap milik staf lama. |
| `404` penerima tidak ada / nonaktif / ADMIN | Toast error + daftar kandidat dimuat ulang. |
| `409` `code: SHIFT_STILL_OPEN` (staf yang keluar masih memegang shift laci `OPEN`) | Langkah "Tutup shift kas Anda terlebih dahulu" + tombol ke `/admin/shifts`. FE juga mengecek ini lebih dulu untuk kasir (`GET /admin/shifts/current`); backend menjaganya untuk semua role. |
| `429` PIN penerima terkunci (lockout 5x/5 menit, dibagi dengan verify-pin & clock-in/out) atau throttle IP 10/menit | Pesan backend (sisa menit/detik) di bawah input PIN (`getRateLimitMessage`). |

> Daftar staf sebelumnya diambil dari `GET /admin/staff`, yang khusus ADMIN, sehingga selalu `403` untuk kasir/dapur/pelayan yang memakai modal ini.

---

## Kontrak: `POST /auth/verify-pin`

Dipakai oleh exit guard mode kiosk (`src/components/kiosk/kiosk-exit-dialog.tsx`) untuk memastikan hanya kasir yang sedang login yang bisa keluar dari mode kiosk.

**Status backend**: sudah di `main` backend (commit `c2b72cc`, di-merge 2026-11-23). Sudah dites BE ke server sungguhan (14/14 skenario lolos).

- **Auth**: Bearer token (JWT), semua role. PIN yang diverifikasi adalah PIN milik user dari JWT.
- **Transport**: E2E (handshake + body terenkripsi), karena PIN adalah kredensial.
- **Request body**: `{ "pinCode": "1234" }`, tepat 4 digit. Selain itu → `400`.

| Kondisi | Respons backend | Tampilan di FE (`describeVerifyError`) |
| :--- | :--- | :--- |
| PIN benar | `200 { valid: true }` | Keluar dari kiosk |
| PIN salah, user belum punya PIN, atau user nonaktif | `200 { valid: false }` | "PIN kasir salah. Akses keluar ditolak." |
| Body tidak valid (bukan 4 digit) | `400` | "PIN kasir salah..." (FE sudah memvalidasi 4 digit sebelum kirim, jadi praktis tidak terjadi) |
| User belum onboarding | `403` dari `OnboardingGuard` | "PIN kasir salah..." (cabang 4xx umum) |
| 5x salah berturut-turut | `429` "Terlalu banyak percobaan PIN. Coba lagi dalam X menit." Terkunci 5 menit; selama terkunci PIN benar pun tetap `429`. | "Terlalu banyak percobaan. Tunggu sebentar." |
| Throttle per IP (10 request/menit di route ini) | `429` | Sama seperti di atas |
| Sesi kedaluwarsa | `401` | Alur silent refresh / modal login ulang (bukan pesan PIN) |

- **PIN salah tidak pernah dibalas `401`.** `401` hanya berarti sesi kasir kedaluwarsa.
- **Counter gagal**: PIN benar me-reset counter. Admin yang me-reset PIN staf (`PUT /admin/staff/:id/pin`) juga membuka kunci.
- **Backend lama (tanpa endpoint, `404`/`501`)**: dialog menampilkan *"Verifikasi PIN belum tersedia di server."* dan **tidak** mengizinkan keluar dari kiosk.

> **Tindak lanjut FE (opsional)**: untuk `429`, FE menampilkan pesan generik dan membuang pesan backend yang menyebut sisa menit penguncian. Pertimbangkan menampilkan `error.message` dari backend agar kasir tahu berapa lama harus menunggu.

---

## Kontrak: review lembur & koreksi presensi

Backend: commit `bd31ec6` (2026-11-21, kini di `main` backend), divalidasi BE ke server sungguhan memakai salinan schema Zod FE. Keduanya **hanya ADMIN** (`403` untuk role lain) dan `404` jika presensi tidak ditemukan. Review maupun koreksi boleh diulang.

### `PATCH /admin/attendance/:id/overtime`

Body `{ status: 'APPROVED' | 'REJECTED' | 'OVERRIDDEN', approvedMinutes?, notes? }` (`OvertimeReviewSchema`).

- `overtimeMinutes` dihitung saat clock-out: durasi kerja − `dailyShiftHours` × 60, minimal 0. Statusnya pending (`isOvertimeApproved: null`) sampai ditinjau.
- `APPROVED` → `isOvertimeApproved: true`.
- `REJECTED` → `false`; `overtimeMinutes` tetap menampilkan menit hasil hitung.
- `OVERRIDDEN` → wajib `approvedMinutes` 0–1440; `overtimeMinutes` di respons = `approvedMinutes`.

| Kondisi | Respons |
| :--- | :--- |
| `APPROVED`/`REJECTED` padahal tidak ada lembur hasil hitung (pakai `OVERRIDDEN`), atau `approvedMinutes` tidak valid | `400` |
| Staf belum presensi pulang | `409` |

### `PATCH /admin/attendance/:id/correction`

Body `{ clockOutTime, notes }` (`AttendanceCorrectionSchema`), `notes` 3–500 karakter.

- `clockOutTime` `"HH:mm"` = jam **WIB** pada tanggal presensi. Jika tidak setelah jam masuk, dianggap hari berikutnya. ISO datetime juga diterima. Bisa dipakai untuk staf yang lupa clock-out.
- Durasi dan lembur dihitung ulang; review lembur di-reset jika menit lemburnya berubah.
- FE mengisi nilai awal input dari `clockOutTime` respons lewat `formatTimeWib()` (sebelumnya ISO dipakai langsung sehingga input `type="time"` kosong).

| Kondisi | Respons |
| :--- | :--- |
| Jam pulang tidak setelah jam masuk, di masa depan, durasi > 24 jam, atau tidak ada jam masuk | `400` |

---

## Status di kode backend (dicek 2026-11-23)

Dicocokkan langsung dengan controller di repo `be-menu-scan-latihan` (`src/modules/**/*.controller.ts`). **Semua endpoint di dokumen ini sudah ada di `main` backend** (merge PR backend #1–#4, terakhir `2d85565`, 2026-11-23), termasuk yang sebelumnya belum ada:

| Endpoint yang dipanggil FE | Ditambahkan di backend | Catatan |
| :--- | :--- | :--- |
| `/admin/shifts/*` (current, open, `:id/close`, riwayat) | `6a13442`, `b84dc4f` | Kontrak dicocokkan dengan FE (lihat [Shift Kasir](#shift-kasir)). |
| `POST /auth/verify-pin` | `c2b72cc` | Lihat [kontrak](#kontrak-post-authverify-pin). |
| `PATCH /admin/attendance/:id/overtime`, `/correction` | `bd31ec6` | Lihat [kontrak](#kontrak-review-lembur--koreksi-presensi). |
| Respons presensi lain (clock-in/out, daftar, ringkasan, izin) | `bd31ec6` | Sebelumnya backend mengirim baris Prisma mentah tanpa `staffName`/`staffRole`, sehingga ditolak sebagai `CONTRACT_VIOLATION`. |

Backend lama (sebelum `3395e5b`) tidak punya endpoint di atas: halaman shift error, kasir hanya bisa keluar kiosk lewat logout, dan review lembur/koreksi gagal.

Pesan `429` throttler backend berbahasa Indonesia ("Terlalu banyak permintaan. Coba lagi dalam X detik.") sejak commit `cf57542` (di `main` backend lewat merge `2d85565`). `getRateLimitMessage()` menampilkannya apa adanya; teks bawaan lama "ThrottlerException: Too Many Requests" tetap diganti kalimat generik untuk backend lama.

Daftar tugas untuk backend ditulis di repo backend: `be-menu-scan-latihan/docs/handoff/2026-11-20-fe-audit-handoff.md`.

---

## Perubahan perilaku backend 2026-11-21 (shift & pembayaran)

Berlaku di branch BE `feat/cashier-shift-payment`. Bentuk respons endpoint order, pembayaran, dan laporan **tidak** berubah.

| # | Perubahan backend | Kondisi FE saat ini | Tindak lanjut FE |
| :---: | :--- | :--- | :--- |
| 1 | `PUT /admin/orders/:id/status` → `PAID` (tunai) dibalas `409` dengan `code: "SHIFT_NOT_OPEN"` (sejak `03e80c6`) jika laci belum dibuka. | ✅ Optimistic update di-rollback. Untuk kasir/admin, toast "Shift kasir belum dibuka" punya tombol **Buka Shift** ke `/admin/shifts` (`isNoOpenShiftError` di `src/lib/api/shift-errors.ts`, opsi `onNoOpenShift` di `useUpdateOrderStatusMutation`). Staf dapur melihat toast biasa. | — Pipeline meneruskan `code` dari body error ke `ApiError.code` jika nilainya dikenal `ErrorCode`. `isNoOpenShiftError` memeriksa `code` lebih dulu, dan memakai teks pesan hanya sebagai fallback untuk backend lama. |
| 2 | Field opsional `paymentMethod: 'CASH' \| 'QRIS'` (default `CASH`). `PAID` ulang dengan metode sama → `200` tanpa perubahan; metode berbeda → `409`. | FE tidak mengirim `paymentMethod`, sehingga selalu `CASH`. Belum ada alur QRIS di FE. | Saat alur QRIS (Fase 3) dibuat: kirim `paymentMethod`, dan sembunyikan tombol "Tandai Lunas" untuk order yang `paidAt`-nya sudah terisi. |
| 3 | "Sudah dibayar" = `paidAt` terisi dan status bukan `CANCELLED`. Order PREPARING/SERVED yang sudah dibayar ikut dihitung di dashboard, laporan, dan menu terlaris. Omzet per `paidAt`, batas hari WIB. | Angka dari endpoint laporan otomatis mengikuti. Hitungan lokal di `orders-view.tsx` masih memakai `status === 'PAID'`. | Samakan hitungan lokal dengan definisi `paidAt` jika angka di layar kasir harus sama dengan laporan. |
| 4 | `startDate`/`endDate` laporan wajib `YYYY-MM-DD` atau ISO datetime; selain itu `400`. | `date-helpers.ts` mengirim ISO datetime. Aman. | — |
| 5 | `create-qris` dibalas `409` untuk order yang sudah dibayar atau dibatalkan. | Belum dipakai FE. | Tangani saat Fase 3. |

### Audit role & keamanan backend (2026-11-23, commit BE `ebe263f`…`6b66ff3`)

| # | Perubahan backend | Kondisi FE saat ini | Tindak lanjut FE |
| :---: | :--- | :--- | :--- |
| 6 | `PUT /admin/orders/:id/status` ke `PAID`/`CANCELLED` hanya `ADMIN` & `CASHIER`; `KITCHEN`/`WAITER` dibalas `403`. `PENDING`/`PREPARING`/`SERVED` tetap semua role. | ✅ `OrderCard` menerima `canSettle`; `OrdersView` mengisinya `true` hanya untuk `ADMIN`/`CASHIER`. Tombol "Tolak" dan "Bayar & Selesai" disembunyikan untuk role lain, dan drag ke kolom Lunas ditolak dengan toast. | — |
| 7 | Lockout PIN dipakai bersama oleh `verify-pin`, clock-in, dan clock-out: 5x salah berturut-turut di endpoint mana pun mengunci PIN staf itu 5 menit di ketiganya. Clock-in/out saat terkunci → `429` dengan pesan sisa menit (PIN salah tetap `400`). | ✅ `getRateLimitMessage()` (`src/lib/api/error-translator.ts`) memakai pesan `429` dari backend, kecuali teks bawaan throttler ("ThrottlerException: Too Many Requests") yang diganti kalimat generik. Dipakai oleh toast umum (`ClockInModal`), keypad PIN kiosk, dan dialog keluar kiosk. | — |
| 8 | Create/update/delete meja & zona khusus `ADMIN` (sebelumnya `DELETE /admin/tables/:id` terbuka untuk semua staf). Kasir hanya melihat dan `POST /admin/tables/:id/reset`. | ✅ `TablesView` hanya menampilkan "Tambah Meja", "Kelola Zona", edit, dan hapus untuk `ADMIN`. Kasir tetap melihat "Mode Kios", QR, dan "Reset". | — |

Kasir memang boleh membuka KDS (`GET /admin/orders`, `PUT` status). Route `admin/*` tanpa `@Roles` kini ditolak `403` secara default; semua route yang dipakai FE sudah punya `@Roles`. `@ZodResponse` sekarang diterapkan sebelum enkripsi, dan bentuk amplop terenkripsi tidak berubah.

---

## Perbedaan dengan dokumen di `docs/be/` (snapshot)

Disalin ulang pada 2026-11-23 dari branch BE `feat/cashier-shift-payment` (commit docs `f4c8e18`):

- `integration/frontend-integration-guide.md`
- `architecture/api-contract-and-security-guidelines.md` (baru)
- `architecture/staff-and-attendance-blueprint.md`
- `roadmap/implementation-milestones.md`
- `handoff/2026-11-20-fe-audit-handoff.md` (baru)
- `architecture/auth-ecdh-dual-token-flow.md`, `architecture/branch-settings-and-geofence-blueprint.md`, `security/staff-login-and-token-lifecycle.md` (baru; sebelumnya hanya ada di repo backend)

Perbedaan yang sebelumnya tercatat di sini sudah **diselesaikan di dokumen backend**: `PUT` untuk update status, path presensi `/admin/attendance/*`, `POST /admin/shifts/:id/close`, `PUT /admin/staff/:id/pin`, `/admin/settings/branch`, serta endpoint onboard, verify-pin, template shift, dan upload kini terdokumentasi.

Yang masih berbeda:

| Dokumen | Catatan |
| :--- | :--- |
| `wireframe/wireframe-api-not-final.md` | Masih menulis `PATCH` untuk update banner, kategori, menu, dan status order. Backend menerima `PUT` maupun `PATCH`, jadi tidak berdampak. FE memakai `PUT`. Sejak BE `29cbd51` dokumen ini diberi peringatan sebagai draf lama (bukan kontrak API) dan sudah disalin ulang. |
| `architecture/architecture-design.md`, `architecture/database-strategy.md` | Salinan FE berisi tambahan yang ditulis di sisi FE (multi-branch, versi stack) dan tidak ada di repo backend. Tidak ditimpa. |
