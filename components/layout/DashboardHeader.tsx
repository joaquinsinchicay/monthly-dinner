import GroupSelector from '@/components/layout/GroupSelector'
import AvatarMenu from '@/components/layout/AvatarMenu'

interface Group {
  id: string
  name: string
}

interface Membership {
  id: string
  name: string
  role: string
}

interface Props {
  memberships: Membership[]
  groups: Group[]
  profile: { full_name: string | null; avatar_url: string | null } | null
}

// Header fijo del dashboard.
// Fondo surface (#fcf9f8), sin borde inferior, altura 56px (h-14).
// GroupSelector a la izquierda, AvatarMenu a la derecha.
export default function DashboardHeader({ memberships, groups, profile }: Props) {
  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between bg-[#fcf9f8] px-6">
      <GroupSelector groups={groups} />
      <AvatarMenu memberships={memberships} profile={profile} />
    </header>
  )
}
