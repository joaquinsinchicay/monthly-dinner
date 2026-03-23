'use client'

import { useState, useTransition } from 'react'
import { signOut } from '@/lib/actions/auth'

export default function SignOutButton() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Scenario: Confirmación antes de cerrar — bottom sheet glassmorphism
  function handleConfirm() {
    startTransition(async () => {
      await signOut()
    })
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-[#585f6c] underline-offset-2 hover:underline"
      >
        Cerrar sesión
      </button>

      {/* Scenario: Confirmación antes de cerrar — bottom sheet */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-[#1c1b1b]/30 backdrop-blur-[2px]"
            onClick={() => !isPending && setOpen(false)}
            aria-hidden="true"
          />

          {/* Bottom sheet — glassmorphism (design-system.md) */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-title"
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

            <p
              id="signout-title"
              className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]"
            >
              Sesión
            </p>
            <h2
              className="mt-1 font-serif text-[22px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
              style={{ fontFamily: 'DM Serif Display, serif' }}
            >
              ¿Cerrar sesión?
            </h2>
            <p className="mt-2 text-sm text-[#585f6c]">
              Tendrás que volver a iniciar sesión con Google la próxima vez.
            </p>

            <div className="mt-6 space-y-3">
              {/* Scenario: Cierre de sesión exitoso — confirmar */}
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,74,198,0.25)] transition-opacity disabled:opacity-60"
              >
                {isPending ? 'Cerrando sesión...' : 'Sí, cerrar sesión'}
              </button>

              {/* Cancelar */}
              <button
                onClick={() => setOpen(false)}
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
