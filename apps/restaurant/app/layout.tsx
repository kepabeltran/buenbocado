import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buen Bocado - Restaurante",
  description: "Panel restaurante MVP"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-brand-50">
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
