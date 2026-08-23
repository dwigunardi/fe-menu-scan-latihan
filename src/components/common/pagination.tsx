'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@/components/ui/select';

export interface PaginationProps {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  isLoading?: boolean;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  itemLabel?: string;
  className?: string;
}

export function Pagination({
  page,
  limit,
  totalItems,
  totalPages,
  hasNextPage,
  hasPrevPage,
  isLoading = false,
  onPageChange,
  onLimitChange,
  itemLabel = 'item',
  className = '',
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (page - 1) * (limit === -1 ? totalItems : limit) + 1;
  const endItem = limit === -1 ? totalItems : Math.min(page * limit, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 ${className}`}>
      {/* Items range info & Items per page selector */}
      <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-zinc-400">
        <span>
          Menampilkan <strong className="font-semibold text-stone-800 dark:text-zinc-200">{startItem}-{endItem}</strong> dari{' '}
          <strong className="font-semibold text-stone-800 dark:text-zinc-200">{totalItems}</strong> {itemLabel}
        </span>

        <div className="flex items-center gap-1.5 ml-2">
          <span>Per hal:</span>
          <Select
            value={String(limit)}
            onValueChange={(val) => onLimitChange(Number(val))}
          >
            <SelectTrigger className="h-8 w-[76px] px-2 text-xs font-semibold rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="-1">Semua</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Page Navigation Buttons */}
      {limit !== -1 && totalPages > 1 && (
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(page - 1, 1))}
            disabled={!hasPrevPage || isLoading}
            className="h-8 px-2.5 text-xs cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Sebelumnya
          </Button>

          <div className="flex items-center gap-1 px-1">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= page - 1 && pageNum <= page + 1)
              ) {
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'default' : 'secondary'}
                    size="icon"
                    onClick={() => onPageChange(pageNum)}
                    className="h-8 w-8 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    {pageNum}
                  </Button>
                );
              }
              if (pageNum === page - 2 || pageNum === page + 2) {
                return <span key={pageNum} className="text-xs text-stone-400">...</span>;
              }
              return null;
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(page + 1, totalPages))}
            disabled={!hasNextPage || isLoading}
            className="h-8 px-2.5 text-xs cursor-pointer"
          >
            Selanjutnya
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
