import { AdminShell } from "@/features/admin/components/admin-shell";
import { WeddingAdminPage } from "@/features/admin/components/wedding-admin-page";
import { createServerCaller } from "@/features/admin/lib/api";
import { requireAdmin } from "@/features/admin/lib/auth";

function parsePageParam(value: string | undefined) {
  if (!value) {
    return 1;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

export default async function AdminWeddingRoute({
  searchParams,
}: {
  searchParams?: Promise<{
    afterParty?: string;
    attendance?: string;
    error?: string;
    guestbookPage?: string;
    photoPage?: string;
    q?: string;
    rsvpPage?: string;
  }>;
}) {
  await requireAdmin();

  const filters = await searchParams;
  const caller = await createServerCaller();
  const overview = await caller.admin.weddingOverview({
    afterParty:
      filters?.afterParty === "YES" || filters?.afterParty === "NO" || filters?.afterParty === "UNDECIDED"
        ? filters.afterParty
        : undefined,
    attendance: filters?.attendance === "YES" || filters?.attendance === "NO" ? filters.attendance : undefined,
    guestbookPage: parsePageParam(filters?.guestbookPage),
    photoPage: parsePageParam(filters?.photoPage),
    q: filters?.q,
    rsvpPage: parsePageParam(filters?.rsvpPage),
  });

  return (
    <AdminShell activeHref="/admin/wedding" title="Wedding" description="RSVP, 방명록, 하객 사진을 운영 관점에서 확인합니다.">
      <WeddingAdminPage overview={overview} filters={filters} />
    </AdminShell>
  );
}
