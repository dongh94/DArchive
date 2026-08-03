import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import {
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminSessionCookieValue,
} from "./lib/admin-session";

export type CreateContextOptions = {
  headers: Headers;
};

function getCookieValue(headers: Headers, cookieName: string) {
  const cookieHeader = headers.get("cookie");

  if (!cookieHeader) {
    return undefined;
  }

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
}

export async function createTRPCContext({ headers }: CreateContextOptions) {
  const adminSessionCookie = getCookieValue(headers, ADMIN_SESSION_COOKIE_NAME);

  return {
    ip: headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    userAgent: headers.get("user-agent") ?? "unknown",
    isAdmin: verifyAdminSessionCookieValue(adminSessionCookie),
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
