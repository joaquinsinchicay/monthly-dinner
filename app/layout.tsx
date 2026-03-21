import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "monthly-dinner",
  description: "App mobile-first para coordinar cenas mensuales grupales."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
