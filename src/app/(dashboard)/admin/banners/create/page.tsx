'use client';

import { RoleGuard } from '@/components/common/role-guard';
import { ROLE } from '@/lib/constants/roles';
import { BannerForm } from '@/components/admin/banner-form';

export default function CreateBannerPage() {
  return (
    <RoleGuard allowedRoles={[ROLE.ADMIN]}>
      <BannerForm mode="create" />
    </RoleGuard>
  );
}
