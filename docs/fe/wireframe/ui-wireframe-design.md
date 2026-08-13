# Kumpul Cafe UI & UX Wireframe Design Specification

> **Project**: Kumpul Cafe – Digital QR Code Menu System & Progressive Web App (PWA)  
> **Brand Name**: Kumpul Cafe  
> **Backend Integration**: NestJS 11 (`http://localhost:5000/api/v1`) + WebSocket (`http://localhost:5000/events`)  
> **Target Interface**: Public QR Ordering (Mobile-First PWA) & Staff / Admin CMS (Responsive Desktop/Tablet)  
> **Styling**: Tailwind CSS v4  
> **Document Location**: `docs/fe/wireframe/ui-wireframe-design.md`  

---

## 📱 1. Tampilan Publik Kumpul Cafe (Pelanggan via Scan QR Meja & PWA)

Tampilan mobile-first yang diakses pelanggan saat men-scan QR Meja (contoh: `https://kumpulcafe.com/menu?table=01`).

---

### A. Screen 1: Scan Meja & Konfirmasi Sesi (`/menu?table=01`)

```text
+--------------------------------------------------+
| ☕ KUMPUL CAFE                     [ 🪑 Meja 01 ] |
+--------------------------------------------------+
|               Selamat Datang di                  |
|                  KUMPUL CAFE                     |
|                                                  |
|  [ KONDISI A: Meja Kosong / VACANT ]             |
|  Silakan masukkan nama Anda untuk memesan:       |
|  Nama Pemesan: [ Dewi                          ] |
|  [           BUKA MENU & PESAN SEKARANG        ] |
|                                                  |
|  [ KONDISI B: Meja Terisi / OCCUPIED ]           |
|  ⚠️ Meja 01 saat ini terdaftar atas nama [Budi]  |
|  Apakah Anda ingin bergabung ke meja ini?        |
|  [ GABUNG PESANAN MEJA ]   [ BUKAN SAYA (PILIH) ]|
+--------------------------------------------------+
```

---

### B. Screen 2: Halaman Utama Menu & Carousel Promo (`/menu`)

```text
+--------------------------------------------------+
| ☕ KUMPUL CAFE | 🪑 Meja 01 (Dewi)    [🔍 Search] |
+--------------------------------------------------+
| 📲 Install Kumpul Cafe App            [ Install ]| -> Banner Prompt PWA
+--------------------------------------------------+
| 🏷️ PROMO CAROUSEL                                 |
| [ Banner: Buy 1 Get 1 Kopi Kumpul Santuy - Diskon] | -> Promo Banners Carousel
+--------------------------------------------------+
| [ ALL ] [ ☕ Signature ] [ 🇮🇩 Local ] [ 🍰 Cake ] | -> Category Tabs (Horizontal Scroll)
| [ 🧋 Non-Coffee ] [ 🍟 Snacks ]                   |
+--------------------------------------------------+
|                                                  |
| ⭐ REKOMENDASI & PALING LARIS                     |
| ☕ Kopi Kumpul Santuy           [ ⭐ 4.9 (340) ]   |
|    Kopi blend signature + susu creamy + madu     |
|    Rp 24.000 (Coret: Rp 28.000)   [ + Kustomisasi ]|
|                                                  |
| ☕ Kopi Genyal                  [ ⭐ 4.8 (215) ]   |
|    Kopi signature + susu + kopi jelly kenyal     |
|    Rp 30.000                      [ + Kustomisasi ]|
|                                                  |
| 🇮🇩 Nasi Goreng Rempah Kumpul    [ ⭐ 4.9 (410) ]   |
|    Nasi goreng bumbu rempah + telur + kerupuk    |
|    Rp 32.000                      [ + Kustomisasi ]|
|                                                  |
| 💧 Air Mineral 600ml            [ Rp 8.000 ]     |
|    Air mineral dingin             [ + Tambah ]   | -> Tanpa Pop-up Variasi
|                                                  |
+--------------------------------------------------+
| 🛒 2 Items | Total: Rp 56.000    [ Lihat Pesanan ]| -> Sticky Bottom Cart Bar
+--------------------------------------------------+
```

