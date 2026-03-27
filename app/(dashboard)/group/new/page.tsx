import Link from 'next/link'
import CreateGroupForm from '@/components/group/CreateGroupForm'

export default function NuevoGrupoPage() {
  return (
    <main className="min-h-[calc(100vh-56px)] bg-[#fcf9f8] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Header editorial */}
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
            Nuevo grupo
          </p>
          <h1
            className="mt-1 font-serif text-[28px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            ¿Cómo se llama el grupo?
          </h1>
          <p className="mt-2 text-sm text-[#585f6c]">
            Este nombre verán todos los miembros cuando los invites.
          </p>
        </div>

        {/* Card sin borde — tonal layering */}
        <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
          <CreateGroupForm />
        </div>

        {/* Cancelar */}
        <div className="mt-4 text-center">
          <Link
            href="/dashboard"
            className="text-sm text-[#004ac6] transition-opacity hover:opacity-70"
          >
            Cancelar
          </Link>
        </div>

      </div>
    </main>
  )
}
