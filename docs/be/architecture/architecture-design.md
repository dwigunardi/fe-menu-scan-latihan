# MenuScan Backend System Architecture Specification

> **Project**: MenuScan – Digital QR Code Menu System & Multi-Branch FnB SaaS  
> **Backend Framework**: NestJS 11 (TypeScript)  
> **Database & ORM**: PostgreSQL 16 & Prisma ORM 7  
> **Validation & Schema**: Zod & `nestjs-zod`  
> **Cache & Distributed Store**: Redis (`ioredis`)  
> **Real-Time Gateway**: WebSockets (`@nestjs/websockets` + Socket.IO)  
> **Security & Auth**: Dual JWT (Access + Refresh Token) & ECDH AES-256-GCM Payload Encryption  
> **Logging**: Structured Step-Tracing Logger (`nestjs-pino`)  
> **Document Location**: `docs/be/architecture/architecture-design.md`  
> **Status**: Up-to-Date Architecture Specification  

---

## 🏛️ 1. Architectural Pattern & Design Principles

Arsitektur aplikasi Backend ini mengadopsi **Feature-Based Modular Architecture** sesuai panduan resmi *NestJS Best Practices* dengan fokus pada skalabilitas, keamanan *Zero-Trust*, dan performa tinggi:

### Prinsip Utama:
1. **High Cohesion, Low Coupling**: Setiap domain bisnis (Auth, Categories, Menus, Tables, Orders, Banners, Reports, Payments) diisolasi dalam modul mandirinya masing-masing.
2. **Layered Lifecycle Pipeline**:
   - **Middleware**: `DecryptPayloadMiddleware` mendekripsi payload request terenkripsi sebelum validasi.
   - **Guards**: `JwtAuthGuard` & `RolesGuard` menegakkan otorisasi berbasis role (`ADMIN`, `CASHIER`, `KITCHEN`, `WAITER`).
   - **Pipes**: `ZodValidationPipe` memvalidasi dan mem-parsing DTO secara runtime.
   - **Interceptors**: `TransformInterceptor` membungkus response terstandar dan `EncryptPayloadInterceptor` mengenkripsi payload keluar.
   - **Exception Filter**: `GlobalExceptionFilter` menangkap ZodError, HttpException, dan PrismaError dengan format seragam.
3. **High-Speed Redis Caching**:
   - Caching katalog menu dan kategori dengan invalidasi otomatis saat ada operasi *create/update/delete*.
   - Penyimpanan sesi handshake ECDH terdistribusi di Redis.
4. **Real-Time Event Dispatching (WebSocket Gateway)**:
   - Namespace `/events` dengan room-based broadcasting (`room:kitchen`, `room:waiter`, `room:table:<number>`).

---

## 📁 2. Complete Directory Structure (`src/`)

