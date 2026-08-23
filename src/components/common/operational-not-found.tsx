'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { AlertCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OperationalNotFoundProps {
  workstationTitle: string;
  backUrl: string;
  backLabel?: string;
  description?: string;
}

export function OperationalNotFound({
  workstationTitle,
  backUrl,
  backLabel,
  description = 'Data atau pesanan yang Anda tuju sudah diproses, dibatalkan, atau tautan tidak valid.',
}: OperationalNotFoundProps) {
  const returnLabel = backLabel || `Kembali ke ${workstationTitle}`;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-zinc-800 shadow-lg shadow-stone-900/5 dark:shadow-black/20 text-center flex flex-col items-center"
      >
        {/* Compact Alert Icon */}
        <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-xs">
          <AlertCircle className="h-6 w-6" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-stone-900 dark:text-zinc-100 mb-1.5">
          Halaman Tidak Ditemukan
        </h2>

        {/* Concise Description */}
        <p className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400 max-w-xs mb-6 leading-relaxed">
          {description}
        </p>

        {/* Single Primary Action Button */}
        <Link href={backUrl} className="w-full mb-3">
          <Button size="lg" className="w-full font-bold shadow-md shadow-amber-600/20 flex items-center justify-center gap-2">
            <RotateCcw className="h-4 w-4" />
            <span>{returnLabel}</span>
          </Button>
        </Link>

        {/* Quick Back */}
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-300 transition-colors cursor-pointer py-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke layar sebelumnya</span>
        </button>
      </motion.div>
    </div>
  );
}
