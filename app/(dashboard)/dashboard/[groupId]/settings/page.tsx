import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import SettingsMembersSection from '@/components/settings/SettingsMembersSection'
import SettingsRotationSection from '@/components/settings/SettingsRotationSection'
import SettingsNameSection from '@/components/settings/SettingsNameSection'

interface Props {
  params: { groupId: string }
}

export default async function SettingsPage({ params }: Props) {
  const { groupId } = params
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // Verificar membresía y rol — protección de ruta: solo admins
  const { data: currentMember } = await supabase
    .from('members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!currentMember) notFound()

  // Solo admins pueden acceder a esta pantalla
  if (currentMember.role !== 'admin') {
    redirect(`/dashboard/${groupId}`)
  }

  // Miembros con perfil
  const { data: membersRaw } = await supabase
    .from('members')
    .select('id, role, user_id, profiles(id, full_name, avatar_url)')
    .eq('group_id', groupId)

  const members = (membersRaw ?? []).map((m) => {
    const profile = m.profiles as unknown as {
      id: string
      full_name: string | null
      avatar_url: string | null
    } | null
    return {
      id: m.id,
      user_id: m.user_id,
      role: m.role as 'member' | 'admin',
      profile,
    }
  })

  // Rotación ordenada por mes (proxy para order)
  const { data: rotationRaw } = await supabase
    .from('rotation')
    .select('id, user_id, month, profiles(full_name, avatar_url)')
    .eq('group_id', groupId)
    .order('month', { ascending: true })

  const rotation = (rotationRaw ?? []).map((r) => {
    const profile = r.profiles as unknown as {
      full_name: string | null
      avatar_url: string | null
    } | null
    return {
      id: r.id,
      user_id: r.user_id,
      month: r.month,
      profile,
    }
  })

  // Grupo
  const { data: group } = await supabase
    .from('groups')
    .select('id, name')
    .eq('id', groupId)
    .single()

  if (!group) notFound()

  // Enlace de invitación activo
  const { data: invitationLink } = await supabase
    .from('invitation_links')
    .select('id, token, expires_at, revoked_at')
    .eq('group_id', groupId)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <main className="min-h-screen bg-[#fcf9f8] px-4 pb-16 pt-20">
      <div className="mx-auto max-w-[480px] space-y-10">

        {/* Botón volver */}
        <Link
          href={`/dashboard/${groupId}`}
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#004ac6]"
        >
          <ArrowLeft size={16} />
          Dashboard
        </Link>

        {/* Sección 1 — Miembros */}
        <SettingsMembersSection
          groupId={groupId}
          members={members}
          currentUserId={user.id}
          invitationToken={invitationLink?.token ?? null}
        />

        {/* Sección 2 — Rotación */}
        <SettingsRotationSection
          groupId={groupId}
          rotation={rotation}
        />

        {/* Sección 3 — Nombre */}
        <SettingsNameSection
          groupId={groupId}
          initialName={group.name}
        />

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-[11px] font-medium tracking-[0.05em] uppercase text-[#585f6c]">
            POWERED BY THE DIGITAL MAÎTRE D&apos;
          </p>
        </footer>

      </div>
    </main>
  )
}
