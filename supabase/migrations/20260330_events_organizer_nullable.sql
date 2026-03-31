-- Migration: make events.organizer_id nullable to support auto-generated event slots (US-03 Scenario 11)
-- Auto-generated events don't have an organizer assigned yet (rotation is configured in US-07).

-- 1. Drop NOT NULL constraint on organizer_id
ALTER TABLE events ALTER COLUMN organizer_id DROP NOT NULL;

-- 2. Add RLS policy for inserting auto-generated events (organizer_id IS NULL)
--    Only the admin of the group can insert auto-generated events (no organizer yet).
--    The existing "events: insert organizer" policy requires auth.uid() = organizer_id,
--    which fails when organizer_id is null — so we add a separate policy for this case.
create policy "events: insert admin auto"
  on events for insert
  with check (
    organizer_id is null
    and exists (
      select 1 from members
      where members.group_id = events.group_id
        and members.user_id  = auth.uid()
        and members.role     = 'admin'
    )
  );
