# Kumpul Cafe UI & UX Wireframe Design Specification

> **Project**: Kumpul Cafe – Digital QR Code Menu System & PWA  
> **Brand Name**: Kumpul Cafe  
> **Target Interface**: Public QR Menu (Mobile-First & PWA) & Admin Dashboard (Responsive Desktop/Tablet)  
> **Styling**: Tailwind CSS v4  
> **Document Location**: `docs/fe/wireframe/ui-wireframe-design.md`  

---

## 📱 1. Tampilan Publik Kumpul Cafe (Pelanggan via Scan QR & PWA)

Tampilan ini diakses oleh pelanggan **Kumpul Cafe** di meja cafe via smartphone. Berfokus pada **tampilan estetik warm-cafe, performa tinggi, dan dukungan PWA installable**.

### Wireframe Layout: `/menu` (Mobile-First & PWA)

```text
+--------------------------------------------------+
| ☕ KUMPUL CAFE                      [🔍 Search]   | -> Header Branding Kumpul Cafe
+--------------------------------------------------+
| 📲 Install Aplikasi Kumpul Cafe      [ Install ] | -> Banner Prompt PWA (Installable)
+--------------------------------------------------+
| [ ALL ] [ ☕ Coffee ] [ 🍰 Cake ] [ 🧋 Beverages] | -> Category Tabs (Horizontal Scroll)
| [ 🍔 Fast Food ] [ 🇮🇩 Local Food ]               |
+--------------------------------------------------+
|                                                  |
| ☕ Palm Sugar Coffee               [ Rp 28.000 ] |
|    Kopi susu gula aren khas Kumpul Cafe          |
|    [ Foto Menu ]                   [ + Tambah ]  |
| ------------------------------------------------ |
| 🍰 Red Velvet Cheesecake           [ Rp 32.000 ] |
|    Cake lembut dengan keju melimpah              |
|    [ Foto Menu ]                   [ + Tambah ]  |
| ------------------------------------------------ |
| 🍔 Kumpul Burger Special           [ Rp 45.000 ] |
|    Daging sapi patty tebal + fries               |
|    [ Foto Menu ]                   [ + Tambah ]  |
| ------------------------------------------------ |
| 🇮🇩 Nasi Goreng Spesial Kumpul       [ Rp 38.000 ] |
|    Nasi goreng rempah + telur mata sapi          |
|    [ Status: HABIS ]               [ Disabled ]  | -> Badging Status Out of Stock
|                                                  |
+--------------------------------------------------+
| 🛒 2 Items Dipilih | Total: Rp 60.000  [ Lihat ] | -> Sticky Bottom Cart Bar
+--------------------------------------------------+
```

### Fitur Utama Public View Kumpul Cafe:
1. **Horizontal Category Navigation (`CategoryTabs`)**:
   - Menampilkan list kategori Kumpul Cafe: **Coffee**, **Cake & Bakery**, **Beverages**, **Fast Food**, dan **Local Food**.
   - Mengubah tab kategori memfilter daftar menu secara instan via TanStack React Query.
2. **PWA Install Banner (`PwaInstallerBanner`)**:
   - Banner elegan yang menyapa pelanggan untuk menambahkan PWA "Kumpul Cafe" ke layar utama HP mereka.
3. **Offline Indicator (`OfflineBanner`)**:
   - Jika koneksi WiFi/seluler cafe terputus, muncul indikator *Offline Mode* tanpa menghentikan pengalaman memilih menu.
4. **Availability State Rendering**:
   - Menu yang sedang stoknya kosong (misal: *Nasi Goreng Spesial Kumpul*) diberi efek grayscale, badge "HABIS", dan tombol tambah dinonaktifkan.

---

## 🖥️ 2. Tampilan Admin Kumpul Cafe (Protected Admin Dashboard)

Tampilan ini digunakan oleh owner/barista Kumpul Cafe untuk mengelola kategori menu, stok item menu, dan mencetak QR Code Meja.

