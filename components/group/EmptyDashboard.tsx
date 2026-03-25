import Link from 'next/link'

interface Props {
  groupId: string
  isAdminOrOrganizer: boolean
}

// Scenario: Admin u organizador ve el estado vacío con CTA — card con título, body y botón primario.
// Scenario: Botón redirige a creación de evento — href a /grupo/[id]/eventos/nuevo.
// Scenario: Miembro ve mensaje de espera sin CTA — texto plano sin botón.
// Scenario: Estado vacío desaparece al crear el primer evento — se oculta cuando hasEvents=true.
// Scenario: Estado vacío no se muestra si hay historial previo — idem, hasEvents cubre eventos cerrados.
export default function EmptyDashboard({ groupId, isAdminOrOrganizer }: Props) {
  // Scenario: Miembro ve mensaje de espera sin CTA
  if (!isAdminOrOrganizer) {
    return (
      <p className="text-center text-sm text-[#585f6c]">
        Aún no hay eventos. El organizador del mes está preparando la primera cita.
      </p>
    )
  }

  // Scenario: Admin u organizador ve el estado vacío con CTA
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">

      {/* Ícono decorativo */}
      <div className="mb-5 flex justify-center">
        <span className="text-4xl" aria-hidden="true">🍽️</span>
      </div>

      {/* Título editorial */}
      <h2
        className="text-center font-serif text-[26px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
        style={{ fontFamily: 'DM Serif Display, serif' }}
      >
        Tu clan está listo,{' '}
        <span className="italic">pero falta la mesa.</span>
      </h2>

      {/* Cuerpo */}
      <p className="mt-4 text-center text-sm leading-relaxed text-[#585f6c]">
        Has creado el espacio perfecto para los amantes del buen comer. Ahora solo falta
        coordinar la primera cita para que la magia suceda.
      </p>

      {/* Scenario: Botón redirige a creación de evento */}
      <Link
        href={`/grupo/${groupId}/eventos/nuevo`}
        className="mt-6 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-opacity hover:opacity-90"
      >
        Crear primer evento →
      </Link>
    </div>
  )
}
