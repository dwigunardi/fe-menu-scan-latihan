# Kumpul Cafe Frontend System Architecture Specification

> **Project**: Kumpul Cafe – Digital QR Code Menu System & Progressive Web App (PWA)  
> **Brand Name**: Kumpul Cafe  
> **Framework**: Next.js 16 (App Router, TypeScript)  
> **PWA Integration**: Progressive Web App (Web App Manifest, Service Worker, Offline Support)  
> **Styling**: Tailwind CSS v4  
> **State Management**: Zustand (Auth, Crypto, Cart, PWA Install Prompt)  
> **Data Fetching & Cache**: `@tanstack/react-query` (v5) + Native `fetch`  
> **HTTP Client**: Custom Native `fetch` Wrapper (`customFetch`)  
> **Validation**: Zod & `react-hook-form`  
> **Document Location**: `docs/fe/architecture/architecture-design.md`  

---

## 🏛️ 1. Architectural Pattern & Design Principles

Sistem Frontend **Kumpul Cafe** dibangun dengan mengadopsi **Modular Component-Driven Architecture & PWA-Enabled** di atas **Next.js App Router**:

### Prinsip Utama:
1. **PWA First (Offline & App-Like Experience)**:
   - Pelanggan **Kumpul Cafe** dapat menginstall aplikasi web ini langsung ke Home Screen smartphone (*Installable PWA*).
   - Mendukung **Offline Caching Capabilities**: Menu dan aset yang sudah pernah dibuka tetap bisa diakses meskipun jaringan di cafe sedang lambat/terputus.
2. **Server vs. Client Component Boundaries**:
   - **Server Components (RSC)**: Digunakan untuk layouting dasar, PWA Meta tags, SEO metadata, dan static shell rendering.
   - **Client Components ('use client')**: Komponen interaktif yang mengelola state (Zustand, React Query, React Hook Form), WebCrypto API, dan PWA Service Worker hooks.
3. **Native Web APIs over Heavy Libraries**:
   - Menggunakan **Native Browser `fetch`** (`customFetch` wrapper) untuk bundle size yang efisien.
   - Menggunakan **Native `window.crypto.subtle` (WebCrypto API)** untuk enkripsi AES-256-GCM.
   - Menggunakan **Native Service Worker API** & Web App Manifest (`manifest.json`) untuk kemampuan PWA.

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
│   │   ├── menu/                    # Halaman Utama QR Code Menu Kumpul Cafe
│   │   │   └── page.tsx             # Public Menu Page (Mobile-First & PWA Enabled)
│   │   └── layout.tsx               # Public Layout (Responsive Container)
│   │
│   ├── (admin)/                     # Grouping Route Admin Restoran
│   │   ├── admin/
│   │   │   ├── login/               # Halaman Login Admin Kumpul Cafe
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/           # Summary Dashboard & Ringkasan Statistics
│   │   │   │   └── page.tsx
│   │   │   ├── categories/          # Pengelolaan Kategori Menu (Coffee, Cake, dll)
│   │   │   │   └── page.tsx
│   │   │   └── menus/               # Pengelolaan Item Menu Kumpul Cafe
│   │   │       └── page.tsx
│   │   └── layout.tsx               # Admin Layout (Sidebar & Top Navigation)
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
│   │   ├── switch.tsx               # Toggle button ketersediaan menu
│   │   └── skeleton.tsx             # Loading Skeleton UI
│   │
│   ├── pwa/                         # PWA Components
│   │   ├── pwa-installer-banner.tsx # Banner Ajakan Install PWA Kumpul Cafe
│   │   └── offline-banner.tsx       # Indikator Koneksi Offline/Online
│   │
│   ├── public/                      # Public QR Menu Components (Kumpul Cafe)
│   │   ├── category-tabs.tsx        # Horizontal Tabs (Coffee, Cake, Beverages, Fast Food, Local Food)
│   │   ├── menu-card.tsx            # Card Item Menu (Foto, Harga, Status Ready/Habis)
│   │   ├── menu-detail-modal.tsx    # Modal Detail Menu
│   │   ├── cart-drawer.tsx          # Drawer Ringkasan Pilihan Pesanan Pelanggan
│   │   └── search-bar.tsx           # Search Input Insensitif
│   │
│   └── admin/                       # Admin Dashboard Components
│       ├── category-table.tsx       # Tabel Admin Kategori
│       ├── category-modal.tsx       # Modal Tambah/Edit Kategori
│       ├── menu-table.tsx           # Tabel Admin Menu Items
│       ├── menu-modal.tsx           # Modal Tambah/Edit Item Menu
│       └── qr-generator-modal.tsx   # Modal Generate & Cetak QR Code Meja Kumpul Cafe
│
├── lib/                             # Core Utilities & Integration Layer
│   ├── api/                         # Custom Fetch & TanStack React Query Client
│   │   ├── custom-fetch.ts          # Encrypted Native fetch Wrapper Function
│   │   ├── auth-api.ts              # Service /api/v1/auth/*
│   │   ├── categories-api.ts        # Service /api/v1/public & admin categories
│   │   └── menus-api.ts             # Service /api/v1/public & admin menus
│   │
│   ├── crypto/                      # WebCrypto Encryption Service
│   │   ├── ecdh.ts                  # P-256 Keypair, HKDF Derivation, AES-256-GCM
│   │   └── session-manager.ts       # Pengelolaan Session Key di Memory
│   │
│   ├── pwa/                         # PWA Service Worker Registration & Hooks
│   │   └── register-sw.ts           # Service Worker Registration Helper
│   │
│   ├── validations/                 # Zod Schemas
│   │   ├── auth.schema.ts           # Schema Login Admin
│   │   ├── category.schema.ts       # Schema Form Kategori
│   │   └── menu.schema.ts           # Schema Form Item Menu
│   │
│   └── utils/                       # Utility Functions
│       ├── format-currency.ts       # Formatter Rupiah (IDR)
│       └── cn.ts                    # Classnames Merger (clsx + tailwind-merge)
│
├── store/                           # Global State Management (Zustand)
│   ├── use-auth-store.ts            # Token, Refresh Token, User Session State
│   ├── use-handshake-store.ts       # SessionKey & HandshakeToken State
│   ├── use-cart-store.ts            # Cart Item Choices for Public View
│   └── use-pwa-store.ts             # State PWA Install Prompt Event & Offline Status
│
├── hooks/                           # Custom React Hooks
│   ├── use-categories.ts            # React Query Hooks untuk Categories
│   ├── use-menus.ts                 # React Query Hooks untuk Menus
│   ├── use-handshake.ts             # Hook Auto Handshake saat App Launch
│   └── use-pwa-install.ts           # Hook untuk Menangkap beforeinstallprompt
│
└── providers/                       # Context Providers
    ├── query-provider.tsx           # TanStack React Query Client Provider
    ├── handshake-provider.tsx       # ECDH Handshake Initializer Provider
    └── pwa-provider.tsx             # PWA Registration & Offline Sync Provider
