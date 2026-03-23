'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import type { ActionResult } from '@/types'

// Inicia el flujo OAuth con Google.
// US-01 (registro) y US-02 (login) usan el mismo endpoint de Supabase —
// si el email ya existe, Supabase inicia sesión en la cuenta existente sin duplicar.
// `next` se usa en US-04 para preservar el token de invitación a través del flujo OAuth.
export async function signInWithGoogle(next?: string): Promise<ActionResult<void>> {
  const supabase = createClient()

  const headersList = headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  const callbackUrl = next
    ? `${baseUrl}/auth/callback?next=${encodeURIComponent(next)}`
    : `${baseUrl}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error || !data.url) {
    return { success: false, error: 'No se pudo iniciar el flujo de autenticación.' }
  }

  redirect(data.url)
}

// Cierra la sesión del usuario autenticado (US-03).
export async function signOut(): Promise<ActionResult<void>> {
  const supabase = createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { success: false, error: 'No se pudo cerrar la sesión.' }
  }

  redirect('/')
}
