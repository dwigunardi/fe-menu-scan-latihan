# RFC: Rekayasa Arsitektur Presensi Staf — Dari Shared Dropdown Menuju Hybrid Personal Auto-Lock & Authenticated POS Kiosk

> **Status**: DRAFT / ARCHIVED EXPLORATION  
> **Tanggal**: September 2026  
> **Penulis**: Engineering & UX Team (Pair Programming with User)  
> **Topik**: Penguatan Integritas Absensi, Pencegahan Titip Absen (*Anti-Buddy Punching*), dan Desain Kios Presensi Kasir

---

## 1. Latar Belakang & Analisis Masalah (Problem Statement)

### Celah Integritas pada Implementasi Saat Ini
Pada implementasi modal presensi saat ini (`ClockInModal` di `src/components/attendance/clock-in-modal.tsx`), modal menyediakan dropdown `<Select>` terbuka yang memuat seluruh staf aktif di cabang:
```tsx
<Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
  <SelectTrigger>
    <SelectValue placeholder="-- Pilih Staf yang Bertugas --" />
  </SelectTrigger>
  <SelectContent>
    {activeStaffList.map((staff) => (
      <SelectItem key={staff.id} value={staff.id}>
        {staff.name} ({staff.role})
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Dampak Operasional:
1. **Risiko Budaya Titip Absen (*Buddy Punching*)**:
   - Jika seorang staf (misal kasir, waiter, atau barista) mengetahui 4 digit PIN rekannya, staf tersebut dapat dengan mudah memilih nama rekannya di dropdown dan melakukan Clock-In saat rekannya sebenarnya belum tiba di kafe.
2. **Inklaritas Konteks Login**:
   - Pengguna sudah terautentikasi secara personal di aplikasi (misalnya akun Dendi dengan role `CASHIER`), namun modal presensi masih memperlakukan perangkat seolah-olah terminal asing tanpa identitas dengan meminta user mencari namanya sendiri di dropdown.

---

## 2. Visi Solusi Gabungan: Hybrid Personal Auto-Lock & Authenticated POS Kiosk

Berdasarkan diskusi mendalam, pendekatan terbaik adalah menggabungkan **Auto-Lock Personal** dan **Dedicated Authenticated POS Kiosk View**:

```
                                  [ Pengguna Membuka Fitur Presensi ]
                                                   │
                       ┌───────────────────────────┴───────────────────────────┐
                       ▼                                                       ▼
        [ Akun Personal / HP Staf ]                                 [ Tablet Stand Kasir ]
       (Waiter, Kitchen, Barista, dll)                             (Role: CASHIER / ADMIN)
                       │                                                       │
                       ▼                                                       ▼
        ┌─────────────────────────────┐                         ┌─────────────────────────────┐
        │    STRICT PERSONAL LOCK     │                         │   OPSI: MODE KIOS KASIR     │
        │ - Dropdown ditiadakan       │                         │ - Akses cepat beralih ke:   │
        │ - Terkunci ke profil login  │                         │   /pos/attendance-kiosk     │
        │ - Masukkan PIN mandiri      │                         │ - Staf bergantian absen     │
        │ - Geofence GPS Kafe         │                         │ - PIN Kasir untuk keluar    │
        └─────────────────────────────┘                         └─────────────────────────────┘
