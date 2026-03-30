'use client'

import { useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { signInWithGoogle } from '@/lib/actions/auth'
import { t } from '@/lib/t'

export default function GoogleSignInButton() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()

  function handleClick() {
    setError(null)
    // Scenario 04 (US-02): propagar ?redirect= para restaurar contexto post re-login
    const redirect = searchParams.get('redirect') ?? undefined
    startTransition(async () => {
      const result = await signInWithGoogle(redirect)
      // signInWithGoogle hace redirect() si tiene éxito — solo llega aquí si falla
      if (result && !result.success) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-3">
      {/* Botón Google — primary_container sólido, py-4, text-base font-medium */}
      <button
        onClick={handleClick}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #004ac6, #2563eb)' }}
      >
        {isPending ? (
          <span>{t('auth.redirecting')}</span>
        ) : (
          <>
            {/* Google icon oficial */}
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#fff" fillOpacity=".9"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#fff" fillOpacity=".8"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#fff" fillOpacity=".7"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#fff" fillOpacity=".6"/>
            </svg>
            <span>{t('auth.continueWithGoogle')}</span>
          </>
        )}
      </button>

      {/* Texto legal */}
      <p className="text-center text-xs text-[#585f6c]">
        {t('auth.autoAccountCreation')}
      </p>

      {/* Error inline — nunca alert() */}
      {error && (
        <p className="text-center text-sm text-[#ba1a1a]">{error}</p>
      )}
    </div>
  )
}
