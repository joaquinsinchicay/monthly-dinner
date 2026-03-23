'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function OnboardingView() {
  const router = useRouter()
  const [linkInput, setLinkInput] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleJoinWithLink() {
    setError(null)
    const trimmed = linkInput.trim()
    if (!trimmed) {
      setError('Pegá el link de invitación.')
      return
    }

    // Extraer token del link completo (https://…/join/TOKEN) o token directo
    let token = trimmed
    try {
      const url = new URL(trimmed)
      const parts = url.pathname.split('/')
      const joinIndex = parts.indexOf('join')
      if (joinIndex !== -1 && parts[joinIndex + 1]) {
        token = parts[joinIndex + 1]
      }
    } catch {
      // No es URL válida — asumir que es el token directo
    }

    if (!token) {
      setError('El link no parece válido. Pedile uno nuevo al admin del grupo.')
      return
    }

    startTransition(() => {
      router.push(`/join/${token}`)
    })
  }

  return (
    <main className="min-h-screen bg-[#fcf9f8] px-4 py-10">
      <div className="mx-auto w-full max-w-sm space-y-8">

        {/* Header editorial */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
            Bienvenido
          </p>
          <h1
            className="mt-1 font-serif text-[28px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            ¿Cómo querés empezar?
          </h1>
          <p className="mt-2 text-sm text-[#585f6c]">
            Creá un grupo nuevo o unite a uno existente con un link de invitación.
          </p>
        </div>

        <div className="space-y-3">

          {/* Opción 1: Crear grupo */}
          <Link
            href="/crear-grupo"
            className="flex w-full items-center justify-between rounded-2xl bg-white p-5 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)] transition-shadow hover:shadow-[0px_20px_50px_-10px_rgba(28,27,27,0.13)]"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
                Opción 1
              </p>
              <p className="mt-0.5 text-[15px] font-semibold text-[#1c1b1b]">
                Crear un grupo
              </p>
              <p className="mt-0.5 text-sm text-[#585f6c]">
                Soy el organizador y quiero empezar.
              </p>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className="shrink-0 text-[#585f6c]"
            >
              <path
                d="M7.5 15l5-5-5-5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          {/* Opción 2: Tengo un link de invitación */}
          <div className="rounded-2xl bg-white p-5 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
            <button
              onClick={() => {
                setShowLinkInput((v) => !v)
                setError(null)
              }}
              className="flex w-full items-center justify-between"
            >
              <div className="text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
                  Opción 2
                </p>
                <p className="mt-0.5 text-[15px] font-semibold text-[#1c1b1b]">
                  Tengo un link de invitación
                </p>
                <p className="mt-0.5 text-sm text-[#585f6c]">
                  Me invitaron a unirme a un grupo existente.
                </p>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
                className={`shrink-0 text-[#585f6c] transition-transform ${showLinkInput ? 'rotate-90' : ''}`}
              >
                <path
                  d="M7.5 15l5-5-5-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {showLinkInput && (
              <div className="mt-4 space-y-3">
                <div>
                  <label
                    htmlFor="invite-link"
                    className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]"
                  >
                    Link de invitación
                  </label>
                  <input
                    id="invite-link"
                    type="text"
                    value={linkInput}
                    onChange={(e) => {
                      setLinkInput(e.target.value)
                      setError(null)
                    }}
                    placeholder="Pegá el link aquí"
                    className="mt-2 w-full rounded-xl bg-[#f0ede9] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-[#9ba3b0] focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
                  />
                </div>

                {error && (
                  <p className="text-sm text-[#ba1a1a]">{error}</p>
                )}

                <button
                  onClick={handleJoinWithLink}
                  disabled={isPending}
                  className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,74,198,0.25)] transition-opacity disabled:opacity-60"
                >
                  {isPending ? 'Redirigiendo...' : 'Ir al link'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}
