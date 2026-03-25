import Image from 'next/image'
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
    <main className="min-h-screen bg-[#fcf9f8] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px]">

        {/* Bloque imagen — hero fotografía de cena entre amigos */}
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

          {/* Título Display Large */}
          <h1
            className="text-center font-serif text-[36px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            Registra las cenas con amigos
          </h1>

          {/* Botón Google + texto legal */}
          <div className="mt-8">
            <GoogleSignInButton />
          </div>

        </div>
      </div>
    </main>
  )
}