```text
src/
├── config/                      # Pengelolaan & Validasi Environment Variable (.env)
│   ├── env.config.ts            # Schema Zod untuk validasi .env
│   └── app.config.ts            # Konfigurasi aplikasi (Port, JWT Secret, Key Expiry)
│
├── common/                      # Module & Utilitas Bersama (Cross-Cutting Concerns)
│   ├── crypto/                  # Kriptografi & Handshake Service
│   │   ├── crypto.service.ts    # AES-256-GCM Encrypt/Decrypt & HKDF Derivation
│   │   ├── ecdh.service.ts      # Pertukaran kunci ECDH (prime256v1)
│   │   └── crypto.module.ts
│   │
│   ├── redis/                   # Redis Cache & Distributed Session
│   │   ├── redis.service.ts     # Redis Client & Helper Methods
│   │   └── redis.module.ts      # @Global() Redis Module
│   │
│   ├── decorators/              # Custom Decorators
│   │   ├── public.decorator.ts       # @Public() -> Bypass JwtAuthGuard
│   │   ├── roles.decorator.ts        # @Roles('ADMIN', 'CASHIER') -> RBAC Access
│   │   ├── skip-encrypt.decorator.ts # @SkipEncryption() -> Bypass Payload Encryption
│   │   └── current-user.decorator.ts # @CurrentUser() -> Extract req.user
│   │
│   ├── filters/                 # Global Exception Handling
│   │   ├── global-exception.filter.ts # Tangkap ZodError, HttpException, & PrismaError
│   │   └── http-exception.filter.ts
│   │
│   ├── guards/                  # Security & RBAC Guards
│   │   ├── jwt-auth.guard.ts    # Memeriksa Access Token
│   │   ├── jwt-refresh.guard.ts # Memeriksa Refresh Token saat /auth/refresh
│   │   ├── handshake.guard.ts   # Memeriksa Keberadaan x-handshake-token
│   │   └── roles.guard.ts       # Role-Based Access Control Validator
│   │
│   ├── interceptors/            # Response Transformation & Encryption
│   │   ├── encrypt-payload.interceptor.ts # Enkripsi Response JSON
│   │   └── transform.interceptor.ts       # Standarisasi JSON Response Wrapper
│   │
│   ├── logger/                  # Step-Tracing Logger Module (nestjs-pino)
│   │   ├── logger.module.ts     # Pino Logger & Redaction Setup
│   │   └── logger.service.ts    # Utility untuk Step Logging
│   │
│   ├── middlewares/             # Request Decryption
│   │   └── decrypt-payload.middleware.ts  # Dekripsi Request Body sebelum masuk Pipe
│   │
│   └── prisma/                  # Database Singleton Module
│       ├── prisma.service.ts    # Lifecycle Hook & Slow Query Logging (>500ms)
│       └── prisma.module.ts     # @Global() Module
│
├── modules/                     # Domain Feature Modules
│   ├── auth/                    # Modul Otentikasi & ECDH Handshake
│   │   ├── dto/                 # HandshakeDto, LoginDto, RefreshTokenDto
│   │   ├── strategies/          # JwtStrategy, JwtRefreshStrategy
│   │   ├── auth.controller.ts   # POST /auth/handshake, /login, /refresh, /logout
│   │   └── auth.service.ts
│   │
│   ├── categories/              # Modul Pengelolaan Kategori
│   │   ├── dto/                 # CreateCategoryDto, UpdateCategoryDto, ReorderDto
│   │   ├── categories.controller.ts # Admin & Public Category Endpoints
│   │   └── categories.service.ts
│   │
│   ├── menus/                   # Modul Pengelolaan Menu & Variasi Bersarang
│   │   ├── dto/                 # CreateMenuDto, UpdateMenuDto, ToggleMenuStatusDto
│   │   ├── menus.controller.ts  # Admin & Public Menu Endpoints
│   │   └── menus.service.ts
│   │
│   ├── tables/                  # Modul Manajemen Meja & Sesi Meja
│   │   ├── dto/                 # CreateTableDto, UpdateTableDto, TableSessionDto
│   │   ├── tables.controller.ts # Admin & Public Table Session & Reset Endpoints
│   │   └── tables.service.ts
│   │
│   ├── table-zones/             # Modul Pengelolaan Zona Meja
│   │   ├── dto/                 # CreateTableZoneDto, UpdateTableZoneDto
│   │   ├── table-zones.controller.ts
│   │   └── table-zones.service.ts
│   │
│   ├── orders/                  # Modul Pesanan & Real-Time KDS
│   │   ├── dto/                 # CreateOrderDto, UpdateOrderStatusDto
│   │   ├── orders.controller.ts # Admin & Public Order Endpoints
│   │   └── orders.service.ts
│   │
│   ├── banners/                 # Modul Banner Promo
│   │   ├── dto/                 # CreateBannerDto, UpdateBannerDto
│   │   ├── banners.controller.ts# Admin & Public Banner Endpoints
│   │   └── banners.service.ts
│   │
│   ├── reports/                 # Modul Laporan & Analitik Penjualan
│   │   ├── reports.controller.ts# /admin/reports/dashboard-overview, /revenue, /top-selling
│   │   └── reports.service.ts   # Aggregation & Revenue Calculation Engine
│   │
│   ├── payments/                # Modul Pembayaran & QRIS Dinamis
│   │   ├── dto/                 # CreateQrisDto, PaymentWebhookDto
│   │   ├── payments.controller.ts # /public/payments/create-qris, /webhook
│   │   └── payments.service.ts
│   │
│   ├── uploads/                 # Modul Upload Media & Gambar
│   │   ├── uploads.controller.ts# POST /admin/uploads/image
│   │   └── uploads.service.ts
│   │
│   └── events/                  # WebSocket Gateway
│       └── events.gateway.ts    # Socket.IO Gateway namespace /events
│
├── app.module.ts                # Root Application Module
└── main.ts                      # Entry Point & Bootstrap Pipeline Setup
```

