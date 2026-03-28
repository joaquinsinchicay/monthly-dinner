'use client'

import { useState, useCallback } from 'react'
import { Shuffle, Pencil, RotateCcw, Link2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { generateRandomRotation, linkAccountToRotationSlot, getUnlinkedMembers, updateRotationEntry } from '@/app/(dashboard)/rotation/actions'
import { t } from '@/lib/t'

// ── Utils ─────────────────────────────────────────────────────────────────────

function formatMonth(isoDate: string): string {
  const [year, monthStr] = isoDate.split('-')
  const date = new Date(parseInt(year), parseInt(monthStr) - 1, 1)
  const monthName = date.toLocaleDateString('es-AR', { month: 'long' })
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`
}

function addMonths(base: Date, n: number): string {
  const d = new Date(base.getFullYear(), base.getMonth() + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocalMember {
  id: string
  user_id: string | null
  role: 'member' | 'admin'
  is_guest: boolean
  display_name: string | null
  profile: { id: string; full_name: string | null; avatar_url: string | null } | null
}

interface RotationItem {
  id: string
  user_id: string | null
  member_id: string | null
  display_name: string | null
  month: string
  profile: { full_name: string | null; avatar_url: string | null } | null
}

interface PreviewItem {
  member_id: string
  user_id: string | null
  display_name: string | null
  month: string
  name: string
}

interface ManualItem {
  month: string
  member_id: string | null
}

type Mode = 'view' | 'random-preview' | 'manual-config' | 'edit'

interface UnlinkedMember {
  member_id: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
}

interface Props {
  groupId: string
  isAdmin: boolean
  members: LocalMember[]
  rotation: RotationItem[]
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function MemberAvatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name}
      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
    />
  ) : (
    <div className="w-8 h-8 rounded-full bg-[#dce6ff] text-[#004ac6] flex items-center justify-center text-[12px] font-semibold flex-shrink-0">
      {initials}
    </div>
  )
}

function SinCuentaTag() {
  return (
    <span className="inline-flex items-center rounded-full bg-[#dce2f3] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[#585f6c]">
      {t('group.rotation.sinCuentaBadge')}
    </span>
  )
}

function getMemberName(m: LocalMember): string {
  if (m.is_guest && m.display_name) return m.display_name
  return m.profile?.full_name ?? t('group.rotation.fallbackMember')
}

function getSlotName(item: RotationItem): string {
  if (item.user_id && item.profile?.full_name) return item.profile.full_name
  if (item.display_name) return item.display_name
  return t('group.rotation.fallbackMember')
}

function isAccountless(item: RotationItem): boolean {
  return !item.user_id
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function RotationManager({ groupId, isAdmin, members, rotation }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('view')
  const [preview, setPreview] = useState<PreviewItem[]>([])
  const [manualItems, setManualItems] = useState<ManualItem[]>([])
  const [editItems, setEditItems] = useState<RotationItem[]>(rotation)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Link flow state
  const [linkingSlot, setLinkingSlot] = useState<RotationItem | null>(null)
  const [unlinkedCandidates, setUnlinkedCandidates] = useState<UnlinkedMember[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  // All members are eligible for rotation — accountless members included (US-11c)
  const allMembers = members

  // ── Random preview ────────────────────────────────────────────────────────

  const generatePreview = useCallback(() => {
    const shuffled = shuffleArray(allMembers)
    const base = new Date()
    const items: PreviewItem[] = shuffled.map((m, i) => ({
      member_id: m.id,
      user_id: m.user_id ?? null,
      display_name: m.user_id ? null : (m.display_name ?? getMemberName(m)),
      month: addMonths(base, i + 1),
      name: getMemberName(m),
    }))
    setPreview(items)
    setError(null)
    setMode('random-preview')
  }, [allMembers])

  async function confirmRandomRotation() {
    setLoading(true)
    setError(null)
    const result = await generateRandomRotation({
      group_id: groupId,
      entries: preview.map((p) => ({
        member_id: p.member_id,
        user_id: p.user_id,
        display_name: p.display_name,
        month: p.month,
      })),
    })
    setLoading(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    setMode('view')
    router.refresh()
  }

  // ── Manual config ─────────────────────────────────────────────────────────

  function openManualConfig() {
    const base = new Date()
    const items: ManualItem[] = Array.from({ length: 6 }, (_, i) => ({
      month: addMonths(base, i + 1),
      member_id: null,
    }))
    setManualItems(items)
    setError(null)
    setMode('manual-config')
  }

  async function confirmManualRotation() {
    const allAssigned = manualItems.every((i) => i.member_id !== null)
    if (!allAssigned) {
      setError(t('group.rotation.errors.allMonthsRequired'))
      return
    }
    setLoading(true)
    setError(null)

    const entries = manualItems.map((item) => {
      const m = allMembers.find((mb) => mb.id === item.member_id)!
      return {
        member_id: item.member_id!,
        user_id: m.user_id ?? null,
        display_name: m.user_id ? null : (m.display_name ?? getMemberName(m)),
        month: item.month,
      }
    })

    const result = await generateRandomRotation({ group_id: groupId, entries })
    setLoading(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    setMode('view')
    router.refresh()
  }

  // ── Edit existing rotation ─────────────────────────────────────────────────

  function openEdit() {
    setEditItems([...rotation])
    setError(null)
    setMode('edit')
  }

  async function saveEdit() {
    setLoading(true)
    setError(null)

    for (const item of editItems) {
      const original = rotation.find((r) => r.id === item.id)
      const memberChanged =
        original?.member_id !== item.member_id ||
        original?.user_id !== item.user_id
      if (!memberChanged || !item.member_id) continue

      const result = await updateRotationEntry({
        rotation_id: item.id,
        group_id: groupId,
        member_id: item.member_id,
        user_id: item.user_id,
        display_name: item.display_name,
      })
      if (!result.success) {
        setLoading(false)
        setError(result.error)
        return
      }
    }

    setLoading(false)
    setMode('view')
    router.refresh()
  }

  function cancel() {
    setMode('view')
    setError(null)
  }

  // ── Link account to slot (US-11c) ──────────────────────────────────────────

  async function openLinkFlow(slot: RotationItem) {
    setLinkError(null)
    setSelectedUserId('')
    setLinkingSlot(slot)
    setLinkLoading(true)
    const result = await getUnlinkedMembers({ group_id: groupId })
    setLinkLoading(false)
    if (!result.success) {
      setLinkError(result.error)
      return
    }
    setUnlinkedCandidates(result.data)
  }

  async function confirmLink() {
    if (!linkingSlot || !selectedUserId) return
    setLinkLoading(true)
    setLinkError(null)
    const result = await linkAccountToRotationSlot({
      rotation_id: linkingSlot.id,
      user_id: selectedUserId,
    })
    setLinkLoading(false)
    if (!result.success) {
      setLinkError(result.error)
      return
    }
    setLinkingSlot(null)
    router.refresh()
  }

  const isEmpty = rotation.length === 0

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section>
      {/* Header */}
      <div className="mb-1 text-[11px] font-medium tracking-[0.05em] uppercase text-[#585f6c]">
        {t('settings.rotationEyebrow')}
      </div>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-['DM_Serif_Display'] text-[28px] italic font-normal leading-tight text-[#1c1b1b]">
          {t('settings.rotationTitle')} <em className="text-[#004ac6] not-italic">{t('settings.rotationTitleHighlight')}</em>
        </h2>

        {/* "Editar rotación" — only in view mode with existing rotation */}
        {isAdmin && !isEmpty && mode === 'view' && (
          <button
            onClick={openEdit}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#004ac6] px-4 py-2 text-[13px] font-semibold text-[#004ac6] bg-transparent"
          >
            <Pencil size={14} />
            {t('group.rotation.editButton')}
          </button>
        )}
      </div>

      {/* ── EMPTY / VIEW STATE ── */}
      {isEmpty && mode === 'view' && (
        <div className="rounded-2xl bg-white shadow-[0px_4px_16px_-4px_rgba(28,27,27,0.08)] px-6 py-6">
          <p className="text-[14px] text-[#585f6c] text-center mb-5">
            {t('settings.noRotation')}
          </p>
          {isAdmin && (
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={generatePreview}
                className="inline-flex items-center gap-2 rounded-full border border-[#004ac6] px-4 py-2 text-[13px] font-semibold text-[#004ac6] bg-transparent"
              >
                <Shuffle size={14} />
                {t('group.rotation.generateRandom')}
              </button>
              <button
                onClick={openManualConfig}
                className="inline-flex items-center gap-2 rounded-full border border-[#585f6c] px-4 py-2 text-[13px] font-semibold text-[#585f6c] bg-transparent"
              >
                <Pencil size={14} />
                {t('group.rotation.configureManual')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── RANDOM PREVIEW ── */}
      {mode === 'random-preview' && (
        <div className="rounded-2xl bg-white shadow-[0px_4px_16px_-4px_rgba(28,27,27,0.08)] px-4 py-4">
          <p className="text-[11px] font-medium tracking-[0.05em] uppercase text-[#585f6c] mb-3">
            {t('group.rotation.previewLabel')}
          </p>
          <div className="space-y-2 mb-4">
            {preview.map((item) => (
              <div key={item.month} className="flex items-center justify-between py-1">
                <span className="text-[13px] font-medium text-[#1c1b1b]">
                  {formatMonth(item.month)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-[#585f6c]">{item.name}</span>
                  {!item.user_id && <SinCuentaTag />}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={generatePreview}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#585f6c]"
            >
              <RotateCcw size={14} />
              {t('group.rotation.regenerate')}
            </button>
            <div className="flex gap-2">
              <button
                onClick={cancel}
                className="inline-flex items-center rounded-full border border-[#585f6c] px-4 py-2 text-[13px] font-semibold text-[#585f6c]"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmRandomRotation}
                disabled={loading}
                className="inline-flex items-center rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {loading ? t('common.saving') : t('group.rotation.confirmRotation')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MANUAL CONFIG ── */}
      {mode === 'manual-config' && (
        <div className="rounded-2xl bg-white shadow-[0px_4px_16px_-4px_rgba(28,27,27,0.08)] px-4 py-4">
          <div className="space-y-3 mb-4">
            {manualItems.map((item, idx) => (
              <div key={item.month} className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-[#1c1b1b] w-[130px] flex-shrink-0">
                  {formatMonth(item.month)}
                </span>
                <select
                  value={item.member_id ?? ''}
                  onChange={(e) => {
                    const updated = [...manualItems]
                    updated[idx] = { ...item, member_id: e.target.value || null }
                    setManualItems(updated)
                  }}
                  className="flex-1 rounded-lg bg-[#f6f3f2] px-3 py-2 text-[13px] text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
                >
                  <option value="">{t('group.rotation.unassigned')}</option>
                  {allMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {getMemberName(m)}{m.is_guest || !m.user_id ? ` ${t('group.rotation.withoutAccount')}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={cancel}
              className="inline-flex items-center rounded-full border border-[#585f6c] px-4 py-2 text-[13px] font-semibold text-[#585f6c]"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={confirmManualRotation}
              disabled={loading || manualItems.some((i) => !i.member_id)}
              className="inline-flex items-center rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {loading ? t('common.saving') : t('group.rotation.saveRotation')}
            </button>
          </div>
        </div>
      )}

      {/* ── POPULATED VIEW (read-only) ── */}
      {!isEmpty && mode === 'view' && (
        <div className="rounded-2xl bg-white shadow-[0px_4px_16px_-4px_rgba(28,27,27,0.08)] px-4 py-4 space-y-2">
          {rotation.map((item) => {
            const name = getSlotName(item)
            const accountless = isAccountless(item)
            return (
              <div key={item.id} className="flex items-center gap-3 py-1">
                <MemberAvatar
                  name={name}
                  avatarUrl={accountless ? null : (item.profile?.avatar_url ?? null)}
                />
                <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[13px] font-medium text-[#1c1b1b]">{name}</span>
                  {accountless && <SinCuentaTag />}
                  <span className="text-[12px] text-[#585f6c]">{formatMonth(item.month)}</span>
                </div>
                {isAdmin && accountless && (
                  <button
                    onClick={() => openLinkFlow(item)}
                    title="Vincular cuenta"
                    className="inline-flex items-center gap-1 rounded-full border border-[#004ac6] px-3 py-1 text-[11px] font-semibold text-[#004ac6] bg-transparent flex-shrink-0"
                  >
                    <Link2 size={12} />
                    {t('group.rotation.linkAccount.linkButton')}
                  </button>
                )}
                {isAdmin && !accountless && (
                  <button
                    onClick={openEdit}
                    aria-label="Editar rotación"
                    className="text-[#585f6c] hover:text-[#004ac6] transition-colors flex-shrink-0"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── EDIT MODE ── */}
      {!isEmpty && mode === 'edit' && (
        <div className="rounded-2xl bg-white shadow-[0px_4px_16px_-4px_rgba(28,27,27,0.08)] px-4 py-4">
          <div className="space-y-3 mb-4">
            {editItems.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-[#1c1b1b] w-[130px] flex-shrink-0">
                  {formatMonth(item.month)}
                </span>
                <select
                  value={item.member_id ?? item.id}
                  onChange={(e) => {
                    const selectedMember = allMembers.find((m) => m.id === e.target.value)
                    if (!selectedMember) return
                    const updated = [...editItems]
                    updated[idx] = {
                      ...item,
                      member_id: selectedMember.id,
                      user_id: selectedMember.user_id ?? null,
                      display_name: selectedMember.user_id
                        ? null
                        : (selectedMember.display_name ?? getMemberName(selectedMember)),
                      profile: selectedMember.profile
                        ? { full_name: selectedMember.profile.full_name, avatar_url: selectedMember.profile.avatar_url }
                        : null,
                    }
                    setEditItems(updated)
                  }}
                  className="flex-1 rounded-lg bg-[#f6f3f2] px-3 py-2 text-[13px] text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
                >
                  {allMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {getMemberName(m)}{m.is_guest || !m.user_id ? ` ${t('group.rotation.withoutAccount')}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={cancel}
              className="inline-flex items-center rounded-full border border-[#585f6c] px-4 py-2 text-[13px] font-semibold text-[#585f6c]"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={saveEdit}
              disabled={loading}
              className="inline-flex items-center rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {loading ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      )}

      {/* ── LINK ACCOUNT MODAL (US-11c) ── */}
      {linkingSlot && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-6">
          <div className="w-full max-w-[420px] rounded-2xl bg-white px-6 py-6 shadow-xl">
            <p className="text-[11px] font-medium tracking-[0.05em] uppercase text-[#585f6c] mb-1">
              {t('group.rotation.linkAccount.eyebrow')}
            </p>
            <h3 className="font-['DM_Serif_Display'] text-[22px] italic font-normal text-[#1c1b1b] mb-1">
              {getSlotName(linkingSlot)}
            </h3>
            <p className="text-[13px] text-[#585f6c] mb-5">
              {t('group.rotation.linkAccount.subtitle')}
            </p>

            {linkLoading && !unlinkedCandidates.length ? (
              <p className="text-[13px] text-[#585f6c] text-center py-4">{t('group.rotation.linkAccount.loading')}</p>
            ) : unlinkedCandidates.length === 0 ? (
              <p className="text-[13px] text-[#585f6c] text-center py-4">
                {t('group.rotation.linkAccount.noMembers')}
              </p>
            ) : (
              <div className="space-y-2 mb-5">
                {unlinkedCandidates.map((c) => {
                  const name = c.full_name ?? t('group.rotation.linkAccount.noName')
                  const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
                  const selected = selectedUserId === c.user_id
                  return (
                    <button
                      key={c.user_id}
                      onClick={() => setSelectedUserId(c.user_id)}
                      className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                        selected
                          ? 'bg-[#dce6ff] ring-2 ring-[#004ac6]'
                          : 'bg-[#f6f3f2] hover:bg-[#eceaf8]'
                      }`}
                    >
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#dce6ff] text-[#004ac6] flex items-center justify-center text-[12px] font-semibold flex-shrink-0">
                          {initials}
                        </div>
                      )}
                      <span className="text-[13px] font-medium text-[#1c1b1b]">{name}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {linkError && <p className="mb-3 text-[13px] text-[#ba1a1a]">{linkError}</p>}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setLinkingSlot(null); setLinkError(null) }}
                className="inline-flex items-center rounded-full border border-[#585f6c] px-4 py-2 text-[13px] font-semibold text-[#585f6c]"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmLink}
                disabled={!selectedUserId || linkLoading}
                className="inline-flex items-center rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {linkLoading ? t('group.rotation.linkAccount.confirmPending') : t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-[13px] text-[#ba1a1a]">{error}</p>}
    </section>
  )
}
