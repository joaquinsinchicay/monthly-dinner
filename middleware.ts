import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/register"];
const ONBOARDING_PATHS = ["/onboarding", "/onboarding/new-group"];

export async function middleware(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  const isProtectedDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isProtectedOnboarding = ONBOARDING_PATHS.some((protectedPath) => pathname === protectedPath || pathname.startsWith(`${protectedPath}/`));
  const isJoin = pathname === "/join" || pathname.startsWith("/join/");
  const isPublic = PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/api/auth/callback") || isJoin;

  if (!userId && (isProtectedDashboard || isProtectedOnboarding)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    const nextValue = `${pathname}${search}`;
    if (nextValue !== "/dashboard" && nextValue !== "/onboarding") {
      loginUrl.searchParams.set("next", nextValue);
    } else {
      loginUrl.searchParams.set("next", "/dashboard");
    }
    return NextResponse.redirect(loginUrl);
  }

  if (userId && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isPublic) {
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/", "/login", "/register", "/join/:path*", "/onboarding/:path*", "/dashboard/:path*", "/api/auth/callback"]
};
