import { redirect } from "next/navigation";
import { AdminLoginPage } from "@/features/admin/components/admin-login-page";
import { isAdminAuthenticated } from "@/features/admin/lib/auth";

export default async function AdminLoginRoute({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  const params = await searchParams;

  return <AdminLoginPage error={params?.error} />;
}
