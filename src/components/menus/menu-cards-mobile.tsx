'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, SlidersHorizontal, ImageOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRupiah } from '@/lib/utils/format-currency';
import { AdminMenuItem } from '@/lib/api/admin-menus-api';
import { AppImage } from '@/components/ui/app-image';

export interface MenuCardsMobileProps {
  menus: AdminMenuItem[];
  isLoading: boolean;
  isTogglePending: boolean;
  isDeletePending: boolean;
  onToggleStock: (menu: AdminMenuItem) => void;
  onDeleteMenu: (id: string, name: string) => void;
}

export function MenuCardsMobile({
  menus,
  isLoading,
  isTogglePending,
  isDeletePending,
  onToggleStock,
  onDeleteMenu,
}: MenuCardsMobileProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-3.5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3"
          >
            <Skeleton className="h-16 w-16 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (menus.length === 0) {
    return (
      <div className="py-12 text-center text-stone-400 bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200/80 md:hidden">
        <SlidersHorizontal className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-xs font-semibold">Tidak ada menu yang sesuai</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:hidden">
      {menus.map((menu) => (
        <div
          key={menu.id}
          onClick={() => router.push(`/admin/menus/detail/${menu.id}`)}
          className="p-3.5 rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 shadow-xs flex items-center gap-3 transition-all cursor-pointer hover:border-amber-400 dark:hover:border-amber-600/50"
        >
          {/* Thumbnail */}
          <div className="h-16 w-16 rounded-2xl overflow-hidden bg-stone-100 dark:bg-zinc-800 shrink-0 border border-stone-200/60 dark:border-zinc-700/60 relative">
            <AppImage
              src={menu.imageUrl}
              alt={menu.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>

          {/* Info & Badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-stone-900 dark:text-zinc-100 truncate">
                {menu.name}
              </h3>
              {menu.isBestSeller && (
                <Badge variant="bestseller" className="text-[8px] px-1 py-0 shrink-0">
                  Best
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-500">
                {menu.category?.name || 'Uncategorized'}
              </span>
              <span className="text-[10px] text-stone-400">
                • {menu.variantGroups?.length || 0} Variasi
              </span>
            </div>
            <div className="font-mono font-bold text-sm text-stone-900 dark:text-zinc-100 mt-1">
              {formatRupiah(menu.price)}
            </div>
          </div>

          {/* Mobile Right Controls: Stock Switch & Actions */}
          <div
            className="flex flex-col items-end gap-2 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-stone-400">
                {menu.isAvailable ? 'Ada' : 'Habis'}
              </span>
              <Switch
                checked={menu.isAvailable}
                onCheckedChange={() => onToggleStock(menu)}
                disabled={isTogglePending}
              />
            </div>

            <div className="flex items-center gap-1">
              <SimpleTooltip content="Edit Menu" side="top">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.push(`/admin/menus/edit/${menu.id}`)}
                  className="h-7 w-7 rounded-xl border border-stone-200 dark:border-zinc-800 text-stone-600 hover:text-amber-600 cursor-pointer"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </SimpleTooltip>
              <SimpleTooltip content="Hapus Menu" side="top">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDeleteMenu(menu.id, menu.name)}
                  disabled={isDeletePending}
                  className="h-7 w-7 rounded-xl border border-stone-200 dark:border-zinc-800 text-stone-400 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </SimpleTooltip>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
