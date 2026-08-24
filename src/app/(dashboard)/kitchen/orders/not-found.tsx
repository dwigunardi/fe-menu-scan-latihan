import { OperationalNotFound } from '@/components/common/operational-not-found';

export default function KitchenNotFound() {
  return (
    <OperationalNotFound
      workstationTitle="Kitchen Display (KDS)"
      backUrl="/kitchen/orders"
      backLabel="Kembali ke Antrean Pesanan KDS"
      description="Pesanan tidak ditemukan atau mungkin sudah selesai diproses dan masuk riwayat."
    />
  );
}
