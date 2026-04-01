import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

// Smart redirect (US-01 §8):
// 1. Último grupo visitado (cookie last_group_id, seteada por middleware)
// 2. Fallback: grupo más recientemente unido (joined_at DESC)
// 3. Sin grupos → /onboarding
export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // Intentar redirigir al último grupo visitado
  const lastGroupId = cookies().get('last_group_id')?.value
  if (lastGroupId) {
    const { data: lastMembership } = await supabase
      .from('members')
      .select('group_id')
      .eq('group_id', lastGroupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (lastMembership?.group_id) {
      redirect(`/dashboard/${lastMembership.group_id}`)
    }
  }

  // Fallback: grupo más recientemente unido
  const { data: latestMembership } = await supabase
    .from('members')
    .select('group_id')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestMembership?.group_id) {
    redirect(`/dashboard/${latestMembership.group_id}`)
  }

  redirect('/onboarding')
}
