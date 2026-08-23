# Frontend Architecture: Branch Outlet App & MicroFrontend Integration

> **Document**: `docs/fe/architecture/saas-branch-app-and-microfrontend.md`  
> **Repository Context**: Branch Outlet Client Engine (`fe-menu-scan-latihan`)  
> **Parent Ecosystem**: Master HQ SaaS SuperApp Platform (`hq.fnbapp.com`)  
> **Status**: MASTER ARCHITECTURE BLUEPRINT  
> **Stack**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Motion v12, Zustand, React Query  

---

## 🏛️ 1. Conceptual Model: Branch Engine vs Master HQ SuperApp

Repository ini (`fe-menu-scan-latihan`) dirancang secara presisi sebagai **MicroFrontend Otonom Berbasis Cabang (Branch Outlet App)**:

```mermaid
flowchart TD
    subgraph Master HQ SaaS SuperApp (Parent Platform)
        HQ_PORTAL["👑 HQ SuperAdmin Portal (hq.fnbapp.com)<br/>Manage Tenants, Global Billing, Multi-Branch P&L"]
        HQ_SSO["🔐 Central SSO Gateway (auth.fnbapp.com)<br/>Universal User Directory & OAuth2/OIDC Tokens"]
    end

    subgraph Branch Outlet Engine (This Repository)
        direction TB
        PUB_MFE["📱 Customer QR Ordering PWA<br/>/menu?table=01, /scan"]
        KDS_MFE["🍳 Kitchen Display System (KDS)<br/>/kitchen/orders"]
        POS_MFE["💳 Cashier & Floor Plan Workstation<br/>/cashier/tables"]
        MGR_MFE["📊 Branch Manager Operations<br/>/admin/dashboard, /admin/menus"]
    end

    HQ_SSO -.->|Issue Tenant-Aware JWT| Branch Outlet Engine
    HQ_PORTAL -.->|Embed or Direct Link with Session Context| Branch Outlet Engine
```

---

## 🧭 2. Kenapa Model "Branch Outlet App" Ini Sangat Kuat?

1. **Performa & Zero Latency di Outlet**:
   - Staf kasir dan dapur tidak dibebani oleh *bundle code* SuperAdmin HQ (grafik billing multi-tenant, manajemen langganan SaaS, dsb).
   - Aplikasi cabang tetap ringan (~150KB bundle) dan ultra-responsif di tablet kasir/dapur murah.
2. **Offline & Edge-Resilient (Tahan Internet Mati)**:
   - Terhubung langsung ke Local Branch Engine (LAN lokal).
   - Pesanan tetap mengalir dari HP tamu $\rightarrow$ KDS Dapur $\rightarrow$ Kasir meskipun jaringan ISP cafe terputus.
3. **Mudah Diintegrasikan oleh HQ SuperApp di Masa Depan**:
   - HQ SuperApp dapat menyematkan (*embed*) atau membuka Branch App via SSO link otomatis:
     `https://bandung-01.fnbapp.com?token=<sso_jwt_token>`

---

## 🗂️ 3. Struktur Route Grouping di Branch App (`src/app/`)

```text
src/app/
├── not-found.tsx                     # 🌍 Global Public 404 (Cangkir Kopi Animasi)
├── page.tsx                          # 🏠 Branch Welcome / QR Demo Gateway
│
├── (auth)/                           # 🔐 Clean URL Auth Group
│   ├── login/page.tsx                # /login -> Universal Staff Login Cabang
│   └── select-branch/page.tsx        # /select-branch -> Pemilihan Cabang (Multi-Branch Staff)
│
├── (public)/                         # 📱 Public Customer Ordering (Mobile-First)
│   ├── menu/page.tsx                 # /menu?table=01 -> QR Menu & Dynamic Modifiers
│   ├── scan/page.tsx                 # /scan -> In-App Table QR Scanner
│   └── layout.tsx                    # Public Mobile-First Shell Layout
│
└── (dashboard)/                      # 🖥️ Internal Operations & Branch Management (RBAC)
    ├── layout.tsx                    # Reusable Dashboard Shell (Header + Dynamic Sidebar + BottomNav)
    ├── not-found.tsx                 # 📊 Dashboard Incident Card 404
    │
    ├── admin/                        # 👑 Scope Branch Manager / Owner
    │   ├── dashboard/page.tsx        # /admin/dashboard -> Omset & KPI Cabang
    │   ├── menus/...                 # /admin/menus -> Toggle Stok & Katalog Cabang
    │   ├── categories/...            # /admin/categories -> Kategori Cabang
    │   └── tables/...                # /admin/tables -> Manajemen Meja Cabang
    │
    ├── kitchen/                      # 🍳 Scope Kitchen Staff
    │   └── orders/page.tsx           # /kitchen/orders -> Live KDS Dapur (Audio Chime)
    │
    ├── cashier/                      # 💳 Scope Cashier Staff
    │   └── tables/page.tsx           # /cashier/tables -> Denah Meja & Kasir POS
    │
    └── waiter/                       # 🤵 Scope Waiter Staff
        └── tables/page.tsx           # /waiter/tables -> Denah Meja Pelayan
```

---

## 🧪 4. Standar Testing Reorganisasi (`test/` Mirroring)

Struktur testing diatur secara terisolasi dan mereplikasi struktur file sumber:

- `src/components/test/...`
- `src/app/test/...`
- `src/hooks/test/...`
- `src/lib/test/...`
- `src/store/test/...`
