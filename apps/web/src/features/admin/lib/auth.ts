import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminSessionCookieValue,
} from "@darchive/api";

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  return verifyAdminSessionCookieValue(sessionCookie);
}

/** Only same-site paths are honored, so a crafted `next` can't bounce users off-site. */
export function toSafeNextPath(value: unknown) {
  return typeof value === "string" && /^\/(?![/\\])/.test(value) ? value : undefined;
}

export async function requireAdmin(nextPath?: string) {
  if (!(await isAdminAuthenticated())) {
    redirect(nextPath ? `/admin/login?${new URLSearchParams({ next: nextPath })}` : "/admin/login");
  }
}
