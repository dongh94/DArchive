import { AdminDashboard } from "@/features/admin/components/admin-dashboard";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { requireAdmin } from "@/features/admin/lib/auth";

export default async function AdminRoute() {
  await requireAdmin();

  return (
    <AdminShell activeHref="/admin" title="Overview" description="DArchive의 운영 영역을 한 곳에서 관리합니다.">
      <AdminDashboard />
    </AdminShell>
  );
}
