import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen bg-[#fcf9f8] px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
          Panel
        </p>
        <h1
          className="mt-1 font-serif text-[28px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          {profile?.full_name ?? 'Bienvenido'}
        </h1>
        <p className="mt-2 text-sm text-[#585f6c]">{profile?.email}</p>
      </div>
    </main>
  )
}
