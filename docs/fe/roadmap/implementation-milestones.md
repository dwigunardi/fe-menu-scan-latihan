# Kumpul Cafe Frontend Implementation Milestones & Roadmap

> **Project**: Kumpul Cafe – Digital QR Code Menu System & Progressive Web App (PWA)  
> **Brand Name**: Kumpul Cafe  
> **Backend Integration**: NestJS 11 (`http://localhost:5000/api/v1`) + WebSocket (`http://localhost:5000/events`)  
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
| **Phase 1** | Client Infrastructure, PWA Setup, Native `customFetch` & Stores | ⏳ **IN PROGRESS** | 0% |
| **Phase 2** | Public QR Menu View, Modifiers Modal, Banners & Table Session | ⬜ **PENDING** | 0% |
| **Phase 3** | Pre-Paid Checkout, Dynamic QRIS & Live Order Tracker (WebSocket) | ⬜ **PENDING** | 0% |
| **Phase 4** | Staff & Admin CMS Portal (Multi-Role RBAC, KDS, Floor Plan, Reports) | ⬜ **PENDING** | 0% |
| **Phase 5** | E2E Integration, PWA Testing, Polish & Final Verification | ⬜ **PENDING** | 0% |

---

## ✅ Phase 0: Planning, Architecture & Specification (COMPLETED)

- [x] **0.1. Kumpul Cafe Frontend Architecture Specification**
  - Document: [architecture-design.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/architecture/architecture-design.md)
  - Detail struktur folder `src/`, Server vs Client components, PWA structure, Native `customFetch` + TanStack React Query + Socket.IO client.
- [x] **0.2. Client-Side ECDH Cryptography Strategy Specification**
  - Document: [client-crypto-strategy.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/security/client-crypto-strategy.md)
  - Spesifikasi WebCrypto P-256, HKDF, AES-256-GCM, Native `customFetch` & Silent Re-Handshake.
- [x] **0.3. Kumpul Cafe UI & UX Wireframe Specification**
  - Document: [ui-wireframe-design.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/wireframe/ui-wireframe-design.md)
  - Layout mobile-first QR menu Kumpul Cafe (Table Binding, Modifiers Modal, Promo Banners, Dynamic QRIS, KDS, Cashier Floor Plan, Admin Reports).
- [x] **0.4. Frontend Roadmap Specification**
  - Document: [implementation-milestones.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/roadmap/implementation-milestones.md)

---

## 🛡️ Phase 1: Client Infrastructure, PWA Setup, Native `customFetch` & Stores

- [ ] **1.1. Package Dependencies Setup**
  - Install `zustand`, `@tanstack/react-query`, `socket.io-client`, `lucide-react`, `react-hook-form`, `@hookform/resolvers`, `zod`, `qrcode.react`, `clsx`, `tailwind-merge`.
- [ ] **1.2. PWA Web App Manifest & Service Worker Setup** (`public/`)
  - File `public/manifest.json` (Kumpul Cafe theme color `#f59e0b`, standalone display, app icons).
  - File `public/sw.js` (Service Worker caching: Stale-While-Revalidate untuk assets, Cache-First untuk gambar menu).
  - Component Provider `providers/pwa-provider.tsx` & helper `lib/pwa/register-sw.ts`.
- [ ] **1.3. WebCrypto ECDH Service Implementation** (`lib/crypto/ecdh.ts`)
  - Generasi P-256 Keypair, HKDF SHA-256 derivation, & AES-256-GCM encrypt/decrypt helper via `window.crypto.subtle`.
- [ ] **1.4. Global Zustand Stores** (`store/`)
  - `useHandshakeStore` (Menyimpan `sessionKey` & `handshakeToken` di RAM).
  - `useTableStore` (Menyimpan status nomor meja, `tableSessionToken`, customer name).
  - `useCartStore` (Menyimpan daftar item pesanan, variasi terpilih, dan catatan per-item).
  - `useAuthStore` (Menyimpan staff token & role `ADMIN`/`CASHIER`/`KITCHEN`/`WAITER`).
  - `usePwaStore` (Menyimpan PWA install prompt event `beforeinstallprompt` & status koneksi internet).
- [ ] **1.5. Encrypted Native `fetch` Wrapper** (`lib/api/custom-fetch.ts`)
  - Auto-encrypt request payload JSON & attach `x-handshake-token`.
  - Auto-decrypt response payload & handle `401 HANDSHAKE_EXPIRED` silent auto-retry.

---

