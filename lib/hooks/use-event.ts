import { currentUserId, groupMembers, monthlyEvents, profiles } from '@/lib/sample-data';

/** Returns the current monthly event, organizer metadata, and next rotation owner for group pages. */
export function useEvent(groupId: string) {
  const event = monthlyEvents.find((item) => item.group_id === groupId) ?? null;
  const organizer = profiles.find((item) => item.id === event?.organizer_id) ?? null;
  const rotation = groupMembers
    .filter((member) => member.group_id === groupId)
    .sort((a, b) => (a.rotation_order ?? 0) - (b.rotation_order ?? 0));
  const currentOrganizerIndex = rotation.findIndex((item) => item.user_id === event?.organizer_id);
  const nextOrganizer = rotation[(currentOrganizerIndex + 1) % rotation.length] ?? null;
  return {
    event,
    organizer,
    isCurrentOrganizer: event?.organizer_id === currentUserId,
    nextOrganizer,
  };
}
