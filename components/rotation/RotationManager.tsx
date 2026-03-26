'use client'

import { useState, useCallback } from 'react'
import { Shuffle, Pencil, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { generateRandomRotation } from '@/app/(dashboard)/rotation/actions'
import { reorderRotation } from '@/app/(dashboard)/dashboard/[groupId]/settings/actions'

// ── Utils ─────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function formatMonth(isoDate: string): string {
  const parts = isoDate.split('-')
  return `${MONTH_NAMES[parseInt(parts[1]) - 1]} ${parts[0]}`
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
  user_id: string
  month: string
  profile: { full_name: string | null; avatar_url: string | null } | null
}

interface PreviewItem {
  user_id: string
  month: string
  name: string
}

interface ManualItem {
  month: string
  user_id: string | null
}

type Mode = 'view' | 'random-preview' | 'manual-config' | 'edit'

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

function getMemberName(m: LocalMember): string {
  if (m.is_guest && m.display_name) return m.display_name
  return m.profile?.full_name ?? 'Miembro'
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

  // Members with a real account (user_id non-null) — eligible for rotation DB insert
  // Guests are shown in selectors with a "(Sin cuenta)" label but can't be saved
  // TODO: support guest rotation by adding member_id to the rotation table schema
  const eligibleMembers = members.filter((m) => !m.is_guest && m.user_id)

  // ── Random preview ────────────────────────────────────────────────────────

  const generatePreview = useCallback(() => {
    const shuffled = shuffleArray(eligibleMembers)
    const base = new Date()
    const items: PreviewItem[] = shuffled.map((m, i) => ({
      user_id: m.user_id!,
      month: addMonths(base, i + 1),
      name: getMemberName(m),
    }))
    setPreview(items)
    setError(null)
    setMode('random-preview')
  }, [eligibleMembers])

  async function confirmRandomRotation() {
    setLoading(true)
    setError(null)
    const result = await generateRandomRotation({
      group_id: groupId,
      entries: preview.map((p) => ({ user_id: p.user_id, month: p.month })),
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
      user_id: null,
    }))
    setManualItems(items)
    setError(null)
    setMode('manual-config')
  }

  async function confirmManualRotation() {
    const allAssigned = manualItems.every((i) => i.user_id !== null)
    if (!allAssigned) {
      setError('Todos los meses deben tener un miembro asignado.')
      return
    }
    setLoading(true)
    setError(null)
    const result = await generateRandomRotation({
      group_id: groupId,
      entries: manualItems.map((i) => ({ user_id: i.user_id!, month: i.month })),
    })
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
    const result = await reorderRotation({
      group_id: groupId,
      ordered_user_ids: editItems.map((i) => i.user_id),
    })
    setLoading(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    setMode('view')
    router.refresh()
  }

  function cancel() {
    setMode('view')
    setError(null)
  }

  const isEmpty = rotation.length === 0

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section>
      {/* Header */}
      <div className="mb-1 text-[11px] font-medium tracking-[0.05em] uppercase text-[#585f6c]">
        PRÓXIMOS ENCUENTROS
      </div>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-['DM_Serif_Display'] text-[28px] italic font-normal leading-tight text-[#1c1b1b]">
          Rotación de <em className="text-[#004ac6] not-italic">Responsables</em>
        </h2>

        {/* "Editar rotación" — only in view mode with existing rotation */}
        {isAdmin && !isEmpty && mode === 'view' && (
          <button
            onClick={openEdit}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#004ac6] px-4 py-2 text-[13px] font-semibold text-[#004ac6] bg-transparent"
          >
            <Pencil size={14} />
            Editar rotación
          </button>
        )}
      </div>

      {/* ── EMPTY / VIEW STATE ── */}
      {isEmpty && mode === 'view' && (
        <div className="rounded-2xl bg-white shadow-[0px_4px_16px_-4px_rgba(28,27,27,0.08)] px-6 py-6">
          <p className="text-[14px] text-[#585f6c] text-center mb-5">
            No hay rotación configurada aún.
          </p>
          {isAdmin && (
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={generatePreview}
                className="inline-flex items-center gap-2 rounded-full border border-[#004ac6] px-4 py-2 text-[13px] font-semibold text-[#004ac6] bg-transparent"
              >
                <Shuffle size={14} />
                Generar aleatoriamente
              </button>
              <button
                onClick={openManualConfig}
                className="inline-flex items-center gap-2 rounded-full border border-[#585f6c] px-4 py-2 text-[13px] font-semibold text-[#585f6c] bg-transparent"
              >
                <Pencil size={14} />
                Configurar manualmente
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── RANDOM PREVIEW ── */}
      {mode === 'random-preview' && (
        <div className="rounded-2xl bg-white shadow-[0px_4px_16px_-4px_rgba(28,27,27,0.08)] px-4 py-4">
          <p className="text-[11px] font-medium tracking-[0.05em] uppercase text-[#585f6c] mb-3">
            VISTA PREVIA — AÚN NO GUARDADO
          </p>
          <div className="space-y-2 mb-4">
            {preview.map((item) => (
              <div key={item.month} className="flex items-center justify-between py-1">
                <span className="text-[13px] font-medium text-[#1c1b1b]">
                  {formatMonth(item.month)}
                </span>
                <span className="text-[13px] text-[#585f6c]">{item.name}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={generatePreview}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#585f6c]"
            >
              <RotateCcw size={14} />
              Regenerar
            </button>
            <div className="flex gap-2">
              <button
                onClick={cancel}
                className="inline-flex items-center rounded-full border border-[#585f6c] px-4 py-2 text-[13px] font-semibold text-[#585f6c]"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRandomRotation}
                disabled={loading}
                className="inline-flex items-center rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {loading ? 'Guardando...' : 'Confirmar rotación'}
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
                  value={item.user_id ?? ''}
                  onChange={(e) => {
                    const updated = [...manualItems]
                    updated[idx] = { ...item, user_id: e.target.value || null }
                    setManualItems(updated)
                  }}
                  className="flex-1 rounded-lg bg-[#f6f3f2] px-3 py-2 text-[13px] text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
                >
                  <option value="">— Sin asignar —</option>
                  {eligibleMembers.map((m) => (
                    <option key={m.user_id} value={m.user_id!}>
                      {getMemberName(m)}
                    </option>
                  ))}
                  {members.filter((m) => m.is_guest).map((m) => (
                    <option key={m.id} value="" disabled>
                      {getMemberName(m)} (Sin cuenta)
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
              Cancelar
            </button>
            <button
              onClick={confirmManualRotation}
              disabled={loading || manualItems.some((i) => !i.user_id)}
              className="inline-flex items-center rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Guardando...' : 'Guardar rotación'}
            </button>
          </div>
        </div>
      )}

      {/* ── POPULATED VIEW (read-only) ── */}
      {!isEmpty && mode === 'view' && (
        <div className="rounded-2xl bg-white shadow-[0px_4px_16px_-4px_rgba(28,27,27,0.08)] px-4 py-4 space-y-2">
          {rotation.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-1">
              <MemberAvatar
                name={item.profile?.full_name ?? 'Miembro'}
                avatarUrl={item.profile?.avatar_url ?? null}
              />
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-medium text-[#1c1b1b]">
                  {item.profile?.full_name ?? 'Miembro'}
                </span>
                <span className="ml-2 text-[12px] text-[#585f6c]">
                  {formatMonth(item.month)}
                </span>
              </div>
              {isAdmin && (
                <button
                  onClick={openEdit}
                  aria-label="Editar rotación"
                  className="text-[#585f6c] hover:text-[#004ac6] transition-colors"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>
          ))}
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
                  value={item.user_id}
                  onChange={(e) => {
                    const updated = [...editItems]
                    updated[idx] = { ...item, user_id: e.target.value }
                    setEditItems(updated)
                  }}
                  className="flex-1 rounded-lg bg-[#f6f3f2] px-3 py-2 text-[13px] text-[#1c1b1b] focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
                >
                  {eligibleMembers.map((m) => (
                    <option key={m.user_id} value={m.user_id!}>
                      {getMemberName(m)}
                    </option>
                  ))}
                  {members.filter((m) => m.is_guest).map((m) => (
                    <option key={m.id} value={item.user_id} disabled>
                      {getMemberName(m)} (Sin cuenta)
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
              Cancelar
            </button>
            <button
              onClick={saveEdit}
              disabled={loading}
              className="inline-flex items-center rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-[13px] text-[#ba1a1a]">{error}</p>}
    </section>
  )
}
