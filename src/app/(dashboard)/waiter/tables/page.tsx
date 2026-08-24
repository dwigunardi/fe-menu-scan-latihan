'use client';

import { TablesView } from '@/components/admin/tables-view';
import { RoleGuard } from '@/components/common/role-guard';

export default function WaiterTablesPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN', 'WAITER', 'PELAYAN']}>
      <TablesView
        pageTitle="Denah Meja Pelayan"
        pageSubtitle="Pantau ketersediaan meja, tamu aktif, dan status pelayanan meja kafe."
        allowManagement={false}
      />
    </RoleGuard>
  );
}