### A. Admin Login: `/admin/login`

```text
+--------------------------------------------------+
|               ☕ Kumpul Cafe Admin               |
|                                                  |
|   Email Address:                                 |
|   [ admin@kumpulcafe.com                       ] |
|                                                  |
|   Password:                                      |
|   [ **********                                 ] |
|                                                  |
|   [             LOG IN TO DASHBOARD            ] |
+--------------------------------------------------+
```

---

### B. Admin Categories Management: `/admin/categories`

```text
+-----------------------------------------------------------------------+
| ☕ Kumpul Cafe Admin | Categories | Menus | QR Code | [ Logout ]       |
+-----------------------------------------------------------------------+
| 📁 Pengelolaan Kategori Menu Kumpul Cafe       [ + Tambah Kategori ]  |
+-----------------------------------------------------------------------+
| Urutan | Nama Kategori   | Total Menu | Aksi                          |
| ------ | --------------- | ---------- | ----------------------------- |
| 1      | Coffee          | 10 Items   | [ Edit ]  [ Hapus ]           |
| 2      | Cake & Bakery   | 6 Items    | [ Edit ]  [ Hapus ]           |
| 3      | Beverages       | 8 Items    | [ Edit ]  [ Hapus ]           |
| 4      | Fast Food       | 5 Items    | [ Edit ]  [ Hapus ]           |
| 5      | Local Food      | 7 Items    | [ Edit ]  [ Hapus ]           |
+-----------------------------------------------------------------------+
```

---

### C. Admin Menu Items Management: `/admin/menus`

```text
+-----------------------------------------------------------------------+
| ☕ Kumpul Cafe Admin | Categories | Menus | QR Code | [ Logout ]       |
+-----------------------------------------------------------------------+
| 🍲 Daftar Menu Kumpul Cafe              [ 🔍 Search... ] [ + Menu Baru ]|
+-----------------------------------------------------------------------+
| Foto | Nama Menu          | Kategori      | Harga     | Status  | Aksi |
| ---- | ------------------ | ------------- | --------- | ------- | ---- |
| [🖼️] | Palm Sugar Coffee  | Coffee        | Rp 28.000 | [ ON ]  | ✏️ 🗑️ |
| [🖼️] | Red Velvet Cake    | Cake & Bakery | Rp 32.000 | [ ON ]  | ✏️ 🗑️ |
| [🖼️] | Kumpul Burger      | Fast Food     | Rp 45.000 | [ ON ]  | ✏️ 🗑️ |
| [🖼️] | Nasi Goreng Kumpul | Local Food    | Rp 38.000 | [ OFF ] | ✏️ 🗑️ | -> Fast Toggle Switch
+-----------------------------------------------------------------------+
|  << Halaman 1 dari 2 >>                                              |
+-----------------------------------------------------------------------+
```

---

## 🎨 3. Design System & Theme Principles (Kumpul Cafe Aesthetics)

1. **Color Palette**:
   - **Primary Brand**: Warm Amber & Coffee Brown (`amber-500`, `amber-600`, `amber-900`) - Memberikan nuansa hangat, ramah, dan profesional khas kafe kopi modern.
   - **Background Light**: Cream / Warm Zinc (`zinc-50`, `stone-50`).
   - **Dark Mode / Accent**: Dark Espresso (`zinc-900`, `stone-900`).
2. **Typography**: Inter / Outfit (Clean, modern, sans-serif legibel di smartphone).
3. **PWA Visual Identity**: Standalone display mode dengan `theme_color: #f59e0b`.

---

## 🔗 4. Terhubung ke Dokumen Terkait

- 📄 Arsitektur Utama Frontend: [architecture-design.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/architecture/architecture-design.md)
- 📄 Strategi Kriptografi Client: [client-crypto-strategy.md](file:///d:/code/fe-menu-scan-latihan/docs/fe/security/client-crypto-strategy.md)
