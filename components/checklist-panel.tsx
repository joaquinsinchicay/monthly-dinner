import React from 'react';
/** Shows the organizer-only monthly checklist and the persisted completion progress. */
export function ChecklistPanel({
  items,
  progress,
  completed,
  total,
  organizerOnly = true,
}: {
  items: Array<{ id: string; label: string; is_completed: boolean }>;
  progress: number;
  completed: number;
  total: number;
  organizerOnly?: boolean;
}) {
  if (!organizerOnly) {
    return (
      <article className="surface-card">
        <p className="label">Checklist</p>
        <h2>Disponible solo para el organizador del mes</h2>
      </article>
    );
  }

  return (
    <article className="surface-card stack-gap">
      <div className="section-header">
        <div>
          <p className="label">Checklist del organizador</p>
          <h2>{progress}% completado</h2>
        </div>
        <p className="body-sm">{completed} de {total} tareas</p>
      </div>

      <div className="stack-gap-sm">
        {items.map((item, index) => (
          <label key={item.id} className={`checklist-row ${item.is_completed ? 'checklist-row--done' : ''}`}>
            <input type="checkbox" checked={item.is_completed} readOnly />
            <span>{index + 1}. {item.label}</span>
          </label>
        ))}
      </div>
    </article>
  );
}
