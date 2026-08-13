# Design System: Kumpul Cafe – Digital QR Menu & Ordering System

> **Brand**: Kumpul Cafe  
> **Target Platforms**: Mobile-First QR Web App (PWA) & Staff / Kitchen CMS Portal  
> **Component System**: shadcn/ui Architecture + Radix UI Primitives  
> **Styling Engine**: Tailwind CSS v4  
> **Design Skills Referenced**: `taste-design`, `design-systems`, `shadcn-ui`, `design-md`  
> **Document Location**: `d:\code\fe-menu-scan-latihan\DESIGN.md`  

---

## 1. Visual Theme & Atmosphere

**Kumpul Cafe** memadukan estetika *modern specialty coffeehouse* bernuansa hangat (*warm Scandinavian coffee bar*) dengan ketepatan fungsional aplikasi pemesanan digital kelas atas.

- **Vibe**: Hangat, mengundang, taktil, dan bersih (*warm, artisanal, tactile, and appetizing*). Mengingatkan pada aroma espresso segar, susu oat creamy, dan tekstur kertas menu kafe premium.
- **Density Spectrum**:
  - **Customer Ordering View (Mobile-First)**: *Daily App Balanced* (Level 5) — Spasi lega yang nyaman disentuh jempol, foto menu menggugah selera, dan hierarki harga yang transparan.
  - **Kitchen Display System & Admin CMS**: *Cockpit Dense* (Level 8) — Kartu pesanan kontras tinggi, navigasi keyboard/tap cepat untuk barista dan kasir yang sibuk.
- **Variance & Structure**: Asymmetric visual balance, card overlays lembut, dan tipografi track-tight yang modern.

---

## 2. Three-Tier Token Architecture

Mengadopsi **Three-Tier Token Architecture** (`primitives` $\rightarrow$ `semantic` $\rightarrow$ `component`) agar theming dan kustomisasi dapat dikelola secara modular:

### A. Tier 1: Primitive Tokens (Raw Palette)
```typescript
export const primitives = {
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706', // Primary Brand Roast
    700: '#B45309',
    900: '#78350F',
  },
  stone: {
    50: '#FAF7F2',  // Cream Oat Milk Canvas
    100: '#F5EFEB',
    200: '#E7E0D8',
    400: '#A8A29E',
    500: '#78716C', // Muted Roast Text
    800: '#292524',
    900: '#1C1917', // Charcoal Ink
    950: '#0C0A09',
  },
  emerald: {
    500: '#10B981',
    600: '#059669', // Success Paid Status
  },
  red: {
    500: '#EF4444',
    600: '#DC2626', // Out of Stock Alert
  },
  radius: {
    sm: '0.375rem', // 6px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1rem',     // 16px
    '2xl': '1.25rem',// 20px
    '3xl': '1.5rem', // 24px (Cards)
    full: '9999px', // Pill Buttons
  },
};
```

### B. Tier 2: Semantic Tokens (CSS Variables in `app/globals.css`)
```css
@layer base {
  :root {
    --background: #FAF7F2;          /* Canvas Cream */
    --surface: #FFFFFF;             /* Pure White Container */
    --surface-elevated: #FFFFFF;
    
    --foreground: #1C1917;          /* Charcoal Ink */
    --foreground-muted: #78716C;    /* Muted Roast */
    
    --primary: #D97706;             /* Golden Amber Roast */
    --primary-foreground: #FFFFFF;
    --primary-hover: #B45309;
    
    --border: rgba(214, 207, 197, 0.45); /* Whisper Line */
    --ring: #D97706;
    
    --success: #059669;
    --destructive: #DC2626;
  }

  .dark, [data-theme="kds"] {
    --background: #18181B;          /* Dark Espresso Backing for Kitchen */
    --surface: #27272A;             /* Zinc-800 KDS Card */
    --surface-elevated: #3F3F46;
    
    --foreground: #F4F4F5;
    --foreground-muted: #A1A1AA;
    
    --primary: #F59E0B;
    --primary-foreground: #18181B;
    --primary-hover: #D97706;
    
    --border: #3F3F46;
    --ring: #F59E0B;
  }
}
```

