'use client';

import { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TableData } from '@/lib/validations/table.schema';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Download, Printer, QrCode, Sparkles, Coffee } from 'lucide-react';
import { toast } from 'sonner';

interface TableQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableData | null;
}

export function TableQrModal({ isOpen, onClose, table }: TableQrModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!table) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const scanUrl = `${origin}/scan?table=${encodeURIComponent(table.tableNumber)}`;

  // Download high-resolution PNG (300 DPI ready)
  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `QR-Meja-${table.tableNumber}.png`;
    link.href = url;
    link.click();
    toast.success(`Stiker QR Meja "${table.tableNumber}" berhasil diunduh!`);
  };

  // Direct Print Sticker
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-stone-900 dark:text-zinc-100 flex items-center gap-2">
            <QrCode className="h-5 w-5 text-amber-600" />
            Stiker QR Meja {table.tableNumber}
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500 dark:text-zinc-400">
            Stiker permanen untuk diletakkan di atas meja, akrilik, atau disisipkan di bawah kaca meja.
          </DialogDescription>
        </DialogHeader>

        {/* ========================================================= */}
        {/* PRINT-READY STICKER CARD (Tampilan Fisik Siap Cetak) */}
        {/* ========================================================= */}
        <div className="flex justify-center my-2">
          <div
            id="printable-table-qr"
            className="w-full max-w-[280px] bg-gradient-to-b from-[#FFFDF9] to-[#FAF5EC] dark:from-zinc-900 dark:to-zinc-950 p-5 rounded-3xl border-2 border-amber-600/30 shadow-lg flex flex-col items-center text-center space-y-3 print:border-black print:shadow-none"
          >
            {/* Cafe Brand Header */}
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-500">
              <Coffee className="h-4 w-4" />
              <span className="font-bold text-xs uppercase tracking-wider">
                Kumpul Cafe & Resto
              </span>
            </div>

            {/* Table Number Pill */}
            <div className="px-4 py-1 rounded-full bg-amber-600 text-white font-extrabold text-sm tracking-wide shadow-sm shadow-amber-600/30">
              MEJA {table.tableNumber}
            </div>

            {/* Vector High-Quality QR Code */}
            <div className="p-3 bg-white rounded-2xl shadow-xs border border-stone-200/80 flex items-center justify-center">
              <QRCodeSVG
                value={scanUrl}
                size={160}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Hidden Canvas for High-Res PNG Download Export (300 DPI equivalent) */}
            <div className="hidden">
              <QRCodeCanvas
                ref={canvasRef}
                value={scanUrl}
                size={600}
                level="H"
                includeMargin={true}
              />
            </div>

            {/* Instructions Prompt */}
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-stone-800 dark:text-zinc-200">
                Pindai untuk Pesan Menu
              </p>
              <p className="text-[10px] text-stone-500 dark:text-zinc-400">
                Arahkan kamera HP Anda ke kode QR di atas untuk melihat katalog & memesan.
              </p>
            </div>

            {/* Sub-footer wifi info */}
            <div className="pt-2 border-t border-amber-600/10 w-full text-[9px] text-stone-400 flex items-center justify-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-amber-600" />
              <span>Satu QR untuk seluruh sesi meja Anda</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Download PNG & Print */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadPng}
            className="text-xs rounded-xl"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
            Download PNG
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Cetak Stiker Meja
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
