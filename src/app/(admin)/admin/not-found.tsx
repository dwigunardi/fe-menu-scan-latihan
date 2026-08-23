'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { AlertTriangle, LayoutDashboard, BookOpen, ArrowLeft, Clock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminNotFound() {
  const pathname = usePathname();
  const [mountedTime, setMountedTime] = useState<string>('');

  useEffect(() => {
    setMountedTime(
      new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    );
  }, []);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-6 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-xl w-full bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-zinc-800 shadow-xl shadow-stone-900/5 dark:shadow-black/20"
      >
        {/* Header Icon with Amber Pulse */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-zinc-800/80 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{
                scale: [1, 1.08, 1],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs"
            >
              <AlertTriangle className="h-6 w-6" />
            </motion.div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Halaman Admin Tidak Ditemukan</span>
              </h1>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Resource atau rute manajemen internal yang dituju tidak valid.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-mono text-[11px]">
            HTTP 404
          </Badge>
        </div>

        {/* Technical Incident Card */}
        <div className="rounded-2xl bg-stone-50 dark:bg-zinc-800/60 border border-stone-200/70 dark:border-zinc-700/60 p-4 space-y-2.5 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 dark:text-zinc-300">
            <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>Laporan Akses Terputus:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-500 dark:text-zinc-400">
            <div className="truncate">
              <span className="font-medium text-stone-700 dark:text-zinc-300">Path: </span>
              <code className="font-mono text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded text-[11px]">
                {pathname || '/admin/*'}
              </code>
            </div>
            {mountedTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-stone-400" />
                <span>Waktu Kejadian: {mountedTime} WIB</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/admin/dashboard" className="w-full">
            <Button size="lg" className="w-full font-semibold flex items-center justify-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span>Kembali ke Dashboard</span>
            </Button>
          </Link>
          <Link href="/admin/menus" className="w-full">
            <Button variant="outline" size="lg" className="w-full font-semibold flex items-center justify-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Katalog Menu</span>
            </Button>
          </Link>
        </div>

        {/* Back Link */}
        <div className="pt-5 text-center">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke menu sebelumnya</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
