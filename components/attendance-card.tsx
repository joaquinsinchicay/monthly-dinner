import React from 'react';
import type { Attendance } from '@/types/database';

/** Renders the event attendance controls and the live summary buckets for organizer visibility. */
export function AttendanceCard({
  statuses,
  shareText,
}: {
  statuses: Record<Attendance['status'], string[]>;
  shareText: string;
}) {
  const labels: Record<Attendance['status'], string> = {
    va: 'Va',
    tal_vez: 'Tal vez',
    no_va: 'No va',
    sin_respuesta: 'Sin responder',
  };

  return (
    <article className="surface-card stack-gap">
      <div className="section-header">
        <div>
          <p className="label">Confirmaciones</p>
          <h2>Resumen en tiempo real</h2>
        </div>
        <button className="secondary-button" type="button">
          Compartir resumen
        </button>
      </div>

      <div className="pill-grid">
        {Object.entries(statuses).map(([status, names]) => (
          <div key={status} className="status-block">
            <span className={`status-pill status-pill--${status}`}>{labels[status as Attendance['status']]}</span>
            <strong>{names.length}</strong>
            <p>{names.length ? names.join(', ') : 'Sin registros'}</p>
          </div>
        ))}
      </div>

      <div className="soft-panel">
        <p className="label">Texto listo para copiar</p>
        <p>{shareText}</p>
      </div>
    </article>
  );
}
