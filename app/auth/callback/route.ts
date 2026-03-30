import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // Scenario: Cancelación del flujo OAuth — Google devuelve error=access_denied
  if (error || !code) {
    return NextResponse.redirect(`${origin}/`)
  }

  const supabase = createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/`)
  }

  // Soportar `next` para flujos con token de invitación (US-04) y redirect post-expiración (US-02 S04)
  // Validación: solo rutas internas relativas — bloquear //evil.com y URLs absolutas
  const next = searchParams.get('next')
  const isValidNext = next && next.startsWith('/') && !next.startsWith('//')
  if (isValidNext) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  // Scenario: Registro exitoso / Login exitoso → redirigir al dashboard
  return NextResponse.redirect(`${origin}/dashboard`)
}
