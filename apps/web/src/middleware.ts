import { NextResponse, type NextRequest } from "next/server";

const WEDDING_ONLY_PATHS = ["/wedding", "/admin"] as const;

type SitePublicMode = "full" | "wedding-only";

function getSitePublicMode(): SitePublicMode {
  const configured = process.env.SITE_PUBLIC_MODE;

  if (configured === "full" || configured === "wedding-only") {
    return configured;
  }

  // Vercel production stays wedding-only unless SITE_PUBLIC_MODE=full is set.
  if (process.env.VERCEL_ENV === "production") {
    return "wedding-only";
  }

  return "full";
}

function isAllowedInWeddingOnlyMode(pathname: string) {
  return WEDDING_ONLY_PATHS.some(
    (publicPath) => pathname === publicPath || pathname.startsWith(`${publicPath}/`),
  );
}

export function middleware(request: NextRequest) {
  if (getSitePublicMode() === "full") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (isAllowedInWeddingOnlyMode(pathname)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/wedding";
  redirectUrl.search = "";

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|audio|fonts).*)"],
};
