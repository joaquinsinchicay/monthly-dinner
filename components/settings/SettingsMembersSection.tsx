'use client'

import { useState } from 'react'
import { MoreVertical } from 'lucide-react'
import { updateMemberRole, removeMember } from '@/app/(dashboard)/dashboard/[groupId]/settings/actions'
import { addGuestMember, deleteGuestMember } from '@/lib/actions/members'
import type { MemberRole } from '@/types'
import { useRouter } from 'next/navigation'

interface MemberItem {
  id: string
  user_id: string | null
  role: MemberRole
  is_guest: boolean
  display_name: string | null
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

function Avatar({
  name,
  avatar_url,
  isGuest,
}: {
  name: string | null
  avatar_url: string | null
  isGuest: boolean
}) {
  const initials = (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (!isGuest && avatar_url) {
    return (
      <img
        src={avatar_url}
        alt={name ?? 'Avatar'}
        className="w-9 h-9 rounded-full object-cover"
      />
    )
  }
  return (
    <div className="w-9 h-9 rounded-full bg-[#ede9e8] text-[#585f6c] flex items-center justify-center text-[13px] font-semibold">
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

function GuestPill() {
  return (
    <span className="rounded-full bg-[#ede9e8] text-[#585f6c] text-[11px] font-semibold px-2 py-0.5 uppercase tracking-[0.03em]">
      Sin cuenta
    </span>
  )
}

type AddTab = 'invite' | 'guest'

export default function SettingsMembersSection({
  groupId,
  members: initialMembers,
  currentUserId,
  invitationToken,
}: Props) {
  const router = useRouter()

  // Lista de miembros — estado local para feedback inmediato sin reload
  const [membersList, setMembersList] = useState<MemberItem[]>(initialMembers)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<{
    memberId: string
    newRole: MemberRole
    name: string
  } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{
    memberId: string
    userId: string | null
    name: string
    isGuest: boolean
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal de agregar
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addTab, setAddTab] = useState<AddTab>('invite')
  const [copied, setCopied] = useState(false)

  // Tab "Agregar sin cuenta"
  const [guestName, setGuestName] = useState('')
  const [guestError, setGuestError] = useState<string | null>(null)
  const [guestLoading, setGuestLoading] = useState(false)

  const adminCount = membersList.filter((m) => m.role === 'admin').length

  // ── Cambio de rol ──────────────────────────────────────────────────────────
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

  // ── Eliminar miembro (guest o no-guest) ────────────────────────────────────
  async function handleDelete() {
    if (!pendingDelete) return
    setLoading(true)
    setError(null)

    let result: { success: boolean; error?: string }

    if (pendingDelete.isGuest) {
      result = await deleteGuestMember({
        group_id: groupId,
        member_id: pendingDelete.memberId,
      })
    } else {
      if (!pendingDelete.userId) {
        setLoading(false)
        setPendingDelete(null)
        return
      }
      result = await removeMember({
        group_id: groupId,
        user_id: pendingDelete.userId,
      })
    }

    setLoading(false)
    setPendingDelete(null)

    if (!result.success) {
      setError(result.error ?? 'Error al eliminar el miembro')
      return
    }

    // Fade-out del row eliminado
    setRemovingId(pendingDelete.memberId)
    setTimeout(() => {
      setMembersList((prev) => prev.filter((m) => m.id !== pendingDelete.memberId))
      setRemovingId(null)
    }, 300)

    // Refresh en background para mantener datos consistentes con el servidor
    router.refresh()
  }

  // ── Agregar guest ──────────────────────────────────────────────────────────
  async function handleAddGuest(e: React.FormEvent) {
    e.preventDefault()
    setGuestError(null)

    const name = guestName.trim()
    if (!name) {
      setGuestError('El nombre es obligatorio')
      return
    }

    setGuestLoading(true)
    const result = await addGuestMember({ group_id: groupId, display_name: name })
    setGuestLoading(false)

    if (!result.success) {
      setGuestError(result.error)
      return
    }

    setGuestName('')
    setShowAddDialog(false)
    router.refresh()
  }

  // ── Copiar link de invitación ──────────────────────────────────────────────
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
          onClick={() => { setAddTab('invite'); setShowAddDialog(true) }}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white"
        >
          Agregar
        </button>
      </div>

      {/* Lista de miembros */}
      <div className="rounded-2xl bg-white shadow-[0px_4px_16px_-4px_rgba(28,27,27,0.08)] divide-y divide-[#f0ede8]">
        {membersList.map((member) => {
          const name = member.is_guest
            ? (member.display_name ?? 'Guest')
            : (member.profile?.full_name ?? 'Usuario')
          const isOnlyAdmin = member.role === 'admin' && adminCount <= 1
          const isCurrentUser = member.user_id === currentUserId
          const isRemoving = removingId === member.id

          return (
            <div
              key={member.id}
              className="flex items-center gap-3 px-4 py-3 transition-opacity duration-300"
              style={{ opacity: isRemoving ? 0 : 1 }}
            >
              <Avatar
                name={name}
                avatar_url={member.profile?.avatar_url ?? null}
                isGuest={member.is_guest}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-[#1c1b1b] truncate">
                  {name}
                  {isCurrentUser && (
                    <span className="ml-1 text-[12px] text-[#585f6c]">(vos)</span>
                  )}
                </p>
              </div>

              {/* Pills: rol + guest */}
              <div className="flex items-center gap-1.5 shrink-0">
                {member.is_guest ? <GuestPill /> : <RolePill role={member.role} />}
              </div>

              {/* Menú de opciones */}
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
                    <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                    <div className="absolute right-0 top-8 z-20 min-w-[180px] rounded-xl bg-white shadow-[0px_8px_24px_-4px_rgba(28,27,27,0.16)] overflow-hidden">
                      {member.is_guest ? (
                        // Guest: solo eliminar
                        <button
                          onClick={() => {
                            setOpenMenu(null)
                            setPendingDelete({ memberId: member.id, userId: null, name, isGuest: true })
                          }}
                          className="w-full px-4 py-2.5 text-left text-[14px] text-[#ba1a1a] hover:bg-[#fff0f0]"
                        >
                          Eliminar del grupo
                        </button>
                      ) : (
                        <>
                          {/* Cambio de rol */}
                          {member.role === 'member' ? (
                            <button
                              onClick={() => {
                                setOpenMenu(null)
                                setPendingAction({ memberId: member.id, newRole: 'admin', name })
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
                                setPendingAction({ memberId: member.id, newRole: 'member', name })
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

                          {/* Eliminar — solo para miembros que no son el usuario actual */}
                          {!isCurrentUser && (
                            <>
                              <div className="h-px bg-[#f0ede8] mx-3" />
                              <button
                                onClick={() => {
                                  setOpenMenu(null)
                                  setPendingDelete({ memberId: member.id, userId: member.user_id, name, isGuest: false })
                                }}
                                className="w-full px-4 py-2.5 text-left text-[14px] text-[#ba1a1a] hover:bg-[#fff0f0]"
                              >
                                Eliminar del grupo
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <p className="mt-2 text-[13px] text-[#ba1a1a]">{error}</p>
      )}

      {/* ── Diálogo de confirmación — cambio de rol ── */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPendingAction(null)} />
          <div className="relative w-full max-w-[480px] rounded-2xl bg-[rgba(252,249,248,0.88)] backdrop-blur-[16px] p-6 shadow-[0px_20px_60px_-12px_rgba(28,27,27,0.3)]">
            <h3 className="text-[18px] font-semibold text-[#1c1b1b] mb-2">Cambiar rol</h3>
            <p className="text-[15px] text-[#585f6c] mb-6">
              ¿Querés hacer a{' '}
              <span className="font-semibold text-[#1c1b1b]">{pendingAction.name}</span>{' '}
              {pendingAction.newRole === 'admin' ? 'admin' : 'miembro'}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingAction(null)}
                className="flex-1 inline-flex items-center justify-center rounded-full bg-[#f0ede8] px-4 py-2 text-[13px] font-semibold text-[#585f6c]"
              >
                Cancelar
              </button>
              <button
                onClick={handleRoleChange}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {loading ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom sheet de confirmación — eliminar miembro ── */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPendingDelete(null)} />
          <div className="relative w-full max-w-[480px] rounded-2xl bg-[rgba(252,249,248,0.88)] backdrop-blur-[16px] p-6 shadow-[0px_20px_60px_-12px_rgba(28,27,27,0.3)]">
            <h3 className="text-[18px] font-semibold text-[#1c1b1b] mb-2">Eliminar del grupo</h3>
            <p className="text-[15px] text-[#585f6c] mb-6">
              ¿Eliminar a{' '}
              <span className="font-semibold text-[#1c1b1b]">{pendingDelete.name}</span>{' '}
              del grupo? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 inline-flex items-center justify-center rounded-full bg-[#f0ede8] px-4 py-2 text-[13px] font-semibold text-[#585f6c]"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center rounded-full bg-[#ba1a1a] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal "Agregar" con tabs ── */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => { setShowAddDialog(false); setGuestName(''); setGuestError(null) }}
          />
          <div className="relative w-full max-w-[480px] rounded-2xl bg-[rgba(252,249,248,0.88)] backdrop-blur-[16px] p-6 shadow-[0px_20px_60px_-12px_rgba(28,27,27,0.3)]">

            {/* Tab toggle */}
            <div className="flex mb-5 rounded-xl bg-[#f0ede8] p-1 gap-1">
              <button
                onClick={() => setAddTab('invite')}
                className={`flex-1 rounded-lg py-2 text-[13px] font-semibold transition-colors ${
                  addTab === 'invite'
                    ? 'bg-white text-[#1c1b1b] shadow-sm'
                    : 'text-[#585f6c] hover:text-[#1c1b1b]'
                }`}
              >
                Invitar por link
              </button>
              <button
                onClick={() => setAddTab('guest')}
                className={`flex-1 rounded-lg py-2 text-[13px] font-semibold transition-colors ${
                  addTab === 'guest'
                    ? 'bg-white text-[#1c1b1b] shadow-sm'
                    : 'text-[#585f6c] hover:text-[#1c1b1b]'
                }`}
              >
                Agregar sin cuenta
              </button>
            </div>

            {/* Tab: Invitar por link */}
            {addTab === 'invite' && (
              <>
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
                  onClick={() => setShowAddDialog(false)}
                  className="mt-4 w-full inline-flex items-center justify-center rounded-full bg-[#f0ede8] px-4 py-2 text-[13px] font-semibold text-[#585f6c]"
                >
                  Cerrar
                </button>
              </>
            )}

            {/* Tab: Agregar sin cuenta */}
            {addTab === 'guest' && (
              <form onSubmit={handleAddGuest}>
                <h3 className="text-[18px] font-semibold text-[#1c1b1b] mb-1">
                  Agregar sin cuenta
                </h3>
                <p className="text-[13px] text-[#585f6c] mb-4">
                  Esta persona aparecerá en confirmaciones e historial. No tendrá acceso a la app.
                </p>

                <div className="mb-4">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c] mb-1.5">
                    NOMBRE
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => { setGuestName(e.target.value); setGuestError(null) }}
                    placeholder="Nombre del miembro"
                    maxLength={80}
                    className="w-full rounded-xl bg-[#f6f3f2] px-4 py-3 text-[15px] text-[#1c1b1b] placeholder-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
                    autoFocus
                  />
                  {guestError && (
                    <p className="mt-1.5 text-[13px] text-[#ba1a1a]">{guestError}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowAddDialog(false); setGuestName(''); setGuestError(null) }}
                    className="flex-1 inline-flex items-center justify-center rounded-full bg-[#f0ede8] px-4 py-2 text-[13px] font-semibold text-[#585f6c]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guestLoading}
                    className="flex-1 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
                  >
                    {guestLoading ? 'Agregando...' : 'Agregar al clan'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </section>
  )
}
