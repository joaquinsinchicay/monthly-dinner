import { pollOptions, polls, pollVotes } from '@/lib/sample-data';
import { summarizePoll } from '@/lib/domain';

/** Returns the active poll for an event with computed option percentages for the UI. */
export function usePoll(eventId: string) {
  const poll = polls.find((item) => item.event_id === eventId) ?? null;
  const options = pollOptions.filter((item) => item.poll_id === poll?.id);
  const votes = pollVotes.filter((item) => item.poll_id === poll?.id);
  return {
    poll,
    options: summarizePoll(options, votes),
    votes,
  };
}
