import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardHeader from '@/components/layout/DashboardHeader'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // Query — grupos del usuario autenticado (para GroupSelector y AvatarMenu)
  const { data: memberships } = await supabase
    .from('members')
    .select('group_id, role, groups(id, name)')
    .eq('user_id', user.id)

  const userMemberships = (memberships ?? [])
    .map((m) => {
      const g = m.groups as unknown as { id: string; name: string } | null
      return g ? { id: g.id, name: g.name, role: m.role as string } : null
    })
    .filter((m): m is { id: string; name: string; role: string } => m !== null)

  const userGroups = userMemberships.map(({ id, name }) => ({ id, name }))

  // Query — perfil del usuario autenticado (para AvatarMenu)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <>
      <DashboardHeader memberships={userMemberships} groups={userGroups} profile={profile ?? null} />
      {/* pt-14 compensa el header fijo de 56px */}
      <div className="pt-14">{children}</div>
    </>
  )
}