### C. Tier 3: Component Tokens (shadcn/ui Styling)
- **`button.primary`**: `bg-primary text-primary-foreground hover:bg-primary-hover active:scale-[0.98]`
- **`card.menu`**: `bg-surface rounded-3xl border border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)]`
- **`drawer.modifier`**: `bg-surface rounded-t-[32px] border-t border-border`

---

## 3. Typography Architecture

- **Display & Headlines**: `Plus Jakarta Sans` / `Outfit`
  - Karakter: Geometris, sudut lembut ramah, track-tight (`letter-spacing: -0.02em`).
  - Hierarki: Penekanan hierarki melalui ketebalan font (*SemiBold 600* & *Bold 700*) dan kontras warna, bukan sekadar ukuran raksasa.
- **Body Text & Controls**: `Plus Jakarta Sans`
  - Karakter: Line-height rileks (`leading-relaxed`), panjang baris maksimal 65 karakter, warna Muted Roast (`#78716C`).
- **Tabular Data & Numbers**: `JetBrains Mono` / `Geist Mono`
  - Digunakan untuk: Format mata uang Rupiah (`Rp 28.000`), nomor pesanan (`#ORD-20260811-001`), dan countdown timer QRIS (`⏱️ 14:45`).
- **Banned Fonts**: `Inter`, generic serif (`Times New Roman`, `Georgia`, `Garamond`), dan generic system fonts.

---

## 4. shadcn/ui Component Architecture & Composition

Mengikuti prinsip **Composition Over Configuration** dari referensi `design-systems` & `shadcn-ui`. Membangun komponen modular menggunakan Radix UI primitives:

### A. Primitive UI Components (`components/ui/`)
1. **`Button` (`components/ui/button.tsx`)**:
   - Varian via `cva`: `default` (Golden Amber), `secondary` (Cream tint), `outline` (Whisper border), `ghost`, `destructive`.
   - Sizes: `sm`, `default` (44px touch target), `lg` (52px checkout CTA), `icon`.
   - Menggunakan `asChild` slot pattern untuk fleksibilitas render Link Next.js.
2. **`Dialog` / `Modal` (`components/ui/dialog.tsx`)**:
   - Compound components: `Dialog.Root`, `Dialog.Trigger`, `Dialog.Content`, `Dialog.Header`, `Dialog.Title`, `Dialog.Description`, `Dialog.Footer`.
   - Digunakan untuk QRIS Payment Popup dan Konfirmasi Gabung Meja Terisi.
3. **`Drawer` (`components/ui/drawer.tsx`)**:
   - Berbasis primitive `vaul` untuk interaksi *bottom-sheet drag-to-dismiss* yang mulus di smartphone.
   - Digunakan untuk **Menu Modifier Modal** dan **Cart Summary Drawer**.
4. **`Badge` (`components/ui/badge.tsx`)**:
   - Varian: `bestseller` (Amber-600 fill), `rating` (Stone-100 pill), `paid` (Emerald-100 + text-Emerald-700), `preparing` (Blue-100), `outofstock` (Red-100 + text-Red-700).
5. **`RadioGroup` & `Checkbox` (`components/ui/radio-group.tsx` & `checkbox.tsx`)**:
   - Radio: Pilihan wajib variasi (Suhu Hot/Ice, Ukuran Regular/Large).
   - Checkbox: Extra Add-ons (Topping) dengan *disable state* otomatis saat `maxSelect` tercapai.
6. **`Switch` (`components/ui/switch.tsx`)**:
   - Fast toggle ketersediaan item menu di Admin/Staff CMS.
7. **`Skeleton` (`components/ui/skeleton.tsx`)**:
   - Shimmer loader dengan background `bg-stone-200/60 animate-pulse` yang persis mencerminkan ukuran kartu menu.

---

## 5. Domain Component Patterns (Kumpul Cafe)

