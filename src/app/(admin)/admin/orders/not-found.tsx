import { OperationalNotFound } from '@/components/common/operational-not-found';

export default function OrdersNotFound() {
  return (
    <OperationalNotFound
      workstationTitle="Kitchen Display (KDS)"
      backUrl="/admin/orders"
      backLabel="Kembali ke Antrean Pesanan KDS"
      description="Pesanan tidak ditemukan atau mungkin sudah selesai diproses dan masuk riwayat."
    />
  );
}
