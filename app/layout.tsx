import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'monthly-dinner',
  description: 'Coordiná las cenas del grupo sin perder mensajes en WhatsApp',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
