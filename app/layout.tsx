import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Monthly Dinner',
  description: 'Registro con Google para coordinar tus grupos de cena.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
