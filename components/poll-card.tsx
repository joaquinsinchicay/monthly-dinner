import React from 'react';
/** Displays the restaurant vote with partial percentages and the configured close date. */
export function PollCard({
  closesAt,
  options,
}: {
  closesAt: string;
  options: Array<{ id: string; restaurant_name: string; count: number; percentage: number }>;
}) {
  return (
    <article className="surface-card stack-gap">
      <div className="section-header">
        <div>
          <p className="label">Votación</p>
          <h2>Restaurante del mes</h2>
        </div>
        <p className="body-sm">Cierra {new Date(closesAt).toLocaleString('es-AR', { dateStyle: 'medium' })}</p>
      </div>

      <div className="stack-gap-sm">
        {options.map((option) => (
          <div key={option.id} className="vote-row">
            <div>
              <strong>{option.restaurant_name}</strong>
              <p className="body-sm">{option.count} votos</p>
            </div>
            <div className="vote-meter">
              <div className="vote-meter__fill" style={{ width: `${option.percentage}%` }} />
            </div>
            <strong>{option.percentage}%</strong>
          </div>
        ))}
      </div>
    </article>
  );
}
