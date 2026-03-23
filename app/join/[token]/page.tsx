import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getGroupByToken } from '@/lib/actions/join'
import JoinGroupView from '@/components/join/JoinGroupView'

interface Props {
  params: { token: string }
}

export default async function JoinPage({ params }: Props) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Validar el link via RPC (bypasea RLS — funciona para anon y authenticated)
  const result = await getGroupByToken(params.token)

  // Scenario: Link expirado o inválido — mostrar mensaje claro
  if (!result.success || !result.data) {
    return (
      <main className="min-h-screen bg-[#fcf9f8] flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
              Link de invitación
            </p>
            <h1
              className="mt-1 font-serif text-[28px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
              style={{ fontFamily: 'DM Serif Display, serif' }}
            >
              Link no válido
            </h1>
          </div>
          <div className="rounded-2xl bg-[#ffdad6] p-6">
            <p className="text-sm text-[#ba1a1a]">
              Este link expiró o fue revocado. Pedile uno nuevo al administrador del grupo.
            </p>
          </div>
        </div>
      </main>
    )
  }

  const { groupId, groupName } = result.data

  // Scenario: Usuario ya miembro — redirect directo al panel sin JOIN
  if (user) {
    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      redirect(`/grupo/${groupId}`)
    }
  }

  return (
    <main className="min-h-screen bg-[#fcf9f8] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <JoinGroupView
          token={params.token}
          groupName={groupName}
          isAuthenticated={!!user}
        />
      </div>
    </main>
  )
}
