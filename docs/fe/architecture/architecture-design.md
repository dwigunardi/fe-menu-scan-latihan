# Kumpul Cafe Frontend System Architecture Specification

> **Project**: Kumpul Cafe – Digital QR Code Menu System & Progressive Web App (PWA)  
> **Brand Name**: Kumpul Cafe  
> **Backend Integration**: NestJS 11 (`http://localhost:5000/api/v1`) + WebSocket (`http://localhost:5000/events`)  
> **Framework**: Next.js 16 (App Router, TypeScript)  
> **PWA Integration**: Progressive Web App (Web App Manifest, Service Worker, Offline Support)  
> **Styling**: Tailwind CSS v4  
> **State Management**: Zustand (Auth, Crypto, Table Session, Cart, PWA Install Prompt)  
> **Data Fetching & Cache**: `@tanstack/react-query` (v5) + Native `customFetch`  
> **Real-Time Client**: `socket.io-client` (WebSockets)  
> **Security Standard**: WebCrypto API (P-256 ECDH + AES-256-GCM Zero-Trust Encryption)  
> **Document Location**: `docs/fe/architecture/architecture-design.md`  

---

## 🏛️ 1. Architectural Pattern & Design Principles

Sistem Frontend **Kumpul Cafe** dibangun dengan mengadopsi **Modular Component-Driven Architecture, PWA-Enabled, & Real-Time Socket-Driven** di atas **Next.js App Router**:

### Prinsip Utama:
1. **PWA First (Offline & App-Like Experience)**:
   - Pelanggan **Kumpul Cafe** dapat menginstall aplikasi web ini langsung ke Home Screen smartphone (*Installable PWA*).
   - Mendukung **Offline Caching Capabilities**: Menu dan banner yang sudah pernah dibuka tetap bisa diakses meskipun jaringan di cafe sedang lambat/terputus.
2. **Server vs. Client Component Boundaries**:
   - **Server Components (RSC)**: Layouting dasar, PWA Meta tags, SEO metadata, dan static shell rendering.
   - **Client Components ('use client')**: Komponen interaktif (Zustand, React Query, WebSockets, WebCrypto API, PWA hooks).
3. **Zero-Trust Payload Encryption**:
   - Menggunakan **Native `window.crypto.subtle` (WebCrypto API)** untuk enkripsi data payload AES-256-GCM dari browser ke backend NestJS.
4. **Real-Time WebSockets (`socket.io-client`)**:
   - Menerima push event `order:status-changed` instan dari backend ke smartphone pelanggan saat status berubah (`PAID` $\rightarrow$ `PREPARING` $\rightarrow$ `SERVED`).
   - Menerima push live orders ke Kitchen Display System (KDS) & Kasir.

---

## 📁 2. Complete Directory Structure (`src/` & `public/`)

