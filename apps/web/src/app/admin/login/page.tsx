import { redirect } from "next/navigation";
import { AdminLoginPage } from "@/features/admin/components/admin-login-page";
import { isAdminAuthenticated, toSafeNextPath } from "@/features/admin/lib/auth";

export default async function AdminLoginRoute({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; next?: string }>;
}) {
  const [params, isAuthenticated] = await Promise.all([searchParams, isAdminAuthenticated()]);
  const nextPath = toSafeNextPath(params?.next);

  if (isAuthenticated) {
    redirect(nextPath ?? "/admin");
  }

  return <AdminLoginPage error={params?.error} nextPath={nextPath} />;
}
