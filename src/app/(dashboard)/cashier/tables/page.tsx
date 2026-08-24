'use client';

import { TablesView } from '@/components/admin/tables-view';
import { RoleGuard } from '@/components/common/role-guard';
import { ROLE_GROUPS } from '@/lib/constants/roles';

export default function CashierTablesPage() {
  return (
    <RoleGuard allowedRoles={ROLE_GROUPS.CASHIER_OR_ADMIN}>
      <TablesView
        pageTitle="Denah Meja & Kasir POS"
        pageSubtitle="Pantau status sesi meja, billing tamu, dan reset meja setelah pembayaran."
        allowManagement={true}
      />
    </RoleGuard>
  );
}
