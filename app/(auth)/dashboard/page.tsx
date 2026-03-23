import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Smart redirect: si el usuario tiene grupo → /grupo/[id], si no → /onboarding
export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // Buscar el primer grupo del usuario (por fecha de join, el más reciente)
  const { data: membership } = await supabase
    .from('members')
    .select('group_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (membership?.group_id) {
    redirect(`/grupo/${membership.group_id}`)
  }

  redirect('/onboarding')
}
