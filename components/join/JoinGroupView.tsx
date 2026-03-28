'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { joinGroup } from '@/lib/actions/join'
import { signInWithGoogle } from '@/lib/actions/auth'
import { t } from '@/lib/t'

interface Props {
  token: string
  groupName: string
  isAuthenticated: boolean
}

export default function JoinGroupView({ token, groupName, isAuthenticated }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Scenario: Join con cuenta existente — usuario ya autenticado toca "Unirme"
  function handleJoin() {
    setError(null)
    startTransition(async () => {
      const result = await joinGroup(token)
      if (!result.success) {
        setError(result.error)
        return
      }
      router.push(`/dashboard/${result.data.groupId}`)
    })
  }

  // Scenario: Join con cuenta nueva — inicia OAuth preservando el token en 'next'
  function handleSignInWithGoogle() {
    setError(null)
    startTransition(async () => {
      const result = await signInWithGoogle(`/join/${token}`)
      if (result && !result.success) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">

      {/* Nombre del grupo — display editorial */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
          {t('join.invitationLabel')}
        </p>
        <h1
          className="mt-1 font-serif text-[28px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          {groupName}
        </h1>
        <p className="mt-2 text-sm text-[#585f6c]">
          {isAuthenticated
            ? t('join.authenticatedSubtitle')
            : t('auth.signInToJoin')}
        </p>
      </div>

      {/* Card sin borde — tonal layering (design-system.md) */}
      <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
        {isAuthenticated ? (
          // Scenario: Join con cuenta existente
          <button
            onClick={handleJoin}
            disabled={isPending}
            className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,74,198,0.25)] transition-opacity disabled:opacity-60"
          >
            {isPending ? t('join.joining') : t('join.joinButton', { groupName })}
          </button>
        ) : (
          // Scenario: Join con cuenta nueva
          <button
            onClick={handleSignInWithGoogle}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,74,198,0.25)] transition-opacity disabled:opacity-60"
          >
            {isPending ? (
              <span>{t('auth.redirecting')}</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#fff" fillOpacity=".9"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#fff" fillOpacity=".8"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#fff" fillOpacity=".7"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#fff" fillOpacity=".6"/>
                </svg>
                <span>{t('auth.signInWithGoogleToJoin')}</span>
              </>
            )}
          </button>
        )}

        {/* Error inline */}
        {error && (
          <p className="mt-4 text-center text-sm text-[#ba1a1a]">{error}</p>
        )}
      </div>
    </div>
  )
}