## 📱 Phase 2: Public QR Menu View, Modifiers Modal, Banners & Table Session

- [ ] **2.1. Reusable Primitive UI Components** (`components/ui/`)
  - Button, Input, Modal, Drawer, Badge, Skeleton, Switch, RadioGroup, Checkbox.
- [ ] **2.2. Table Binding & Session Initializer** (`components/public/table-session-modal.tsx`)
  - Hook `useTableSession`: Cek status meja (`VACANT` vs `OCCUPIED`), modal input nama pemesan atau konfirmasi gabung meja.
- [ ] **2.3. Public Menu & Promo Carousel Components** (`components/public/`)
  - `PromoCarousel` (Carousel banner promo dari `/api/v1/public/banners`).
  - `CategoryTabs` (Horizontal scroll tab kategori: Signature, Coffee, Local, Cake, dll).
  - `MenuCard` (Card item menu dengan foto, harga promo, rating bintang, status ketersediaan).
  - `MenuModifierModal` (Modal kustomisasi variasi bersarang, radio pilihan wajib, checkbox extra toppings max limit, dan textarea catatan khusus).
  - `CartDrawer` (Drawer keranjang pesanan dengan kalkulasi subtotal).
- [ ] **2.4. Public Menu Page Assembly** (`app/(public)/menu/page.tsx`)
  - Integrasi TanStack React Query (`usePublicCategories`, `usePublicMenus`, `usePublicBanners`) via `customFetch`.

---

## 💳 Phase 3: Pre-Paid Checkout, Dynamic QRIS & Live Order Tracker

- [ ] **3.1. Checkout Page** (`app/(public)/order/checkout/page.tsx`)
  - Rincian item pesanan, ringkasan pajak, dan pilihan metode pembayaran.
- [ ] **3.2. Dynamic QRIS Payment Modal & Timer** (`components/public/qris-modal.tsx`)
  - Request `POST /api/v1/public/payments/create-qris`, render QRIS code dengan `qrcode.react`, dan countdown timer 15 menit.
- [ ] **3.3. Real-Time Order Tracking** (`app/(public)/order/status/[orderNumber]/page.tsx`)
  - WebSocket subscription ke `room:table:<no>`, update visual progress realtime saat `PAID` $\rightarrow$ `PREPARING` $\rightarrow$ `SERVED`.

---

## 🖥️ Phase 4: Staff & Admin CMS Portal (Multi-Role RBAC)

- [ ] **4.1. Staff Authentication** (`app/(admin)/admin/login/page.tsx`)
  - Login multi-role (`ADMIN`, `CASHIER`, `KITCHEN`, `WAITER`) dengan proteksi layout guard.
- [ ] **4.2. Kitchen Display System (KDS)** (`app/(admin)/admin/orders/page.tsx`)
  - Kartu pesanan live dapur dengan notifikasi audio lonceng saat pesanan baru dibayar (`PAID`).
  - Tombol update status pesanan: `PREPARING` $\rightarrow$ `SERVED`.
- [ ] **4.3. Cashier & Floor Plan Management** (`app/(admin)/admin/tables/page.tsx`)
  - Denah grid status meja (`VACANT`/`OCCUPIED`), detail tagihan aktif, dan 1-Tap Reset Meja.
- [ ] **4.4. Menu, Variant & Category Management** (`app/(admin)/admin/menus/page.tsx` & `categories/page.tsx`)
  - CRUD Kategori, CRUD Menu & Nested Variant Groups, serta Fast Toggle ketersediaan menu.
- [ ] **4.5. Owner Dashboard & Analytics** (`app/(admin)/admin/dashboard/page.tsx` & `reports/page.tsx`)
  - KPI Omset harian, total transaksi, rata-rata order value, dan Top 5 Menu Paling Laris.

---

## 🌱 Phase 5: E2E Integration, PWA Testing, Polish & Final Verification

- [ ] **5.1. Full Encrypted End-to-End Testing**
  - Verifikasi alur penuh: Scan QR Meja 01 $\rightarrow$ Input Nama $\rightarrow$ Kustomisasi Menu & Notes $\rightarrow$ Bayar QRIS $\rightarrow$ Webhook $\rightarrow$ Push KDS Dapur $\rightarrow$ Pelanggan Live Track.
- [ ] **5.2. PWA Audit & Offline Verification**
  - Verifikasi Lighthouse PWA Score, installability ke smartphone, dan offline menu fallback.
- [ ] **5.3. Final Code Walkthrough & Documentation**
