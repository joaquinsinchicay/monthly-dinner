'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { updateGroupName } from '@/app/(dashboard)/dashboard/[groupId]/settings/actions'
import { t } from '@/lib/t'
import { useRouter } from 'next/navigation'

interface Props {
  groupId: string
  initialName: string
}

export default function SettingsNameSection({ groupId, initialName }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [draftName, setDraftName] = useState(initialName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSaveName() {
    const trimmed = draftName.trim()
    if (!trimmed) {
      setError(t('errors.settings.nameEmpty'))
      return
    }
    if (trimmed.length < 3) {
      setError(t('errors.settings.nameTooShort'))
      return
    }
    if (trimmed.length > 50) {
      setError(t('errors.settings.nameTooLong'))
      return
    }

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

  return (
    <section>
      <div className="mb-1 text-[11px] font-medium tracking-[0.05em] uppercase text-[#585f6c]">
        {t('settings.identityEyebrow')}
      </div>
      <div className="mb-4">
        <h2 className="font-['DM_Serif_Display'] text-[28px] italic font-normal leading-tight text-[#1c1b1b]">
          {t('settings.sectionTitle')} <em className="text-[#004ac6] not-italic">{t('settings.sectionTitleHighlight')}</em>
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
          <span className="flex-1 text-[15px] text-[#1c1b1b]">{t('settings.clanNameRow')}</span>
          <span className="text-[14px] text-[#585f6c] truncate max-w-[140px]">{name}</span>
        </button>

        {editing && (
          <div className="px-4 py-3 space-y-3">
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder={t('settings.clanNamePlaceholder')}
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
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveName}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {loading ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        )}
      </div>

    </section>
  )
}
