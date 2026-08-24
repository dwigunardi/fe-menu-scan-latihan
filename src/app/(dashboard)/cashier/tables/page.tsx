'use client';

import { TablesView } from '@/components/admin/tables-view';
import { RoleGuard } from '@/components/common/role-guard';

export default function CashierTablesPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN', 'CASHIER', 'KASIR']}>
      <TablesView
        pageTitle="Denah Meja & Kasir POS"
        pageSubtitle="Pantau status sesi meja, billing tamu, dan reset meja setelah pembayaran."
        allowManagement={true}
      />
    </RoleGuard>
  );
}
