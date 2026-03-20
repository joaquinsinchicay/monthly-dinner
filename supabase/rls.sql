-- RLS policies for monthly-dinner MVP.

create policy "profiles_select_self" on public.profiles
for select using (auth.uid() = id);

create policy "profiles_update_self" on public.profiles
for update using (auth.uid() = id);

create policy "groups_select_member_groups" on public.groups
for select using (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = groups.id and gm.user_id = auth.uid()
  )
);

create policy "group_members_select_member_groups" on public.group_members
for select using (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = group_members.group_id and gm.user_id = auth.uid()
  )
);

create policy "invitations_select_group_members" on public.invitations
for select using (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = invitations.group_id and gm.user_id = auth.uid()
  )
);

create policy "monthly_events_select_group_members" on public.monthly_events
for select using (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = monthly_events.group_id and gm.user_id = auth.uid()
  )
);

create policy "monthly_events_insert_organizer_only" on public.monthly_events
for insert with check (auth.uid() = organizer_id);

create policy "monthly_events_update_organizer_only" on public.monthly_events
for update using (auth.uid() = organizer_id);

create policy "attendances_select_group_members" on public.attendances
for select using (
  exists (
    select 1
    from public.monthly_events me
    join public.group_members gm on gm.group_id = me.group_id
    where me.id = attendances.event_id and gm.user_id = auth.uid()
  )
);

create policy "attendances_write_self" on public.attendances
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "polls_select_group_members" on public.polls
for select using (
  exists (
    select 1
    from public.monthly_events me
    join public.group_members gm on gm.group_id = me.group_id
    where me.id = polls.event_id and gm.user_id = auth.uid()
  )
);

create policy "polls_insert_organizer_only" on public.polls
for insert with check (auth.uid() = created_by);

create policy "poll_options_select_group_members" on public.poll_options
for select using (
  exists (
    select 1
    from public.polls p
    join public.monthly_events me on me.id = p.event_id
    join public.group_members gm on gm.group_id = me.group_id
    where p.id = poll_options.poll_id and gm.user_id = auth.uid()
  )
);

create policy "poll_options_insert_organizer_only" on public.poll_options
for insert with check (
  exists (
    select 1 from public.polls p where p.id = poll_options.poll_id and p.created_by = auth.uid()
  )
);

create policy "poll_votes_select_group_members" on public.poll_votes
for select using (
  exists (
    select 1
    from public.polls p
    join public.monthly_events me on me.id = p.event_id
    join public.group_members gm on gm.group_id = me.group_id
    where p.id = poll_votes.poll_id and gm.user_id = auth.uid()
  )
);

create policy "poll_votes_write_self" on public.poll_votes
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "rotation_history_select_group_members" on public.rotation_history
for select using (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = rotation_history.group_id and gm.user_id = auth.uid()
  )
);

create policy "checklist_items_organizer_only" on public.checklist_items
for all using (
  exists (
    select 1
    from public.monthly_events me
    where me.id = checklist_items.event_id and me.organizer_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.monthly_events me
    where me.id = checklist_items.event_id and me.organizer_id = auth.uid()
  )
);

create policy "notifications_select_self" on public.notifications
for select using (auth.uid() = user_id);
