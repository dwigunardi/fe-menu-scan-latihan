'use client';

import { UtensilsCrossed } from 'lucide-react';

export default function AdminKdsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-50">
            Kitchen Display System (KDS)
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Live antrian pesanan dapur & barista.
          </p>
        </div>
      </div>

      <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200 dark:border-zinc-800 text-stone-400">
        <UtensilsCrossed className="h-10 w-10 mx-auto mb-3 text-amber-600" />
        <h3 className="font-bold text-base text-stone-800 dark:text-zinc-200">
          Modul KDS Siap Diintegrasikan
        </h3>
        <p className="text-xs max-w-sm mx-auto mt-1">
          Layar pemrosesan pesanan dapur dengan WebSocket live push dan audio chimes.
        </p>
      </div>
    </div>
  );
}
