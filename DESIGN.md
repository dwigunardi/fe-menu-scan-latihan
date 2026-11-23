# Design System & UI/UX Specification: Kumpul Cafe Admin Portal

> **Module**: Staff & Admin CMS Portal (Multi-Role RBAC)  
> **Route Group**: `src/app/(admin)/admin/*`  
> **Component Architecture**: shadcn/ui + Radix UI Primitives + Tailwind CSS v4  
> **Design Skills Referenced**: `taste-design`, `design-md`, `shadcn-ui`, `frontend-design`  
> **Document Location**: `docs/fe/design/ADMIN_DESIGN.md`  

---

## 1. Visual Theme & Atmosphere (Back-Office Cockpit)

Portal Admin & Staf **Kumpul Cafe** dirancang dengan estetika **Artisanal Coffeehouse Back-Office Cockpit** — menggabungkan efisiensi operasional tinggi khas sistem POS modern dengan kehangatan palet kopi specialty (*warm stone, dark espresso, and golden honey amber*).

- **Density Level**: *Cockpit Dense (Level 8/10)* — Tata letak padat informasi, jarak klik/sentuh cepat, tabel data scannable, dan aksi 1-tap untuk kasir/barista yang sibuk.
- **Color Temperature**: Netral hangat (*Stone-900 / Slate-50*) di mode terang, dan *Dark Zinc-900 / Espresso* di mode gelap.
- **Typographic Character**:
  - Headings & Labels: `Plus Jakarta Sans` (Track-tight `-0.02em`, SemiBold 600).
  - Numbers & Currency: `JetBrains Mono` / `Geist Mono` (Tabular numeric alignment untuk harga, omset, dan timer pesanan).
- **Anti-Patterns yang Dilarang**: Tidak ada gradien neon AI (*no purple glows*), tidak ada teks bertumpuk di atas gambar, tidak ada font generic Inter/Times New Roman, dan tidak ada warna hitam pekat `#000000`.

---

## 2. Three-Tier Token Architecture (Admin CMS)

```text
[ Cream Canvas: #FAF7F2 ] ──► [ Pure Surface: #FFFFFF ] ──► [ Charcoal Ink: #1C1917 ]
                                      │
                         [ Golden Amber Roast: #D97706 ] (Primary Accent)
```

### Palet Warna Semantik Admin:
- **Canvas Background**: `#FAF7F2` (Light Mode) / `#18181B` (Dark / KDS Mode)
- **Card & Table Surface**: `#FFFFFF` (Light) / `#27272A` (Dark Zinc)
- **Border / Divider**: `rgba(214, 207, 197, 0.5)` (Light Whisper Line) / `#3F3F46` (Dark)
- **Primary Action (Amber Roast)**: `#D97706` (Hover: `#B45309`, Active: `#92400E`)
- **Status Paid / Available**: `#059669` (Emerald-600, Soft BG: `#ECFDF5`)
- **Status Out of Stock / Alert**: `#DC2626` (Red-600, Soft BG: `#FEF2F2`)
- **Text Primary**: `#1C1917` (Charcoal Ink) / `#F4F4F5` (Dark Foreground)
- **Text Secondary / Muted**: `#78716C` (Muted Roast) / `#A1A1AA` (Dark Muted)

---

## 3. UI/UX Blueprint & Flow Breakdown

### A. Screen 1: Staff Quick-Login Portal (`/admin/login`)
- **Layout**: Centered luxury card (`max-w-md`) dengan latar belakang oat canvas hangat.
- **Branding Header**: Logo cangkir Kumpul Cafe dengan badge `Staff & Management Portal`.
- **Form Fields**: Input Username & Password dengan floating clean label dan error Zod inline.
- **1-Click Demo Login Grid**: 4 tombol preset cepat untuk pengujian instan:
  - 👑 **Super Admin** (`admin` / `admin123`) -> Akses Penuh
  - 💵 **Kasir** (`kasir` / `kasir123`) -> Denah Meja & 1-Tap Reset Meja
  - 🍳 **Barista Dapur** (`dapur` / `dapur123`) -> Live Kitchen Display System (KDS)
  - 🛎️ **Pelayan / Waiter** (`pelayan` / `pelayan123`) -> Status Meja & Antaran
