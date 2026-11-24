# Kumpul Cafe Frontend Implementation Milestones & Roadmap

> **Project**: Kumpul Cafe – Digital QR Code Menu System & Multi-Branch FnB SaaS Platform  
> **Brand Name**: Kumpul Cafe  
> **Backend Integration**: NestJS 11 (`http://localhost:5000/api/v1`) + WebSocket (`http://localhost:5000/events`)  
> **Framework**: Next.js 16 (App Router, TypeScript)  
> **Styling & Motion**: Tailwind CSS v4 + `motion`  
> **Data Fetching**: `@tanstack/react-query` (v5) + `apiTransport` → `executePipeline` (middleware pipeline)  
> **Security Standard**: WebCrypto API (P-256 ECDH + AES-256-GCM payload encryption, di atas TLS)  
> **Document Location**: `docs/fe/roadmap/implementation-milestones.md`  
> **Status**: Active Frontend Roadmap Tracking Document — terakhir disinkronkan dengan kode: 2026-11-20  

---

## 📊 Overview Progress Summary

| Phase | Description | Status | Completion |
| :--- | :--- | :---: | :---: |
| **Phase 0** | Planning, Architecture & Multi-Tenant Specification | ✅ **DONE** | 100% |
| **Phase 1** | Client Infrastructure, WebCrypto ECDH & Pipeline | ✅ **DONE** | 100% |
| **Phase 4A**| Admin CMS, KDS Kanban, Table Zones, Menu CRUD & 404 Templates | ✅ **DONE** | 100% |
| **Phase 4B**| Route Grouping, Reusable Shell, ROLE Enum & Domain-First Restructure | ✅ **DONE** | 100% |
| **Phase 4C**| **Admin Reports Hub & Cafe Operational Blueprint (POV Cabang)** | ⏳ **IN PROGRESS** | ~75% |
| **Phase 2** | Public QR Menu View, Modifiers Modal, Banners & Table Session | ⬜ **PENDING** | ~10% (carousel saja) |
| **Phase 3** | Pre-Paid Checkout, Dynamic QRIS & Live Order Tracker (WebSocket) | ⬜ **PENDING** | 0% |
| **Phase 5** | Multi-Branch SSO Integration, E2E Testing & PWA Polish | ⬜ **PENDING** | 0% |

---

## ✅ Phase 0: Planning, Architecture & Specification (COMPLETED)
- [x] **0.1. Kumpul Cafe Frontend Architecture Specification** (`docs/fe/architecture/architecture-design.md`)
- [x] **0.2. Multi-Tenant SaaS & Tenant-Aware Routing Specification** (`docs/fe/architecture/multi-tenant-auth-and-routing.md`)
- [x] **0.3. Client-Side ECDH Cryptography Strategy Specification** (`docs/fe/security/client-crypto-strategy.md`)
- [x] **0.4. Kumpul Cafe UI & UX Wireframe Specification** (`docs/fe/wireframe/ui-wireframe-design.md`)
- [x] **0.5. Cafe Branch Operational Blueprint (POV Cabang)** (`docs/fe/architecture/cafe-branch-operational-blueprint.md`)

---

## ✅ Phase 1: Client Infrastructure & Security Foundation (COMPLETED)
- [x] **1.1. Package Dependencies & Tooling Setup** (`zustand`, `@tanstack/react-query`, `lucide-react`, `motion`, `zod`, `tailwind-merge`, `sonner`)
- [x] **1.2. WebCrypto ECDH Service & Zero-Trust Handshake** (`lib/crypto/ecdh.ts` & `lib/api/pipeline/`)
- [x] **1.3. Hardened Pipeline & Interceptors** (`hardenedFetch`, `authMiddleware`, `encryptionMiddleware`, `handshakeMiddleware`, `loggerMiddleware`)
- [x] **1.4. Global Zustand Stores & Providers** (`useAuthStore`, `useTableStore`, `useCartStore`, `useHandshakeStore`, `useSidebarStore`)

---

