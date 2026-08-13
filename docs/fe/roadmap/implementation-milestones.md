# Kumpul Cafe Frontend Implementation Milestones & Roadmap

> **Project**: Kumpul Cafe – Digital QR Code Menu System & PWA  
> **Brand Name**: Kumpul Cafe  
> **Framework**: Next.js 16 (App Router, TypeScript)  
> **PWA Support**: Web App Manifest, Service Worker Caching, PWA Install Prompt  
> **Data Fetching**: `@tanstack/react-query` (v5) + Native `customFetch`  
> **Document Location**: `docs/fe/roadmap/implementation-milestones.md`  
> **Status**: Active Frontend Roadmap Tracking Document  

---

## 📊 Overview Progress Summary

| Phase | Description | Status | Completion |
| :--- | :--- | :---: | :---: |
| **Phase 0** | Planning, Architecture & Specification | ✅ **DONE** | 100% |
| **Phase 1** | Client Infrastructure, PWA Manifest, Native `customFetch` & Stores | ⏳ **IN PROGRESS** | 0% |
| **Phase 2** | Public QR Menu View UI, PWA Banner & State Integration | ⬜ **PENDING** | 0% |
| **Phase 3** | Admin Dashboard, CRUD & Fast Toggle | ⬜ **PENDING** | 0% |
| **Phase 4** | E2E Integration, PWA Testing, Polish & Verification | ⬜ **PENDING** | 0% |

---

## ✅ Phase 0: Planning, Architecture & Specification (COMPLETED)

- [x] **0.1. Kumpul Cafe Frontend Architecture Specification**
  - Document: [architecture-design.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/architecture/architecture-design.md)
  - Detail struktur folder `src/`, Server vs Client components, PWA structure, Native `customFetch` + TanStack React Query.
- [x] **0.2. Client-Side ECDH Cryptography Strategy Specification**
  - Document: [client-crypto-strategy.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/security/client-crypto-strategy.md)
  - Spesifikasi WebCrypto P-256, HKDF, AES-256-GCM, Native `customFetch` & Silent Re-Handshake.
- [x] **0.3. Kumpul Cafe UI & UX Wireframe Specification**
  - Document: [ui-wireframe-design.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/wireframe/ui-wireframe-design.md)
  - Layout mobile-first QR menu Kumpul Cafe (Coffee, Cake, Beverages, Fast Food, Local Food) & PWA Install Banner.
- [x] **0.4. Frontend Roadmap Specification**
  - Document: [implementation-milestones.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/roadmap/implementation-milestones.md)

---

## 🛡️ Phase 1: Client Infrastructure, PWA Setup, Native `customFetch` & Stores

- [ ] **1.1. Package Dependencies Setup**
  - Install `zustand`, `@tanstack/react-query`, `lucide-react`, `react-hook-form`, `@hookform/resolvers`, `zod`, `qrcode.react`, `clsx`, `tailwind-merge`.
- [ ] **1.2. PWA Web App Manifest & Service Worker Setup** (`public/`)
  - File `public/manifest.json` (Kumpul Cafe theme color `#f59e0b`, standalone display, app icons).
  - File `public/sw.js` (Service Worker caching: Stale-While-Revalidate untuk assets, Cache-First untuk gambar menu).
  - Component Provider `providers/pwa-provider.tsx` & helper `lib/pwa/register-sw.ts`.
- [ ] **1.3. WebCrypto ECDH Service Implementation** (`lib/crypto/ecdh.ts`)
  - Generasi P-256 Keypair, HKDF SHA-256 derivation, & AES-256-GCM encrypt/decrypt helper via `window.crypto.subtle`.
- [ ] **1.4. Handshake & Auth Stores** (`store/`)
  - `useHandshakeStore` (Menyimpan `sessionKey` & `handshakeToken` di RAM).
  - `useAuthStore` (Menyimpan `accessToken`, `refreshToken`, user profile).
  - `usePwaStore` (Menyimpan PWA install prompt event `beforeinstallprompt` & status koneksi internet).
- [ ] **1.5. Encrypted Native `fetch` Wrapper** (`lib/api/custom-fetch.ts`)
  - Auto-encrypt request payload JSON & attach `x-handshake-token`.
  - Auto-decrypt response payload & handle `401 HANDSHAKE_EXPIRED` silent auto-retry.

---

## 📱 Phase 2: Public QR Menu View UI, PWA Banner & State Integration

- [ ] **2.1. Reusable Primitive UI Components** (`components/ui/`)
  - Button, Input, Modal, Drawer, Badge, Skeleton, Switch.
- [ ] **2.2. PWA UI Components** (`components/pwa/`)
  - `PwaInstallerBanner` (Banner ajakan install PWA Kumpul Cafe).
  - `OfflineBanner` (Indikator status koneksi offline/online).
- [ ] **2.3. Public Menu Components (Kumpul Cafe)** (`components/public/`)
  - `CategoryTabs` (Horizontal scroll tab kategori: Coffee, Cake, Beverages, Fast Food, Local Food).
  - `MenuCard` (Card item menu dengan foto, harga IDR, status ketersediaan).
  - `MenuDetailModal` (Modal detail item menu).
  - `CartDrawer` & `useCartStore` (Drawer pilihan menu sementara).
  - `SearchBar` (Search insensitif).
- [ ] **2.4. Public Menu Page Integration** (`app/(public)/menu/page.tsx`)
  - TanStack React Query integration (`usePublicCategories`, `usePublicMenus`) via `customFetch`.
  - Handling loading skeleton & empty state.

---

## 🖥️ Phase 3: Admin Dashboard, CRUD & Fast Toggle

- [ ] **3.1. Admin Authentication Page** (`app/(admin)/admin/login/page.tsx`)
  - Login Form Kumpul Cafe Admin dengan validasi Zod & `useAuthStore` integration.
  - Route Guard / Protected Admin Layout.
- [ ] **3.2. Admin Category Management** (`app/(admin)/admin/categories/page.tsx`)
  - Tabel Kategori (Coffee, Cake, dll), Modal Tambah/Edit Kategori, Delete confirmation.
- [ ] **3.3. Admin Menu Items Management** (`app/(admin)/admin/menus/page.tsx`)
  - Tabel Menu Items Kumpul Cafe dengan pagination offset & filter kategori.
  - Modal Tambah/Edit Item Menu.
  - **Fast Availability Toggle Switch** dengan TanStack React Query *Optimistic Update*.
- [ ] **3.4. QR Code Generator Component** (`components/admin/qr-generator-modal.tsx`)
  - Print & Download QR Code Meja Kumpul Cafe.

---

## 🌱 Phase 4: E2E Integration, PWA Testing, Polish & Verification

- [ ] **4.1. Full Encrypted End-to-End Testing**
  - Verifikasi komunikasi terenkripsi dari FE Next.js (`customFetch`) ke BE NestJS.
- [ ] **4.2. PWA Audit & Offline Verification**
  - Verifikasi Lighthouse PWA Score, installability ke Android/iOS/Desktop, dan offline menu fallback.
- [ ] **4.3. UI/UX Polish & Responsive Verification**
  - Verifikasi tema warm amber Kumpul Cafe pada layar smartphone dan Desktop Admin.
- [ ] **4.4. Final Code Walkthrough & Documentation**
  - Walkthrough lengkap hasil pengembangan frontend Kumpul Cafe.
