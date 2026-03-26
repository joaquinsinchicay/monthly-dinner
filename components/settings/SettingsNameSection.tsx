'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { updateGroupName } from '@/app/(dashboard)/dashboard/[groupId]/settings/actions'
import { useRouter } from 'next/navigation'

interface Props {
  groupId: string
  initialName: string
  invitationToken: string | null
}

export default function SettingsNameSection({ groupId, initialName, invitationToken }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [draftName, setDraftName] = useState(initialName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Invitation link state
  const [copied, setCopied] = useState(false)
  const [checkIcon, setCheckIcon] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [currentToken, setCurrentToken] = useState(invitationToken)

  const inviteUrl = currentToken
    ? `https://monthly-dinner.vercel.app/join/${currentToken}`
    : null

  async function handleSaveName() {
    setLoading(true)
    setError(null)

    const result = await updateGroupName({ group_id: groupId, name: draftName })

    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setName(result.data.name)
    setEditing(false)
    router.refresh()
  }

  async function handleCopyLink() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCheckIcon(true)
    setTimeout(() => setCheckIcon(false), 2000)
  }

  async function handleGenerateNew() {
    setInviteLoading(true)
    setInviteError(null)

    // Import dynamically to avoid circular dependency
    const { generateInvitationLink } = await import('@/lib/actions/invitation-links')
    const result = await generateInvitationLink(groupId)

    setInviteLoading(false)

    if (!result.success) {
      setInviteError('No se pudo generar el enlace. Intentá de nuevo.')
      return
    }

    setCurrentToken(result.data.token)
    router.refresh()
  }

  return (
    <section>
      <div className="mb-1 text-[11px] font-medium tracking-[0.05em] uppercase text-[#585f6c]">
        CONTROL &amp; IDENTIDAD
      </div>
      <div className="mb-4">
        <h2 className="font-['DM_Serif_Display'] text-[28px] italic font-normal leading-tight text-[#1c1b1b]">
          Ajustes del <em className="text-[#004ac6] not-italic">Clan</em>
        </h2>
      </div>

      {/* Card nombre del clan */}
      <div className="rounded-2xl bg-white shadow-[0px_4px_16px_-4px_rgba(28,27,27,0.08)] divide-y divide-[#f0ede8] mb-4">
        <button
          onClick={() => {
            setDraftName(name)
            setEditing(!editing)
            setError(null)
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#faf8f7] transition-colors"
        >
          <Pencil size={16} className="text-[#585f6c] shrink-0" />
          <span className="flex-1 text-[15px] text-[#1c1b1b]">Nombre del Clan</span>
          <span className="text-[14px] text-[#585f6c] truncate max-w-[140px]">{name}</span>
        </button>

        {editing && (
          <div className="px-4 py-3 space-y-3">
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Nombre del grupo"
              autoFocus
              className="w-full rounded-xl border-0 bg-[#f4f0eb] px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
            />
            {error && <p className="text-[13px] text-[#ba1a1a]">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(false)
                  setError(null)
                }}
                className="flex-1 inline-flex items-center justify-center rounded-full border border-[#004ac6] px-4 py-2 text-[13px] font-semibold text-[#004ac6] bg-transparent"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveName}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card enlace de invitación */}
      <div className="rounded-2xl bg-white shadow-[0px_4px_16px_-4px_rgba(28,27,27,0.08)] px-4 py-4">
        <div className="mb-2 text-[11px] font-medium tracking-[0.05em] uppercase text-[#585f6c]">
          ENLACE DE INVITACIÓN
        </div>

        {inviteUrl ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[#1c1b1b] truncate">{inviteUrl}</p>
            </div>
            <button
              onClick={handleCopyLink}
              aria-label="Copiar enlace"
              className="shrink-0 p-2 rounded-full text-[#004ac6] hover:bg-[#f0ede8] transition-colors"
            >
              {checkIcon ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-[14px] text-[#ba1a1a]">Link expirado</p>
            <button
              onClick={handleGenerateNew}
              disabled={inviteLoading}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {inviteLoading ? 'Generando...' : 'Generar nuevo'}
            </button>
          </div>
        )}

        {inviteError && (
          <p className="mt-2 text-[13px] text-[#ba1a1a]">{inviteError}</p>
        )}
      </div>
    </section>
  )
}
