# Kumpul Cafe Frontend System Architecture Specification

> **Project**: Kumpul Cafe – Digital QR Code Menu System & Progressive Web App (PWA)  
> **Brand Name**: Kumpul Cafe  
> **Backend Integration**: NestJS 11 (`http://localhost:5000/api/v1`) + WebSocket (`http://localhost:5000/events`)  
> **Framework**: Next.js 16 (App Router, TypeScript)  
> **Styling**: Tailwind CSS v4  
> **State Management**: Zustand (Auth, Handshake Session, Table Session, Cart, Sidebar)  
> **Data Fetching & Cache**: `@tanstack/react-query` (v5) + Native `hardenedFetch` & Interceptor Pipeline  
> **Real-Time Client**: `socket.io-client` (WebSockets)  
> **Security Standard**: WebCrypto API (P-256 ECDH + AES-256-GCM Zero-Trust Encryption)  
> **Document Location**: `docs/fe/architecture/architecture-design.md`  
> **Status**: Up-to-Date Architecture Specification  

---

## 🏛️ 1. Architectural Pattern & Design Principles

Sistem Frontend **Kumpul Cafe** mengadopsi **Domain-First Modular Component Architecture, Zero-Trust End-to-End Encryption, Type-Safe Role-Based Access Control, & Real-Time Socket-Driven** di atas **Next.js App Router**:

### Prinsip Utama:
1. **Domain-First Component Architecture**:
   - Seluruh komponen UI dikelompokkan berdasarkan **Domain Bisnis** (`orders/`, `tables/`, `menus/`, `reports/`, `banners/`, `common/`, `ui/`).
   - Komponen bersama (*shared*) seperti `OrdersView` (dipakai Admin & Dapur) dan `TablesView` (dipakai Admin, Kasir, & Pelayan) bersifat netral tanpa terkunci di folder admin.
   - Setiap folder domain dilengkapi **Barrel Export (`index.ts`)** untuk kemudahan import bersih dan modular.
2. **Server vs. Client Component Boundaries**:
   - **Server Components (RSC)**: Layouting dasar, dynamic metadata, dan static shell rendering.
   - **Client Components ('use client')**: Komponen interaktif (Zustand, React Query, WebSockets, WebCrypto API, Form validation).
3. **Zero-Trust Payload Encryption & Interceptor Pipeline**:
   - Request dan Response otomatis melewati **Onion-Style Middleware Pipeline** (`loggerMiddleware` $\rightarrow$ `authMiddleware` $\rightarrow$ `handshakeMiddleware` $\rightarrow$ `encryptionMiddleware`).
   - Enkripsi AES-256-GCM dengan *Native WebCrypto API* (`window.crypto.subtle`) dan auto-retry token expiry.
4. **Type-Safe Role-Based Access Control (RBAC)**:
   - Menggunakan konstanta terpusat `ROLE` dan `ROLE_GROUPS` (`src/lib/constants/roles.ts`) untuk memvalidasi hak akses `ADMIN`, `CASHIER`, `KITCHEN`, dan `WAITER` pada level route dan komponen via `<RoleGuard>`.
5. **Real-Time WebSockets (`socket.io-client`)**:
   - Menerima push event `order:status-changed` instan ke KDS dapur, kasir, dan smartphone pelanggan.

---

## 📁 2. Complete Directory Structure (`src/`)

