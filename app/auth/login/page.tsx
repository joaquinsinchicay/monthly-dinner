import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

export default async function LoginPage() {
  const supabase = createClient()

  // Scenario: Sesión persistente — si ya hay sesión activa, ir directo al dashboard
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-[#fcf9f8] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Header editorial — "The Ritual Entrance" (design-system.md) */}
        <div className="mb-10 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
            monthly-dinner
          </p>
          <h1
            className="mt-3 font-serif text-[32px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            Las cenas
            <br />
            del grupo
          </h1>
          <p className="mt-3 text-sm text-[#585f6c]">
            Coordiná sin perder mensajes en WhatsApp.
          </p>
        </div>

        {/* Card sin borde — tonal layering */}
        <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
          <GoogleSignInButton />
        </div>

      </div>
    </main>
  )
}
