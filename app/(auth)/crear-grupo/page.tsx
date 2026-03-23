import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CreateGroupForm from '@/components/group/CreateGroupForm'

export default async function CrearGrupoPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <main className="min-h-screen bg-[#fcf9f8] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Header editorial — asimetría título izquierda (design-system.md) */}
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
            Nuevo grupo
          </p>
          <h1
            className="mt-1 font-serif text-[28px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            ¿Cómo se llama
            <br />
            el grupo?
          </h1>
          <p className="mt-2 text-sm text-[#585f6c]">
            Este nombre verán todos los miembros cuando los invites.
          </p>
        </div>

        {/* Card sin borde — tonal layering (design-system.md) */}
        <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
          <CreateGroupForm />
        </div>

      </div>
    </main>
  )
}
