import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const CART_COOKIE = "sc_cart";
const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);
const isSignIn = createRouteMatcher(["/admin/sign-in(.*)", "/admin/sign-up(.*)"]);

/* Phase 1: only admins sign in (spec §7 Access), so Clerk runs on admin routes only.
   The admin list itself is checked on every request in src/lib/auth.ts. */
const admin = clerkMiddleware(async (auth, req) => {
  if (!isSignIn(req)) await auth.protect({ unauthenticatedUrl: new URL("/admin/sign-in", req.url).toString() });
});

export default function middleware(req: NextRequest, ev: NextFetchEvent) {
  if (isAdminRoute(req)) return admin(req, ev);
  // everyone else gets an anonymous cart cookie (cart holds belong to it)
  const res = NextResponse.next();
  if (!req.cookies.get(CART_COOKIE)) {
    res.cookies.set(CART_COOKIE, crypto.randomUUID(), {
      httpOnly: true, sameSite: "lax", secure: req.nextUrl.protocol === "https:", path: "/", maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next|fonts|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2?|txt|xml)$).*)", "/(api|trpc)(.*)"],
};
