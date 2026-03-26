'use client'

import { useState } from 'react'
import { MoreVertical } from 'lucide-react'
import { updateMemberRole } from '@/app/(dashboard)/dashboard/[groupId]/settings/actions'
import type { MemberRole } from '@/types'
import { useRouter } from 'next/navigation'

interface MemberItem {
  id: string
  user_id: string
  role: MemberRole
  profile: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface Props {
  groupId: string
  members: MemberItem[]
  currentUserId: string
  invitationToken: string | null
}

function Avatar({ name, avatar_url }: { name: string | null; avatar_url: string | null }) {
  const initials = (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (avatar_url) {
    return (
      <img
        src={avatar_url}
        alt={name ?? 'Avatar'}
        className="w-9 h-9 rounded-full object-cover"
      />
    )
  }
  return (
    <div className="w-9 h-9 rounded-full bg-[#dce6ff] text-[#004ac6] flex items-center justify-center text-[13px] font-semibold">
      {initials}
    </div>
  )
}

function RolePill({ role }: { role: MemberRole }) {
  if (role === 'admin') {
    return (
      <span className="rounded-full bg-[#dce6ff] text-[#004ac6] text-[11px] font-semibold px-2 py-0.5">
        ADMIN
      </span>
    )
  }
  return (
    <span className="rounded-full bg-[#e8f5e9] text-[#1b5e20] text-[11px] font-semibold px-2 py-0.5">
      MIEMBRO
    </span>
  )
}

export default function SettingsMembersSection({
  groupId,
  members,
  currentUserId,
  invitationToken,
}: Props) {
  const router = useRouter()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<{
    memberId: string
    newRole: MemberRole
    name: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [copied, setCopied] = useState(false)

  const adminCount = members.filter((m) => m.role === 'admin').length

  async function handleRoleChange() {
    if (!pendingAction) return
    setLoading(true)
    setError(null)

    const result = await updateMemberRole({
      group_id: groupId,
      member_id: pendingAction.memberId,
      role: pendingAction.newRole,
    })

    setLoading(false)
    setPendingAction(null)

    if (!result.success) {
      setError(result.error)
      return
    }

    router.refresh()
  }

  const inviteUrl = invitationToken
    ? `https://monthly-dinner.vercel.app/join/${invitationToken}`
    : null

  async function handleCopyInvite() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section>
      <div className="mb-1 text-[11px] font-medium tracking-[0.05em] uppercase text-[#585f6c]">
        ECOSISTEMA
      </div>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-['DM_Serif_Display'] text-[28px] italic font-normal leading-tight text-[#1c1b1b]">
          Miembros del <em className="text-[#004ac6] not-italic">Clan</em>
        </h2>
        <button
          onClick={() => setShowInviteDialog(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white"
        >
          Agregar
        </button>
      </div>

      {/* Lista de miembros */}
      <div className="rounded-2xl bg-white shadow-[0px_4px_16px_-4px_rgba(28,27,27,0.08)] divide-y divide-[#f0ede8]">
        {members.map((member) => {
          const name = member.profile?.full_name ?? 'Usuario'
          const isOnlyAdmin = member.role === 'admin' && adminCount <= 1
          const isCurrentUser = member.user_id === currentUserId

          return (
            <div key={member.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={member.profile?.full_name ?? null} avatar_url={member.profile?.avatar_url ?? null} />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-[#1c1b1b] truncate">
                  {name}
                  {isCurrentUser && (
                    <span className="ml-1 text-[12px] text-[#585f6c]">(vos)</span>
                  )}
                </p>
              </div>
              <RolePill role={member.role} />
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === member.id ? null : member.id)}
                  className="p-1 rounded-full text-[#585f6c] hover:bg-[#f0ede8] transition-colors"
                  aria-label="Opciones"
                >
                  <MoreVertical size={16} />
                </button>

                {openMenu === member.id && (
                  <>
                    {/* Click outside overlay */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setOpenMenu(null)}
                    />
                    <div className="absolute right-0 top-8 z-20 min-w-[180px] rounded-xl bg-white shadow-[0px_8px_24px_-4px_rgba(28,27,27,0.16)] border border-[#f0ede8] overflow-hidden">
                      {member.role === 'member' ? (
                        <button
                          onClick={() => {
                            setOpenMenu(null)
                            setPendingAction({
                              memberId: member.id,
                              newRole: 'admin',
                              name,
                            })
                          }}
                          className="w-full px-4 py-2.5 text-left text-[14px] text-[#1c1b1b] hover:bg-[#f6f3f2]"
                        >
                          Hacer admin
                        </button>
                      ) : (
                        <button
                          disabled={isOnlyAdmin}
                          onClick={() => {
                            if (isOnlyAdmin) return
                            setOpenMenu(null)
                            setPendingAction({
                              memberId: member.id,
                              newRole: 'member',
                              name,
                            })
                          }}
                          className={`w-full px-4 py-2.5 text-left text-[14px] ${
                            isOnlyAdmin
                              ? 'text-[#aaa] cursor-not-allowed'
                              : 'text-[#1c1b1b] hover:bg-[#f6f3f2]'
                          }`}
                        >
                          Hacer miembro
                          {isOnlyAdmin && (
                            <span className="block text-[11px] text-[#aaa]">
                              (debe haber al menos un admin)
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Error global */}
      {error && (
        <p className="mt-2 text-[13px] text-[#ba1a1a]">{error}</p>
      )}

      {/* Diálogo de confirmación de cambio de rol */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPendingAction(null)} />
          <div className="relative w-full max-w-[480px] rounded-2xl bg-[rgba(252,249,248,0.96)] backdrop-blur-[16px] p-6 shadow-[0px_20px_60px_-12px_rgba(28,27,27,0.3)]">
            <h3 className="text-[18px] font-semibold text-[#1c1b1b] mb-2">
              Cambiar rol
            </h3>
            <p className="text-[15px] text-[#585f6c] mb-6">
              ¿Querés hacer a{' '}
              <span className="font-semibold text-[#1c1b1b]">{pendingAction.name}</span>{' '}
              {pendingAction.newRole === 'admin' ? 'admin' : 'miembro'}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingAction(null)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-[#004ac6] px-4 py-2 text-[13px] font-semibold text-[#004ac6] bg-transparent"
              >
                Cancelar
              </button>
              <button
                onClick={handleRoleChange}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {loading ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de invitación */}
      {showInviteDialog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowInviteDialog(false)} />
          <div className="relative w-full max-w-[480px] rounded-2xl bg-[rgba(252,249,248,0.96)] backdrop-blur-[16px] p-6 shadow-[0px_20px_60px_-12px_rgba(28,27,27,0.3)]">
            <h3 className="text-[18px] font-semibold text-[#1c1b1b] mb-2">
              Invitar al Clan
            </h3>
            {inviteUrl ? (
              <>
                <p className="text-[13px] text-[#585f6c] mb-4">
                  Compartí este enlace para que alguien se una al grupo.
                </p>
                <div className="flex items-center gap-2 rounded-xl bg-[#f4f0eb] px-3 py-2.5">
                  <p className="flex-1 text-[12px] text-[#1c1b1b] truncate">{inviteUrl}</p>
                  <button
                    onClick={handleCopyInvite}
                    className="shrink-0 text-[#004ac6] text-[12px] font-semibold"
                  >
                    {copied ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-[14px] text-[#ba1a1a]">
                No hay un enlace de invitación activo. Generá uno en la sección de Ajustes.
              </p>
            )}
            <button
              onClick={() => setShowInviteDialog(false)}
              className="mt-4 w-full inline-flex items-center justify-center rounded-full border border-[#004ac6] px-4 py-2 text-[13px] font-semibold text-[#004ac6] bg-transparent"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
