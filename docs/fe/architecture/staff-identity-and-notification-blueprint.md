# Blueprint Arsitektur Identitas Staf, Verifikasi Kontak (Email & WA), dan Notifikasi Siaran (Frontend Perspective)

> **Project**: Kumpul Cafe – Digital QR Code Menu System & Multi-Branch FnB SaaS  
> **Document Location**: `docs/fe/architecture/staff-identity-and-notification-blueprint.md`  
> **Status**: APPROVED ARCHITECTURE BLUEPRINT  

---

## 🎯 1. Executive Summary & Kebutuhan Bisnis

Karyawan cabang (Barista, Chef/Kitchen, Kasir, Waiter) bukan sekadar *role string statis*, melainkan **entitas profil personal nyata** (*Human Identity*) yang didaftarkan oleh Admin/Manager.

Karena seluruh pemberitahuan darurat (misal: *Kafe Tutup Mendadak*, *Perubahan Jam Shift*, *Insiden Operasional*) akan dikirimkan secara otomatis lewat **Email** dan **WhatsApp**, maka **verifikasi kontak ganda (Email & WhatsApp Verification)** menjadi syarat mutlak sistem.

```mermaid
graph TD
    A[Admin Mendaftarkan Staf Baru di /admin/staff] --> B[Input: Nama, Email, No. WA, Role, PIN 4-Digit]
    B --> C[Backend Buat Akun & Generate Token Verifikasi]
    C --> D1[Kirim Link Verifikasi ke Email Staf]
    C --> D2[Kirim OTP / Pesan Sambutan ke WhatsApp Staf]
    
    subgraph Pengalaman Staf (First Login & Daily)
        E[Staf Login via Email & Password] --> F{Sudah Verifikasi Email & WA?}
        F -- Belum --> G[Banner Pengingat: 'Verifikasi Email & WhatsApp Anda']
        F -- Sudah --> H[Akses Penuh Workstation + Notifikasi Siaran Masuk]
    end

    subgraph Notifikasi Siaran Darurat (Broadcast Engine)
        I[Admin Buat Pengumuman: 'Kafe Tutup Besok'] --> J[Pilih Saluran: In-App, Email, WhatsApp]
        J --> K[Otomatis Terkirim ke Seluruh Karyawan Terverifikasi]
    end
```

---

## 🧱 2. Analisis Dampak Perubahan pada Frontend (FE)

### A. Update State Management (`src/store/use-auth-store.ts`)
Tipe data `User` diperluas untuk memuat profil personal lengkap:

```typescript
export interface User {
  id: string;
  name: string;                // Contoh: "Ahmad Syahripudin"
  email: string;               // Contoh: "ahmad@kumpulcafe.com"
  phone: string;               // Format E.164: "+6281234567890"
  role: UserRole;              // 'ADMIN' | 'CASHIER' | 'KITCHEN' | 'WAITER'
  isEmailVerified: boolean;    // Status verifikasi email
  isPhoneVerified: boolean;    // Status verifikasi WhatsApp
  pinCodeSet: boolean;         // Apakah sudah punya PIN 4-digit untuk clock-in
  avatarUrl?: string | null;
  branchId: string;
  joinedAt: string;
}
```

---

### B. Komponen Baru & Pembaruan UI

```
src/
├── components/
│   ├── staff/                         # Domain Manajemen Karyawan
│   │   ├── staff-table.tsx            # Tabel staf dengan badge verifikasi Email & WA
│   │   ├── staff-form-modal.tsx       # Form create staf (Nama, Email, No WA, Role, PIN)
│   │   ├── staff-pin-modal.tsx        # Modal ubah/reset PIN 4-digit
│   │   └── staff-verification-badge.tsx # Badge status verifikasi kontak
│   │
│   ├── profile/                       # Domain Profil Diri Karyawan
│   │   ├── profile-modal.tsx          # Modal profil staf (Edit nama, ganti password, ganti PIN)
│   │   ├── verify-email-card.tsx      # Card instruksi kirim ulang link verifikasi email
│   │   └── verify-phone-modal.tsx     # Modal input OTP WhatsApp 6-digit
│   │
│   └── broadcast/                     # Domain Pengumuman & Siaran Darurat
│       ├── create-broadcast-modal.tsx # Modal kirim pengumuman ke WhatsApp/Email staf
│       └── broadcast-banner.tsx       # Banner pengumuman aktif di workstation
│
└── app/
    ├── (auth)/
    │   ├── verify-email/page.tsx      # Halaman landing klik link verifikasi email
    │   └── verify-phone/page.tsx      # Halaman input OTP WhatsApp
    │
    └── (dashboard)/
        └── admin/
            ├── staff/page.tsx         # Master Karyawan & Status Verifikasi Kontak
            └── announcements/page.tsx # Log riwayat broadcast email/WA
```

---

## 🔒 3. Alur Verifikasi Kontak (Email & WhatsApp)

### 1. Verifikasi Email
- Saat didaftarkan admin, staf menerima email berisi tombol: `https://kumpulcafe.com/verify-email?token=xyz...`.
- Saat diklik $\rightarrow$ Membuka halaman `/verify-email`, memvalidasi token via `POST /api/v1/auth/verify-email`, dan mengubah `isEmailVerified = true`.

### 2. Verifikasi WhatsApp
- Staf menerima pesan WhatsApp resmi: *"Halo Ahmad, kode OTP verifikasi akun Kumpul Cafe Anda adalah: 849201"*.
- Staf memasukkan OTP di modal `VerifyPhoneModal` $\rightarrow$ Memanggil `POST /api/v1/auth/verify-phone-otp` $\rightarrow$ `isPhoneVerified = true`.

---

## 📢 4. Modul Siaran Darurat (*Broadcast & Emergency Announcements*)

Admin / Manager dapat mempublikasikan pengumuman darurat dari `/admin/announcements`:
* **Pilihan Target**: Seluruh Staf, Khusus Kitchen/Barista, Khusus Kasir, atau Khusus Pelayan.
* **Pilihan Saluran (*Multi-Channel*)**:
  1. 📱 **WhatsApp Blast**: Dikirim langsung ke nomor WhatsApp pribadi staf terverifikasi.
  2. 📧 **Email Blast**: Dikirim sebagai email resmi dengan template HTML rapi.
  3. 🖥️ **In-App Toast & Banner**: Muncul di layar workstation KDS/Kasir secara real-time.
