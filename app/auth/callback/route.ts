import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // Scenario: Cancelación del flujo OAuth — Google devuelve error=access_denied
  if (error || !code) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  const supabase = createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  // Scenario: Registro exitoso / Login exitoso → redirigir al dashboard
  return NextResponse.redirect(`${origin}/dashboard`)
}
