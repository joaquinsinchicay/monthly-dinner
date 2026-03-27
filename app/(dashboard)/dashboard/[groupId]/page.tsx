import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import InvitationLinkPanel from '@/components/group/InvitationLinkPanel'
import OrganizerPanel from '@/components/group/OrganizerPanel'
import EventPanel from '@/components/group/EventPanel'
import ConvocatoriaNotification from '@/components/group/ConvocatoriaNotification'
import PollPanel from '@/components/group/PollPanel'
import RestaurantHistory from '@/components/group/RestaurantHistory'
import { getCurrentOrganizer, getNextOrganizer } from '@/lib/actions/rotation'
import { getCurrentEvent, getAttendanceCounts } from '@/lib/actions/events'
import { getUserAttendance } from '@/lib/actions/attendances'
import { getPollWithOptions } from '@/lib/actions/polls'
import { getRestaurantHistory } from '@/lib/actions/restaurant'
import { getOrCreateChecklist } from '@/lib/actions/checklist'
import ChecklistPanel from '@/components/group/ChecklistPanel'
import { getInvitationLinkStatus } from '@/types'
import type { MemberRole } from '@/types'

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

  const { data: group } = await supabase
    .from('groups')
    .select('id, name')
    .eq('id', params.groupId)
    .single()

  if (!group) notFound()

  // Obtener el link activo más reciente
  const { data: links } = await supabase
    .from('invitation_links')
    .select('id, group_id, token, created_by, expires_at, revoked_at, created_at')
    .eq('group_id', params.groupId)
    .order('created_at', { ascending: false })

  const activeLink =
    (links ?? []).find((l) => getInvitationLinkStatus(l) === 'active') ?? null

  // US-07b — ¿El grupo tiene algún evento en su historial?
  const { count: eventsCount } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', params.groupId)
  const hasEvents = (eventsCount ?? 0) > 0
  const isAdmin = member.role === 'admin'

  // Organizador del mes actual (US-11)
  const organizerResult = await getCurrentOrganizer(params.groupId)
  const organizer = organizerResult.success ? organizerResult.data : null
  const isOrganizer = organizer?.userId === user.id

  // Próximo organizador (US-13)
  const nextOrganizerResult = await getNextOrganizer(params.groupId)
  const nextOrganizer = nextOrganizerResult.success ? nextOrganizerResult.data : null

  // Evento del mes actual (US-05)
  const eventResult = await getCurrentEvent(params.groupId)
  const currentEvent = eventResult.success ? eventResult.data : null

  // Conteos de asistencia para realtime (US-07) — solo si hay evento
  const countsResult = currentEvent ? await getAttendanceCounts(currentEvent.id) : null
  const attendanceCounts = countsResult?.success ? countsResult.data : undefined

  // Confirmación del usuario actual
  const attendanceResult = currentEvent
    ? await getUserAttendance(currentEvent.id)
    : null
  const userAttendance = attendanceResult?.success ? attendanceResult.data : null

  const showNotification = currentEvent?.status === 'published' && !userAttendance && !isOrganizer

  // Historial de restaurantes del grupo (US-16)
  const historyResult = await getRestaurantHistory(params.groupId)
  const restaurantHistory = historyResult.success ? historyResult.data : []

  // Checklist del mes (US-20) — solo si el usuario es el organizador y hay evento
  const checklistResult =
    isOrganizer && currentEvent
      ? await getOrCreateChecklist(currentEvent.id)
      : null
  const checklistItems = checklistResult?.success ? checklistResult.data : []

  // Votación del mes actual (US-17) — solo si hay evento publicado
  const pollResult =
    currentEvent && currentEvent.status !== 'pending'
      ? await getPollWithOptions(currentEvent.id)
      : null
  const currentPoll = pollResult?.success ? pollResult.data : null

  // Base URL para construir el link completo
  const headersList = headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  // US-NAV-03 — Estado vacío para grupo sin eventos
  if (!hasEvents) {
    const isAdminOrOrganizer = isAdmin || isOrganizer
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fcf9f8] px-4">
        <div className="w-full max-w-[480px] rounded-2xl bg-gradient-to-b from-white to-gray-50 p-10 text-center shadow-[0px_10px_40px_-8px_rgba(28,27,27,0.12)]">
          {isAdminOrOrganizer ? (
            <>
              <h1
                className="text-[38px] font-normal italic leading-tight tracking-[-0.02em] text-[#1c1b1b]"
                style={{ fontFamily: 'DM Serif Display, serif' }}
              >
                Configurá el{' '}
                <span className="text-[#004ac6]">grupo</span>
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-[#585f6c]">
                Tu grupo está listo, finalizá la configuración para dar comienzo
                a la experiencia culinaria.
              </p>
              <div className="mt-8 flex justify-center">
                <a
                  href={`/dashboard/${params.groupId}/settings`}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-8 py-4 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Completar configuración →
                </a>
              </div>
            </>
          ) : (
            <>
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

  return (
    <main className="min-h-screen bg-[#fcf9f8] px-4 pb-10 pt-6">
      <div className="mx-auto w-full max-w-sm space-y-8">

        {/* US-11: Organizador del mes / US-13: Próximo organizador */}
        <OrganizerPanel organizer={organizer ?? null} currentUserId={user.id} nextOrganizer={nextOrganizer} />

        {/* US-20: Checklist del mes */}
        {currentEvent && (
          <ChecklistPanel
            eventId={currentEvent.id}
            isOrganizer={isOrganizer}
            initialItems={checklistItems ?? []}
          />
        )}

        {/* US-08: Notificación de convocatoria */}
        {showNotification && currentEvent && (
          <ConvocatoriaNotification event={currentEvent} groupId={params.groupId} />
        )}

        {/* US-05 / US-07 / US-09: Evento del mes + confirmaciones + Tu respuesta */}
        <EventPanel
          groupId={params.groupId}
          event={currentEvent ?? null}
          currentUserId={user.id}
          isOrganizer={isOrganizer}
          isAdmin={isAdmin}
          attendanceCounts={attendanceCounts}
          userAttendance={userAttendance}
        />

        {/* US-17: Votación de restaurantes */}
        {currentEvent && currentEvent.status !== 'pending' && (
          <PollPanel
            eventId={currentEvent.id}
            groupId={params.groupId}
            poll={currentPoll ?? null}
            isOrganizer={isOrganizer}
          />
        )}

        {/* US-16: Historial de restaurantes */}
        <RestaurantHistory entries={restaurantHistory} />

        {/* Link de invitación */}
        <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
          <InvitationLinkPanel
            groupId={group.id}
            initialLink={activeLink}
            userRole={member.role as MemberRole}
            baseUrl={baseUrl}
          />
        </div>

      </div>
    </main>
  )
}
