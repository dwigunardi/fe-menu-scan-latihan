# ☕ Kumpul Cafe — Frontend

Aplikasi frontend untuk **Kumpul Cafe**: menu digital via QR code, POS multi-role (Admin, Kasir, Dapur, Pelayan), Kitchen Display System (KDS), presensi staf, dan dashboard analitik cabang.

> **Catatan Next.js:** Proyek ini memakai **Next.js 16**, yang API dan konvensinya berbeda dari versi sebelumnya. Sebelum menulis kode, cek panduan di `node_modules/next/dist/docs/` (lihat [AGENTS.md](AGENTS.md)).

---

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Prasyarat](#prasyarat)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Peran & Rute](#peran--rute)
- [Struktur Proyek](#struktur-proyek)
- [Alur Request API](#alur-request-api)
- [Testing](#testing)
- [Checklist Sebelum Commit / PR](#checklist-sebelum-commit--pr)
- [Dokumentasi](#dokumentasi)

---

## Tech Stack

| Area | Library |
| :--- | :--- |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling & UI | Tailwind CSS v4, Radix UI primitives (gaya shadcn), `lucide-react`, `motion` |
| State | Zustand (auth, handshake session, cart, table, sidebar, theme, PWA) |
| Data fetching | TanStack Query v5 di atas transport `hardenedFetch` internal |
| Form & validasi | `react-hook-form` + Zod v4 (validasi kontrak request/response saat runtime) |
| Keamanan | WebCrypto API — handshake ECDH P-256 + enkripsi payload AES-256-GCM |
| Lainnya | Leaflet (peta geofence cabang), `qrcode.react` (QR meja), `socket.io-client`, `sonner` (toast), `pino` (logging) |
| Testing | Vitest + React Testing Library + happy-dom + MSW |

---

## Prasyarat

- **Node.js ≥ 20.9** (syarat minimum Next.js 16)
- **npm** (repo memakai `package-lock.json`)
- Backend API Kumpul Cafe berjalan secara lokal (default `http://localhost:5000/api/v1`) atau akses ke environment remote

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Buat file environment (lihat bagian di bawah)
#    lalu isi .env.local

# 3. Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000), lalu masuk lewat **Portal Staf** (`/login`). Setelah login, pengguna diarahkan otomatis sesuai perannya (lihat [Peran & Rute](#peran--rute)). Staf yang baru pertama kali login akan melewati `/onboarding` terlebih dahulu.

---

## Environment Variables

Buat file `.env.local` di root proyek. File `.env*` sudah di-ignore oleh git — **jangan commit secret**.

```dotenv
# Base URL backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1

# Shared secret untuk derivasi session key ECDH — harus sama dengan konfigurasi backend
NEXT_PUBLIC_APP_SECRET=<minta ke tim backend>

# Opsional (development saja):
# NEXT_PUBLIC_ENABLE_MOCK_FALLBACK=true   # data mock staf/shift saat backend tidak tersedia
# NEXT_PUBLIC_SHOW_DEMO_LOGIN=true        # tampilkan tombol demo login di build production
```

| Variabel | Wajib | Default jika kosong | Dipakai di |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | Ya | `http://localhost:5000/api/v1` | [pipeline-runner.ts](src/lib/api/pipeline/pipeline-runner.ts), [handshake-session.ts](src/lib/api/handshake-session.ts) |
| `NEXT_PUBLIC_ENABLE_MOCK_FALLBACK` | Tidak | mati | [mock-fallback.ts](src/lib/api/mock-fallback.ts). Jika `true`, API staf & shift memakai data mock di `localStorage` **hanya** saat backend tidak terjangkau (error jaringan/404/501). **Jangan aktifkan di production.** |
| `NEXT_PUBLIC_SHOW_DEMO_LOGIN` | Tidak | mati | [login/page.tsx](src/app/%28auth%29/login/page.tsx). Tombol demo login selalu tampil di `npm run dev`, dan disembunyikan di build production kecuali variabel ini `true`. |
| `NEXT_PUBLIC_APP_SECRET` | Ya | Nilai fallback khusus dev | [ecdh.ts](src/lib/crypto/ecdh.ts) |

> Jika `NEXT_PUBLIC_APP_SECRET` tidak cocok dengan backend, handshake tetap berjalan tetapi seluruh request terenkripsi akan gagal didekripsi.

Host gambar remote yang diizinkan (backend lokal port 5000, `api.kumpulcaffe.my.id`, dll.) diatur di [next.config.ts](next.config.ts).

---

## Scripts

| Perintah | Fungsi |
| :--- | :--- |
| `npm run dev` | Development server di port 3000 |
| `npm run build` | Build produksi |
| `npm start` | Menjalankan hasil build produksi |
| `npm run lint` | ESLint |
| `npm test` | Menjalankan seluruh test sekali (`vitest run`) |
| `npm run test:watch` | Vitest dalam mode watch |
| `npm run test:coverage` | Test + laporan coverage (output di `coverage/`) |
| `npx tsc --noEmit` | Type-check tanpa build |

---

## Peran & Rute

Akses halaman dibatasi oleh `AuthGuard` dan `RoleGuard`. Definisi peran ada di [roles.ts](src/lib/constants/roles.ts) dan menu navigasi per peran ada di [navigation.ts](src/lib/constants/navigation.ts). Backend bisa mengirim nama peran versi Indonesia (`KASIR`, `DAPUR`, `PELAYAN`) — keduanya diperlakukan setara.

| Peran | Halaman awal setelah login | Halaman lain |
| :--- | :--- | :--- |
| **ADMIN** | `/admin/dashboard` | `/admin/menus`, `/admin/categories`, `/admin/tables`, `/admin/orders`, `/admin/shifts`, `/admin/attendance`, `/admin/staff`, `/admin/reports`, `/admin/banners`, `/admin/settings` (cabang, kebijakan toko, template shift) |
| **CASHIER / KASIR** | `/cashier/tables` | `/cashier/kiosk` (mode kiosk presensi di meja kasir), `/admin/shifts`, `/kitchen/orders` |
| **KITCHEN / DAPUR** | `/kitchen/orders` | — |
| **WAITER / PELAYAN** | `/waiter/tables` | — |

Rute publik pelanggan (scan QR → menu → checkout QRIS) berada di route group `(public)` dan **belum diimplementasikan** — lihat Phase 2 & 3 di [roadmap](docs/fe/roadmap/implementation-milestones.md).

---

## Struktur Proyek

```text
src/
├── app/                    # App Router
│   ├── (auth)/login/       # Login staf
│   ├── (dashboard)/        # Halaman terproteksi: admin/, cashier/, kitchen/, waiter/
│   ├── (public)/           # Halaman pelanggan (QR menu) — dalam pengembangan
│   ├── onboarding/         # Onboarding login pertama staf
│   └── test/               # Test untuk halaman
├── components/             # Dikelompokkan per domain
│   ├── ui/                 # Primitif UI (button, dialog, select, …)
│   ├── common/             # Shell & guard: sidebar, header, bottom nav, AuthGuard, RoleGuard
│   ├── attendance/  banners/  kiosk/  menus/  orders/
│   ├── reports/  settings/  shifts/  staff/  tables/
│   └── test/               # Test komponen (mirror struktur domain)
├── hooks/
│   └── queries/            # Hook TanStack Query per domain (use-admin-*.ts)
├── lib/
│   ├── api/                # Fungsi API per domain + transport, error, Either
│   │   └── pipeline/       # Middleware: logger → auth → handshake → encryption
│   ├── crypto/             # ECDH + AES-GCM (WebCrypto)
│   ├── validations/        # Skema Zod per domain
│   ├── constants/          # Peran, navigasi, konstanta presensi & cabang
│   ├── utils/              # Helper (currency, tanggal, haversine, parser gmaps, …)
│   └── query-keys.ts       # Factory query key terpusat
├── providers/              # Query, theme, toaster, handshake, PWA
├── store/                  # Zustand stores
└── test/                   # Setup Vitest, handler MSW, test utils
```

Test diletakkan di folder `test/` sejajar dengan kode yang diuji (mis. `src/lib/api/auth-api.ts` → `src/lib/test/api/auth-api.spec.ts`). Alias import `@/` mengarah ke `src/`.

---

## Alur Request API

Setiap pemanggilan API melewati lapisan berikut:

```text
Komponen → Hook React Query (hooks/queries) → Fungsi API domain (lib/api/*-api.ts)
        → api-transport → Pipeline middleware → fetch ke backend
```

Pipeline middleware ([pipeline-runner.ts](src/lib/api/pipeline/pipeline-runner.ts)) berjalan berurutan:

1. **logger** — mencatat request/response
2. **auth** — menyisipkan access token; saat 401, melakukan refresh token sekali (single-flight mutex) lalu mengulang request
3. **handshake** — memastikan session key ECDH sudah ada
4. **encryption** — mengenkripsi body request dan mendekripsi response dengan AES-256-GCM

Fungsi API mengembalikan `Either<ApiError, T>` alih-alih melempar exception, dan response divalidasi dengan Zod. Penjelasan lengkap plus tips debugging ada di [Frontend Developer Handbook §4](docs/fe/guidelines/frontend-development-handbook.md) dan [Interceptor Pipeline Architecture](docs/fe/architecture/interceptor-pipeline-architecture.md).

---

## Testing

```bash
npm test                     # Semua test sekali jalan
npm run test:watch           # Mode watch
npx vitest run src/components/test/kiosk   # Hanya satu folder
npm run test:coverage        # Coverage (v8) → coverage/index.html
```

- Environment: `happy-dom`, setup global di [src/test/setup.ts](src/test/setup.ts)
- Request HTTP di-mock dengan **MSW** — handler default di [src/test/mocks/handlers.ts](src/test/mocks/handlers.ts)
- Gunakan helper render di [src/test/test-utils.tsx](src/test/test-utils.tsx) agar komponen terbungkus provider yang dibutuhkan
- Primitif `src/components/ui/` dikecualikan dari coverage
- **Windows**: jalankan Vitest dari PowerShell/CMD. Di Git Bash, drive terbaca huruf kecil (`d:/`) dan semua suite gagal dengan *"Vitest failed to find the runner"*.

---

## Checklist Sebelum Commit / PR

```bash
npx tsc --noEmit   # 0 type error
npm run lint       # 0 lint error
npm test           # Semua test hijau
```

Konvensi kode, anti-pattern, dan resep membuat fitur baru (endpoint + Zod, hook React Query, halaman ber-`RoleGuard`, form, unit test) ada di **[Frontend Developer Handbook](docs/fe/guidelines/frontend-development-handbook.md)** — wajib dibaca sebelum mulai berkontribusi.

---

## Dokumentasi

Dokumentasi frontend ada di [docs/fe/](docs/fe/). [docs/be/](docs/be/) adalah salinan dokumentasi repo backend untuk referensi; untuk endpoint yang benar-benar dipakai frontend, lihat [API Endpoints](docs/fe/integration/api-endpoints.md).

| Dokumen | Isi |
| :--- | :--- |
| [Frontend Developer Handbook](docs/fe/guidelines/frontend-development-handbook.md) | **Wajib baca.** Aturan folder, resep, anti-pattern, quality gate |
| [Architecture Design](docs/fe/architecture/architecture-design.md) | Arsitektur domain-first, route group, struktur modul |
| [Interceptor Pipeline](docs/fe/architecture/interceptor-pipeline-architecture.md) | Transport 2-lapis, middleware, opsi request, mutex refresh token, fallback mock |
| [API Endpoints](docs/fe/integration/api-endpoints.md) | Daftar endpoint yang dipakai frontend (sumber kebenaran: kode) + perbedaan dengan `docs/be` |
| [Client Crypto Strategy](docs/fe/security/client-crypto-strategy.md) | Handshake ECDH & enkripsi payload |
| [Multi-Tenant Auth & Routing](docs/fe/architecture/multi-tenant-auth-and-routing.md) | Rencana multi-cabang / SaaS |
| [Cafe Branch Operational Blueprint](docs/fe/architecture/cafe-branch-operational-blueprint.md) | Kebutuhan operasional dari sudut pandang kasir, barista, dapur, manajer |
| [Staff & Attendance Blueprint](docs/fe/architecture/staff-and-attendance-blueprint.md) · [Attendance Kiosk](docs/fe/architecture/attendance-kiosk-enhancement.md) | Presensi geofence, PIN, dan mode kiosk |
| [Branch Settings & Geofence](docs/fe/architecture/branch-settings-and-geofence-blueprint.md) | Lokasi cabang, radius geofence, jam operasional |
| [Design System](docs/fe/design/DESIGN.md) · [Admin Design](docs/fe/design/ADMIN_DESIGN.md) | Token warna, tipografi, pola UI |
| [UI Wireframe](docs/fe/wireframe/ui-wireframe-design.md) | Wireframe halaman |
| [Implementation Milestones](docs/fe/roadmap/implementation-milestones.md) | Status fitur per phase |
| [Frontend Integration Guide (BE)](docs/be/integration/frontend-integration-guide.md) | Kontrak integrasi dari sisi backend (snapshot, ada perbedaan dengan kode — lihat API Endpoints) |
