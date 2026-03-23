import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingView from '@/components/onboarding/OnboardingView'

// Si el usuario ya tiene grupo, redirigirlo directamente — no debería llegar aquí
export default async function OnboardingPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: membership } = await supabase
    .from('members')
    .select('group_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (membership?.group_id) {
    redirect(`/grupo/${membership.group_id}`)
  }

  return <OnboardingView />
}
