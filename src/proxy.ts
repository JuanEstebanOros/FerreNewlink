import { NextResponse, type NextRequest } from "next/server";
import { CUSTOMER_SESSION_COOKIE, verifyCustomerSession } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  const session = token ? await verifyCustomerSession(token) : null;

  if (!session || !session.isAdmin) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
    const loginUrl = new URL("/ingresar", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
