'use client';

import { RoleGuard } from '@/components/common/role-guard';
import { BannerForm } from '@/components/admin/banner-form';

export default function CreateBannerPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <BannerForm mode="create" />
    </RoleGuard>
  );
}
