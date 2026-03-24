import type { OrganizerInfo } from '@/lib/actions/rotation'

interface Props {
  organizer: OrganizerInfo | null
  currentUserId: string
}

// Formatea 'YYYY-MM-DD' como "Marzo 2026"
function formatMonth(dateStr: string): string {
  const [year, month] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  })
}

export default function OrganizerPanel({ organizer, currentUserId }: Props) {
  // Scenario: Sin organizador asignado
  if (!organizer) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
          Turno rotativo
        </p>
        <p
          className="mt-1 font-serif text-[20px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          Sin organizador asignado
        </p>
        <p className="mt-2 text-sm text-[#585f6c]">
          El turno de este mes aún no fue asignado. El admin del grupo puede configurarlo.
        </p>
      </div>
    )
  }

  const isMe = organizer.userId === currentUserId
  const displayName = organizer.fullName ?? 'Organizador'
  const monthLabel = formatMonth(organizer.month)

  // Scenario: El organizador soy yo
  if (isMe) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#004ac6]">
              {monthLabel} · Turno rotativo
            </p>
            <p
              className="mt-1 font-serif text-[22px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
              style={{ fontFamily: 'DM Serif Display, serif' }}
            >
              Te toca organizar
            </p>
            <p className="mt-1 text-sm text-[#585f6c]">
              Sos el organizador de este mes.
            </p>
          </div>

          {/* Badge visual */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#004ac6] to-[#2563eb] shadow-[0_4px_16px_rgba(0,74,198,0.25)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Acceso al checklist — disponible cuando US-20 esté implementada */}
        <div className="mt-4 rounded-xl bg-[#f0ede9] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
            Próximo paso
          </p>
          <p className="mt-0.5 text-sm text-[#1c1b1b]">
            Creá el evento del mes para convocar al grupo.
          </p>
        </div>
      </div>
    )
  }

  // Scenario: Organizador visible en el panel (otro miembro organiza)
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
        {monthLabel} · Turno rotativo
      </p>
      <p
        className="mt-1 font-serif text-[22px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
        style={{ fontFamily: 'DM Serif Display, serif' }}
      >
        {displayName}
      </p>
      <p className="mt-1 text-sm text-[#585f6c]">Organiza este mes.</p>
    </div>
  )
}
