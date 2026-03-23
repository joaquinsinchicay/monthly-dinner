import type { Metadata } from 'next'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
})

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
})

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
    <html lang="es" className={`${dmSans.variable} ${dmSerifDisplay.variable}`}>
      <body>{children}</body>
    </html>
  )
}
