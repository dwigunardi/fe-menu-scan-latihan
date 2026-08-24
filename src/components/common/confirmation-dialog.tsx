'use client';

import { ReactNode } from 'react';
import { LucideIcon, AlertTriangle, AlertCircle, Info, LogOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

export type ConfirmationDialogVariant = 'danger' | 'warning' | 'info';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  variant?: ConfirmationDialogVariant;
  icon?: LucideIcon;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  loadingText?: string;
  children?: ReactNode;
  className?: string;
}

const variantStyles: Record<
  ConfirmationDialogVariant,
  {
    iconBadge: string;
    defaultIcon: LucideIcon;
    confirmButtonVariant: 'destructive' | 'default' | 'secondary' | 'accent';
    confirmButtonClass: string;
  }
> = {
  danger: {
    iconBadge:
      'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200/60 dark:border-red-900/60 shadow-xs',
    defaultIcon: AlertTriangle,
    confirmButtonVariant: 'destructive',
    confirmButtonClass:
      'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 active:bg-red-800',
  },
  warning: {
    iconBadge:
      'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60 shadow-xs',
    defaultIcon: AlertCircle,
    confirmButtonVariant: 'default',
    confirmButtonClass:
      'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 active:bg-amber-800',
  },
  info: {
    iconBadge:
      'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60 shadow-xs',
    defaultIcon: Info,
    confirmButtonVariant: 'default',
    confirmButtonClass:
      'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 active:bg-blue-800',
  },
};

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  variant = 'danger',
  icon,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  isLoading = false,
  loadingText,
  children,
  className,
}: ConfirmationDialogProps) {
  const currentVariant = variantStyles[variant];
  const IconComponent = icon || currentVariant.defaultIcon;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent
        className={cn(
          'w-[94vw] sm:max-w-md p-6 rounded-3xl border border-stone-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden',
          className
        )}
      >
        <DialogHeader className="flex flex-col items-center text-center space-y-3">
          {/* Visual Icon Badge */}
          <div
            className={cn(
              'h-12 w-12 rounded-2xl flex items-center justify-center transition-transform animate-in zoom-in-95 duration-200',
              currentVariant.iconBadge
            )}
          >
            <IconComponent className="h-6 w-6 shrink-0" />
          </div>

          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold text-stone-900 dark:text-zinc-100">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-xs sm:text-sm text-stone-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                {description}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>

        {/* Contextual Children Slot (e.g. preview card, user summary) */}
        {children && <div className="my-2">{children}</div>}

        {/* Action Buttons */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={onClose}
            className="w-full sm:w-auto rounded-2xl border-stone-200 dark:border-zinc-700 text-xs font-semibold h-10 px-4"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={currentVariant.confirmButtonVariant}
            disabled={isLoading}
            isLoading={isLoading}
            loadingText={loadingText}
            onClick={handleConfirm}
            className={cn(
              'w-full sm:w-auto rounded-2xl text-xs font-bold h-10 px-5 transition-all active:scale-[0.98]',
              currentVariant.confirmButtonClass
            )}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
