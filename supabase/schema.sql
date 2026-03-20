-- monthly-dinner MVP schema for Supabase Postgres.
-- The schema keeps every addition backward-compatible by using defaults or nullable columns.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'miembro' check (role in ('organizador', 'miembro')),
  rotation_order integer,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  token text not null unique,
  created_by uuid references public.profiles(id),
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.monthly_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  organizer_id uuid references public.profiles(id),
  month date not null,
  event_date date,
  venue_name text,
  venue_address text,
  description text,
  status text not null default 'pendiente' check (status in ('pendiente', 'publicado', 'cerrado')),
  restaurant_name text,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (group_id, month)
);

create table if not exists public.attendances (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.monthly_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'sin_respuesta' check (status in ('va', 'no_va', 'tal_vez', 'sin_respuesta')),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.monthly_events(id) on delete cascade,
  created_by uuid references public.profiles(id),
  closes_at timestamptz not null,
  status text not null default 'activa' check (status in ('activa', 'cerrada')),
  created_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  restaurant_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  voted_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

create table if not exists public.rotation_history (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  month date not null,
  assigned_at timestamptz not null default now()
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.monthly_events(id) on delete cascade,
  label text not null,
  is_completed boolean not null default false,
  order_index integer,
  completed_at timestamptz
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_id uuid references public.monthly_events(id) on delete set null,
  type text not null check (type in ('convocatoria', 'recordatorio', 'cierre', 'turno', 'votacion')),
  message text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.invitations enable row level security;
alter table public.monthly_events enable row level security;
alter table public.attendances enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.rotation_history enable row level security;
alter table public.checklist_items enable row level security;
alter table public.notifications enable row level security;

alter publication supabase_realtime add table public.attendances;
alter publication supabase_realtime add table public.poll_votes;
alter publication supabase_realtime add table public.monthly_events;
