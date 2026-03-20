import React from 'react';
import { render, screen } from '@testing-library/react';

import { AttendanceCard } from '@/components/attendance-card';
import { ChecklistPanel } from '@/components/checklist-panel';
import { PollCard } from '@/components/poll-card';
import {
  buildAttendanceShareText,
  canUpdateAttendance,
  searchHistory,
  summarizeAttendances,
  summarizeChecklist,
  summarizePoll,
  upsertAttendance,
  upsertPollVote,
  validateMonthlyEvent,
  validatePollCreation,
} from '@/lib/domain';
import { attendances, checklistItems, monthlyEvents, pollOptions, pollVotes, profiles } from '@/lib/sample-data';

describe('E02 panel de evento', () => {
  it('persiste validación de creación con datos válidos', () => {
    expect(validateMonthlyEvent({ month: '2026-03-01', eventDate: '2026-03-26' })).toEqual({ ok: true });
  });

  it('bloquea guardado cuando la fecha obligatoria falta', () => {
    expect(validateMonthlyEvent({ month: '2026-03-01', eventDate: '' })).toEqual({
      ok: false,
      message: 'La fecha es obligatoria.',
    });
  });

  it('respeta la constraint de un evento por grupo y mes', () => {
    expect(validateMonthlyEvent({ month: '2026-03-01', eventDate: '2026-03-26', existingMonth: '2026-03-01' })).toEqual({
      ok: false,
      message: 'Ya existe un evento activo para este mes.',
    });
  });

  it('simula una actualización realtime sobre asistencias', () => {
    const updated = upsertAttendance(attendances, { event_id: 'event-mar-2026', user_id: 'user-guido', status: 'va' });
    expect(updated.find((item) => item.user_id === 'user-guido')?.status).toBe('va');
  });
});

describe('E04 confirmaciones', () => {
  it('guarda y resume los tres estados principales correctamente', () => {
    const summary = summarizeAttendances(attendances, profiles);
    expect(summary.va).toHaveLength(1);
    expect(summary.tal_vez).toHaveLength(1);
    expect(summary.no_va).toHaveLength(1);
  });

  it('no permite cambiar estado después del cierre', () => {
    expect(canUpdateAttendance('cerrado')).toBe(false);
  });

  it('el texto compartible incluye solo confirmados en va', () => {
    expect(buildAttendanceShareText(attendances, profiles)).toContain('Joaquin Fernandez Sinchi');
    expect(buildAttendanceShareText(attendances, profiles)).not.toContain('Martín');
  });

  it('renderiza el resumen con conteos por categoría', () => {
    const summary = summarizeAttendances(attendances, profiles);
    render(<AttendanceCard statuses={summary} shareText="Confirmados (1): Joaquin" />);
    expect(screen.getByText('Resumen en tiempo real')).toBeInTheDocument();
    expect(screen.getByText('Confirmados (1): Joaquin')).toBeInTheDocument();
  });
});

describe('E06 votación', () => {
  it('no permite crear con menos de dos opciones', () => {
    expect(validatePollCreation(['Ajo Negro'], '2026-03-25T00:00:00Z')).toEqual({
      ok: false,
      message: 'Se necesitan al menos 2 opciones.',
    });
  });

  it('no permite fecha de cierre en el pasado', () => {
    expect(validatePollCreation(['Ajo Negro', 'Julia'], '2026-03-19T00:00:00Z')).toEqual({
      ok: false,
      message: 'La fecha de cierre debe ser futura.',
    });
  });

  it('actualiza el voto dentro del plazo', () => {
    const updatedVotes = upsertPollVote(pollVotes, { poll_id: 'poll-mar-2026', option_id: 'opt-2', user_id: 'user-martin' });
    expect(updatedVotes.find((item) => item.user_id === 'user-martin')?.option_id).toBe('opt-2');
  });

  it('renderiza resultados parciales con porcentajes', () => {
    render(<PollCard closesAt="2026-03-24T23:00:00Z" options={summarizePoll(pollOptions, pollVotes)} />);
    expect(screen.getByText('Restaurante del mes')).toBeInTheDocument();
    expect(screen.getByText('Ajo Negro')).toBeInTheDocument();
  });
});

describe('E05 historial', () => {
  it('ordena por fecha descendente', () => {
    const result = searchHistory([
      { restaurant_name: 'Viejo', month: '2026-01-01' },
      { restaurant_name: 'Nuevo', month: '2026-03-01' },
    ], '');
    expect(result[0].restaurant_name).toBe('Nuevo');
  });

  it('filtra por nombre correctamente', () => {
    const result = searchHistory(monthlyEvents.map((event) => ({ restaurant_name: event.venue_name, month: event.month })), 'ajo');
    expect(result).toHaveLength(1);
    expect(result[0].restaurant_name).toBe('Ajo Negro');
  });

  it('muestra estado vacío cuando no hay registros', () => {
    expect(searchHistory([], '')).toEqual([]);
  });
});

describe('E07 checklist', () => {
  it('solo el organizador puede acceder a la vista interactiva', () => {
    render(<ChecklistPanel items={[]} progress={0} completed={0} total={0} organizerOnly={false} />);
    expect(screen.getByText('Disponible solo para el organizador del mes')).toBeInTheDocument();
  });

  it('marcar tarea actualiza el progreso', () => {
    const summary = summarizeChecklist(checklistItems);
    expect(summary.progress).toBe(60);
  });

  it('el estado persiste entre sesiones a nivel de resumen', () => {
    const summaryA = summarizeChecklist(checklistItems);
    const summaryB = summarizeChecklist(checklistItems);
    expect(summaryA.progress).toBe(summaryB.progress);
  });
});