---

## 🔄 3. Request & Response Lifecycle Flow (Step-Tracing)

```mermaid
flowchart TD
    A[Incoming Encrypted Request] --> B[DecryptPayloadMiddleware]
    
    subgraph Step 1: HTTP_INBOUND & PAYLOAD_DECRYPT
        B -->|Step: HTTP_INBOUND| B1{Handshake Token Valid?}
        B1 -- No --> B2[Throw 401 Handshake Expired]
        B1 -- Yes --> B3[AES-256-GCM Decrypt Payload to req.body]
        B3 -->|Step: PAYLOAD_DECRYPT| C
    end

    C[JwtAuthGuard / RolesGuard]

    subgraph Step 2: SECURITY_AUTH & RBAC
        C -->|Check @Public Decorator| C1{Is Endpoint Public?}
        C1 -- Yes --> D[ZodValidationPipe]
        C1 -- No --> C2{Is Access Token & Role Valid?}
        C2 -- No --> C3[Throw 401 Unauthorized / 403 Forbidden]
        C2 -- Yes -->|Step: SECURITY_AUTH| C4[Attach User Object to req.user] --> D
    end

    subgraph Step 3: VALIDATION_INPUT
        D --> D1{Zod Schema Valid?}
        D1 -- No --> D2[Throw 400 Bad Request / ZodError]
        D1 -- Yes -->|Step: VALIDATION_INPUT| E[Controller & Service Logic]
    end

    subgraph Step 4 & 5: SERVICE_EXECUTION & DATABASE_QUERY
        E -->|Check Redis Cache| E0{Cached in Redis?}
        E0 -- Yes --> E2[Return Cached Data]
        E0 -- No -->|Step: SERVICE_EXECUTION| E1[Prisma Database Query]
        E1 -->|Step: DATABASE_QUERY| E2[Return Raw Response Object & Cache to Redis]
    end

    E2 --> F[EncryptPayloadInterceptor]

    subgraph Step 6 & 7: RESPONSE_ENCRYPT & HTTP_OUTBOUND
        F --> F1{Is @SkipEncryption Present?}
        F1 -- Yes --> H[Send Raw Response]
        F1 -- No -->|Step: RESPONSE_ENCRYPT| F2[AES-256-GCM Encrypt Object with Fresh IV]
        F2 -->|Step: HTTP_OUTBOUND| H[Send Encrypted JSON Response]
    end

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style H fill:#bbf,stroke:#333,stroke-width:2px
```

---

## 🔗 4. Dokumen Terkait

- 📄 Blueprint Operasional Cabang Kafe: [cafe-branch-operational-blueprint.md](file:///d:/code/fe-menu-scan-latihan/docs/be/architecture/cafe-branch-operational-blueprint.md)
- 📄 Spesifikasi Enkripsi Payload: [encryption-decryption-strategy.md](file:///d:/code/fe-menu-scan-latihan/docs/be/security/encryption-decryption-strategy.md)
- 📄 Spesifikasi Step-Tracing Logging: [logging-strategy.md](file:///d:/code/fe-menu-scan-latihan/docs/be/architecture/logging-strategy.md)
- 📄 Spesifikasi Database & Query Strategy: [database-strategy.md](file:///d:/code/fe-menu-scan-latihan/docs/architecture/database-strategy.md)
- 📄 Milestones & Roadmap Backend: [implementation-milestones.md](file:///d:/code/fe-menu-scan-latihan/docs/be/roadmap/implementation-milestones.md)
