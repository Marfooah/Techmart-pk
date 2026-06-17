import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = token.role as string;

    if (path.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (
      ["/dashboard", "/products", "/orders", "/tracking", "/returns", "/tickets", "/chat", "/profile"].some(
        (p) => path === p || path.startsWith(p + "/")
      ) &&
      role !== "CUSTOMER" &&
      role !== "ADMIN"
    ) {
      if (role === "AGENT") {
        return NextResponse.redirect(new URL("/admin/tickets", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/products/:path*",
    "/orders/:path*",
    "/tracking/:path*",
    "/returns/:path*",
    "/tickets/:path*",
    "/chat/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/api/chat",
  ],
};
