import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./_auth/AuthProvider";
export const metadata: Metadata = {
  title: "Buen Bocado - Restaurante",
  description: "Panel restaurante",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#fafdf7]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
