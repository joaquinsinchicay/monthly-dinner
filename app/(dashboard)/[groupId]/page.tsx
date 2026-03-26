import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: { groupId: string }
}

export default async function GroupDashboardPage({ params }: Props) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // Verificar membresía — RLS también lo garantiza pero necesitamos el rol
  const { data: member } = await supabase
    .from('members')
    .select('role')
    .eq('group_id', params.groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) notFound()

  // US-07b / US-NAV-03 — ¿El grupo tiene algún evento en su historial?
  const { count: eventsCount } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', params.groupId)

  const hasEvents = (eventsCount ?? 0) > 0

  // Scenario: Estado vacío desaparece al crear el primer evento.
  // Con eventos activos: panel completo se implementa en US posteriores (US-05/07/09...).
  if (hasEvents) {
    redirect(`/grupo/${params.groupId}`)
  }

  const isAdminOrOrganizer = member.role === 'admin'

  return (
    // Scenario: Navegación inferior ausente en estado inicial — solo header + card
    <main className="flex min-h-screen items-center justify-center bg-[#fcf9f8] px-4">

      {/* Scenario: Card de configuración centrada en pantalla */}
      <div className="w-full max-w-[480px] rounded-2xl bg-gradient-to-b from-white to-gray-50 p-10 text-center shadow-[0px_10px_40px_-8px_rgba(28,27,27,0.12)]">

        {isAdminOrOrganizer ? (
          <>
            {/* Scenario: Admin u organizador ve el estado vacío con CTA */}
            <h1
              className="text-[38px] font-normal italic leading-tight tracking-[-0.02em] text-[#1c1b1b]"
              style={{ fontFamily: 'DM Serif Display, serif' }}
            >
              Configurá el{' '}
              <span className="text-[#004ac6]">grupo</span>
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[#585f6c]">
              Tu clan está listo, finalizá la configuración para dar comienzo
              a la experiencia culinaria.
            </p>
            {/* Scenario: Botón "Completar configuración →" redirige a /settings */}
            <div className="mt-8 flex justify-center">
              <Link
                href={`/dashboard/${params.groupId}/settings`}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-8 py-4 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                Completar configuración →
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Scenario: Miembro ve mensaje de espera sin CTA */}
            <h1
              className="text-[38px] font-normal italic leading-tight tracking-[-0.02em] text-[#1c1b1b]"
              style={{ fontFamily: 'DM Serif Display, serif' }}
            >
              Pronto hay{' '}
              <span className="text-[#004ac6]">novedades</span>
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[#585f6c]">
              Aún no hay eventos. El organizador del mes está preparando la primera cita.
            </p>
          </>
        )}

      </div>
    </main>
  )
}
