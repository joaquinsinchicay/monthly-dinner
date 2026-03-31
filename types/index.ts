// =============================================================================
// monthly-dinner — Types
// Fuente de verdad de tipos TypeScript del schema de Supabase.
// Estos tipos deben mantenerse sincronizados con docs/architecture/schema.sql.
// No usar `any` ni inferir tipos desde el cliente — usar siempre estos tipos.
// =============================================================================

// -----------------------------------------------------------------------------
// Enums — valores exactos del schema. No modificar sin actualizar schema.sql.
// -----------------------------------------------------------------------------

export type MemberRole = 'member' | 'admin'

export type EventStatus = 'pending' | 'published' | 'closed'

export type AttendanceStatus = 'va' | 'no_va' | 'tal_vez'

export type PollStatus = 'open' | 'closed'

export type ChecklistStatus = 'pending' | 'done'

// -----------------------------------------------------------------------------
// Tabla: profiles
// -----------------------------------------------------------------------------

export interface Profile {
  id: string               // uuid — auth.uid()
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string       // timestamptz
  updated_at: string
}

// -----------------------------------------------------------------------------
// Tabla: groups
// -----------------------------------------------------------------------------

export interface Group {
  id: string
  name: string
  frequency: 'mensual' | 'quincenal' | 'semanal'
  meeting_day_of_week: 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado' | 'domingo' | null
  meeting_week?: number    // 1-5. mensual: 1-5 (5=última). quincenal: 1|2. semanal: undefined
  created_by: string       // uuid — profiles.id
  created_at: string
  updated_at: string
}

// -----------------------------------------------------------------------------
// Tabla: members
// -----------------------------------------------------------------------------

export interface Member {
  id: string
  group_id: string
  user_id: string | null    // null para guests
  role: MemberRole
  is_guest: boolean
  display_name: string | null  // solo para guests
  joined_at: string
}

// Miembro con perfil expandido (join con profiles — null para guests)
export interface MemberWithProfile extends Member {
  profile: Profile | null
}

// Helper: nombre a mostrar para cualquier tipo de miembro
export function getMemberDisplayName(
  member: Member & { profile?: { full_name: string | null } | null }
): string {
  if (member.is_guest && member.display_name) return member.display_name
  return member.profile?.full_name ?? 'Miembro'
}

// -----------------------------------------------------------------------------
// Tabla: invitation_links
// -----------------------------------------------------------------------------

export interface InvitationLink {
  id: string
  group_id: string
  token: string
  created_by: string
  expires_at: string
  revoked_at: string | null
  created_at: string
}

// Estado derivado — no existe como columna en DB
export type InvitationLinkStatus = 'active' | 'expired' | 'revoked'

export function getInvitationLinkStatus(link: InvitationLink): InvitationLinkStatus {
  if (link.revoked_at !== null) return 'revoked'
  if (new Date(link.expires_at) <= new Date()) return 'expired'
  return 'active'
}

// -----------------------------------------------------------------------------
// Tabla: rotation
// -----------------------------------------------------------------------------

export interface Rotation {
  id: string
  group_id: string
  user_id: string | null       // null para miembros sin cuenta
  member_id: string | null     // references members.id — siempre presente tras US-11c
  display_name: string | null  // nombre visible cuando user_id es null
  month: string                // date — primer día del mes: '2026-04-01'
  notified_at: string | null
  created_at: string
}

// Rotación con perfil del organizador expandido
export interface RotationWithProfile extends Rotation {
  profile: Profile | null      // null cuando el slot no tiene cuenta vinculada
}

// -----------------------------------------------------------------------------
// Tabla: events
// -----------------------------------------------------------------------------

export interface Event {
  id: string
  group_id: string
  organizer_id: string | null  // null para eventos generados automáticamente (US-03 Scenario 11)
  month: string            // date — primer día del mes: '2026-04-01'
  status: EventStatus
  event_date: string | null
  place: string | null
  description: string | null
  notified_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
}

// Evento con organizador expandido (null cuando aún no tiene organizador asignado)
export interface EventWithOrganizer extends Event {
  organizer: Profile | null
}

// -----------------------------------------------------------------------------
// Tabla: attendances
// -----------------------------------------------------------------------------

export interface Attendance {
  id: string
  event_id: string
  member_id: string
  status: AttendanceStatus
  updated_at: string
}

// Confirmación con perfil del miembro expandido
export interface AttendanceWithProfile extends Attendance {
  profile: Profile
}

// Resumen de confirmaciones para el panel del organizador
export interface AttendanceSummary {
  va: AttendanceWithProfile[]
  no_va: AttendanceWithProfile[]
  tal_vez: AttendanceWithProfile[]
  sin_respuesta: Profile[]
  total: number
}

// -----------------------------------------------------------------------------
// Tabla: polls
// -----------------------------------------------------------------------------

export interface Poll {
  id: string
  event_id: string
  group_id: string
  created_by: string
  status: PollStatus
  closes_at: string
  closed_at: string | null
  created_at: string
}

// -----------------------------------------------------------------------------
// Tabla: poll_options
// -----------------------------------------------------------------------------

export interface PollOption {
  id: string
  poll_id: string
  label: string
  created_at: string
}

// Opción con conteo de votos calculado
export interface PollOptionWithVotes extends PollOption {
  vote_count: number
  percentage: number
}

// -----------------------------------------------------------------------------
// Tabla: poll_votes
// -----------------------------------------------------------------------------

export interface PollVote {
  id: string
  poll_id: string
  option_id: string
  user_id: string
  created_at: string
  updated_at: string
}

// Poll completo con opciones y votos
export interface PollWithOptions extends Poll {
  options: PollOptionWithVotes[]
  my_vote: PollVote | null   // voto del usuario autenticado
}

// -----------------------------------------------------------------------------
// Tabla: restaurant_history
// -----------------------------------------------------------------------------

export interface RestaurantHistory {
  id: string
  event_id: string
  group_id: string
  name: string | null        // nullable — cierre sin restaurante registrado
  visited_at: string         // date
  attendee_ids: string[]     // uuid[] — snapshot de asistentes confirmados
  created_by: string
  created_at: string
  updated_at: string
}

// -----------------------------------------------------------------------------
// Tabla: checklist_templates
// -----------------------------------------------------------------------------

export interface ChecklistTemplate {
  id: string
  group_id: string | null    // null = template global del sistema
  label: string
  description: string | null
  order_index: number
  global: boolean
  created_at: string
}

// -----------------------------------------------------------------------------
// Tabla: checklist_items
// -----------------------------------------------------------------------------

export interface ChecklistItem {
  id: string
  event_id: string
  template_id: string | null
  label: string
  status: ChecklistStatus
  order_index: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

// Progreso del checklist
export interface ChecklistProgress {
  items: ChecklistItem[]
  total: number
  done: number
  percentage: number
}

// -----------------------------------------------------------------------------
// Server Action responses — patrón estándar para todos los server actions
// -----------------------------------------------------------------------------

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// -----------------------------------------------------------------------------
// Helpers de navegación — contexto del usuario autenticado
// -----------------------------------------------------------------------------

export interface UserContext {
  profile: Profile
  groups: Group[]
  active_group: Group | null
  role: MemberRole | null          // rol en el grupo activo
  is_organizer_this_month: boolean // true si rotation.user_id = auth.uid() este mes
}