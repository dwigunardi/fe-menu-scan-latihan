'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Edit, Trash2, SlidersHorizontal, ImageOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { formatRupiah } from '@/lib/utils/format-currency';
import { AdminMenuItem } from '@/lib/api/admin-menus-api';
import { AppImage } from '@/components/ui/app-image';

export interface MenuTableProps {
  menus: AdminMenuItem[];
  isLoading: boolean;
  isTogglePending: boolean;
  isDeletePending: boolean;
  onToggleStock: (menu: AdminMenuItem) => void;
  onDeleteMenu: (id: string, name: string) => void;
}

export function MenuTable({
  menus,
  isLoading,
  isTogglePending,
  isDeletePending,
  onToggleStock,
  onDeleteMenu,
}: MenuTableProps) {
  const router = useRouter();

  return (
    <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-3xl border border-stone-200/80 dark:border-zinc-800 overflow-hidden shadow-xs">
      <div className="overflow-x-auto scrollbar-thin">
        <Table className="min-w-[850px] w-full text-left text-sm border-collapse">
          <TableHeader className="bg-amber-600 dark:bg-amber-600">
            <TableRow className="border-b border-amber-700/60 dark:border-amber-700/80 bg-amber-600 dark:bg-amber-600 hover:bg-amber-600 dark:hover:bg-amber-600">
              <TableHead className="py-3.5 px-4 min-w-[280px] text-white dark:text-white font-bold">
                Menu Item
              </TableHead>
              <TableHead className="py-3.5 px-4 min-w-[150px] whitespace-nowrap text-white dark:text-white font-bold">
                Kategori
              </TableHead>
              <TableHead className="py-3.5 px-4 min-w-[130px] whitespace-nowrap text-white dark:text-white font-bold">
                Harga (Base)
              </TableHead>
              <TableHead className="py-3.5 px-4 min-w-[130px] whitespace-nowrap text-white dark:text-white font-bold">
                Variasi
              </TableHead>
              <TableHead className="py-3.5 px-4 min-w-[110px] text-center whitespace-nowrap text-white dark:text-white font-bold">
                Status Stok
              </TableHead>
              {/* Sticky Right Column: Aksi Header */}
              <TableHead className="py-3.5 px-4 sticky right-0 z-20 bg-amber-600 dark:bg-amber-600 text-white dark:text-white font-bold min-w-[140px] text-right whitespace-nowrap shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.15)] dark:shadow-[-2px_0_8px_-2px_rgba(0,0,0,0.4)]">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="py-4 px-4 min-w-[280px]">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-4"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="py-4 px-4"><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="py-4 px-4"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="py-4 px-4 text-center"><Skeleton className="h-6 w-11 mx-auto rounded-full" /></TableCell>
                  <TableCell className="py-4 px-4 sticky right-0 z-10 bg-white dark:bg-zinc-900 min-w-[140px] text-right shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[-2px_0_8px_-2px_rgba(0,0,0,0.4)]">
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : menus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-stone-400">
                  <SlidersHorizontal className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold">Tidak ada menu yang sesuai</p>
                </TableCell>
              </TableRow>
            ) : (
              menus.map((menu) => (
                <TableRow
                  key={menu.id}
                  onClick={() => router.push(`/admin/menus/detail/${menu.id}`)}
                  className="group hover:bg-stone-50/60 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
                >
                  {/* Regular Column: Item Name & Thumb */}
                  <TableCell className="py-3.5 px-4 min-w-[280px]">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl overflow-hidden bg-stone-100 dark:bg-zinc-800 border border-stone-200/60 dark:border-zinc-700/60 shrink-0 relative">
                        <AppImage
                          src={menu.imageUrl}
                          alt={menu.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-stone-900 dark:text-zinc-100 truncate">
                            {menu.name}
                          </span>
                          {menu.isBestSeller && (
                            <Badge variant="bestseller" className="text-[9px] px-1.5 py-0.5 shrink-0">
                              Best Seller
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 dark:text-zinc-400 line-clamp-1">
                          {menu.description || 'Tidak ada deskripsi'}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="py-3.5 px-4 whitespace-nowrap min-w-[150px]">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border border-stone-200/50 dark:border-zinc-700/50">
                      {menu.category?.name || 'Uncategorized'}
                    </span>
                  </TableCell>

                  {/* Price */}
                  <TableCell className="py-3.5 px-4 font-mono font-bold text-stone-900 dark:text-zinc-100 whitespace-nowrap min-w-[130px]">
                    {formatRupiah(menu.price)}
                  </TableCell>

                  {/* Variant count */}
                  <TableCell className="py-3.5 px-4 whitespace-nowrap min-w-[130px]">
                    <span className="text-xs text-stone-500 dark:text-zinc-400 font-medium">
                      {menu.variantGroups?.length || 0} Grup Variasi
                    </span>
                  </TableCell>

                  {/* Availability Switch */}
                  <TableCell
                    className="py-3.5 px-4 text-center whitespace-nowrap min-w-[110px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center">
                      <Switch
                        checked={menu.isAvailable}
                        onCheckedChange={() => onToggleStock(menu)}
                        disabled={isTogglePending}
                      />
                    </div>
                  </TableCell>

                  {/* Sticky Right Column: Seamless Action buttons */}
                  <TableCell
                    className="py-3.5 px-4 sticky right-0 z-10 bg-white dark:bg-zinc-900 group-hover:bg-stone-50/90 dark:group-hover:bg-zinc-800 text-right whitespace-nowrap min-w-[140px] shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[-2px_0_8px_-2px_rgba(0,0,0,0.4)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <SimpleTooltip content="Lihat Detail" side="top">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => router.push(`/admin/menus/detail/${menu.id}`)}
                          className="h-8 w-8 rounded-xl border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:text-amber-600 hover:border-amber-500 transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </SimpleTooltip>
                      <SimpleTooltip content="Edit Menu" side="top">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => router.push(`/admin/menus/edit/${menu.id}`)}
                          className="h-8 w-8 rounded-xl border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:text-amber-600 hover:border-amber-500 transition-colors cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </SimpleTooltip>
                      <SimpleTooltip content="Hapus Menu" side="top">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onDeleteMenu(menu.id, menu.name)}
                          disabled={isDeletePending}
                          className="h-8 w-8 rounded-xl border border-stone-200 dark:border-zinc-800 text-stone-400 hover:text-red-600 hover:border-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </SimpleTooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
