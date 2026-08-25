# Kumpul Cafe Frontend Implementation Milestones & Roadmap

> **Project**: Kumpul Cafe – Digital QR Code Menu System & Multi-Branch FnB SaaS Platform  
> **Brand Name**: Kumpul Cafe  
> **Backend Integration**: NestJS 11 (`http://localhost:5000/api/v1`) + WebSocket (`http://localhost:5000/events`)  
> **Framework**: Next.js 16 (App Router, TypeScript)  
> **Styling & Motion**: Tailwind CSS v4 + Framer Motion (`motion` v12)  
> **Data Fetching**: `@tanstack/react-query` (v5) + Native `customFetch` + Pipeline Interceptors  
> **Security Standard**: WebCrypto API (P-256 ECDH + AES-256-GCM Zero-Trust)  
> **Document Location**: `docs/fe/roadmap/implementation-milestones.md`  
> **Status**: Active Frontend Roadmap Tracking Document  

---

## 📊 Overview Progress Summary

| Phase | Description | Status | Completion |
| :--- | :--- | :---: | :---: |
| **Phase 0** | Planning, Architecture & Multi-Tenant Specification | ✅ **DONE** | 100% |
| **Phase 1** | Client Infrastructure, WebCrypto ECDH & Pipeline | ✅ **DONE** | 100% |
| **Phase 4A**| Admin CMS, KDS Kanban, Table Zones, Menu CRUD & 404 Templates | ✅ **DONE** | 100% |
| **Phase 4B**| Route Grouping, Reusable Shell, ROLE Enum & Domain-First Restructure | ✅ **DONE** | 100% |
| **Phase 4C**| **Admin Reports Hub & Cafe Operational Blueprint (POV Cabang)** | ⏳ **IN PROGRESS** | 50% |
| **Phase 2** | Public QR Menu View, Modifiers Modal, Banners & Table Session | ⬜ **PENDING** | 0% |
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
- [ ] **4C.3. Payment Method Breakdown (Rekonsiliasi QRIS vs Tunai)**
  - Pemisahan omset uang digital (QRIS) dan kas fisik (Cash) pada Laporan dan Dashboard.
- [ ] **4C.6. Manajemen Akun Staf Cabang (`/admin/staff`)**
  - CRUD staf kasir, chef dapur, dan pelayan dengan role badge dan reset password mandiri.
- [ ] **4C.7. Pengaturan Pajak PB1 & Profil Struk (`/admin/settings`)**
  - Konfigurasi tarif PB1, service charge, WiFi kafe, dan footer catatan struk.


---

## 📱 Phase 2: Public Customer QR Experience (NEXT)
- [ ] **2.1. Table Binding & Session Initializer** (`components/public/table-session-modal.tsx`)
- [ ] **2.2. Public Menu & Promo Carousel Components** (`src/components/banners/promo-carousel.tsx`)
- [ ] **2.3. Public Menu Catalog Page** (`app/(public)/scan/[tableNumber]/page.tsx`)

---

## 💳 Phase 3: Pre-Paid Checkout, Dynamic QRIS & Live Order Tracker
- [ ] **3.1. Checkout Page** (`app/(public)/order/checkout/page.tsx`)
- [ ] **3.2. Dynamic QRIS Payment Modal & Timer** (`components/public/qris-modal.tsx`)
- [ ] **3.3. Real-Time Order Tracking via WebSocket** (`app/(public)/order/status/[orderNumber]/page.tsx`)

---

## 🌱 Phase 5: Multi-Branch Backend Integration & SSO Rollout
- [ ] **5.1. Backend Prisma Branch Schema & Migration**
- [ ] **5.2. Branch Switching Endpoints (`/api/v1/auth/switch-branch`)**
- [ ] **5.3. Centralized Identity Provider (SSO) Integration**
- [ ] **5.4. Full End-to-End Multi-Tenant Verification**
