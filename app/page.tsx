import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

export default async function HomePage() {
  const supabase = createClient()

  // Sesión activa → ir directo al dashboard (Scenario: Sesión persistente)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px]">

        {/* Hero — fotografía de cena entre amigos */}
        <div className="relative w-full overflow-hidden rounded-3xl" style={{ aspectRatio: '4/3' }}>
          <Image
            src="/images/login-hero.jpg"
            alt="Amigos cenando juntos"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Bloque texto + CTA */}
        <div className="mt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
            monthly-dinner
          </p>
          <h1
            className="mt-3 font-serif text-[32px] leading-tight tracking-[-0.02em] text-[#1c1b1b] whitespace-nowrap"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            Las cenas del grupo
          </h1>
          <p className="mt-3 text-sm text-[#585f6c]">
            Coordiná sin perder mensajes en WhatsApp.
          </p>

          {/* Card sin borde — tonal layering */}
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
            <GoogleSignInButton />
          </div>
        </div>

      </div>
    </main>
  )
}
