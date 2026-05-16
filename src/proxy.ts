import { NextResponse, type NextRequest } from "next/server";

/**
 * The admin tool runs ffmpeg via a local Node child process — it cannot work
 * on Vercel Functions and shouldn't be exposed to the public internet anyway.
 *
 * In production we 404 every /admin/* path so the route effectively doesn't
 * exist. Locally (`npm run dev`) it's open.
 *
 * Note: this file uses Next 16's "proxy" convention (renamed from
 * middleware.ts in Next 16; same behavior).
 */
export function proxy(req: NextRequest) {
  const isAdmin = req.nextUrl.pathname.startsWith("/admin");
  if (!isAdmin) return NextResponse.next();

  const isDev = process.env.NODE_ENV !== "production";
  // Explicit opt-in via env var if you ever want to host it (not recommended).
  const explicitlyEnabled = process.env.ADMIN_ENABLE === "1";
  if (isDev || explicitlyEnabled) return NextResponse.next();

  return new NextResponse(null, { status: 404 });
}

export const config = {
  matcher: ["/admin/:path*"],
};
