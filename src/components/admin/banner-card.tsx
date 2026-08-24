'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
} from 'lucide-react';
import { BannerData } from '@/lib/validations/banner.schema';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/cn';

interface BannerCardProps {
  banner: BannerData;
  onToggleStatus: (id: string, isActive: boolean) => Promise<void> | void;
  onDelete: (id: string, title: string) => void;
  isToggling?: boolean;
  isDeleting?: boolean;
}

export function BannerCard({
  banner,
  onToggleStatus,
  onDelete,
  isToggling = false,
  isDeleting = false,
}: BannerCardProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    setIsPending(true);
    try {
      await onToggleStatus(banner.id, !banner.isActive);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div
      className={cn(
        'group rounded-3xl border transition-all duration-300 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs hover:shadow-xl flex flex-col',
        banner.isActive
          ? 'border-stone-200/90 dark:border-zinc-800 hover:border-amber-500/50'
          : 'border-stone-200/50 dark:border-zinc-800/50 opacity-80 hover:opacity-100'
      )}
    >
      {/* 16:9 Thumbnail Image Container */}
      <div className="relative aspect-16/9 w-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1">
            <Layers className="h-3 w-3 text-amber-400" />
            <span>Urutan #{banner.sortOrder}</span>
          </span>

          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-colors',
              banner.isActive
                ? 'bg-emerald-500/90 text-white shadow-xs'
                : 'bg-stone-800/80 text-stone-300'
            )}
          >
            {banner.isActive ? 'Tayang (Aktif)' : 'Draft (Nonaktif)'}
          </span>
        </div>

        {/* Bottom Banner Title & Target URL inside Image */}
        <div className="absolute bottom-3 left-3 right-3 space-y-0.5 text-white">
          <h3 className="font-bold text-sm sm:text-base leading-tight drop-shadow-sm line-clamp-1">
            {banner.title}
          </h3>
          {banner.targetUrl && (
            <p className="text-[11px] text-stone-200 flex items-center gap-1 drop-shadow-xs font-mono line-clamp-1">
              <ExternalLink className="h-3 w-3 text-amber-400 shrink-0" />
              <span>{banner.targetUrl}</span>
            </p>
          )}
        </div>
      </div>

      {/* Body Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        {banner.description ? (
          <p className="text-xs text-stone-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {banner.description}
          </p>
        ) : (
          <p className="text-xs text-stone-400 dark:text-zinc-500 italic">
            Tidak ada deskripsi tambahan
          </p>
        )}

        {/* Action Toolbar */}
        <div className="pt-3 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between gap-2">
          {/* Active Switch Pill */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending || isToggling}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border',
              banner.isActive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100'
                : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 border-stone-200 dark:border-zinc-700 hover:bg-stone-200'
            )}
          >
            {banner.isActive ? (
              <>
                <Eye className="h-3.5 w-3.5 text-emerald-600" />
                <span>Aktif</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-stone-400" />
                <span>Nonaktif</span>
              </>
            )}
          </button>

          {/* Edit & Delete Action Buttons */}
          <div className="flex items-center gap-1.5">
            <SimpleTooltip content="Edit Banner" side="top">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Edit Banner"
                onClick={() => router.push(`/admin/banners/edit/${banner.id}`)}
                className="h-8.5 w-8.5 rounded-xl border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:text-amber-600 hover:border-amber-500 transition-colors cursor-pointer"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </SimpleTooltip>

            <SimpleTooltip content="Hapus Banner" side="top">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Hapus Banner"
                disabled={isDeleting}
                onClick={() => onDelete(banner.id, banner.title)}
                className="h-8.5 w-8.5 rounded-xl border border-stone-200 dark:border-zinc-800 text-stone-400 hover:text-red-600 hover:border-red-500 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </SimpleTooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
