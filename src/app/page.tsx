import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200/80 shadow-sm flex flex-col items-center gap-6">
        <Badge variant="bestseller" className="px-3 py-1 text-xs">
          ☕ Kumpul Cafe System Ready
        </Badge>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Kumpul Cafe
          </h1>
          <p className="text-sm text-stone-500 leading-relaxed">
            Boilerplate & Core Infrastructure siap digunakan. Sistem dilengkapi WebCrypto Zero-Trust, Monad Either, Zod Contract Hardening, dan Sonner Toast UX.
          </p>
        </div>

        <div className="w-full pt-2 flex flex-col gap-3">
          <Link href="/menu?table=01" className="w-full">
            <Button size="lg" className="w-full">
              Buka Menu Publik (Meja 01)
            </Button>
          </Link>
          <Link href="/admin/login" className="w-full">
            <Button variant="outline" size="default" className="w-full">
              Portal Staf & Kasir
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
