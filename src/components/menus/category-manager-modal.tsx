'use client';

import { SubmitEvent, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleTooltip } from '@/components/ui/tooltip';
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/hooks/queries/use-admin-categories';
import { CategoryData } from '@/lib/validations/admin-menu.schema';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryData[];
  onRefresh?: () => void;
}

export function CategoryManagerModal({
  isOpen,
  onClose,
  categories,
  onRefresh,
}: CategoryManagerModalProps) {
  const [newCategoryName, setNewCategoryName] = useState('');

  const createMutation = useCreateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();

  const handleCreate = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    await createMutation.mutateAsync({
      name: newCategoryName.trim(),
      sortOrder: (categories.length || 0) + 1,
    });
    setNewCategoryName('');
    onRefresh?.();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus kategori "${name}"?`)) return;

    await deleteMutation.mutateAsync({ id, name });
    onRefresh?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-stone-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-stone-900 dark:text-zinc-100">
            Kelola Kategori Menu
          </DialogTitle>
          <DialogDescription className="text-stone-500 dark:text-zinc-400">
            Tambah atau hapus kategori untuk mengelompokkan menu kafe.
          </DialogDescription>
        </DialogHeader>

        {/* Create Category Form */}
        <form onSubmit={handleCreate} className="flex gap-2 mt-3">
          <Input
            placeholder="Nama Kategori Baru..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <Button
            type="submit"
            isLoading={createMutation.isPending}
            disabled={!newCategoryName.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Tambah
          </Button>
        </form>

        {/* Existing Categories List */}
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          <Label className="text-stone-700 dark:text-zinc-300">
            Daftar Kategori ({categories.length})
          </Label>
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 rounded-2xl border border-stone-100 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/40 text-sm"
            >
              <span className="font-semibold text-stone-800 dark:text-zinc-200">
                {category.name}
              </span>
              <SimpleTooltip content="Hapus Kategori" side="left">
                <button
                  type="button"
                  onClick={() => handleDelete(category.id, category.name)}
                  disabled={deleteMutation.isPending}
                  aria-label="Hapus Kategori"
                  className="text-stone-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </SimpleTooltip>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
