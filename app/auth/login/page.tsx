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

          {/* Título Display — nombre del producto */}
          <h1
            className="font-serif text-[42px] leading-[1.1] tracking-[-0.02em] text-[#1b1c1b]"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            Monthly <em>dinner</em>
          </h1>

          {/* Subtítulo Label Signature */}
          <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.05em] text-[#585f6c]">
            Registra las cenas con amigos
          </p>

          {/* Botón Google + texto legal */}
          <div className="mt-8">
            <GoogleSignInButton />
          </div>

        </div>
      </div>
    </main>
  )
}
