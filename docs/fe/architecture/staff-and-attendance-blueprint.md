# Blueprint & Spesifikasi Smart Absensi & Manajemen Karyawan (Frontend Perspective)

> **Project**: Kumpul Cafe – Digital QR Code Menu System & Multi-Branch FnB SaaS  
> **Target Audience**: Frontend Engineers, Branch Managers, & Staff Workstations  
> **Document Location**: `docs/fe/architecture/staff-and-attendance-blueprint.md`  
> **Status**: APPROVED TECHNICAL BLUEPRINT  

---

## 🎯 1. Overview & Business Needs

Fitur **Manajemen Karyawan (`/admin/staff`)** dan **Smart Absensi (`/admin/attendance` & Workstation Clock-In)** dirancang untuk memecahkan 3 kebutuhan operasional mendesak di cabang kafe:
1. **Master Karyawan**: Pengelolaan profil akun staf, kontak WhatsApp, penugasan role (`ADMIN`, `CASHIER`, `KITCHEN`, `WAITER`), dan status aktif.
2. **Smart Clock-In / Clock-Out**: Absensi mandiri berbasis **Geofencing GPS Radius 100m** dan verifikasi cepat menggunakan **4-Digit PIN**.
3. **Audit & Pengajuan Izin/Sakit/Cuti**: Pengawasan keterlambatan jam kerja dan pengajuan izin/sakit mandiri dengan upload foto surat dokter.

```mermaid
graph TD
    subgraph Staf Workstation (Kasir / Kitchen / Waiter)
        A[Login Workstation] --> B{Sudah Absen Masuk?}
        B -- Belum --> C[Modal Smart Clock-In]
        C --> C1[1. Cek Koordinat GPS Kafe <= 100m]
        C --> C2[2. Input PIN 4-Digit]
        C1 & C2 --> D[Status: HADIR / TERLAMBAT]
        B -- Sudah --> E[Header Badge: Jam Kerja Berjalan]
    end

    subgraph Admin & Supervisor Dashboard
        F[Menu /admin/staff] --> G[CRUD Karyawan, Role, Reset PIN]
        H[Menu /admin/attendance] --> I[Rekap Harian, Filter Tanggal, Ekspor CSV]
    end
```

---

## 📍 2. Geofencing & Haversine Formula (`src/lib/utils/haversine.ts`)

Untuk memastikan kejujuran absensi tanpa titip absen dari rumah:
1. Browser meminta izin lokasi `navigator.geolocation.getCurrentPosition`.
2. Menghitung jarak terhadap titik koordinat GPS cabang kafe:
   $$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{long}}{2}\right)}\right)$$
3. **Validasi Radius**:
   - Jika $\text{Jarak} \le 100\text{ meter}$: **Valid / Boleh Clock-In**.
   - Jika $\text{Jarak} > 100\text{ meter}$: Muncul peringatan *"Lokasi Anda berada X meter dari kafe (Maksimal 100m)"*.
4. **Anti-Mock / Akurasi**: Menolak akurasi GPS yang buram (`accuracy > 50m`).

---

## 📁 3. Struktur Komponen Frontend Baru

```
src/components/
├── staff/                             # Domain Manajemen Karyawan
│   ├── staff-table.tsx                # Tabel master karyawan, badge role, status toggle
│   ├── staff-form-modal.tsx           # Modal create & edit data karyawan
│   ├── staff-pin-modal.tsx            # Modal ganti/reset PIN 4-digit
│   └── index.ts                       # Barrel export
│
└── attendance/                        # Domain Smart Absensi & Time Tracking
    ├── smart-clock-in-modal.tsx       # Modal Clock-In (Radar GPS + 4-Digit PIN Pad)
    ├── leave-request-modal.tsx        # Modal pengajuan Izin / Sakit (+ upload surat dokter)
    ├── attendance-kpi-cards.tsx       # KPI Summary (Hadir, Telat, Izin, Sakit, Alpha)
    ├── attendance-logs-table.tsx      # Tabel log audit supervisor dengan badge jarak & status
    ├── staff-attendance-badge.tsx     # Widget status absensi mandiri di CommonHeader
    └── index.ts                       # Barrel export
```

---

## 🛣️ 4. Halaman & Rute Aplikasi

| Rute | Hak Akses Role | Deskripsi |
| :--- | :--- | :--- |
| **`/admin/staff`** | `ROLE.ADMIN` | Master data seluruh staf cabang |
| **`/admin/attendance`** | `ROLE.ADMIN` | Dashboard audit rekap absensi harian seluruh staf |
| **`/cashier/tables`** | `ROLE_GROUPS.CASHIER_OR_ADMIN` | Workstation Kasir + Trigger Clock-In mandiri |
| **`/kitchen/orders`** | `ROLE_GROUPS.KITCHEN_OR_ADMIN` | Workstation Dapur/KDS + Trigger Clock-In mandiri |
| **`/waiter/tables`** | `ROLE_GROUPS.WAITER_OR_ADMIN` | Workstation Pelayan + Trigger Clock-In mandiri |

---

## 🔒 5. Privasi & Aturan Hak Akses

1. **Self-Service**: Staf non-admin (Kasir, Chef, Waiter) **hanya bisa mengakses data absensi diri sendiri** via `GET /api/v1/staff/attendance/today`.
2. **Audit Supervisor**: Hanya Admin/Manager yang berhak melihat log seluruh karyawan di `/admin/attendance`.
