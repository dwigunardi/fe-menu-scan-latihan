'use client';

import { Grid2X2 } from 'lucide-react';

export default function AdminTablesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-50">
            Denah Meja & Kasir
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Visual floor plan dan 1-tap reset sesi meja kasir.
          </p>
        </div>
      </div>

      <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200 dark:border-zinc-800 text-stone-400">
        <Grid2X2 className="h-10 w-10 mx-auto mb-3 text-emerald-600" />
        <h3 className="font-bold text-base text-stone-800 dark:text-zinc-200">
          Modul Denah Meja Kasir Siap Diintegrasikan
        </h3>
        <p className="text-xs max-w-sm mx-auto mt-1">
          Denah visual Meja 01 - 10 dengan status real-time VACANT / OCCUPIED dan reset meja.
        </p>
      </div>
    </div>
  );
}
