import { attendances, profiles } from '@/lib/sample-data';
import { buildAttendanceShareText, summarizeAttendances } from '@/lib/domain';

/** Returns the current event attendance summary and the copy-ready organizer message. */
export function useAttendance(eventId: string) {
  const items = attendances.filter((item) => item.event_id === eventId);
  return {
    items,
    summary: summarizeAttendances(items, profiles),
    shareText: buildAttendanceShareText(items, profiles),
  };
}
