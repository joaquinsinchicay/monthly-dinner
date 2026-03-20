import type { Attendance, ChecklistItem, PollOption, PollVote, Profile } from '@/types/database';

export type AttendanceStatus = Attendance['status'];

/** Returns grouped attendance counts and member names for the organizer summary. */
export function summarizeAttendances(attendances: Attendance[], profiles: Profile[]) {
  const byUser = new Map(profiles.map((profile) => [profile.id, profile.full_name ?? profile.email]));
  const buckets: Record<AttendanceStatus, string[]> = {
    va: [],
    no_va: [],
    tal_vez: [],
    sin_respuesta: [],
  };

  for (const item of attendances) {
    buckets[item.status].push(byUser.get(item.user_id) ?? item.user_id);
  }

  return {
    va: buckets.va,
    no_va: buckets.no_va,
    tal_vez: buckets.tal_vez,
    sin_respuesta: buckets.sin_respuesta,
  };
}

/** Produces the shareable attendance text required for restaurant coordination. */
export function buildAttendanceShareText(attendances: Attendance[], profiles: Profile[]) {
  const summary = summarizeAttendances(attendances, profiles);
  return `Confirmados (${summary.va.length}): ${summary.va.join(', ')}`;
}

/** Validates creation and editing constraints for a monthly event. */
export function validateMonthlyEvent(input: { eventDate?: string | null; month: string; existingMonth?: string | null }) {
  if (!input.eventDate) {
    return { ok: false as const, message: 'La fecha es obligatoria.' };
  }
  if (input.existingMonth && input.existingMonth === input.month) {
    return { ok: false as const, message: 'Ya existe un evento activo para este mes.' };
  }
  return { ok: true as const };
}

/** Simulates realtime updates by returning a new attendance list with the changed status. */
export function upsertAttendance(attendances: Attendance[], next: Pick<Attendance, 'event_id' | 'user_id' | 'status'>) {
  const existing = attendances.find((attendance) => attendance.event_id === next.event_id && attendance.user_id === next.user_id);
  if (existing) {
    return attendances.map((attendance) =>
      attendance.event_id === next.event_id && attendance.user_id === next.user_id
        ? { ...attendance, status: next.status, updated_at: '2026-03-20T00:00:00Z' }
        : attendance,
    );
  }

  return [...attendances, { id: `att-${attendances.length + 1}`, updated_at: '2026-03-20T00:00:00Z', ...next }];
}

/** Guards attendance changes after the event has been closed. */
export function canUpdateAttendance(eventStatus: 'pendiente' | 'publicado' | 'cerrado') {
  return eventStatus !== 'cerrado';
}

/** Validates organizer-created polls before persisting them. */
export function validatePollCreation(options: string[], closesAt: string, now = '2026-03-20T00:00:00Z') {
  if (options.filter(Boolean).length < 2) {
    return { ok: false as const, message: 'Se necesitan al menos 2 opciones.' };
  }
  if (new Date(closesAt).getTime() <= new Date(now).getTime()) {
    return { ok: false as const, message: 'La fecha de cierre debe ser futura.' };
  }
  return { ok: true as const };
}

/** Returns percentage results for the active or closed restaurant poll. */
export function summarizePoll(options: PollOption[], votes: PollVote[]) {
  const totalVotes = votes.length || 1;
  return options.map((option) => {
    const count = votes.filter((vote) => vote.option_id === option.id).length;
    return {
      ...option,
      count,
      percentage: Math.round((count / totalVotes) * 100),
    };
  });
}

/** Upserts a member vote while the poll is still open. */
export function upsertPollVote(votes: PollVote[], next: Pick<PollVote, 'poll_id' | 'option_id' | 'user_id'>) {
  const existing = votes.find((vote) => vote.poll_id === next.poll_id && vote.user_id === next.user_id);
  if (existing) {
    return votes.map((vote) =>
      vote.poll_id === next.poll_id && vote.user_id === next.user_id
        ? { ...vote, option_id: next.option_id, voted_at: '2026-03-20T00:00:00Z' }
        : vote,
    );
  }
  return [...votes, { id: `vote-${votes.length + 1}`, voted_at: '2026-03-20T00:00:00Z', ...next }];
}

/** Filters historical restaurants using the search query the group member types. */
export function searchHistory(items: Array<{ restaurant_name: string | null; month: string }>, query: string) {
  const normalized = query.trim().toLowerCase();
  return items
    .filter((item) => item.restaurant_name)
    .filter((item) => !normalized || item.restaurant_name!.toLowerCase().includes(normalized))
    .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());
}

/** Calculates organizer checklist progress and preserves item ordering. */
export function summarizeChecklist(items: ChecklistItem[]) {
  const ordered = [...items].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const completed = ordered.filter((item) => item.is_completed).length;
  const progress = ordered.length === 0 ? 0 : Math.round((completed / ordered.length) * 100);
  return { ordered, completed, total: ordered.length, progress };
}