```text
src/
├── app/                             # Next.js App Router Pages & Routes
│   ├── (auth)/                      # Grouping Route Auth (Clean URLs)
│   │   ├── login/page.tsx           # /login -> Universal Staff Login
│   │   └── select-branch/page.tsx   # /select-branch -> Branch Selection
│   │
│   ├── (public)/                    # Grouping Route Publik (Pelanggan via QR Code)
│   │   ├── scan/[tableNumber]/      # /scan/01 -> Dynamic Table QR Scan Landing
│   │   └── layout.tsx               # Public Mobile-First Shell Layout
│   │
│   ├── (dashboard)/                 # Grouping Route Internal Portal & Operasional (RBAC)
│   │   ├── admin/                   # /admin/* -> Owner & Branch Manager Scope
│   │   │   ├── dashboard/page.tsx   # Dashboard Omset & Live Analytics
│   │   │   ├── reports/page.tsx     # Hub Laporan & Analitik Penjualan (+ CSV/Print Export)
│   │   │   ├── menus/               # /admin/menus (List, Create, Edit [id], Detail [id])
│   │   │   ├── categories/page.tsx  # /admin/categories -> Manajemen Kategori
│   │   │   ├── tables/page.tsx      # /admin/tables -> Manajemen Meja & Zona
│   │   │   ├── orders/page.tsx      # /admin/orders -> Log Riwayat Pesanan
│   │   │   └── banners/             # /admin/banners (List, Create, Edit [id])
│   │   │
│   │   ├── kitchen/                 # /kitchen/* -> Kitchen Staff Scope
│   │   │   └── orders/page.tsx      # /kitchen/orders -> Live Kitchen Display System (KDS)
│   │   │
│   │   ├── cashier/                 # /cashier/* -> Cashier Staff Scope
│   │   │   └── tables/page.tsx      # /cashier/tables -> Denah Meja & Kasir POS
│   │   │
│   │   ├── waiter/                  # /waiter/* -> Waiter Staff Scope
│   │   │   └── tables/page.tsx      # /waiter/tables -> Denah Meja Pelayan
│   │   │
│   │   ├── not-found.tsx            # Dashboard Operational Error Card 404
│   │   └── layout.tsx               # Reusable Shell (CommonHeader + CommonSidebar + BottomNav)
│   │
│   ├── not-found.tsx                # Global Public 404 (Animated Coffee Cup)
│   ├── layout.tsx                   # Root Application Layout & Global Providers
│   ├── globals.css                  # Global Tailwind CSS v4 Directives
│   └── page.tsx                     # Landing / Public Redirect Page
│
├── components/                      # Domain-First UI Components
│   ├── orders/                      # Domain Pesanan (Shared: Admin & Kitchen)
│   │   ├── order-card.tsx           # Kartu Tiket Pesanan dengan Audio Alert & Cooking Notes
│   │   ├── order-receipt-modal.tsx  # Modal Struk & Nota Digital
│   │   ├── orders-view.tsx          # Shared Kanban & Live Monitoring Pesanan
│   │   └── index.ts                 # Barrel Export
│   │
│   ├── tables/                      # Domain Meja (Shared: Admin, Cashier, Waiter)
│   │   ├── tables-view.tsx          # Shared Floor Plan Denah Meja Berbasis Zona
│   │   ├── table-form-modal.tsx     # Modal Create/Edit Meja & Tipe Kursi
│   │   ├── table-qr-modal.tsx       # Modal Preview & Unduh QR Code Meja
│   │   ├── table-reset-modal.tsx    # Modal 1-Tap Reset Sesi Meja
│   │   ├── table-delete-modal.tsx   # Modal Konfirmasi Hapus Meja
│   │   ├── zone-manager-modal.tsx   # Modal Kelola Zona Kafe (Indoor, Outdoor, VIP)
│   │   └── index.ts                 # Barrel Export
│   │
│   ├── menus/                       # Domain Katalog & Form Menu
│   │   ├── menu-table.tsx           # Tabel Katalog Menu Desktop
│   │   ├── menu-cards-mobile.tsx    # Tampilan Kartu Menu Responsif Mobile
│   │   ├── menu-form.tsx            # Form Menu Lengkap + Nested Variant Matrix
│   │   ├── menu-filter-bar.tsx      # Search Bar & Filter Kategori
│   │   ├── category-manager-modal.tsx # Modal Kelola Kategori
│   │   └── index.ts                 # Barrel Export
│   │
│   ├── reports/                     # Domain Laporan & Analitik
│   │   ├── report-date-filter.tsx   # Filter Tanggal (Hari Ini, 7d, Bulan Ini, Kustom)
│   │   ├── revenue-summary-cards.tsx# KPI Cards (Omset, Transaksi, AOV) + Skeletons
│   │   ├── top-selling-table.tsx    # Tabel Peringkat Menu Terlaris (Gold/Silver Badges)
│   │   ├── orders-status-breakdown.tsx # Distribusi Status Pesanan (PAID, CANCELLED)
│   │   ├── export-report-button.tsx # 1-Click Ekspor CSV & Cetak Laporan PDF
│   │   └── index.ts                 # Barrel Export
│   │
│   ├── banners/                     # Domain Banner Promo (Admin & Public)
│   │   ├── banner-card.tsx          # Kartu Banner Preview 16:9
│   │   ├── banner-form.tsx          # Form Tambah/Edit Banner
│   │   ├── banner-image-uploader.tsx# Uploader Gambar Banner & Preset Gallery
│   │   ├── promo-carousel.tsx       # Carousel Promo Publik Pelanggan
│   │   └── index.ts                 # Barrel Export
│   │
│   ├── common/                      # Cross-Cutting Reusable Components
│   │   ├── role-guard.tsx           # Guard URL & Komponen Berbasis Role
│   │   ├── auth-guard.tsx           # Guard Autentikasi Pengguna
│   │   ├── common-sidebar.tsx       # Sidebar Navigasi Dinamis Multi-Role
│   │   ├── common-header.tsx        # Header Terpusat & Profil Staf
│   │   ├── common-bottom-nav.tsx    # Bottom Navigation Responsif Mobile
│   │   ├── confirmation-dialog.tsx  # Dialog Konfirmasi Aksi Destruktif
│   │   ├── error-boundary.tsx       # React Error Boundary
│   │   ├── operational-not-found.tsx# Fallback Halaman Operasional
│   │   ├── pagination.tsx           # Komponen Paginasi Server-Side
│   │   ├── session-expired-modal.tsx# Modal Auto Re-Auth saat Sesi Habis
│   │   └── index.ts                 # Barrel Export
│   │
│   ├── ui/                          # Atom / Primitive Components (Shadcn + Radix)
│   │   ├── app-image.tsx            # Optimized Next/Image Wrapper with Fallbacks
│   │   ├── button.tsx, dialog.tsx, input.tsx, select.tsx, switch.tsx, table.tsx, dll.
│   │   └── index.ts                 # Barrel Export
│   │
│   └── test/                        # Symmetrical Unit Test Suite (Vitest)
│       ├── orders/                  # Unit tests for orders domain
│       ├── tables/                  # Unit tests for tables domain
│       ├── menus/                   # Unit tests for menus domain
│       ├── reports/                 # Unit tests for reports domain
│       ├── common/                  # Unit tests for common components
│       ├── ui/                      # Unit tests for ui components
│       └── illustrations/           # Unit tests for SVG illustrations
│
├── hooks/                           # Custom React & Query Hooks
│   ├── queries/                     # TanStack Query Data Fetching Hooks
│   │   ├── use-admin-reports.ts     # Overview, Revenue, Top Selling Queries
│   │   ├── use-admin-orders.ts      # Paginated Orders & Status Mutation
│   │   ├── use-admin-menus.ts       # Menus CRUD & Availability Toggle
│   │   ├── use-admin-categories.ts  # Categories CRUD & Reorder
│   │   ├── use-admin-tables.ts      # Tables CRUD & 1-Tap Reset
│   │   └── use-admin-banners.ts     # Banners CRUD & Toggle Status
│   │
│   ├── use-audio-chime.ts           # Hook Pemutar Audio Notifikasi Pesanan
│   └── use-handshake.ts             # Hook Inisialisasi Kriptografi ECDH
│
├── lib/                             # Core Infrastructure & Utilities
│   ├── api/                         # API Client & Interceptor Pipeline
│   │   ├── pipeline/                # Onion Middleware Pipeline
│   │   │   ├── pipeline-runner.ts   # Interceptor Execution Runner
│   │   │   ├── auth-middleware.ts   # JWT Bearer Token Injection
│   │   │   ├── handshake-middleware.ts # Handshake Token Resolver
│   │   │   ├── encryption-middleware.ts# AES-256-GCM Zero-Trust Encryptor
│   │   │   └── logger-middleware.ts # Structured Step Logger
│   │   ├── hardened-fetch.ts        # Type-Safe Fetcher with Runtime Zod Validation
│   │   ├── admin-reports-api.ts     # Reports API Calls
│   │   ├── admin-orders-api.ts      # Orders API Calls
│   │   ├── admin-menus-api.ts       # Menus API Calls
│   │   ├── admin-tables-api.ts      # Tables API Calls
│   │   ├── admin-banners-api.ts     # Banners API Calls
│   │   ├── auth-api.ts              # Login & Refresh Token API Calls
│   │   └── either.ts                # Functional Either<ApiError, T> Pattern
│   │
│   ├── constants/                   # System-Wide Constants
│   │   └── roles.ts                 # ROLE Enum, USER_ROLE, ROLE_GROUPS
│   │
│   ├── crypto/                      # WebCrypto Encryption Service (P-256 ECDH)
│   ├── validations/                 # Zod Schemas (Contract Types)
│   │   ├── reports.schema.ts
│   │   ├── order.schema.ts
│   │   ├── table.schema.ts
│   │   ├── admin-menu.schema.ts
│   │   └── auth.schema.ts
│   │
│   └── utils/                       # Utility Functions
│       ├── format-currency.ts       # Indonesian Rupiah Formatter
│       ├── date-helpers.ts          # Date Range & Indonesian Date Formatter
│       └── cn.ts                    # ClassNames Merger
│
└── store/                           # Global State Management (Zustand)
    ├── use-auth-store.ts            # Staf User, AccessToken, RefreshToken, Permissions
    ├── use-handshake-store.ts       # SessionKey & HandshakeToken
    ├── use-cart-store.ts            # Keranjang Pesanan Pelanggan
    └── use-sidebar-store.ts         # Status Sidebar (Expand / Collapse)
```

