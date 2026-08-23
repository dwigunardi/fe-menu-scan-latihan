'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { UtensilsCrossed, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedCoffeeCup } from '@/components/illustrations/animated-coffee-cup';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

export default function RootNotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4 sm:p-6 bg-[#FAF7F2] dark:bg-zinc-950 text-foreground transition-colors relative overflow-hidden">
      {/* Subtle background ambient mesh */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-lg w-full bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 border border-stone-200/80 dark:border-zinc-800 shadow-xl shadow-stone-900/5 dark:shadow-black/20 flex flex-col items-center text-center relative z-10"
      >
        {/* Badge */}
        <motion.div variants={itemVariants}>
          <Badge variant="outline" className="px-3.5 py-1 text-xs font-semibold border-amber-300 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
            ☕ Error 404 • Halaman Tidak Ditemukan
          </Badge>
        </motion.div>

        {/* Animated SVG Coffee Cup Illustration */}
        <motion.div variants={itemVariants} className="my-2">
          <AnimatedCoffeeCup className="w-56 h-56 sm:w-64 sm:h-64" />
        </motion.div>

        {/* Title & Description */}
        <motion.div variants={itemVariants} className="space-y-2 max-w-sm">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-zinc-100">
            Ups! Racikan Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400 leading-relaxed">
            Sepertinya tautan QR code sudah berganti atau menu yang Anda tuju sudah tidak tersedia di Kumpul Cafe.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="w-full pt-6 flex flex-col sm:flex-row gap-3">
          <Link href="/menu?table=01" className="w-full">
            <Button size="lg" className="w-full font-semibold shadow-md shadow-amber-600/20 flex items-center justify-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              <span>Buka Menu Kafe</span>
            </Button>
          </Link>
          <Link href="/" className="w-full">
            <Button variant="outline" size="lg" className="w-full font-semibold flex items-center justify-center gap-2">
              <Home className="h-4 w-4" />
              <span>Halaman Depan</span>
            </Button>
          </Link>
        </motion.div>

        {/* Footer Back Hint */}
        <motion.div variants={itemVariants} className="pt-6">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-400 dark:text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke halaman sebelumnya</span>
          </button>
        </motion.div>
      </motion.div>
    </main>
  );
}
