'use client';

import { OrdersView } from '@/components/admin/orders-view';
import { RoleGuard } from '@/components/common/role-guard';

export default function AdminOrdersPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <OrdersView
        pageTitle="Log & Monitoring Pesanan Toko"
        pageSubtitle="Pantau seluruh antrean dan riwayat transaksi pesanan dapur secara real-time."
      />
    </RoleGuard>
  );
}