---

## 🔒 3. Keamanan & Role Access Strategy (`src/lib/constants/roles.ts`)

Seluruh autentikasi dan otorisasi dikendalikan oleh konstanta terpusat tipe-aman:

```typescript
export const ROLE = {
  ADMIN: 'ADMIN',
  CASHIER: 'CASHIER',
  KITCHEN: 'KITCHEN',
  WAITER: 'WAITER',
  // Localized Synonyms
  KASIR: 'KASIR',
  DAPUR: 'DAPUR',
  PELAYAN: 'PELAYAN',
} as const;

export const ROLE_GROUPS = {
  ADMIN_ONLY: [ROLE.ADMIN],
  KITCHEN_OR_ADMIN: [ROLE.KITCHEN, ROLE.DAPUR, ROLE.ADMIN],
  CASHIER_OR_ADMIN: [ROLE.CASHIER, ROLE.KASIR, ROLE.ADMIN],
  WAITER_OR_ADMIN: [ROLE.WAITER, ROLE.PELAYAN, ROLE.ADMIN],
  ALL_STAFF: [ROLE.ADMIN, ROLE.CASHIER, ROLE.KITCHEN, ROLE.WAITER],
} as const;
```

---

## 🔗 4. Dokumen Terkait

- 📄 Blueprint Operasional Cabang Kafe: [cafe-branch-operational-blueprint.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/architecture/cafe-branch-operational-blueprint.md)
- 📄 Spesifikasi Enkripsi Kriptografi Client: [client-crypto-strategy.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/security/client-crypto-strategy.md)
- 📄 Milestones & Roadmap Frontend: [implementation-milestones.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/roadmap/implementation-milestones.md)