```

### A. Mode Personal (Strict Auto-Lock)
- **Berlaku untuk**: Seluruh staf yang login di perangkat smartphone / personal masing-masing (Waiter, Kitchen, Staff umum).
- **Perilaku**:
  - Modal presensi **tidak menampilkan dropdown pemilihan nama staf**.
  - Modal otomatis mengunci identitas ke `user.id` dan menampilkan kartu identitas ringkas (Foto Avatar, Nama Lengkap, Badge Role).
  - Staf cukup mengonfirmasi koordinat GPS dalam radius geofence cabang kafe dan mengetikkan 4-digit PIN miliknya.

### B. Mode Kios Presensi Kasir (Authenticated POS Kiosk)
- **Berlaku untuk**: Tablet kasir yang ditempatkan permanen di meja counter kasir kafe.
- **Mengapa tidak menggunakan Public API tanpa login?**
  - Jika dibuat publik tanpa login (`/public/kiosk`), endpoint presensi rentan disalahgunakan (*brute-force* atau serangan bot) karena tidak memiliki session guard.
  - Dengan tetap berada di bawah autentikasi akun Kasir (`CASHIER`), seluruh request tetap terlindungi oleh JWT/Transport Layer dan Geofence GPS, namun UI beralih ke tampilan layar penuh (*kiosk mode*) yang ramah untuk pergantian staf yang datang bergantian.
- **Mekanisme Keluar dari Kios**:
  - Untuk kembali dari mode Kios ke antarmuka POS kasir normal, diperlukan input PIN kasir yang sedang bertugas guna mencegah staf lain mengotak-atik transaksi kasir.

---

## 3. Arsip Pertanyaan & Diskusi Desain (/grill-me Exploration)

Berikut adalah rekapitulasi poin-poin krusial yang dibedah selama wawancara desain:

### Pertanyaan 1: Hak Pemilihan Nama Staf
- **Dilema**: Apakah modal presensi harus selalu mengunci akun yang login, atau haruskah ada fleksibilitas untuk perangkat bersama di toko?
- **Temuan**:
  - Menghapus dropdown secara total untuk semua perangkat akan menyulitkan staf kafe yang tidak memegang smartphone saat jam kerja dan mengandalkan tablet kasir sebagai mesin absensi bersama toko.
  - Namun membiarkan dropdown bebas di semua perangkat membuka celah titip absen.
  - **Kesimpulan**: Perlu membedakan antara *Personal Device* (terkunci) dan *Shared Store Kiosk* (bisa bergantian).

### Pertanyaan 2: Pengenalan Perangkat Kasir vs Risiko Keamanan
- **Dilema**: Bagaimana sistem tahu bahwa suatu browser adalah tablet toko tanpa menimbulkan risiko keamanan?
  - *Opsi A (localStorage toggle by Admin)*: Membutuhkan Admin untuk login di tablet toko. **Risiko**: Hak akses Admin (data omset, ganti gaji, ubah cabang) tertinggal di perangkat toko yang bisa diakses sembarang staf.
  - *Opsi B (Akun role baru KIOSK_DEVICE)*: Membutuhkan migrasi skema database dan backend baru.
- **Temuan & Arahan Pengguna**:
  - Tablet kasir pada praktiknya login dengan akun staf ber-role **`CASHIER`** (bukan Admin). Ini sudah aman dari sisi hak akses karena role kasir tidak memiliki izin ke menu konfigurasi sensitif.
  - Dari akun kasir tersebut, fitur Mode Kios dapat diaktifkan tanpa harus memberikan hak istimewa Admin.

### Pertanyaan 3: Alur Kerja Kios vs Keamanan API
- **Dilema**: Apakah Kios dibuat sebagai halaman publik atau tetap di dalam aplikasi?
  - Halaman publik tanpa login berisiko membuka API presensi ke publik (*unauthenticated public attack surface*).
  - **Solusi Ideal**: Kios adalah rute khusus yang diaktifkan di bawah session Kasir (`/admin/kiosk` atau `/pos/attendance-kiosk`), sehingga aman, terautentikasi, namun UX-nya didedikasikan untuk operasional absensi kafe.

---

## 4. Daftar Pertanyaan & Skenario Lanjutan (Next Questions & Edge Cases)

Saat fitur ini siap diimplementasikan pada roadmap mendatang, berikut adalah daftar pertanyaan lanjutan yang perlu diselesaikan:

### Q1: Tampilan UI Kios Toko
1. Apakah Kios Toko berupa:
   - **Opsi A**: Modal pop-up layar penuh (*Full-screen Dialog*) di atas tampilan POS Kasir.
   - **Opsi B**: Halaman mandiri terdedikasi (`src/app/(dashboard)/kiosk/page.tsx`) dengan jam digital besar, status buka toko, radar GPS live, dan grid foto/avatar staf untuk tap cepat.
   *(Rekomendasi: Opsi B memberikan kesan profesional dan modern seperti sistem presensi hospitality kelas atas).*

### Q2: Proteksi Keluar dari Mode Kios (*Exit Guard*)
2. Bagaimana kasir kembali dari Mode Kios ke sistem kasir?
   - Menggunakan tombol gembok di pojok atas yang mewajibkan input PIN Kasir aktif sebelum menutup mode Kios. Hal ini menjamin staf lain yang sedang absen tidak bisa membuka data kasir atau transaksi.

### Q3: Penanganan Staf Baru Tanpa PIN
3. Jika ada staf baru yang belum mengatur PIN 4 digit:
   - Apakah sistem meminta pembuatan PIN awal saat pertama kali absen?
   - Atau pembuatan PIN wajib dilakukan melalui Admin / link registrasi awal?

### Q4: Indikator Waktu & Status Shift Real-Time
4. Pada tampilan Kios, apakah perlu ditampilkan:
   - Daftar staf yang **Sedang Bertugas (Active On-Duty)** hari ini?
   - Indikator peringatan jika staf absen terlalu cepat (> 30 menit sebelum shift) atau terlambat melebihi *Late Grace Period*?

---

## 5. Rencana Langkah Implementasi (Proposed Future Implementation Plan)

```
Phase 1: Personal Auto-Lock (Quick Win & Anti-Titip Absen)
  ├── Baca user aktif dari useAuthStore() di ClockInModal.
  ├── Jika user.role !== 'ADMIN', kunci selectedStaffId = user.id.
  └── Sembunyikan Select dropdown dan ganti dengan kartu profil staf aktif.

Phase 2: Cashier Kiosk View Route (/admin/kiosk)
  ├── Buat halaman Kiosk Layar Penuh dengan jam analog/digital & status toko.
  ├── Tampilkan avatar grid staf untuk dipilih dengan 1-tap.
  ├── Numpad PIN responsif dan animasi konfirmasi kehadiran.
  └── Exit modal dengan proteksi PIN kasir.

Phase 3: Security & Offline Fallback Audit
  ├── Validasi geofence caching untuk area kasir dengan sinyal GPS indoor lemah.
  └── Notifikasi suara/chime saat presensi berhasil tercatat.
```
