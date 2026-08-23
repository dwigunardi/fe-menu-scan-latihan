import { OperationalNotFound } from '@/components/common/operational-not-found';

export default function TablesNotFound() {
  return (
    <OperationalNotFound
      workstationTitle="Denah Meja & Kasir"
      backUrl="/admin/tables"
      backLabel="Kembali ke Denah Meja"
      description="Nomor meja atau sesi meja tidak ditemukan dalam sistem aktif saat ini."
    />
  );
}