```

---

## 📱 3. Detail Kategori Menu Kumpul Cafe

Aplikasi **Kumpul Cafe** mendukung pengelompokan menu utama berikut:

| Icon | Kategori Menu | Deskripsi / Contoh Item |
| :---: | :--- | :--- |
| ☕ | **Coffee** | Espresso, Americano, Cappuccino, Latte, Palm Sugar Coffee (Kopi Susu Gula Aren). |
| 🍰 | **Cake & Bakery** | Croissant, Cheesecake, Red Velvet Cake, Brownies, Doughnuts. |
| 🧋 | **Beverages** | Fresh Juices, Smoothies, Iced Tea, Matcha Latte, Mocktails. |
| 🍔 | **Fast Food** | Beef Burger, French Fries, Chicken Wings, Hotdogs. |
| 🇮🇩 | **Local Food** | Nasi Goreng Kumpul, Mie Goreng Mamak, Ayam Geprek, Tahu Cabe Garam. |

---

## 📲 4. Spesifikasi PWA (Progressive Web App)

PWA dirancang merujuk pada standar modern (seperti pola pada *ThriveSaver*):

1. **Web App Manifest (`public/manifest.json`)**:
   ```json
   {
     "name": "Kumpul Cafe – Digital Menu & Ordering",
     "short_name": "Kumpul Cafe",
     "description": "Scan QR Menu Digital & Pesan Kopi, Cake, Fast Food, & Local Food di Kumpul Cafe",
     "start_url": "/menu",
     "display": "standalone",
     "background_color": "#18181b",
     "theme_color": "#f59e0b",
     "orientation": "portrait",
     "icons": [
       { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
       { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" },
       { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
     ]
   }
   ```
2. **Service Worker Caching Strategy**:
   - **Static Assets (HTML/CSS/JS/Icons)**: *Stale-While-Revalidate* strategy.
   - **Menu Images**: *Cache-First* strategy dengan waktu kadaluarsa 7 hari untuk menghemat kuota internet pelanggan.
   - **Encrypted API Calls**: *Network-First* dengan fallback graceful UI jika offline.
3. **PWA Installation Prompt**:
   - Banner khusus (`pwa-installer-banner.tsx`) yang muncul secara tidak mengganggu di bagian atas/bawah layar mobile, mengajak pelanggan menambahkan "Kumpul Cafe" ke Home Screen.

---

## 🔗 5. Terhubung ke Dokumen Terkait

- 📄 Spesifikasi Enkripsi Kriptografi FE: [client-crypto-strategy.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/security/client-crypto-strategy.md)
- 📄 Spesifikasi UI/UX & Wireframe Kumpul Cafe: [ui-wireframe-design.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/wireframe/ui-wireframe-design.md)
- 📄 Milestones & Roadmap Kumpul Cafe: [implementation-milestones.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/roadmap/implementation-milestones.md)