## ✅ Phase 4A & 4B: Operational CMS, Multi-Role Shell & Domain-First Restructuring (COMPLETED)
- [x] **4.1. Menu Management & Nested Variants** (`src/components/menus/`, `src/app/(dashboard)/admin/menus/`)
- [x] **4.2. Responsive Kitchen Display System (KDS)** (`src/components/orders/`, `src/app/(dashboard)/kitchen/orders/`)
- [x] **4.3. Floor Plan & Table Zone Accordion** (`src/components/tables/`, `src/app/(dashboard)/admin/tables/`)
- [x] **4.4. 404 & Operational Error Templates**
- [x] **4.5. Multi-Role Shell & Navigation Architecture** (`CommonSidebar`, `CommonHeader`, `CommonBottomNav`, `RoleGuard`)
- [x] **4.6. System-Wide `ROLE` & `ROLE_GROUPS` Enum Migration** (`src/lib/constants/roles.ts`)
- [x] **4.7. Domain-First Component Restructuring** (`orders/`, `tables/`, `menus/`, `reports/`, `banners/`, `common/`, `ui/`)
- [x] **4.8. Symmetrical Test Architecture** (`src/components/test/orders/`, `tables/`, `menus/`, `reports/`, `common/`, `ui/`)

---

## ⏳ Phase 4C: Admin Reports Hub & Branch Operational Capabilities (CURRENT FOCUS)

- [x] **4C.1. Laporan & Analitik Penjualan (`/admin/reports`)**
  - KPI Cards (Omset, Transaksi, AOV), Tabel Menu Terlaris (*Top Selling*), Distribusi Status Pesanan, Date Filter Presets, 1-Click Ekspor CSV & Cetak Laporan.
- [x] **4C.2. Integrasi Live Analytics Dashboard Admin (`/admin/dashboard`)**
  - Mengganti data dummy dengan endpoint live backend `GET /admin/reports/dashboard-overview`.
- [x] **4C.4. Quick "Sold-Out" Switch Barista**
  - Saklar 1-tap ketersediaan menu langsung pada tabel `MenuTable` dan `MenuCardsMobile` dengan feedback optimistik.
- [x] **4C.5. Manajemen Shift Kasir & Z-Report (`/admin/shifts`)**
  - Modal input kas modal awal, monitoring arus kas berjalan, rekonsiliasi kas fisik & selisih (*variance*), serta struk thermal Z-Report siap cetak.
  - ✅ **Backend sudah di `main`** (merge 2026-11-23). Kontrak sudah dicocokkan dengan `ShiftItemSchema`. Pelunasan tunai kini wajib ada shift terbuka (`409` jika tidak). Lihat `docs/fe/integration/api-endpoints.md`.
- [ ] **4C.3. Payment Method Breakdown (Rekonsiliasi QRIS vs Tunai)**
  - Pemisahan omset uang digital (QRIS) dan kas fisik (Cash) pada Laporan dan Dashboard.
- [x] **4C.6. Manajemen Akun Staf Cabang (`/admin/staff`)**
  - CRUD staf kasir, chef dapur, pelayan, dan manager dengan role badge, PIN 4-digit untuk clock-in, kontak WhatsApp, dan reset password mandiri.
  - Serah terima shift (2026-11-23, `ShiftHandoverModal`): staf pengganti memasukkan PIN miliknya lewat `POST /auth/handover`, dan sesi (profil **dan** token) diganti dengan sesi baru dari backend; backend mencabut sesi staf yang keluar. Staf yang masih memegang shift kas terbuka wajib menutup shift (Z-Report) lebih dulu (`409 SHIFT_STILL_OPEN`). Butuh backend `feat/shift-handover-pin` (`e048b97`). Sebelumnya modal hanya mengganti profil di store tanpa verifikasi PIN dan tetap memakai token kasir lama, sehingga semua aksi tercatat atas nama kasir lama di backend. Tab "Magic Link" (route `/handover` tidak ada) dihapus.
- [x] **4C.7. Pengaturan Lokasi Cabang, Geofence, Jam Operasional & Mesin Kontingensi (`/admin/settings`)**
  - 3-Way Hybrid Geolocation (1-Tap GPS, Google Maps Link Extractor, Leaflet Interactive Map Picker), Slider Radius Geofence 50m - 500m (field `geofenceRadius`, bukan 100m tetap), Jadwal Operasional Mingguan, Delegasi Shift Sementara, dan Alert Ketidakhadiran Kasir 3-Opsi.
  - Dipecah menjadi sub-halaman: `/admin/settings/branch`, `/admin/settings/policies`, `/admin/settings/shifts`.