- **Smart Redirect**: Otomatis mengarahkan staf ke halaman operasional utamanya sesuai peran (*Admin -> Dashboard/Menus, Dapur -> KDS, Kasir -> Meja*).

---

### B. Screen 2: Admin Layout & Responsive Shell (`/admin/*`)
- **Sidebar Navigasi (Desktop)**:
  - Lebar: 260px, fixed di sisi kiri dengan border tipis `border-border`.
  - Item Navigasi Berbasis Role (RBAC):
    - 📊 **Dashboard & Analytics** (`/admin/dashboard`) — `[ADMIN]`
    - 🍳 **Kitchen Display System** (`/admin/orders`) — `[ADMIN, KITCHEN, CASHIER, WAITER]`
    - 🪑 **Denah Meja & Kasir** (`/admin/tables`) — `[ADMIN, CASHIER, WAITER]`
    - ☕ **Katalog Menu & Variasi** (`/admin/menus`) — `[ADMIN]`
    - 🏷️ **Kategori Menu** (`/admin/categories`) — `[ADMIN]`
    - 🖼️ **Promo Banners** (`/admin/banners`) — `[ADMIN]`
  - Active State: Background Amber muda (`bg-amber-50 dark:bg-amber-950/40`), teks Amber tebal (`text-amber-700`), indikator bar vertikal emas di sisi kiri item.
- **Top Header Bar**:
  - Kiri: Breadcrumb lokasi halaman aktif (*"Admin / Katalog Menu"*).
  - Kanan: Badge nama staf aktif (*"Dewi Sartika (Admin)"*), Switch Mode Gelap/Terang, dan tombol Logout dengan konfirmasi.

---

### C. Screen 3: Menu Catalog Management (`/admin/menus`)
- **Toolbar Aksi Atas**:
  - **Search Bar**: Input pencarian real-time dengan ikon Search dan shortcut keyboard `Ctrl+K`.
  - **Category Pills Filter**: Tab horizontal (*"Semua", "Signature Coffee", "Manual Brew", "Non-Coffee", "Makanan Rempah", "Snack"*).
  - **Tombol Aksi Utama**: `+ Tambah Menu Baru` (Button Amber) & `Kelola Kategori` (Button Outline).
- **Interactive Data Table**:
  - **Kolom 1 (Menu)**: Foto thumbnail 48x48px (rounded-xl) + Nama Menu + Badge Best Seller/Rekomendasi.
  - **Kolom 2 (Kategori)**: Tag Pill Kategori (*"Signature Coffee"*).
  - **Kolom 3 (Harga)**: Font monospace tabular (`Rp 28.000`), mencoret harga lama jika ada harga promo.
  - **Kolom 4 (Variasi)**: Badge jumlah grup variasi (*"3 Grup Variasi"* misal: Suhu, Ukuran, Topping).
  - **Kolom 5 (Ketersediaan Stok)**: **Instant Switch Toggle** (`Switch` Radix UI).
    - Hijau = Stok Tersedia, Abu-abu/Merah = Stok Habis.
    - Menggunakan *Optimistic Update* dengan konfirmasi toast Sonner seketika disentuh.
  - **Kolom 6 (Aksi)**: Tombol Edit (Ikon Pensil) dan Hapus (Ikon Tempat Sampah Merah dengan Dialog Konfirmasi).

---

### D. Screen 4: Multi-Tab Menu & Variant Modal (`MenuFormModal`)
- **Dialog Container**: Modal Radix (`max-w-2xl`), rounded-3xl, shadow-xl dengan 2 Tab Navigasi:
- **Tab 1: Informasi Dasar & Harga**:
  - Input Nama Menu (*"Kopi Kumpul Santuy"*).
  - Select Dropdown Kategori (*"Signature Coffee"*).
  - Textarea Deskripsi Bahan (*"Blend signature espresso + susu segar creamy + madu murni"*).
  - Grid 2 Kolom: Harga Dasar (`price`) & Harga Promo (`promoPrice` opsional).
  - Input URL Foto Menu dengan preview live thumbnail.
  - Checkbox Flags: `Best Seller` & `Menu Rekomendasi Barista`.
