import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1) Canonicalizar /ofertas -> /offers (manteniendo subruta)
  if (pathname === "/ofertas" || pathname.startsWith("/ofertas/")) {
    const rest = pathname.slice("/ofertas".length); // "" o "/[id]" etc
    const url = req.nextUrl.clone();
    url.pathname = `/offers${rest}`;
    return NextResponse.redirect(url);
  }

  // 2) Cualquier /r/* pertenece al portal restaurante (3001)
  if (pathname === "/r" || pathname.startsWith("/r/")) {
    const restaurantOrigin =
      process.env.NEXT_PUBLIC_RESTAURANT_PORTAL_ORIGIN || "http://127.0.0.1:3001";
    const target = `${restaurantOrigin}${pathname}${search}`;
    return NextResponse.redirect(target);
  }

  // 3) Ruta suelta: /restaurant -> /restaurants (cliente)
  if (pathname === "/restaurant") {
    const url = req.nextUrl.clone();
    url.pathname = "/restaurants";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/ofertas/:path*", "/r/:path*", "/restaurant"],
};
