'use client';

import { OrdersView } from '@/components/orders';
import { RoleGuard } from '@/components/common/role-guard';
import { ROLE_GROUPS } from '@/lib/constants/roles';

export default function KitchenOrdersPage() {
  return (
    <RoleGuard allowedRoles={ROLE_GROUPS.KITCHEN_OR_ADMIN}>
      <OrdersView
        pageTitle="Kitchen Display System (KDS)"
        pageSubtitle="Pantau antrean pesanan dapur secara real-time dan kelola status memasak."
      />
    </RoleGuard>
  );
}
