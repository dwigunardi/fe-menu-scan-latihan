'use client';

import { TablesView } from '@/components/admin/tables-view';
import { RoleGuard } from '@/components/common/role-guard';

export default function AdminTablesPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <TablesView
        pageTitle="Manajemen Denah Meja & Zona"
        pageSubtitle="Atur kapasitas, fasilitas meja, kelola zona kafe, dan unduh stiker QR code."
        allowManagement={true}
      />
    </RoleGuard>
  );
}
