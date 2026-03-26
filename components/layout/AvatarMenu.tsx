'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Settings, LogOut } from 'lucide-react'
import { signOut } from '@/lib/actions/auth'
import AvatarUser from '@/components/ui/avatar-user'

interface Props {
  profile: { full_name: string | null; avatar_url: string | null } | null
}

// Scenario: Avatar visible en el header — foto de perfil de Google o iniciales.
// Scenario: Menú del avatar muestra dos opciones — "Configuración del grupo" y "Cerrar sesión".
// Scenario: Acceso a configuración del grupo — redirect a /dashboard/[groupId]/settings.
// Scenario: Cierre de sesión desde el avatar — diálogo de confirmación + signOut.
// Scenario: Cierre del menú sin acción — click fuera cierra sin ejecutar nada.
export default function AvatarMenu({ profile }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useParams()

  // Lee el grupo activo desde la URL (/dashboard/[groupId])
  const activeGroupId = (params?.groupId as string) ?? ''

  // Scenario: Cierre del menú sin acción
  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  // Scenario: Acceso a configuración del grupo
  function handleSettings() {
    setMenuOpen(false)
    router.push(`/dashboard/${activeGroupId}/settings`)
  }

  function handleSignOutRequest() {
    setMenuOpen(false)
    setDialogOpen(true)
  }

  function handleSignOutConfirm() {
    startTransition(async () => {
      await signOut()
    })
  }

  return (
    <>
      <div ref={ref} className="relative">
        {/* Scenario: Avatar visible en el header */}
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Menú de usuario"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-[#004ac6] focus:outline-none"
        >
          <AvatarUser
            avatarUrl={profile?.avatar_url ?? null}
            fullName={profile?.full_name ?? '?'}
            size="md"
          />
        </button>

        {/* Scenario: Menú del avatar muestra dos opciones */}
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-lg bg-white shadow-[0px_8px_24px_-4px_rgba(28,27,27,0.12)]"
          >
            {/* Ítem 1: Configuración del grupo */}
            <button
              role="menuitem"
              onClick={handleSettings}
              className="flex w-full items-center gap-3 rounded-t-lg px-4 py-3 text-left text-[15px] text-[#1c1b1b] transition-colors hover:bg-[#f6f3f2]"
            >
              <Settings size={16} className="shrink-0 text-[#585f6c]" />
              Configuración del grupo
            </button>

            {/* Separador: espacio en blanco, sin hr */}
            <div className="h-1" />

            {/* Ítem 2: Cerrar sesión */}
            <button
              role="menuitem"
              onClick={handleSignOutRequest}
              className="flex w-full items-center gap-3 rounded-b-lg px-4 py-3 text-left text-[15px] text-[#ba1a1a] transition-colors hover:bg-[#f6f3f2]"
            >
              <LogOut size={16} className="shrink-0" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {/* Scenario: Diálogo de confirmación — bottom sheet glassmorphism */}
      {dialogOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[#1c1b1b]/30 backdrop-blur-[2px]"
            onClick={() => !isPending && setDialogOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="avatar-signout-title"
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] p-6 pb-10"
            style={{
              background: 'rgba(252,249,248,0.88)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0px 20px 50px -10px rgba(28,27,27,0.13)',
            }}
          >
            {/* Handle pill */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#c8cdd6]" />

            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
              Sesión
            </p>
            <h2
              id="avatar-signout-title"
              className="mt-1 font-serif text-[22px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
              style={{ fontFamily: 'DM Serif Display, serif' }}
            >
              ¿Cerrar sesión?
            </h2>
            <p className="mt-2 text-sm text-[#585f6c]">
              Tendrás que volver a iniciar sesión con Google la próxima vez.
            </p>

            <div className="mt-6 space-y-3">
              {/* Scenario: Cerrar sesión — confirmar */}
              <button
                onClick={handleSignOutConfirm}
                disabled={isPending}
                className="flex w-full items-center justify-center rounded-full bg-[#ba1a1a] px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              >
                {isPending ? 'Cerrando sesión...' : 'Cerrar sesión'}
              </button>

              {/* Cancelar */}
              <button
                onClick={() => setDialogOpen(false)}
                disabled={isPending}
                className="flex w-full items-center justify-center rounded-full bg-[#f0ede9] px-6 py-3 text-sm font-semibold text-[#1c1b1b] transition-opacity disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
