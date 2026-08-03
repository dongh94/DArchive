import { AdminPlaceholderPage } from "@/features/admin/components/admin-placeholder-page";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { requireAdmin } from "@/features/admin/lib/auth";

export default async function AdminProjectsRoute() {
  await requireAdmin();

  return (
    <AdminShell activeHref="/admin/projects" title="Projects" description="앞으로 stock 등 프로젝트 앱의 운영 도구가 들어올 자리입니다.">
      <AdminPlaceholderPage title="Projects admin" />
    </AdminShell>
  );
}