### A. Menu Card (`components/public/menu-card.tsx`)
```tsx
<article className="group relative flex gap-4 p-4 bg-surface rounded-3xl border border-border shadow-sm hover:shadow-md transition-all">
  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
    <Image src={imageUrl} alt={name} fill className="object-cover group-hover:scale-105 transition-transform" />
    {isBestSeller && <Badge variant="bestseller" className="absolute top-2 left-2">Best Seller</Badge>}
  </div>
  <div className="flex flex-1 flex-col justify-between">
    <div>
      <h3 className="font-semibold text-foreground tracking-tight">{name}</h3>
      <p className="text-xs text-foreground-muted line-clamp-2 mt-0.5">{description}</p>
    </div>
    <div className="flex items-center justify-between mt-2">
      <span className="font-mono font-bold text-foreground">{formatRupiah(price)}</span>
      <Button size="sm" onClick={onOpenModifier} disabled={!isAvailable}>
        {hasVariants ? "+ Kustom" : "+ Tambah"}
      </Button>
    </div>
  </div>
</article>
```

### B. Menu Modifier Bottom Drawer (`components/public/menu-modifier-modal.tsx`)
- Compound Drawer layout dengan 4 bagian terstruktur:
  1. **Header**: Foto hero menu, nama, rating bintang, dan harga dasar.
  2. **Mandatory Groups (Radio)**: Pilihan Suhu (`Hot` / `Ice`) & Ukuran (`Regular` / `Large`).
  3. **Optional Add-ons (Checkbox)**: Checkbox list topping dengan label *"Pilih Maksimal {maxSelect}"*.
  4. **Special Notes Textarea**: Catatan barista (*"Kurangi es, gula dipisah"*).
  5. **Sticky Sticky Footer**: Tombol CTA besar yang menghitung total harga real-time: `Base Price + Σ(Extra Prices)`.

---

## 6. Layout & Spacing Principles

1. **Mobile-First Container Constraint**:
   - Untuk antarmuka pelanggan QR Menu, seluruh layout dibatasi pada `max-w-md` (maksimal 448px) dan dipusatkan di layar desktop dengan latar belakang luar bernuansa warm cafe mockup.
2. **Viewport Height Standard**:
   - Seluruh section layar penuh menggunakan `min-h-[100dvh]` (menghindari bug loncatan *toolbar* pada browser mobile iOS Safari / Android Chrome).
3. **Touch Target Size**:
   - Seluruh tombol, switch, dan opsi pilihan memiliki area sentuh minimal **44x44px** untuk kenyamanan jari pelanggan.

---

## 7. Motion & Interaction Engine

1. **Spring Physics**:
   - Transisi drawer dan modal menggunakan pegas alami (`stiffness: 120, damping: 18`).
2. **Live Pulse Indicators**:
   - Titik hijau/kuning berkedip lembut (*infinite pulse animation*) pada status pesanan live tracking dan indikator meja terisi.
3. **Hardware Acceleration**:
   - Semua animasi hanya memanipulasi properti `transform` dan `opacity` untuk menjamin rendering 60fps yang mulus.

---

## 8. Explicit Anti-Patterns (Banned AI Clichés)

- ❌ **DILARANG** menggunakan warna gradien neon ungu/biru (*AI Slop Aesthetic*).
- ❌ **DILARANG** menggunakan font generic `Inter` atau `Times New Roman`.
- ❌ **DILARANG** menggunakan warna hitam pekat `#000000` (Gunakan Charcoal Ink `#1C1917`).
- ❌ **DILARANG** menggunakan bayangan neon berpendar (*outer glow drop shadows*).
- ❌ **DILARANG** menggunakan layout kartu 3 kolom kaku yang membosankan di mobile.
- ❌ **DILARANG** membiarkan foto menu tanpa fallback placeholder yang estetik.
- ❌ **DILARANG** menampilkan teks generic ("Lorem ipsum", "John Doe", "Acme Cafe").
- ❌ **DILARANG** membuat teks bertumpuk di atas elemen lain tanpa pemisahan spasial yang bersih.