- [x] **4C.8. Smart Absensi Geofencing + PIN 4-Digit (`/admin/attendance` & Workstation Clock-In)**
  - Validasi jarak via Haversine terhadap `geofenceRadius` cabang, input PIN Clock-In/Out, pengajuan Ijin/Sakit/Cuti, review lembur, koreksi presensi, dan rekap kehadiran (`src/components/attendance/`, `admin-attendance-api.ts`).
  - Personal auto-lock: staf non-admin hanya bisa absen untuk dirinya sendiri; admin punya mode supervisor.
  - Belum: penolakan GPS dengan akurasi > 50m (disebut di blueprint, belum diimplementasikan).
  - ✅ Review lembur & koreksi presensi, serta respons presensi yang sesuai `AttendanceItemSchema`, sudah ada di `main` backend (`bd31ec6`, merge 2026-11-23). Jam presensi ditampilkan dalam WIB lewat `formatTimeWib()`.
- [ ] **4C.9. Verifikasi Kontak (Email Link & WhatsApp OTP) & Emergency Broadcast Engine**
  - Verifikasi identitas kontak ganda dan broadcast pengumuman darurat multi-channel.
- [ ] **4C.10. Pengaturan Pajak PB1 & Profil Struk (`/admin/settings`)**
  - Konfigurasi tarif PB1, service charge, WiFi kafe, dan footer catatan struk.
- [x] **4C.11. Registrasi Staf via NIK, Distribusi Kredensial & Onboarding Login Pertama (`/onboarding`)**
  - Admin membuat akun + kredensial sementara (`StaffCredentialModal`); staf wajib ganti password & membuat PIN 4-digit di login pertama (`POST /auth/onboard`), lalu diarahkan ke workstation sesuai role.
- [x] **4C.12. Mode Kiosk Presensi di Meja Kasir (`/cashier/kiosk`)**
  - Grid staf, numpad PIN, overlay sukses, dan exit guard. Lihat `docs/fe/architecture/attendance-kiosk-enhancement.md`.
  - ✅ Grid staf & status hadir hari ini memakai `GET /admin/attendance/kiosk-roster` (2026-11-23, ADMIN & CASHIER). Sebelumnya kiosk memanggil `GET /admin/staff` dan `GET /admin/attendance` yang khusus ADMIN, sehingga kosong saat dibuka kasir. Kartu staf tanpa PIN dinonaktifkan ("PIN belum dibuat").
  - ✅ Exit guard memverifikasi PIN kasir lewat `POST /auth/verify-pin` (sudah di `main` backend). Perangkat terkunci di kiosk sampai PIN terverifikasi atau logout. Lihat `docs/fe/integration/api-endpoints.md`.
- [x] **4C.13. Template Shift (`/admin/settings/shifts`)**
  - CRUD template shift + seed default (`admin-shift-templates-api.ts`).
- [x] **4C.14. Hardening hasil audit (2026-11-20)**
  - Fallback mock localStorage pada API staf & shift kini mati secara default (aktif hanya dengan `NEXT_PUBLIC_ENABLE_MOCK_FALLBACK=true`, dan hanya untuk error jaringan/404/501).
  - Exit guard kiosk diverifikasi server-side; redirect onboarding per role; redirect refresh-token gagal ke `/login`; tombol demo login disembunyikan di production; cache React Query dibersihkan saat logout/ganti user; service worker diperbaiki (tidak lagi meng-cache API/cross-origin).
