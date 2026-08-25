'use client';

import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RevenueReportData, TopSellingItemData } from '@/lib/validations/reports.schema';
import { formatDateIndo } from '@/lib/utils/date-helpers';
import { toast } from 'sonner';

interface ExportReportButtonProps {
  revenueData?: RevenueReportData;
  topSellingItems?: TopSellingItemData[];
  dateLabel?: string;
  disabled?: boolean;
}

export function ExportReportButton({
  revenueData,
  topSellingItems = [],
  dateLabel = 'Periode',
  disabled,
}: ExportReportButtonProps) {
  const handleExportCSV = () => {
    try {
      const rows: string[][] = [
        ['LAPORAN PENJUALAN & REVENUE KUMPUL CAFE'],
        ['Periode:', dateLabel],
        ['Waktu Export:', new Date().toLocaleString('id-ID')],
        [''],
        ['RINGKASAN REVENUE'],
        ['Total Pendapatan (IDR)', String(revenueData?.totalRevenue ?? 0)],
        ['Total Transaksi', String(revenueData?.totalOrders ?? 0)],
        ['Rata-Rata Nilai Pesanan / AOV (IDR)', String(Math.round(revenueData?.averageOrderValue ?? 0))],
        [''],
        ['DISTRIBUSI STATUS PESANAN'],
        ['Status', 'Jumlah Pesanan'],
      ];

      if (revenueData?.ordersByStatus && revenueData.ordersByStatus.length > 0) {
        revenueData.ordersByStatus.forEach((item) => {
          rows.push([item.status, String(item.count)]);
        });
      } else {
        rows.push(['Tidak ada data', '0']);
      }

      rows.push(['']);
      rows.push(['DAFTAR MENU TERLARIS (TOP SELLING)']);
      rows.push(['Peringkat', 'Nama Menu', 'Kuantitas Terjual', 'Total Pendapatan (IDR)']);

      if (topSellingItems.length > 0) {
        topSellingItems.forEach((item, idx) => {
          rows.push([
            String(idx + 1),
            `"${item.name.replace(/"/g, '""')}"`,
            String(item.totalQuantitySold),
            String(item.totalRevenue),
          ]);
        });
      } else {
        rows.push(['-', 'Tidak ada data', '0', '0']);
      }

      const csvContent = rows.map((r) => r.join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `Laporan_Penjualan_KumpulCafe_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Laporan berhasil diekspor ke format CSV!');
    } catch {
      toast.error('Gagal mengekspor laporan CSV.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={handlePrint}
        className="rounded-xl flex items-center gap-1.5 text-xs font-semibold"
      >
        <Printer className="w-3.5 h-3.5 text-stone-500" />
        <span>Cetak</span>
      </Button>

      <Button
        type="button"
        size="sm"
        disabled={disabled}
        onClick={handleExportCSV}
        className="rounded-xl flex items-center gap-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Ekspor CSV</span>
      </Button>
    </div>
  );
}
