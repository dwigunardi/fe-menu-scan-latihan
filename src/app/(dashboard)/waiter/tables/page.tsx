'use client';

import { TablesView } from '@/components/admin/tables-view';
import { RoleGuard } from '@/components/common/role-guard';
import { ROLE_GROUPS } from '@/lib/constants/roles';

export default function WaiterTablesPage() {
  return (
    <RoleGuard allowedRoles={ROLE_GROUPS.WAITER_OR_ADMIN}>
      <TablesView
        pageTitle="Denah Meja Pelayan"
        pageSubtitle="Pantau ketersediaan meja, tamu aktif, dan status pelayanan meja kafe."
        allowManagement={false}
      />
    </RoleGuard>
  );
}
