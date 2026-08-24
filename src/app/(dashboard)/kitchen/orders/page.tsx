'use client';

import { OrdersView } from '@/components/admin/orders-view';
import { RoleGuard } from '@/components/common/role-guard';

export default function KitchenOrdersPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN', 'KITCHEN', 'DAPUR', 'CASHIER', 'KASIR']}>
      <OrdersView
        pageTitle="Kitchen Display System (KDS)"
        pageSubtitle="Pantau antrean pesanan dapur secara real-time dan kelola status memasak."
      />
    </RoleGuard>
  );
}
