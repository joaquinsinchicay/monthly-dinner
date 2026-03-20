import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'monthly-dinner',
  description: 'Registro con Google OAuth y base estructural del MVP de Monthly Dinner.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="bg-surface text-on-surface min-h-screen font-sans">{children}</body>
    </html>
  );
}
