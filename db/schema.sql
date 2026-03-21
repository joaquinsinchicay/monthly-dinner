create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'admin')),
  joined_at timestamptz not null default now(),
  unique(group_id, user_id)
);

create table public.invitation_links (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  token text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  organizer_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  event_date date not null,
  location text,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendances (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('va', 'no_va', 'tal_vez')),
  updated_at timestamptz not null default now(),
  unique(event_id, member_id)
);

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.create_group_with_admin(group_name text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group_id uuid;
  result json;
begin
  insert into public.groups (name, created_by)
  values (group_name, auth.uid())
  returning id into new_group_id;

  insert into public.members (group_id, user_id, role)
  values (new_group_id, auth.uid(), 'admin');

  select json_build_object(
    'group_id', new_group_id,
    'name', group_name
  ) into result;

  return result;
exception when others then
  raise exception 'Error al crear el grupo: %', sqlerrm;
end;
$$;

create table public.rotation (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  month date not null,
  is_current boolean not null default false,
  unique(group_id, month)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('event_published', 'event_updated', 'poll_opened', 'turn_assigned')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  closes_at timestamptz not null,
  is_closed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  order_index integer not null default 0
);

create table public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  voted_at timestamptz not null default now(),
  unique(poll_id, user_id)
);

create table public.restaurant_history (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  restaurant_name text not null,
  visited_at date not null,
  attendees_count integer,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  label text not null,
  order_index integer not null default 0,
  is_active boolean not null default true
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  template_id uuid references public.checklist_templates(id) on delete set null,
  label text not null,
  is_done boolean not null default false,
  order_index integer not null default 0,
  completed_at timestamptz
);

create index idx_members_group_id on public.members(group_id);
create index idx_members_user_id on public.members(user_id);
create index idx_invitation_links_group_id on public.invitation_links(group_id);
create index idx_events_group_id on public.events(group_id);
create index idx_events_organizer_id on public.events(organizer_id);
create index idx_attendances_event_id on public.attendances(event_id);
create index idx_attendances_member_id on public.attendances(member_id);
create index idx_rotation_group_id on public.rotation(group_id);
create index idx_rotation_user_id on public.rotation(user_id);
create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_event_id on public.notifications(event_id);
create index idx_polls_event_id on public.polls(event_id);
create index idx_poll_options_poll_id on public.poll_options(poll_id);
create index idx_poll_votes_poll_id on public.poll_votes(poll_id);
create index idx_poll_votes_user_id on public.poll_votes(user_id);
create index idx_restaurant_history_group_id on public.restaurant_history(group_id);
create index idx_restaurant_history_event_id on public.restaurant_history(event_id);
create index idx_checklist_templates_group_id on public.checklist_templates(group_id);
create index idx_checklist_items_event_id on public.checklist_items(event_id);

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.members enable row level security;
alter table public.invitation_links enable row level security;
alter table public.events enable row level security;
alter table public.attendances enable row level security;
alter table public.rotation enable row level security;
alter table public.notifications enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.restaurant_history enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklist_items enable row level security;

create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "groups_insert_authenticated" on public.groups for insert with check (auth.uid() = created_by);
create policy "groups_select_members" on public.groups for select using (
  exists (select 1 from public.members m where m.group_id = groups.id and m.user_id = auth.uid())
);
create policy "groups_update_creator" on public.groups for update using (auth.uid() = created_by) with check (auth.uid() = created_by);

create policy "members_insert_self" on public.members for insert with check (auth.uid() = user_id);
create policy "members_select_same_group" on public.members for select using (
  exists (select 1 from public.members requester where requester.group_id = members.group_id and requester.user_id = auth.uid())
);
create policy "members_update_self" on public.members for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "invitation_links_insert_admin" on public.invitation_links for insert with check (
  exists (select 1 from public.members m where m.group_id = invitation_links.group_id and m.user_id = auth.uid() and m.role = 'admin')
);
create policy "invitation_links_select_member" on public.invitation_links for select using (
  exists (select 1 from public.members m where m.group_id = invitation_links.group_id and m.user_id = auth.uid())
);
create policy "invitation_links_update_admin" on public.invitation_links for update using (
  exists (select 1 from public.members m where m.group_id = invitation_links.group_id and m.user_id = auth.uid() and m.role = 'admin')
) with check (
  exists (select 1 from public.members m where m.group_id = invitation_links.group_id and m.user_id = auth.uid() and m.role = 'admin')
);

