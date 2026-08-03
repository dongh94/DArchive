import { AdminPlaceholderPage } from "@/features/admin/components/admin-placeholder-page";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { requireAdmin } from "@/features/admin/lib/auth";

export default async function AdminSettingsRoute() {
  await requireAdmin();

  return (
    <AdminShell activeHref="/admin/settings" title="Settings" description="공통 운영 설정과 권한 관리가 들어올 자리입니다.">
      <AdminPlaceholderPage title="Settings" />
    </AdminShell>
  );
}
