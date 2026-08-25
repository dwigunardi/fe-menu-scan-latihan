'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  CategoryData,
  CreateCategoryInput,
  CreateCategoryInputSchema,
} from '@/lib/validations/admin-menu.schema';

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
  const createMutation = useCreateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(CreateCategoryInputSchema),
    defaultValues: {
      name: '',
    },
  });

  const categoryNameValue = watch('name') || '';

  const handleCreate = async (data: CreateCategoryInput) => {
    await createMutation.mutateAsync({
      name: data.name.trim(),
      sortOrder: (categories.length || 0) + 1,
    });
    reset({ name: '' });
    onRefresh?.();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus kategori "${name}"?`)) return;

    await deleteMutation.mutateAsync({ id, name });
    onRefresh?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-stone-200 dark:border-zinc-800 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-stone-900 dark:text-zinc-100">
            Kelola Kategori Menu
          </DialogTitle>
          <DialogDescription className="text-stone-500 dark:text-zinc-400">
            Tambah atau hapus kategori untuk mengelompokkan menu kafe.
          </DialogDescription>
        </DialogHeader>

        {/* Create Category Form */}
        <form onSubmit={handleSubmit(handleCreate)} className="mt-3 space-y-1.5">
          <div className="flex gap-2">
            <Input
              placeholder="Nama Kategori Baru..."
              {...register('name')}
              className="rounded-xl bg-stone-50 dark:bg-zinc-800/80 border-stone-200 dark:border-zinc-700"
            />
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              disabled={!categoryNameValue.trim()}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white shrink-0"
            >
              <Plus className="h-4 w-4 mr-1" />
              Tambah
            </Button>
          </div>
          {errors.name && (
            <p className="text-xs font-medium text-rose-500">{errors.name.message}</p>
          )}
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
