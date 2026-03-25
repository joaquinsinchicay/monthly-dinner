import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import InvitationLinkPanel from '@/components/group/InvitationLinkPanel'
import OrganizerPanel from '@/components/group/OrganizerPanel'
import EventPanel from '@/components/group/EventPanel'
import ConvocatoriaNotification from '@/components/group/ConvocatoriaNotification'
import PollPanel from '@/components/group/PollPanel'
import RestaurantHistory from '@/components/group/RestaurantHistory'
import SignOutButton from '@/components/auth/SignOutButton'
import { getCurrentOrganizer, getNextOrganizer } from '@/lib/actions/rotation'
import { getCurrentEvent, getAttendanceCounts } from '@/lib/actions/events'
import { getUserAttendance } from '@/lib/actions/attendances'
import { getPollWithOptions } from '@/lib/actions/polls'
import { getRestaurantHistory } from '@/lib/actions/restaurant'
import { getOrCreateChecklist } from '@/lib/actions/checklist'
import ChecklistPanel from '@/components/group/ChecklistPanel'
import EmptyDashboard from '@/components/group/EmptyDashboard'
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

  // US-07b — ¿El grupo tiene algún evento en su historial?
  // COUNT sobre events (sin filtro de mes) para determinar si el grupo es nuevo.
  const { count: eventsCount } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('group_id', params.id)
  const hasEvents = (eventsCount ?? 0) > 0
  const isAdmin = member.role === 'admin'

  // Organizador del mes actual (US-11)
  const organizerResult = await getCurrentOrganizer(params.id)
  const organizer = organizerResult.success ? organizerResult.data : null
  const isOrganizer = organizer?.userId === user.id

  // Próximo organizador (US-13) — asignado al cerrar el evento
  const nextOrganizerResult = await getNextOrganizer(params.id)
  const nextOrganizer = nextOrganizerResult.success ? nextOrganizerResult.data : null

  // Evento del mes actual (US-05)
  const eventResult = await getCurrentEvent(params.id)
  const currentEvent = eventResult.success ? eventResult.data : null

  // Conteos de asistencia para realtime (US-07) — solo si hay evento
  const countsResult = currentEvent ? await getAttendanceCounts(currentEvent.id) : null
  const attendanceCounts = countsResult?.success ? countsResult.data : undefined

  // Confirmación del usuario actual (US-08) — solo si hay evento publicado
  const attendanceResult =
    currentEvent?.status === 'published'
      ? await getUserAttendance(currentEvent.id)
      : null
  const userAttendance = attendanceResult?.success ? attendanceResult.data : null

  // Scenario: Notificación recibida con acción directa — mostrar solo si el evento
  // está publicado y el miembro NO ha confirmado todavía.
  // Scenario: Recordatorio por falta de respuesta — isReminder se evalúa dentro del componente.
  // Scenario: Acceso desde notificación — el routing /dashboard → /grupo/[id] ya garantiza
  // que el usuario llega al panel del evento, no a la pantalla de inicio.
  const showNotification = currentEvent?.status === 'published' && !userAttendance && !isOrganizer

  // Historial de restaurantes del grupo (US-16)
  const historyResult = await getRestaurantHistory(params.id)
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

        {/* US-11: Organizador del mes / US-13: Próximo organizador */}
        <OrganizerPanel organizer={organizer ?? null} currentUserId={user.id} nextOrganizer={nextOrganizer} />

        {/* US-07b: Estado vacío — visible solo cuando el grupo no tiene ningún evento */}
        {!hasEvents && (
          <EmptyDashboard
            groupId={params.id}
            isAdminOrOrganizer={isAdmin || isOrganizer}
          />
        )}

        {/* US-20: Checklist del mes — visible para el organizador cuando hay evento activo;
            para no organizadores muestra mensaje explicativo */}
        {currentEvent && (
          <ChecklistPanel
            eventId={currentEvent.id}
            isOrganizer={isOrganizer}
            initialItems={checklistItems ?? []}
          />
        )}

        {/* US-08: Notificación de convocatoria — visible cuando hay evento publicado y el
            miembro no confirmó. Muestra variante "recordatorio" si pasaron ≥48h. */}
        {showNotification && currentEvent && (
          <ConvocatoriaNotification event={currentEvent} groupId={params.id} />
        )}

        {/* US-05 / US-07 / US-09: Evento del mes + confirmaciones en tiempo real + Tu respuesta */}
        <EventPanel
          groupId={params.id}
          event={currentEvent ?? null}
          currentUserId={user.id}
          isOrganizer={isOrganizer}
          attendanceCounts={attendanceCounts}
          userAttendance={userAttendance}
        />

        {/* US-17: Votación de restaurantes — visible para organizador (crear) y todos (ver) */}
        {currentEvent && currentEvent.status !== 'pending' && (
          <PollPanel
            eventId={currentEvent.id}
            groupId={params.id}
            poll={currentPoll ?? null}
            isOrganizer={isOrganizer}
          />
        )}

        {/* US-16: Historial de restaurantes */}
        <RestaurantHistory entries={restaurantHistory} />

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
