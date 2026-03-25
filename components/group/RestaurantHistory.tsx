'use client'

import { useState } from 'react'
import type { RestaurantHistoryEntryWithNames } from '@/lib/actions/restaurant'

interface Props {
  entries: RestaurantHistoryEntryWithNames[]
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Scenario: Historial con registros — card por entrada con nombre, fecha y asistentes.
// Scenario: Historial vacío — empty state cuando no hay entradas.
// Scenario: Búsqueda en el historial — filtrado client-side por nombre (case-insensitive).
export default function RestaurantHistory({ entries }: Props) {

  const [searchTerm, setSearchTerm] = useState('')

  // Scenario: Historial vacío
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
          Historial de cenas
        </p>
        <p
          className="mt-1 font-serif text-[22px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          Sin cenas registradas
        </p>
        <p className="mt-2 text-sm text-[#585f6c]">
          Todavía no hay cenas registradas.
        </p>
      </div>
    )
  }

  // Scenario: Búsqueda — solo filtra por nombre (las entradas sin nombre no aparecen en búsqueda)
  const filtered = searchTerm.trim()
    ? entries.filter((e) =>
        e.name?.toLowerCase().includes(searchTerm.trim().toLowerCase())
      )
    : entries

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0px_10px_30px_-5px_rgba(28,27,27,0.07)]">

      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
            Historial de cenas
          </p>
          <p
            className="mt-1 font-serif text-[22px] leading-tight tracking-[-0.02em] text-[#1c1b1b]"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            Restaurantes visitados
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#f0ede9] px-3 py-1 text-[11px] font-semibold text-[#585f6c]">
          {entries.length} {entries.length === 1 ? 'cena' : 'cenas'}
        </span>
      </div>

      {/* Scenario: Búsqueda en el historial */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar restaurante…"
        className="mb-4 w-full rounded-xl bg-[#f6f3f2] px-4 py-2.5 text-sm text-[#1c1b1b] placeholder:text-[#585f6c] focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
      />

      {/* Sin resultados de búsqueda */}
      {filtered.length === 0 && searchTerm.trim() && (
        <p className="text-sm text-[#585f6c]">
          No hay resultados para &ldquo;{searchTerm.trim()}&rdquo;.
        </p>
      )}

      {/* Scenario: Historial con registros — lista ordenada por fecha */}
      <div className="space-y-3">
        {filtered.map((entry) => (
          <div key={entry.id} className="rounded-xl bg-[#f6f3f2] p-4">

            {/* Nombre del restaurante */}
            <p className="font-medium text-[#1c1b1b]">
              {entry.name ?? (
                <span className="italic text-[#585f6c]">Sin restaurante registrado</span>
              )}
            </p>

            {/* Fecha de visita */}
            <p className="mt-0.5 text-xs text-[#585f6c]">
              {formatDate(entry.visited_at)}
            </p>

            {/* Asistentes */}
            {entry.attendees.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]">
                  Fueron ({entry.attendees.length})
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {entry.attendees.map((a) => (
                    <span
                      key={a.id}
                      className="rounded-full bg-white px-2.5 py-0.5 text-xs text-[#585f6c]"
                    >
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {entry.attendees.length === 0 && (
              <p className="mt-1.5 text-xs text-[#585f6c]">Sin asistentes registrados.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
