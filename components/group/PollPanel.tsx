import PollForm from '@/components/group/PollForm'
import PollVoting from '@/components/group/PollVoting'
import type { PollWithOptions } from '@/lib/actions/polls'
import { t } from '@/lib/t'

interface Props {
  eventId: string
  groupId: string
  poll: PollWithOptions | null
  isOrganizer: boolean
}

function formatDateTime(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isPollOpen(poll: PollWithOptions): boolean {
  return poll.status === 'open' && new Date(poll.closes_at) > new Date()
}

// Scenario: Votación creada exitosamente — PollPanel visible para todos los miembros
// cuando la votación existe (notificación in-app).
//
// Scenario: Solo una votación activa por evento — si hay poll, el organizador ve
// el estado de la votación con mensaje de edición en lugar del formulario.
export default function PollPanel({ eventId, groupId, poll, isOrganizer }: Props) {

  // Sin votación
  if (!poll) {
    // Scenario: Sin votación activa — miembro no organizador ve empty state informativo
    if (!isOrganizer) {
      return (
        <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
            {t('group.pollPanel.eyebrow')}
          </p>
          <p
            className="mt-1 font-serif text-[22px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            {t('group.pollPanel.noVotingTitle')}
          </p>
          <p className="mt-2 text-sm text-[#585f6c]">
            {t('group.pollPanel.noVotingBody')}
          </p>
        </div>
      )
    }

    return (
      <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
          {t('group.pollPanel.eyebrow')}
        </p>
        <p
          className="mt-1 font-serif text-[22px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          {t('group.pollPanel.openTitle')}
        </p>
        <p className="mb-5 mt-2 text-sm text-[#585f6c]">
          {t('group.pollPanel.openBody')}
        </p>
        {/* Scenario: Votación creada exitosamente — PollForm maneja la creación */}
        <PollForm eventId={eventId} groupId={groupId} />
      </div>
    )
  }

  // Votación existe — mostrar estado y opciones
  const open = isPollOpen(poll)

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
            {t('group.pollPanel.eyebrow')}
          </p>
          <p
            className="mt-1 font-serif text-[22px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            {open ? t('group.pollPanel.titleOpen') : t('group.pollPanel.titleClosed')}
          </p>
        </div>

        {/* Badge de estado */}
        <span
          className={[
            'mt-1 shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em]',
            open
              ? 'bg-[#dce2f3] text-[#004ac6]'
              : 'bg-[#f0ede9] text-[#585f6c]',
          ].join(' ')}
        >
          {open ? t('group.pollPanel.statusOpen') : t('group.pollPanel.statusClosed')}
        </span>
      </div>

      <p className="mt-2 text-sm text-[#585f6c]">
        {open
          ? `${t('group.pollPanel.closesPrefix')} ${formatDateTime(poll.closes_at)}`
          : `${t('group.pollPanel.closedPrefix')} ${formatDateTime(poll.closes_at)}`}
      </p>

      {/* US-18: Opciones con mecanismo de voto, porcentajes en tiempo real y estado final */}
      <PollVoting poll={poll} />

      {/* Scenario: Solo una votación activa por evento — organizador ve aviso en lugar del form */}
      {isOrganizer && open && (
        <p className="mt-4 text-xs text-[#585f6c]">
          {t('group.pollPanel.alreadyActive')}
        </p>
      )}
    </div>
  )
}
