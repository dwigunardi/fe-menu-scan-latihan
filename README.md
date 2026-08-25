# ☕ Kumpul Cafe – Frontend Application

Sistem Digital QR Code Menu, Multi-Role POS, Kitchen Display System (KDS), dan Analytics Hub untuk **Kumpul Cafe**.

---

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling & Motion**: Tailwind CSS v4 + Framer Motion (`motion` v12)
- **State Management**: Zustand (Auth, Handshake Session, Cart, Sidebar)
- **Data Fetching & Cache**: TanStack React Query v5 + Native `hardenedFetch`
- **Security**: WebCrypto API (P-256 ECDH + AES-256-GCM Zero-Trust Interceptor Pipeline)
- **Validation**: Zod (Runtime Contract Validation)
- **Testing**: Vitest + React Testing Library (52 test suites, 294 unit tests)

---

## 📖 Developer Documentation & Guidelines

Sebelum mulai menulis kode, seluruh frontend engineer **wajib** membaca panduan dan resep arsitektur berikut:

| Dokumen | Lokasi | Deskripsi |
| :--- | :--- | :--- |
| 📘 **Frontend Developer Handbook** | [`docs/fe/guidelines/frontend-development-handbook.md`](file:///d:/code/fe-menu-scan-latihan/docs/fe/guidelines/frontend-development-handbook.md) | **Wajib Baca**: Aturan baku, resep kode (*recipes*), anti-patterns, dan cara membuat fitur baru. |
| 🏛️ **Frontend Architecture Design** | [`docs/fe/architecture/architecture-design.md`](file:///d:/code/fe-menu-scan-latihan/docs/fe/architecture/architecture-design.md) | Arsitektur domain-first, route groups, dan struktur modul. |
| 🧅 **Interceptor Pipeline Architecture** | [`docs/fe/architecture/interceptor-pipeline-architecture.md`](file:///d:/code/fe-menu-scan-latihan/docs/fe/architecture/interceptor-pipeline-architecture.md) | Detail onion middleware pipeline & mutex token refresh. |
| ☕ **Cafe Branch Operational Blueprint** | [`docs/fe/architecture/cafe-branch-operational-blueprint.md`](file:///d:/code/fe-menu-scan-latihan/docs/fe/architecture/cafe-branch-operational-blueprint.md) | Analisis kebutuhan operasional cabang kafe (*POV Kasir, Barista, Kitchen, Manager*). |
| 🗺️ **Milestones & Roadmap** | [`docs/fe/roadmap/implementation-milestones.md`](file:///d:/code/fe-menu-scan-latihan/docs/fe/roadmap/implementation-milestones.md) | Status pengerjaan fitur dan target milestone. |

---

## ⚡ Quick Start

### 1. Jalankan Development Server
```bash
npm run dev
```
Aplikasi berjalan di [http://localhost:3000](http://localhost:3000).

### 2. Jalankan TypeScript Compiler Check
```bash
npx tsc --noEmit
```

### 3. Jalankan Test Suite (Vitest)
```bash
npm test -- --run
```