create policy "events_insert_organizer" on public.events for insert with check (auth.uid() = organizer_id);
create policy "events_select_group_member" on public.events for select using (
  exists (select 1 from public.members m where m.group_id = events.group_id and m.user_id = auth.uid())
);
create policy "events_update_organizer" on public.events for update using (auth.uid() = organizer_id) with check (auth.uid() = organizer_id);

create policy "attendances_select_event_group_member" on public.attendances for select using (
  exists (
    select 1 from public.events e
    join public.members m on m.group_id = e.group_id
    where e.id = attendances.event_id and m.user_id = auth.uid()
  )
);
create policy "attendances_insert_self" on public.attendances for insert with check (auth.uid() = member_id);
create policy "attendances_update_self" on public.attendances for update using (auth.uid() = member_id) with check (auth.uid() = member_id);
create policy "attendances_delete_self" on public.attendances for delete using (auth.uid() = member_id);

create policy "rotation_select_group_member" on public.rotation for select using (
  exists (select 1 from public.members m where m.group_id = rotation.group_id and m.user_id = auth.uid())
);
create policy "notifications_insert_organizer" on public.notifications for insert with check (
  auth.uid() in (select organizer_id from public.events where id = notifications.event_id)
);
create policy "notifications_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = user_id);

create policy "rotation_manage_admin" on public.rotation for all using (
  exists (select 1 from public.members m where m.group_id = rotation.group_id and m.user_id = auth.uid() and m.role = 'admin')
) with check (
  exists (select 1 from public.members m where m.group_id = rotation.group_id and m.user_id = auth.uid() and m.role = 'admin')
);

create policy "polls_select_group_member" on public.polls for select using (
  exists (
    select 1 from public.events e
    join public.members m on m.group_id = e.group_id
    where e.id = polls.event_id and m.user_id = auth.uid()
  )
);
create policy "polls_manage_organizer" on public.polls for all using (
  exists (select 1 from public.events e where e.id = polls.event_id and e.organizer_id = auth.uid())
) with check (
  exists (select 1 from public.events e where e.id = polls.event_id and e.organizer_id = auth.uid())
);

create policy "poll_options_select_group_member" on public.poll_options for select using (
  exists (
    select 1 from public.polls p
    join public.events e on e.id = p.event_id
    join public.members m on m.group_id = e.group_id
    where p.id = poll_options.poll_id and m.user_id = auth.uid()
  )
);
create policy "poll_options_manage_organizer" on public.poll_options for all using (
  exists (
    select 1 from public.polls p
    join public.events e on e.id = p.event_id
    where p.id = poll_options.poll_id and e.organizer_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.polls p
    join public.events e on e.id = p.event_id
    where p.id = poll_options.poll_id and e.organizer_id = auth.uid()
  )
);

create policy "poll_votes_select_group_member" on public.poll_votes for select using (
  exists (
    select 1 from public.polls p
    join public.events e on e.id = p.event_id
    join public.members m on m.group_id = e.group_id
    where p.id = poll_votes.poll_id and m.user_id = auth.uid()
  )
);
create policy "poll_votes_manage_self" on public.poll_votes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "restaurant_history_insert_event_organizer" on public.restaurant_history for insert with check (
  exists (select 1 from public.events e where e.id = restaurant_history.event_id and e.organizer_id = auth.uid())
);
create policy "restaurant_history_select_group_member" on public.restaurant_history for select using (
  exists (select 1 from public.members m where m.group_id = restaurant_history.group_id and m.user_id = auth.uid())
);

create policy "checklist_templates_select_member_or_global" on public.checklist_templates for select using (
  group_id is null or exists (select 1 from public.members m where m.group_id = checklist_templates.group_id and m.user_id = auth.uid())
);
create policy "checklist_templates_manage_admin" on public.checklist_templates for all using (
  group_id is null or exists (select 1 from public.members m where m.group_id = checklist_templates.group_id and m.user_id = auth.uid() and m.role = 'admin')
) with check (
  group_id is null or exists (select 1 from public.members m where m.group_id = checklist_templates.group_id and m.user_id = auth.uid() and m.role = 'admin')
);

create policy "checklist_items_select_organizer" on public.checklist_items for select using (
  exists (select 1 from public.events e where e.id = checklist_items.event_id and e.organizer_id = auth.uid())
);
create policy "checklist_items_manage_organizer" on public.checklist_items for all using (
  exists (select 1 from public.events e where e.id = checklist_items.event_id and e.organizer_id = auth.uid())
) with check (
  exists (select 1 from public.events e where e.id = checklist_items.event_id and e.organizer_id = auth.uid())
);

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at_column();

drop trigger if exists update_events_updated_at on public.events;
create trigger update_events_updated_at before update on public.events for each row execute function public.update_updated_at_column();