---

### C. Screen 3: Modal Kustomisasi Variasi & Topping Menu

```text
+--------------------------------------------------+
| [X] Kopi Kumpul Santuy                           |
| Campuran kopi khas blend signature + susu + madu |
| Harga Dasar: Rp 24.000                           |
+--------------------------------------------------+
| 🌡️ PILIH SUHU (Wajib 1) - Radio Button           |
| (•) Ice (Dingin Segar)               [ +Rp 0 ]   |
| ( ) Hot (Hangat)                     [ +Rp 0 ]   |
+--------------------------------------------------+
| 📏 PILIH UKURAN (Wajib 1) - Radio Button         |
| (•) Regular                          [ +Rp 0 ]   |
| ( ) Large                            [ +Rp 5.000]|
+--------------------------------------------------+
| ➕ EXTRA ADD-ONS (Opsional, Pilih Max 3)         |
| [✓] Extra Espresso Shot (1 Shot)     [ +Rp 5.000]|
| [✓] Kopi Jelly Kenyal                [ +Rp 4.000]|
| [ ] Extra Madu Murni                 [ +Rp 3.000]|
| [ ] Extra Krimer Creamy              [ +Rp 3.000]|
+--------------------------------------------------+
| 📝 CATATAN KHUSUS UNTUK BARISTA                  |
| [ Sedikit es & less sugar ya mas               ] |
+--------------------------------------------------+
| [   TAMBAH KE KERANJANG - Rp 33.000 (1 Item)   ] |
+--------------------------------------------------+
```

---

### D. Screen 4: Checkout & Dynamic QRIS Pre-Paid Payment

```text
+--------------------------------------------------+
| 🧾 RINCIAN PESANAN - MEJA 01 (DEWI)              |
+--------------------------------------------------+
| • 1x Kopi Kumpul Santuy (Ice, Large, Extra Shot) |
|   Catatan: Sedikit es & less sugar   Rp 33.000   |
| • 1x Nasi Goreng Rempah (Pedas Sedang, Telur)    |
|   Catatan: Acar dipisah              Rp 37.000   |
| ------------------------------------------------ |
| Subtotal:                            Rp 70.000   |
| Pajak Resto (10%):                   Rp  7.000   |
| TOTAL PEMBAYARAN:                    Rp 77.000   |
+--------------------------------------------------+
| METODE PEMBAYARAN:                               |
| (•) 💳 QRIS Dinamis (BCA, GoPay, OVO, ShopeePay) |
| ( ) 💵 Bayar di Kasir (Tunai / Debit EDC)        |
+--------------------------------------------------+
| [        LANJUTKAN PEMBAYARAN QRIS             ] |
+--------------------------------------------------+
```

---

### E. Screen 5: Dynamic QRIS Popup & Real-Time Tracking

```text
+--------------------------------------------------+
| 📱 BAYAR SEKARANG VIA QRIS                       |
| Order ID: #ORD-20260811-001                      |
| Sisa Waktu Pembayaran: ⏱️ 14:45                   |
+--------------------------------------------------+
|               +------------------+               |
|               |  [ QRIS IMAGE ]  |               |
|               |   NMID: 102938   |               |
|               +------------------+               |
|            Scan dengan Semua E-Wallet            |
+--------------------------------------------------+
| 💡 Setelah bayar, status pesanan otomatis update!|
+--------------------------------------------------+

   ⬇️ (Pemicu WebSocket instan saat Webhook Paid diterima)

+--------------------------------------------------+
| 🎉 PEMBAYARAN BERHASIL (Rp 77.000)               |
| Status Pesanan Meja 01:                          |
|                                                  |
| [✓] 1. Pembayaran Terkonfirmasi (PAID)           |
| [🔄] 2. Sedang Dimasak di Dapur (PREPARING)      |
| [ ] 3. Makanan Diantar ke Meja (SERVED)          |
|                                                  |
| ⏱️ Estimasi Penyajian: 10 - 15 Menit             |
| [          PESAN MENU TAMBAHAN LAINNYA         ] |
+--------------------------------------------------+
```

