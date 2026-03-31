-- Migration: add RLS policy "members: update admin"
-- Fix for US-06 ISSUE-01: updateMemberRole() fails when an admin updates another member's role
-- because the only existing policy is "members: update own" (WHERE auth.uid() = user_id),
-- which blocks updates targeting a different member.

create policy "members: update admin"
  on members for update
  using (
    exists (
      select 1 from members m
      where m.group_id = members.group_id
        and m.user_id  = auth.uid()
        and m.role     = 'admin'
    )
  );
