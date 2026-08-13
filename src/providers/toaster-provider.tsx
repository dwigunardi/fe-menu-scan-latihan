'use client';

import { Toaster } from 'sonner';

export function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        className: 'font-sans shadow-lg rounded-2xl border border-stone-200',
        style: {
          background: '#FFFFFF',
          color: '#1C1917',
        },
      }}
    />
  );
}
