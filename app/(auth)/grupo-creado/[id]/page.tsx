import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GroupCreatedView from '@/components/group/GroupCreatedView'

interface Props {
  params: { id: string }
}

// Tiempo máximo en minutos para acceder a la pantalla de confirmación.
// Pasado este tiempo se considera acceso directo y se redirige al dashboard.
const FRESHNESS_MINUTES = 10

export default async function GrupoCreado({ params }: Props) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Verificar que el usuario es admin del grupo
  // (solo el creador puede ver la pantalla de confirmación)
  const { data: member } = await supabase
    .from('members')
    .select('role')
    .eq('group_id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member || member.role !== 'admin') redirect(`/grupo/${params.id}`)

  const { data: group } = await supabase
    .from('groups')
    .select('id, name, frequency, meeting_day_of_week, meeting_day_of_month, created_at')
    .eq('id', params.id)
    .single()

  if (!group) redirect('/dashboard')

  // Scenario: Acceso directo por URL bloqueado
  // Si el grupo fue creado hace más de FRESHNESS_MINUTES minutos,
  // se trata de acceso directo → redirigir al dashboard del grupo.
  const minutesSinceCreation =
    (Date.now() - new Date(group.created_at).getTime()) / (1000 * 60)

  if (minutesSinceCreation > FRESHNESS_MINUTES) {
    redirect(`/grupo/${params.id}`)
  }

  return <GroupCreatedView group={group} />
}