- [ ] **4C.15. Tindak lanjut audit**
  - [x] Kunci navigasi mode kiosk (2026-11-21): `useKioskLockStore` (persist `localStorage`) + `KioskLockGuard` di layout dashboard. Selama terkunci, tombol back, URL yang diketik, dan reload selalu kembali ke `/cashier/kiosk`. Kunci dibuka hanya oleh PIN yang terverifikasi atau logout (tombol "Lupa PIN? Keluar akun & login ulang" di dialog keluar).
  - [ ] Proteksi rute di sisi server (`proxy.ts`) **masih ditunda**. Cookie refresh `menuscan_rt` bersifat host-only di host API dengan `Path=/api/v1/auth`, jadi server Next.js tidak pernah menerimanya, dan access token tetap di `localStorage`. Butuh desain sesi sendiri, mis. proxy API lewat Next.js (opsi B di rencana cookie backend). Cookie penanda yang bisa dipalsukan sengaja tidak dipakai.
  - [x] Logout mencabut sesi di server (2026-11-23): header, bottom-nav, dialog keluar kiosk, modal sesi habis, dan onboarding memanggil `signOutStaff()` → `POST /auth/logout`. Sebelumnya logout hanya menghapus token di browser, sehingga refresh token tetap berlaku di backend sampai 7 hari. Ini juga prasyarat Tahap 2 migrasi cookie.
  - [x] Refresh token di cookie HttpOnly (2026-11-24, bersama backend `feat/refresh-token-cookie` `c10105a`): `credentials: 'include'` untuk endpoint auth, `refreshToken` dihapus dari store & `localStorage` (persist v1), silent refresh dikunci antar tab (Web Lock), logout satu panggilan. Access token masih di `localStorage` (di luar cakupan).
  - [x] Single-flight handshake (2026-11-23): request paralel memakai satu handshake ECDH (`performHandshake` di `src/lib/api/handshake-session.ts`), tidak lagi masing-masing handshake dan saling menimpa sesi.
  - [x] GPS kiosk (2026-11-23): tanpa lokasi GPS, presensi ditolak dan kiosk meminta GPS ulang. Sebelumnya koordinat cabang dikirim sebagai lokasi staf, sehingga cek geofence backend selalu lolos dari mana pun.
  - [x] Tanggal "hari ini" kiosk dalam WIB (2026-11-23): `useWibToday()` / `getTodayWib()`. Sebelumnya tanggal UTC (antara 00:00–07:00 WIB terbaca kemarin) dan tidak berganti jika kiosk menyala melewati tengah malam.
  - [x] Review cakupan role (2026-11-23, mengikuti audit backend): kasir memang boleh membuka KDS; bayar/batal pesanan hanya `ADMIN`/`CASHIER`; CRUD meja & zona hanya `ADMIN`. UI menyembunyikan aksi yang akan ditolak `403`.


---

## 📱 Phase 2: Public Customer QR Experience (NEXT)
- [ ] **2.1. Table Binding & Session Initializer** (`components/public/table-session-modal.tsx`)
- [ ] **2.2. Public Menu & Promo Carousel Components** — *sebagian*: `src/components/banners/promo-carousel.tsx` sudah ada, komponen menu publik belum.
- [ ] **2.3. Public Menu Catalog Page** (`app/(public)/scan/[tableNumber]/page.tsx`)
  - Catatan: route QR publik masih didefinisikan berbeda-beda di docs (`/scan/[tableNumber]`, `/menu?table=`, `/?table=`). Tetapkan satu sebelum implementasi, lalu kembalikan link "Buka Menu" di `src/app/page.tsx`, `src/app/not-found.tsx`, dan `start_url` di `public/manifest.json`.

---

## 💳 Phase 3: Pre-Paid Checkout, Dynamic QRIS & Live Order Tracker
- [ ] **3.1. Checkout Page** (`app/(public)/order/checkout/page.tsx`)
- [ ] **3.2. Dynamic QRIS Payment Modal & Timer** (`components/public/qris-modal.tsx`)
- [ ] **3.3. Real-Time Order Tracking via WebSocket** (`app/(public)/order/status/[orderNumber]/page.tsx`)
  - Catatan: `socket.io-client` sudah terpasang tapi belum dipakai; KDS saat ini polling setiap 10 detik (`use-admin-orders.ts`).

---

## 🌱 Phase 5: Multi-Branch Backend Integration & SSO Rollout
- [ ] **5.1. Backend Prisma Branch Schema & Migration**
- [ ] **5.2. Branch Switching Endpoints (`/api/v1/auth/switch-branch`)**
- [ ] **5.3. Centralized Identity Provider (SSO) Integration**
- [ ] **5.4. Full End-to-End Multi-Tenant Verification**
