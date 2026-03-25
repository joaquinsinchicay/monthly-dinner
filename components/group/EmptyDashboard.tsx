import Link from 'next/link'

interface Props {
  groupId: string
  isAdminOrOrganizer: boolean
}

// Scenario: Admin u organizador ve el estado vacío con CTA — layout sin card, centrado sobre surface.
// Scenario: Botón redirige a configuración del grupo — href a /dashboard/[groupId]/settings.
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
    <div className="flex flex-col items-center px-8">

      {/* Título editorial Display Large */}
      <h2
        className="text-center font-serif text-[36px] leading-tight tracking-[-0.02em]"
        style={{ fontFamily: 'DM Serif Display, serif' }}
      >
        <span className="text-[#1c1b1b]">Configurá</span>
        <br />
        <span className="italic text-[#004ac6]">el grupo</span>
      </h2>

      {/* Cuerpo */}
      <p className="mt-6 text-center text-base leading-relaxed text-[#585f6c]">
        Tu clan está listo, finalizá la configuración para dar comienzo a la experiencia culinaria.
      </p>

      {/* Scenario: Botón redirige a configuración del grupo */}
      <Link
        href={`/dashboard/${groupId}/settings`}
        className="mt-8 flex w-full max-w-xs items-center justify-center rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb] px-6 py-5 text-base font-semibold text-white transition-opacity hover:opacity-90"
      >
        Completar configuración →
      </Link>

      {/* Footer */}
      <p className="mt-auto pt-10 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
        Powered by The Digital Maître D&apos;
      </p>
    </div>
  )
}
