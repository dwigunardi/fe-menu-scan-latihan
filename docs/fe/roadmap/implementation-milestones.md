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
| **Phase 4B**| **Route Grouping Restructuring, Reusable Shell & Tenant-Aware Readiness** | ⏳ **IN PROGRESS** | 15% |
| **Phase 2** | Public QR Menu View, Modifiers Modal, Banners & Table Session | ⬜ **PENDING** | 0% |
| **Phase 3** | Pre-Paid Checkout, Dynamic QRIS & Live Order Tracker (WebSocket) | ⬜ **PENDING** | 0% |
| **Phase 5** | Multi-Branch SSO Integration, E2E Testing & PWA Polish | ⬜ **PENDING** | 0% |

---

## ✅ Phase 0: Planning, Architecture & Specification (COMPLETED)

- [x] **0.1. Kumpul Cafe Frontend Architecture Specification**
  - Document: [architecture-design.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/architecture/architecture-design.md)
- [x] **0.2. Multi-Tenant SaaS & Tenant-Aware Routing Specification**
  - Document: [multi-tenant-auth-and-routing.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/architecture/multi-tenant-auth-and-routing.md)
- [x] **0.3. Client-Side ECDH Cryptography Strategy Specification**
  - Document: [client-crypto-strategy.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/security/client-crypto-strategy.md)
- [x] **0.4. Kumpul Cafe UI & UX Wireframe Specification**
  - Document: [ui-wireframe-design.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/wireframe/ui-wireframe-design.md)

---

## ✅ Phase 1: Client Infrastructure & Security Foundation (COMPLETED)

- [x] **1.1. Package Dependencies & Tooling Setup**
  - `zustand`, `@tanstack/react-query`, `lucide-react`, `motion`, `zod`, `clsx`, `tailwind-merge`, `sonner`.
- [x] **1.2. WebCrypto ECDH Service & Zero-Trust Handshake** (`lib/crypto/ecdh.ts` & `lib/api/pipeline/`)
  - Key generation P-256, HKDF derivation, AES-256-GCM encryption/decryption, auto-reauth, silent handshake retry.
- [x] **1.3. Hardened Pipeline & Interceptors**
  - `hardenedFetch`, `authMiddleware`, `encryptionMiddleware`, `handshakeMiddleware`, `loggerMiddleware`.
- [x] **1.4. Global Zustand Stores & Providers**
  - `useAuthStore`, `useTableStore`, `useCartStore`, `useHandshakeStore`, `useSidebarStore`.

---

## ✅ Phase 4A: Operational CMS, KDS & Error UX (COMPLETED)

- [x] **4A.1. Menu Management & Nested Variants** (`app/(admin)/admin/menus/`)
  - Tabel paginasi server-side, kartu mobile, pencarian real-time, filter kategori, form input Rupiah, dan upload gambar terverifikasi.
- [x] **4A.2. Responsive Kitchen Display System (KDS)** (`app/(admin)/admin/orders/`)
  - Tampilan Kanban desktop/tablet dengan `overflow-x`, segmented tabs untuk mobile, dan proteksi drag-and-drop sentuh.
- [x] **4A.3. Floor Plan & Table Zone Accordion** (`app/(admin)/admin/tables/`)
  - Manajemen meja berbasis zona (Indoor, Outdoor, VIP), modal create/edit, reset sesi meja 1-tap, dan unduh QR code meja.
- [x] **4A.4. 404 Not Found Templates dengan Framer Motion**
  - `src/app/not-found.tsx` (Publik: Cangkir Kopi Animasi SVG + Uap Bergerak).
  - `src/app/(admin)/admin/not-found.tsx` (Admin: Kartu Laporan Insiden + Path Aktif).
  - `src/components/common/operational-not-found.tsx` (Workstation KDS & Kasir).

---

## ⏳ Phase 4B: Route Grouping Restructuring, Reusable Shell & Tenant-Aware Readiness (CURRENT FOCUS)

- [ ] **4B.1. Route Grouping Realignment** (`src/app/`)
  - Memindahkan route ke grup semantik:
    - `src/app/(auth)/login/page.tsx` (`/login` -> Universal Staff Login)
    - `src/app/(auth)/select-branch/page.tsx` (`/select-branch` -> Multi-Branch Selector)
    - `src/app/(dashboard)/kitchen/orders/page.tsx` (`/kitchen/orders` -> KDS Dapur)
    - `src/app/(dashboard)/cashier/tables/page.tsx` (`/cashier/tables` -> Kasir & Meja)
    - `src/app/(dashboard)/waiter/tables/page.tsx` (`/waiter/tables` -> Pelayan & Meja)
    - `src/app/(dashboard)/admin/...` (`/admin/*` -> Owner & Manager Dashboard)
- [ ] **4B.2. Reusable Shell & Navigation Architecture** (`src/components/common/`)
  - `CommonSidebar`: Komponen sidebar dinamis berdasarkan `user.role` dan permissions.
  - `CommonHeader`: Header terpusat dengan `BranchSwitcher` dropdown, theme switcher, dan profil staf.
  - `CommonBottomNav`: Navigasi bawah responsif mobile yang otomatis menyesuaikan role aktif.
  - `RoleGuard`: Guard pelindung URL berdasarkan hak akses role.
- [ ] **4B.3. Unit Testing Reorganization (`test/` Mirroring)**
  - Reorganisasi seluruh unit test lama (`*.spec.ts*`) ke folder `test/` yang mereplikasi path file sumber:
    - `src/components/test/...`
    - `src/app/test/...`
    - `src/hooks/test/...`
    - `src/lib/test/...`
    - `src/store/test/...`
- [ ] **4B.4. Tenant-Aware Store & Pipeline Preparation (Mock Ready)**
  - Penambahan field `activeBranch` dan `availableBranches` pada `useAuthStore`.
  - Injeksi otomatis header `X-Branch-ID` pada pipeline fetch client.

---

## 📱 Phase 2: Public Customer QR Experience (NEXT)

- [ ] **2.1. Reusable Primitive UI Components** (`components/ui/`)
- [ ] **2.2. Table Binding & Session Initializer** (`components/public/table-session-modal.tsx`)
- [ ] **2.3. Public Menu & Promo Carousel Components** (`components/public/`)
- [ ] **2.4. Public Menu Page Assembly** (`app/(public)/menu/page.tsx`)

---

## 💳 Phase 3: Pre-Paid Checkout, Dynamic QRIS & Live Order Tracker

- [ ] **3.1. Checkout Page** (`app/(public)/order/checkout/page.tsx`)
- [ ] **3.2. Dynamic QRIS Payment Modal & Timer** (`components/public/qris-modal.tsx`)
- [ ] **3.3. Real-Time Order Tracking** (`app/(public)/order/status/[orderNumber]/page.tsx`)

---

## 🌱 Phase 5: Multi-Branch Backend Integration & SSO Rollout

- [ ] **5.1. Backend Prisma Branch Schema & Migration**
- [ ] **5.2. Branch Switching Endpoints (`/api/v1/auth/switch-branch`)**
- [ ] **5.3. Centralized Identity Provider (SSO) Integration**
- [ ] **5.4. Full End-to-End Multi-Tenant Verification**
