import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { CartProvider } from "./_state/cart";

export const metadata: Metadata = {
  title: "Buen Bocado - Cliente",
  description: "Buen precio, mejor bocado",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-brand-50">
        <CartProvider>
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}