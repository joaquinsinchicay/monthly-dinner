'use client'

import { useState, useTransition } from 'react'
import { generateInvitationLink, revokeInvitationLink } from '@/lib/actions/invitation-links'
import type { InvitationLink, MemberRole } from '@/types'
import { t } from '@/lib/t'

interface Props {
  groupId: string
  initialLink: InvitationLink | null
  userRole: MemberRole
  baseUrl: string
}

export default function InvitationLinkPanel({
  groupId,
  initialLink,
  userRole,
  baseUrl,
}: Props) {
  const [link, setLink] = useState<InvitationLink | null>(initialLink)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isAdmin = userRole === 'admin'
  const inviteUrl = link ? `${baseUrl}/join/${link.token}` : null

  // Scenario: Link copiado al portapapeles
  async function handleCopy() {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError(t('group.invitationLink.errors.copyFailed'))
    }
  }

  // Generar nuevo link (link expirado o revocado)
  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const result = await generateInvitationLink(groupId)
      if (!result.success) {
        setError(result.error)
        return
      }
      setLink(result.data)
    })
  }

  // Scenario: Revocar link activo
  function handleRevoke() {
    if (!link) return
    setError(null)
    startTransition(async () => {
      const result = await revokeInvitationLink(link.id)
      if (!result.success) {
        setError(result.error)
        return
      }
      setLink(null)
    })
  }

  return (
    <div className="space-y-4">

      {/* Label — uppercase + tracking (design-system.md) */}
      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
        {t('group.invitationLink.label')}
      </p>

      {inviteUrl ? (
        <>
          {/* Link display — surface_low sin borde (design-system.md) */}
          <div className="flex items-center gap-2 rounded-xl bg-[#f6f3f2] px-4 py-3">
            <span className="flex-1 truncate text-sm text-[#1c1b1b]">
              {inviteUrl}
            </span>

            {/* Scenario: Link copiado al portapapeles — confirmación visual */}
            <button
              onClick={handleCopy}
              disabled={isPending}
              className="shrink-0 rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-4 py-1.5 text-xs font-semibold text-white shadow-[0_4px_16px_rgba(0,74,198,0.25)] transition-opacity disabled:opacity-60"
            >
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>

          {/* Expiración */}
          <p className="text-xs text-[#585f6c]">
            {t('group.invitationLink.validity')}
          </p>

          {/* Revocar — solo admin */}
          {isAdmin && (
            <button
              onClick={handleRevoke}
              disabled={isPending}
              className="text-xs text-[#ba1a1a] disabled:opacity-60"
            >
              {isPending ? t('group.invitationLink.revokePending') : t('group.invitationLink.revokeIdle')}
            </button>
          )}
        </>
      ) : (
        <>
          {/* Scenario: Link expirado o revocado */}
          <div className="rounded-xl bg-[#ffdad6] px-4 py-3">
            <p className="text-sm text-[#ba1a1a]">
              {t('group.invitationLink.unavailable')}
            </p>
          </div>

          {/* Admin puede generar uno nuevo */}
          {isAdmin && (
            <button
              onClick={handleGenerate}
              disabled={isPending}
              className="w-full rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,74,198,0.25)] disabled:opacity-60 transition-opacity"
            >
              {isPending ? t('group.invitationLink.generatePending') : t('group.invitationLink.generateIdle')}
            </button>
          )}
        </>
      )}

      {/* Error inline (technical-decisions.md) */}
      {error && (
        <p className="text-sm text-[#ba1a1a]">{error}</p>
      )}
    </div>
  )
}