- **Tab 2: Grup Variasi & Batas Topping (`maxSelect`)**:
  - **Dynamic Variant Group Builder**: Tombol `+ Tambah Grup Variasi` (misal: "Ukuran", "Pilihan Topping").
  - Form per-grup:
    - Nama Grup (*"Extra Topping"*).
    - Tipe Seleksi: Wajib (`isRequired: true/false`).
    - Aturan Seleksi: `minSelect` (0) dan `maxSelect` (3) (*"Pelanggan hanya boleh memilih maksimal 3 topping"*).
    - List Opsi Variasi: Baris opsi dengan Nama (*"Coffee Jelly"*), Tambahan Harga (*"+Rp 4.000"*), dan tombol hapus baris.
- **Modal Footer**: Tombol Batal & Tombol Simpan (`Button` Amber dengan loading spinner saat submit).

---

## 4. Google Stitch / AI Generation Prompts

Berikut adalah prompt visual terkalibrasi yang dapat digunakan langsung di Google Stitch atau AI Designer:

### 🎨 Prompt 1: Admin Staff Quick-Login Screen
```text
A modern, minimalist luxury Scandinavian coffeehouse staff login screen for "Kumpul Cafe". The background is a soft warm oat milk canvas (#FAF7F2). In the center is a pristine white floating card (rounded-3xl, whisper shadow) featuring an artisanal minimalist coffee icon, elegant typography in Plus Jakarta Sans saying "Kumpul Cafe - Staff Portal", username and password input fields with warm amber focus rings, and a primary Golden Amber submit button (#D97706). Below the form is a dedicated "1-Click Quick Demo Login" grid with 4 clean pill buttons: "Super Admin", "Kasir Meja", "Barista Dapur", and "Pelayan". No purple glows, no emojis as icons, ultra-clean UI.
```

### 🎨 Prompt 2: Admin Menu Management Catalog Screen
```text
A high-density desktop dashboard screen for managing coffeehouse menus in "Kumpul Cafe". Top header features active staff badge "Dewi Sartika (Admin)" and breadcrumbs. Main content has a top toolbar with a search input, horizontal category pills ("All", "Signature Coffee", "Non-Coffee", "Food"), and an Amber CTA button "+ Tambah Menu". Below is a clean tabular data list showing menu items with 48x48px rounded thumbnails, bold menu names ("Kopi Kumpul Santuy", "Kopi Genyal"), monospace price tags ("Rp 28.000"), category tags, interactive green iOS-style availability toggle switches for stock status, and clean action buttons (Edit, Variants, Delete). Warm stone background, crisp typography, zero clutter.
```

### 🎨 Prompt 3: Unified Multi-Tab Menu & Variant Editor Modal
```text
A centered multi-tab modal dialog (max-w-2xl, rounded-3xl, pure white surface) for creating and editing cafe menu items. Top of the modal has two tabs: "1. Info Dasar & Harga" and "2. Grup Variasi & Topping" styled with an active Golden Amber underline. The active tab shows a dynamic modifier builder with accordion cards for variant groups like "Suhu (Hot/Ice, Required: Yes)", "Ukuran (Regular/Large)", and "Extra Topping (Optional, Max Select: 3)". Inside the topping group are row inputs for option name ("Coffee Jelly", "Extra Shot") and price modifier ("+Rp 4.000"). Clean sticky footer with "Batal" and "Simpan Menu" buttons. Modern, accessible, tactile.
```

---

## 5. Verification & Acceptance Criteria

1. **RBAC Guard**: Pengguna yang belum login ditolak saat mengakses `/admin/*` dan diarahkan ke `/admin/login`.
2. **Instant Availability Toggle**: Mengubah switch ketersediaan stok langsung mengupdate data di database Backend dan menampilkan toast konfirmasi Sonner.
3. **Variant Group Constraints**: Form validasi Zod menjamin `maxSelect` tidak boleh lebih kecil dari `minSelect`, dan harga ekstra tidak boleh negatif.
4. **Zero Type Errors**: Lulus uji `npm test` dan `npm run build` tanpa warning.