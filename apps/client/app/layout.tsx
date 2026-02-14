import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { CartProvider } from "./_state/cart";
import { ClientAuthProvider } from "./_auth/AuthProvider";
import CartFloat from "./_state/CartFloat";
export const metadata: Metadata = {
  title: "Buen Bocado - Cliente",
  description: "Buen precio, mejor bocado",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ClientAuthProvider>
          <CartProvider>
            {children}
            <CartFloat />
          </CartProvider>
        </ClientAuthProvider>
      </body>
    </html>
  );
}
