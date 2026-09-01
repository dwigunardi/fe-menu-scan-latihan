'use client';

import React from 'react';
import { ConfirmationDialog } from './confirmation-dialog';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';

export interface UnsavedChangesDialogProps {
  isDirty: boolean;
  enabled?: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

export function UnsavedChangesDialog({
  isDirty,
  enabled = true,
  title = 'Perubahan Belum Disimpan',
  description = 'Anda memiliki perubahan formulir yang belum disimpan. Jika meninggalkan halaman ini sekarang, perubahan tersebut akan dibuang.',
  confirmText = 'Lanjutkan Keluar',
  cancelText = 'Tetap di Sini',
}: UnsavedChangesDialogProps) {
  const { isOpen, confirmLeave, cancelLeave } = useUnsavedChangesGuard({
    isDirty,
    enabled,
  });

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={cancelLeave}
      onConfirm={confirmLeave}
      title={title}
      description={description}
      variant="warning"
      confirmText={confirmText}
      cancelText={cancelText}
    />
  );
}
