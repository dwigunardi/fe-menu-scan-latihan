'use client';

import { CashierKioskView } from '@/components/kiosk';
import { RoleGuard } from '@/components/common/role-guard';
import { ROLE_GROUPS } from '@/lib/constants/roles';

export default function CashierKioskPage() {
  return (
    <RoleGuard allowedRoles={ROLE_GROUPS.CASHIER_OR_ADMIN}>
      <CashierKioskView />
    </RoleGuard>
  );
}
