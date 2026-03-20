import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Cenas del Jueves',
  description: 'MVP para coordinar cenas mensuales con eventos, confirmaciones, votación e historial.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
