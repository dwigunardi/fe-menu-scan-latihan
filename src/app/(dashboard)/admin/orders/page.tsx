'use client';

import { OrdersView } from '@/components/orders';
import { RoleGuard } from '@/components/common/role-guard';
import { ROLE } from '@/lib/constants/roles';

export default function AdminOrdersPage() {
  return (
    <RoleGuard allowedRoles={[ROLE.ADMIN]}>
      <OrdersView
        pageTitle="Log & Monitoring Pesanan Toko"
        pageSubtitle="Pantau seluruh antrean dan riwayat transaksi pesanan dapur secara real-time."
      />
    </RoleGuard>
  );
}