```text
public/                              # PWA Assets & Service Worker
├── manifest.json                    # Web App Manifest (Kumpul Cafe Branding)
├── sw.js                            # PWA Service Worker (Caching Strategies)
├── icons/                           # App Icons (192x192, 512x512, Maskable)
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   └── apple-touch-icon.png
└── favicon.ico

src/
├── app/                             # Next.js App Router Pages & Routes
│   ├── (public)/                    # Grouping Route Publik (Pelanggan Kumpul Cafe via QR)
│   │   ├── menu/                    # Halaman Utama QR Code Menu & Banners
│   │   │   └── page.tsx
│   │   ├── order/
│   │   │   ├── checkout/            # Rincian Pesanan & Pembayaran QRIS
│   │   │   │   └── page.tsx
│   │   │   └── status/[orderNumber]/# Live Tracking Status Pesanan Real-time
│   │   │       └── page.tsx
│   │   └── layout.tsx               # Public Mobile-First Layout
│   │
│   ├── (admin)/                     # Grouping Route Staff & Admin Portal (RBAC)
│   │   ├── admin/
│   │   │   ├── login/               # Halaman Login Multi-Role (Admin/Cashier/Kitchen/Waiter)
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/           # Summary Dashboard & Ringkasan Statistics (Admin)
│   │   │   │   └── page.tsx
│   │   │   ├── orders/              # Live Kitchen Display System (KDS) & Order Monitor
│   │   │   │   └── page.tsx
│   │   │   ├── tables/              # Floor Plan & 1-Tap Reset Meja (Kasir / Waiter)
│   │   │   │   └── page.tsx
│   │   │   ├── banners/             # Manajemen Promo Banners (Admin)
│   │   │   │   └── page.tsx
│   │   │   ├── categories/          # Pengelolaan Kategori Menu
│   │   │   │   └── page.tsx
│   │   │   ├── menus/               # Pengelolaan Item Menu & Variasi
│   │   │   │   └── page.tsx
│   │   │   └── reports/             # Laporan Pendapatan & Omset Harian (Admin)
│   │   │       └── page.tsx
│   │   └── layout.tsx               # Staff Portal Layout (Sidebar & Role Protection)
│   │
│   ├── layout.tsx                   # Root Application Layout & Global Providers
│   ├── globals.css                  # Global Styles & Tailwind CSS v4 Directive
│   └── page.tsx                     # Landing / Redirect Page
│
├── components/                      # UI Components Layer
│   ├── ui/                          # Atom/Primitive Components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   ├── drawer.tsx
│   │   ├── badge.tsx
│   │   ├── switch.tsx               # Fast toggle ketersediaan menu
│   │   └── skeleton.tsx
│   │
│   ├── pwa/                         # PWA Components
│   │   ├── pwa-installer-banner.tsx # Banner Ajakan Install PWA
│   │   └── offline-banner.tsx       # Indikator Status Offline/Online
│   │
│   ├── public/                      # Public Customer Ordering Components
│   │   ├── table-session-modal.tsx  # Modal Input Nama / Konfirmasi Meja Terisi
│   │   ├── promo-carousel.tsx       # Banner Carousel Promo Kafe
│   │   ├── category-tabs.tsx        # Tab Horizontal Kategori
│   │   ├── menu-card.tsx            # Card Menu (Foto, Harga, Rating, Badge Best Seller)
│   │   ├── menu-modifier-modal.tsx  # Modal Kustomisasi (Ukuran, Suhu, Topping, Notes)
│   │   ├── cart-drawer.tsx          # Drawer Ringkasan Keranjang Pesanan
│   │   ├── qris-modal.tsx           # Modal QRIS Dinamis + Countdown Timer
│   │   └── live-order-tracker.tsx   # Visual Tracker Progress Pesanan Real-time
│   │
│   └── admin/                       # Staff & Admin Components
│       ├── kds-order-card.tsx       # Kartu Pesanan Live Dapur dengan Audio Alert
│       ├── table-grid.tsx           # Denah Grid Meja & 1-Tap Reset
│       ├── revenue-chart.tsx        # Grafik Visual Omset & Transaksi
│       ├── top-selling-table.tsx    # Tabel Menu Paling Laris
│       ├── menu-form-modal.tsx      # Modal CRUD Menu & Nested Variant Groups
│       └── qr-printer-modal.tsx     # Modal Cetak QR Code Meja
│
├── lib/                             # Core Utilities & Integration Layer
│   ├── api/                         # Native customFetch & API Endpoints
│   │   ├── custom-fetch.ts          # Encrypted Native fetch Wrapper
│   │   ├── auth-api.ts              # /api/v1/auth/*
│   │   ├── banners-api.ts           # /api/v1/public & admin banners
│   │   ├── categories-api.ts        # /api/v1/public & admin categories
│   │   ├── menus-api.ts             # /api/v1/public & admin menus
│   │   ├── tables-api.ts            # /api/v1/public & admin tables
│   │   ├── orders-api.ts            # /api/v1/public & admin orders
│   │   ├── payments-api.ts          # /api/v1/public/payments/create-qris
│   │   └── reports-api.ts           # /api/v1/admin/reports/*
│   │
│   ├── crypto/                      # WebCrypto Encryption Service
│   │   ├── ecdh.ts                  # P-256 Keypair, HKDF, AES-256-GCM
│   │   └── session-manager.ts       # RAM Session Key Storage
│   │
│   ├── socket/                      # WebSocket Socket.IO Client
│   │   └── socket-client.ts         # Socket.IO Singleton Connection to /events
│   │
│   ├── pwa/                         # Service Worker Registration
│   │   └── register-sw.ts
│   │
│   ├── validations/                 # Zod Schemas
│   │   ├── auth.schema.ts
│   │   ├── order.schema.ts
│   │   ├── menu.schema.ts
│   │   └── table.schema.ts
│   │
│   └── utils/
│       ├── format-currency.ts       # Format IDR (Rupiah)
│       └── cn.ts                    # Classnames Merger (clsx + tailwind-merge)
│
├── store/                           # Global State Management (Zustand)
│   ├── use-auth-store.ts            # Token, Role (ADMIN/CASHIER/KITCHEN/WAITER)
│   ├── use-handshake-store.ts       # RAM SessionKey & HandshakeToken
│   ├── use-table-store.ts           # Table Number, Active Session Token, Customer Name
│   ├── use-cart-store.ts            # Items, Selected Variants, Item Notes, Total
│   └── use-pwa-store.ts             # PWA Install Prompt & Offline State
│
├── hooks/                           # Custom React Hooks
│   ├── use-table-session.ts         # Hook Validasi Status Meja saat Scan QR
│   ├── use-live-orders.ts           # Hook WebSocket Listeners untuk Order Status
│   ├── use-menus.ts                 # React Query Hooks untuk Menus & Categories
│   ├── use-banners.ts               # React Query Hooks untuk Promo Banners
│   └── use-handshake.ts             # Hook Auto ECDH Handshake
│
└── providers/                       # Context Providers
    ├── query-provider.tsx           # TanStack React Query Client Provider
    ├── socket-provider.tsx          # Real-time WebSocket Provider (/events)
    ├── handshake-provider.tsx       # ECDH Initializer Provider
    └── pwa-provider.tsx             # PWA & Offline Provider
```

---

## 🔗 3. Terhubung ke Dokumen Terkait

- 📄 Spesifikasi Enkripsi Kriptografi FE: [client-crypto-strategy.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/security/client-crypto-strategy.md)
- 📄 Spesifikasi UI/UX & Wireframe Kumpul Cafe: [ui-wireframe-design.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/wireframe/ui-wireframe-design.md)
- 📄 Milestones & Roadmap Kumpul Cafe: [implementation-milestones.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/roadmap/implementation-milestones.md)
