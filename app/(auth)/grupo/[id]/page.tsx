import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import InvitationLinkPanel from '@/components/group/InvitationLinkPanel'
import OrganizerPanel from '@/components/group/OrganizerPanel'
import EventPanel from '@/components/group/EventPanel'
import SignOutButton from '@/components/auth/SignOutButton'
import { getCurrentOrganizer } from '@/lib/actions/rotation'
import { getCurrentEvent, getAttendanceCounts } from '@/lib/actions/events'
import { getInvitationLinkStatus } from '@/types'
import type { MemberRole } from '@/types'

interface Props {
  params: { id: string }
}

export default async function GrupoPage({ params }: Props) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Verificar que el usuario es miembro del grupo (RLS lo garantiza también)
  const { data: member } = await supabase
    .from('members')
    .select('role')
    .eq('group_id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) notFound()

  const { data: group } = await supabase
    .from('groups')
    .select('id, name')
    .eq('id', params.id)
    .single()

  if (!group) notFound()

  // Obtener el link activo más reciente
  const { data: links } = await supabase
    .from('invitation_links')
    .select('id, group_id, token, created_by, expires_at, revoked_at, created_at')
    .eq('group_id', params.id)
    .order('created_at', { ascending: false })

  const activeLink =
    (links ?? []).find((l) => getInvitationLinkStatus(l) === 'active') ?? null

  // Organizador del mes actual (US-11)
  const organizerResult = await getCurrentOrganizer(params.id)
  const organizer = organizerResult.success ? organizerResult.data : null
  const isOrganizer = organizer?.userId === user.id

  // Evento del mes actual (US-05)
  const eventResult = await getCurrentEvent(params.id)
  const currentEvent = eventResult.success ? eventResult.data : null

  // Conteos de asistencia para realtime (US-07) — solo si hay evento
  const countsResult = currentEvent ? await getAttendanceCounts(currentEvent.id) : null
  const attendanceCounts = countsResult?.success ? countsResult.data : undefined

  // Base URL para construir el link completo
  const headersList = headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  return (
    <main className="min-h-screen bg-[#fcf9f8] px-4 py-10">
      <div className="mx-auto w-full max-w-sm space-y-8">

        {/* Header editorial */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
            Tu grupo
          </p>
          <h1
            className="mt-1 font-serif text-[28px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            {group.name}
          </h1>
        </div>

        {/* US-11: Organizador del mes */}
        <OrganizerPanel organizer={organizer ?? null} currentUserId={user.id} />

        {/* US-05 / US-07: Evento del mes + confirmaciones en tiempo real */}
        <EventPanel
          groupId={params.id}
          event={currentEvent ?? null}
          currentUserId={user.id}
          isOrganizer={isOrganizer}
          attendanceCounts={attendanceCounts}
        />

        {/* Scenario: Link generado automáticamente al crear el grupo */}
        <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
          <InvitationLinkPanel
            groupId={group.id}
            initialLink={activeLink}
            userRole={member.role as MemberRole}
            baseUrl={baseUrl}
          />
        </div>

      </div>

      {/* Scenario: Cerrar sesión desde cualquier pantalla (US-03) */}
      <div className="mx-auto mt-8 w-full max-w-sm text-center">
        <SignOutButton />
      </div>
    </main>
  )
}