---

## 🖥️ 2. Tampilan Admin & Staff CMS Kumpul Cafe

Staff CMS mendukung 4 Role RBAC: **ADMIN**, **CASHIER**, **KITCHEN**, dan **WAITER**.

---

### A. Staff Login: `/admin/login`

```text
+--------------------------------------------------+
|               ☕ Kumpul Cafe Portal              |
|                                                  |
|   Email: [ cashier@menuscan.com                ] |
|   Password: [ **********                       ] |
|                                                  |
|   [                  SIGN IN                   ] |
+--------------------------------------------------+
```

---

### B. Kitchen Display System (KDS): `/admin/orders` (Role: `KITCHEN`, `ADMIN`)

Menerima push WebSocket suara lonceng & kartu pesanan baru saat `PAID`.

```text
+-------------------------------------------------------------------------+
| ☕ Kumpul Cafe KDS | 🔔 Live Orders Active: 3 Meja | [ Logout Barista ] |
+-------------------------------------------------------------------------+
| MEJA 01 (#ORD-001) - 16:20 | MEJA 05 (#ORD-002) - 16:22 | MEJA 03 (#003)|
| Pemesan: Dewi              | Pemesan: Rian              | Pemesan: Andi |
| Status: [ 🍳 PREPARING ]   | Status: [ ⏳ PAID ]        | [ 🍳 PREPARING]|
| -------------------------- | -------------------------- | ------------- |
| • 1x Kopi Kumpul (Ice/Lrg) | • 2x Palm Sugar Coffee     | • 1x Burger   |
|   [Notes: Sedikit es]      | • 1x French Fries          | • 1x Fries    |
| • 1x Nasi Goreng (Pedas)   |                            |               |
| -------------------------- | -------------------------- | ------------- |
| [ SIAP DISAJIKAN (SERVED)] | [ MULAI MASAK (PREPARE) ]  | [ SERVED ]    |
+-------------------------------------------------------------------------+
```

---

### C. Cashier & Floor Plan Management: `/admin/tables` (Role: `CASHIER`, `WAITER`, `ADMIN`)

```text
+-------------------------------------------------------------------------+
| ☕ Kumpul Cafe Kasir | Tables | Orders | Reports | [ Logout ]           |
+-------------------------------------------------------------------------+
| 🪑 DENAH MEJA CAFE                                                      |
|                                                                         |
| [ MEJA 01 - OCCUPIED ]   [ MEJA 02 - VACANT ]    [ MEJA 03 - OCCUPIED ] |
| Pemesan: Dewi            | Status: Kosong        | Pemesan: Andi        |
| Bill: Rp 77.000 (PAID)   | [ Cetak QR Code ]     | Bill: Rp 50.000      |
| [ 🔄 RESET MEJA KOSONG ] |                       | [ RESET MEJA ]       |
+-------------------------------------------------------------------------+
```

---

### D. Owner / Admin Analytics & Reports: `/admin/reports` (Role: `ADMIN`)

```text
+-------------------------------------------------------------------------+
| 📊 DASHBOARD OVERVIEW & LAPORAN PENDAPATAN                              |
+-------------------------------------------------------------------------+
| 💰 Total Omset Hari Ini: Rp 3.450.000 | 📦 Total Transaksi: 48 Orders   |
| 👥 Rata-rata Nilai Order: Rp 71.875   | 🪑 Tingkat Keterisian: 80%      |
+-------------------------------------------------------------------------+
| 🏆 TOP 5 MENU PALING LARIS                                              |
| 1. ☕ Kopi Kumpul Santuy (78 porsi)   - Rp 1.872.000                    |
| 2. 🇮🇩 Nasi Goreng Rempah (42 porsi)   - Rp 1.344.000                    |
| 3. ☕ Kopi Genyal (35 porsi)          - Rp 1.050.000                    |
+-------------------------------------------------------------------------+
```
