'use client';

import * as React from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  Clock,
  ArrowDownAZ,
  Coins,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@/components/ui/select';
import { CategoryData } from '@/lib/validations/admin-menu.schema';

export interface MenuFilterBarProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  sortBy: 'name' | 'price' | 'rating' | 'createdAt' | 'isAvailable';
  onSortByChange: (value: 'name' | 'price' | 'rating' | 'createdAt' | 'isAvailable') => void;
  sortOrder: 'asc' | 'desc';
  onToggleSortOrder: () => void;
  categories: CategoryData[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

function getSortDirectionInfo(
  sortBy: 'name' | 'price' | 'rating' | 'createdAt' | 'isAvailable',
  sortOrder: 'asc' | 'desc'
): { label: string; tooltip: string } {
  switch (sortBy) {
    case 'name':
      return {
        label: sortOrder === 'asc' ? 'A → Z' : 'Z → A',
        tooltip: sortOrder === 'asc' ? 'Urutan Nama: A ke Z (Klik untuk Z ke A)' : 'Urutan Nama: Z ke A (Klik untuk A ke Z)',
      };
    case 'price':
      return {
        label: sortOrder === 'asc' ? 'Termurah' : 'Termahal',
        tooltip: sortOrder === 'asc' ? 'Urutan Harga: Termurah ke Termahal (Klik untuk Termahal)' : 'Urutan Harga: Termahal ke Termurah (Klik untuk Termurah)',
      };
    case 'rating':
      return {
        label: sortOrder === 'asc' ? 'Terendah' : 'Tertinggi',
        tooltip: sortOrder === 'asc' ? 'Urutan Rating: Terendah ke Tertinggi' : 'Urutan Rating: Tertinggi ke Terendah',
      };
    case 'createdAt':
      return {
        label: sortOrder === 'asc' ? 'Terlama' : 'Terbaru',
        tooltip: sortOrder === 'asc' ? 'Urutan Waktu: Terlama ke Terbaru' : 'Urutan Waktu: Terbaru ke Terlama',
      };
    case 'isAvailable':
      return {
        label: sortOrder === 'asc' ? 'Habis Dulu' : 'Ada Dulu',
        tooltip: sortOrder === 'asc' ? 'Urutan Stok: Menu habis ditampilkan dahulu' : 'Urutan Stok: Menu tersedia ditampilkan dahulu',
      };
  }
}

export function MenuFilterBar({
  searchInput,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onToggleSortOrder,
  categories,
  selectedCategory,
  onSelectCategory,
}: MenuFilterBarProps) {
  const sortDirectionInfo = getSortDirectionInfo(sortBy, sortOrder);

  return (
    <div className="space-y-3">
      {/* Search Input, Sort By Select, and Sort Order Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3.5 top-3 text-stone-400" />
          <Input
            placeholder="Cari menu (misal: Aren, Espresso, Croissant)..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={sortBy}
            onValueChange={(val) => onSortByChange(val as any)}
          >
            <SelectTrigger className="h-10 min-w-[150px] sm:min-w-[170px] text-xs">
              <div className="flex items-center gap-2 truncate">
                <ArrowUpDown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500 shrink-0" />
                <SelectValue placeholder="Urutkan" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="createdAt">
                  <span className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span>Terbaru Dibuat</span>
                  </span>
                </SelectItem>
                <SelectItem value="name">
                  <span className="flex items-center gap-2">
                    <ArrowDownAZ className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span>Nama Menu (A-Z)</span>
                  </span>
                </SelectItem>
                <SelectItem value="price">
                  <span className="flex items-center gap-2">
                    <Coins className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span>Harga</span>
                  </span>
                </SelectItem>
                <SelectItem value="rating">
                  <span className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span>Rating Tertinggi</span>
                  </span>
                </SelectItem>
                <SelectItem value="isAvailable">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span>Ketersediaan Stok</span>
                  </span>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <SimpleTooltip content={sortDirectionInfo.tooltip} side="top">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onToggleSortOrder}
              className="h-10 px-3.5 text-xs font-semibold cursor-pointer gap-2 border border-stone-200 dark:border-zinc-800 bg-stone-50/80 dark:bg-zinc-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-400 dark:hover:border-amber-600 hover:text-amber-700 dark:hover:text-amber-400 text-stone-800 dark:text-zinc-100 transition-all rounded-xl shadow-2xs group"
            >
              {sortOrder === 'asc' ? (
                <ArrowUpNarrowWide className="h-4 w-4 text-amber-600 dark:text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
              ) : (
                <ArrowDownWideNarrow className="h-4 w-4 text-amber-600 dark:text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
              )}
              <span className="font-semibold tracking-tight whitespace-nowrap">{sortDirectionInfo.label}</span>
            </Button>
          </SimpleTooltip>
        </div>
      </div>

      {/* Category Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Button
          type="button"
          variant={selectedCategory === 'ALL' ? 'default' : 'secondary'}
          size="sm"
          onClick={() => onSelectCategory('ALL')}
          className="rounded-full text-xs font-semibold shrink-0 cursor-pointer h-8 px-3.5"
        >
          Semua Menu
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            type="button"
            variant={selectedCategory === cat.id ? 'default' : 'secondary'}
            size="sm"
            onClick={() => onSelectCategory(cat.id)}
            className="rounded-full text-xs font-semibold shrink-0 cursor-pointer h-8 px-3.5"
          >
            {cat.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
