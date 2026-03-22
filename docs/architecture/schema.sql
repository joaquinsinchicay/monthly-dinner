-- =============================================================================
-- monthly-dinner — Schema SQL completo
-- Supabase / Postgres
-- Versión: MVP v1.0 — Marzo 2026
-- =============================================================================
-- Instrucciones:
--   1. Ejecutar este archivo completo en el SQL Editor de Supabase
--   2. El orden importa: respetar la secuencia de creación de tablas
--   3. RLS está habilitado en todas las tablas — nunca desactivarlo en producción
--   4. Las políticas usan auth.uid() de Supabase Auth (Google OAuth)
-- =============================================================================


-- -----------------------------------------------------------------------------
-- EXTENSIONS
-- -----------------------------------------------------------------------------

create extension if not exists "uuid-ossp";


-- -----------------------------------------------------------------------------
-- 01. profiles
-- Espejo del usuario autenticado. Se crea automáticamente en el trigger de auth.
-- id = auth.uid() — nunca generar un UUID distinto.
-- -----------------------------------------------------------------------------

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table profiles enable row level security;

-- El usuario solo puede ver y editar su propio perfil
create policy "profiles: select own"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: insert own"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on profiles for update
  using (auth.uid() = id);

-- Trigger: crear perfil automáticamente al registrarse con Google OAuth
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- -----------------------------------------------------------------------------
-- 02. groups
-- Grupo de cena. El admin es quien lo crea (US-00).
-- -----------------------------------------------------------------------------

create table if not exists groups (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  created_by  uuid not null references profiles(id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table groups enable row level security;

-- Solo miembros del grupo pueden verlo
create policy "groups: select members"
  on groups for select
  using (
    exists (
      select 1 from members
      where members.group_id = groups.id
        and members.user_id  = auth.uid()
    )
  );

-- Solo el creador puede insertar (se convierte en admin via trigger)
create policy "groups: insert creator"
  on groups for insert
  with check (auth.uid() = created_by);

-- Solo admins del grupo pueden editar el nombre
create policy "groups: update admin"
  on groups for update
  using (
    exists (
      select 1 from members
      where members.group_id = groups.id
        and members.user_id  = auth.uid()
        and members.role     = 'admin'
    )
  );


-- -----------------------------------------------------------------------------
-- 03. members
-- Membresía usuario-grupo. Roles: member | admin.
-- -----------------------------------------------------------------------------

create type member_role as enum ('member', 'admin');

create table if not exists members (
  id         uuid primary key default uuid_generate_v4(),
  group_id   uuid not null references groups(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  role       member_role not null default 'member',
  joined_at  timestamptz not null default now(),
  unique (group_id, user_id)
);

create index idx_members_group_id on members(group_id);
create index idx_members_user_id  on members(user_id);

alter table members enable row level security;

-- Miembros del mismo grupo pueden verse entre sí
create policy "members: select same group"
  on members for select
  using (
    exists (
      select 1 from members m2
      where m2.group_id = members.group_id
        and m2.user_id  = auth.uid()
    )
  );

-- Cualquier usuario autenticado puede insertarse a sí mismo (via link de invitación)
create policy "members: insert self"
  on members for insert
  with check (auth.uid() = user_id);

-- Cada miembro puede actualizar solo su propio registro (ej: abandonar grupo)
create policy "members: update own"
  on members for update
  using (auth.uid() = user_id);

-- Solo admins pueden eliminar miembros
create policy "members: delete admin"
  on members for delete
  using (
    exists (
      select 1 from members m2
      where m2.group_id = members.group_id
        and m2.user_id  = auth.uid()
        and m2.role     = 'admin'
    )
  );

-- Trigger: al crear un grupo, insertar al creador como admin automáticamente
create or replace function handle_new_group()
returns trigger language plpgsql security definer as $$
begin
  insert into members (group_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;

create or replace trigger on_group_created
  after insert on groups
  for each row execute procedure handle_new_group();


-- -----------------------------------------------------------------------------
-- 04. invitation_links
-- Links de invitación al grupo (US-00b, US-04).
-- Generados automáticamente al crear el grupo. Revocables por el admin.
-- -----------------------------------------------------------------------------

create table if not exists invitation_links (
  id          uuid primary key default uuid_generate_v4(),
  group_id    uuid not null references groups(id) on delete cascade,
  token       text not null unique default encode(gen_random_bytes(24), 'base64url'),
  created_by  uuid not null references profiles(id) on delete restrict,
  expires_at  timestamptz not null default (now() + interval '30 days'),
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index idx_invitation_links_token    on invitation_links(token);
create index idx_invitation_links_group_id on invitation_links(group_id);

alter table invitation_links enable row level security;

-- Miembros del grupo pueden ver los links (para compartir)
create policy "invitation_links: select members"
  on invitation_links for select
  using (
    exists (
      select 1 from members
      where members.group_id = invitation_links.group_id
        and members.user_id  = auth.uid()
    )
  );

-- Solo admins pueden crear links
create policy "invitation_links: insert admin"
  on invitation_links for insert
  with check (
    exists (
      select 1 from members
      where members.group_id = invitation_links.group_id
        and members.user_id  = auth.uid()
        and members.role     = 'admin'
    )
  );

-- Solo admins pueden revocar (update revoked_at) o editar
create policy "invitation_links: update admin"
  on invitation_links for update
  using (
    exists (
      select 1 from members
      where members.group_id = invitation_links.group_id
        and members.user_id  = auth.uid()
        and members.role     = 'admin'
    )
  );

-- Solo admins pueden eliminar links
create policy "invitation_links: delete admin"
  on invitation_links for delete
  using (
    exists (
      select 1 from members
      where members.group_id = invitation_links.group_id
        and members.user_id  = auth.uid()
        and members.role     = 'admin'
    )
  );

-- Trigger: crear link de invitación automáticamente al crear el grupo
create or replace function handle_new_group_invitation()
returns trigger language plpgsql security definer as $$
begin
  insert into invitation_links (group_id, created_by)
  values (new.id, new.created_by);
  return new;
end;
$$;

create or replace trigger on_group_created_invitation
  after insert on groups
  for each row execute procedure handle_new_group_invitation();


-- -----------------------------------------------------------------------------
-- 05. rotation
-- Turno rotativo de organización (US-11, US-13).
-- Un registro por mes por grupo. Solo admins gestionan.
-- -----------------------------------------------------------------------------

create table if not exists rotation (
  id            uuid primary key default uuid_generate_v4(),
  group_id      uuid not null references groups(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete restrict,
  month         date not null,                          -- primer día del mes: 2026-04-01
  notified_at   timestamptz,                            -- cuándo se notificó al organizador
  created_at    timestamptz not null default now(),
  unique (group_id, month)
);

create index idx_rotation_group_id on rotation(group_id);
create index idx_rotation_month    on rotation(month);

alter table rotation enable row level security;

-- Todos los miembros del grupo pueden ver la rotación
create policy "rotation: select members"
  on rotation for select
  using (
    exists (
      select 1 from members
      where members.group_id = rotation.group_id
        and members.user_id  = auth.uid()
    )
  );

-- Solo admins gestionan la rotación
create policy "rotation: insert admin"
  on rotation for insert
  with check (
    exists (
      select 1 from members
      where members.group_id = rotation.group_id
        and members.user_id  = auth.uid()
        and members.role     = 'admin'
    )
  );

create policy "rotation: update admin"
  on rotation for update
  using (
    exists (
      select 1 from members
      where members.group_id = rotation.group_id
        and members.user_id  = auth.uid()
        and members.role     = 'admin'
    )
  );

create policy "rotation: delete admin"
  on rotation for delete
  using (
    exists (
      select 1 from members
      where members.group_id = rotation.group_id
        and members.user_id  = auth.uid()
        and members.role     = 'admin'
    )
  );


-- -----------------------------------------------------------------------------
-- 06. events
-- Evento mensual de cena (US-05, US-06, US-07).
-- Solo el organizador del mes puede crear y editar.
-- Estados: pending | published | closed
-- -----------------------------------------------------------------------------

create type event_status as enum ('pending', 'published', 'closed');

create table if not exists events (
  id              uuid primary key default uuid_generate_v4(),
  group_id        uuid not null references groups(id) on delete cascade,
  organizer_id    uuid not null references profiles(id) on delete restrict,
  month           date not null,                          -- primer día del mes: 2026-04-01
  status          event_status not null default 'pending',
  event_date      date,
  place           text,
  description     text,
  notified_at     timestamptz,                            -- cuándo se notificó al grupo (US-06)
  closed_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (group_id, month)
);

create index idx_events_group_id on events(group_id);
create index idx_events_month    on events(month);

alter table events enable row level security;

-- Todos los miembros del grupo pueden ver los eventos
create policy "events: select members"
  on events for select
  using (
    exists (
      select 1 from members
      where members.group_id = events.group_id
        and members.user_id  = auth.uid()
    )
  );

-- Solo el organizador del mes puede crear el evento
create policy "events: insert organizer"
  on events for insert
  with check (auth.uid() = organizer_id);

-- Solo el organizador puede editar mientras no esté cerrado
create policy "events: update organizer"
  on events for update
  using (
    auth.uid() = organizer_id
    and status != 'closed'
  );


-- -----------------------------------------------------------------------------
-- 07. attendances
-- Confirmaciones de asistencia (US-09, US-10).
-- Estados exactos: va | no_va | tal_vez — no usar otros valores.
-- -----------------------------------------------------------------------------

create type attendance_status as enum ('va', 'no_va', 'tal_vez');

create table if not exists attendances (
  id         uuid primary key default uuid_generate_v4(),
  event_id   uuid not null references events(id) on delete cascade,
  member_id  uuid not null references profiles(id) on delete cascade,
  status     attendance_status not null,
  updated_at timestamptz not null default now(),
  unique (event_id, member_id)
);

create index idx_attendances_event_id  on attendances(event_id);
create index idx_attendances_member_id on attendances(member_id);

alter table attendances enable row level security;

-- Miembros del grupo pueden ver las confirmaciones de su evento
create policy "attendances: select members"
  on attendances for select
  using (
    exists (
      select 1 from events
      join members on members.group_id = events.group_id
      where events.id         = attendances.event_id
        and members.user_id   = auth.uid()
    )
  );

-- Cada miembro gestiona solo su propia confirmación
create policy "attendances: insert own"
  on attendances for insert
  with check (auth.uid() = member_id);

create policy "attendances: update own"
  on attendances for update
  using (auth.uid() = member_id);

create policy "attendances: delete own"
  on attendances for delete
  using (auth.uid() = member_id);


-- -----------------------------------------------------------------------------
-- 08. polls
-- Votaciones de restaurante (US-17, US-18).
-- Solo el organizador del evento puede crear y gestionar.
-- Un solo poll activo por evento.
-- -----------------------------------------------------------------------------

create type poll_status as enum ('open', 'closed');

create table if not exists polls (
  id          uuid primary key default uuid_generate_v4(),
  event_id    uuid not null references events(id) on delete cascade,
  group_id    uuid not null references groups(id) on delete cascade,
  created_by  uuid not null references profiles(id) on delete restrict,
  status      poll_status not null default 'open',
  closes_at   timestamptz not null,
  closed_at   timestamptz,
  created_at  timestamptz not null default now(),
  unique (event_id)                                       -- un solo poll por evento
);

create index idx_polls_event_id on polls(event_id);
create index idx_polls_group_id on polls(group_id);

alter table polls enable row level security;

-- Miembros del grupo pueden ver las votaciones
create policy "polls: select members"
  on polls for select
  using (
    exists (
      select 1 from members
      where members.group_id = polls.group_id
        and members.user_id  = auth.uid()
    )
  );

-- Solo el organizador (created_by) puede crear y editar
create policy "polls: insert organizer"
  on polls for insert
  with check (auth.uid() = created_by);

create policy "polls: update organizer"
  on polls for update
  using (auth.uid() = created_by);


-- -----------------------------------------------------------------------------
-- 09. poll_options
-- Opciones de votación (US-17). Mínimo 2 por poll.
-- -----------------------------------------------------------------------------

create table if not exists poll_options (
  id         uuid primary key default uuid_generate_v4(),
  poll_id    uuid not null references polls(id) on delete cascade,
  label      text not null,
  created_at timestamptz not null default now()
);

create index idx_poll_options_poll_id on poll_options(poll_id);

alter table poll_options enable row level security;

-- Miembros del grupo pueden ver las opciones (via poll → event → group)
create policy "poll_options: select members"
  on poll_options for select
  using (
    exists (
      select 1 from polls
      join members on members.group_id = polls.group_id
      where polls.id        = poll_options.poll_id
        and members.user_id = auth.uid()
    )
  );

-- Solo el organizador puede agregar opciones
create policy "poll_options: insert organizer"
  on poll_options for insert
  with check (
    exists (
      select 1 from polls
      where polls.id         = poll_options.poll_id
        and polls.created_by = auth.uid()
    )
  );

create policy "poll_options: delete organizer"
  on poll_options for delete
  using (
    exists (
      select 1 from polls
      where polls.id         = poll_options.poll_id
        and polls.created_by = auth.uid()
    )
  );


-- -----------------------------------------------------------------------------
-- 10. poll_votes
-- Votos emitidos (US-18). Un voto por miembro por poll. Modificable antes del cierre.
-- -----------------------------------------------------------------------------

create table if not exists poll_votes (
  id         uuid primary key default uuid_generate_v4(),
  poll_id    uuid not null references polls(id) on delete cascade,
  option_id  uuid not null references poll_options(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (poll_id, user_id)                               -- un voto por miembro
);

create index idx_poll_votes_poll_id on poll_votes(poll_id);
create index idx_poll_votes_user_id on poll_votes(user_id);

alter table poll_votes enable row level security;

-- Miembros del grupo pueden ver todos los votos (para ver porcentajes)
create policy "poll_votes: select members"
  on poll_votes for select
  using (
    exists (
      select 1 from polls
      join members on members.group_id = polls.group_id
      where polls.id        = poll_votes.poll_id
        and members.user_id = auth.uid()
    )
  );

-- Cada miembro gestiona solo su propio voto
create policy "poll_votes: insert own"
  on poll_votes for insert
  with check (auth.uid() = user_id);

create policy "poll_votes: update own"
  on poll_votes for update
  using (auth.uid() = user_id);

create policy "poll_votes: delete own"
  on poll_votes for delete
  using (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 11. restaurant_history
-- Historial de cenas (US-14, US-16).
-- INSERT solo al cerrar el evento. Solo el organizador puede cargar.
-- -----------------------------------------------------------------------------

create table if not exists restaurant_history (
  id           uuid primary key default uuid_generate_v4(),
  event_id     uuid not null references events(id) on delete cascade,
  group_id     uuid not null references groups(id) on delete cascade,
  name         text,                                      -- puede ser null (US-14 scenario: cierre sin restaurante)
  visited_at   date not null,
  attendee_ids uuid[] not null default '{}',              -- snapshot de asistentes confirmados
  created_by   uuid not null references profiles(id) on delete restrict,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (event_id)
);

create index idx_restaurant_history_group_id   on restaurant_history(group_id);
create index idx_restaurant_history_visited_at on restaurant_history(visited_at);

alter table restaurant_history enable row level security;

-- Todos los miembros del grupo pueden consultar el historial
create policy "restaurant_history: select members"
  on restaurant_history for select
  using (
    exists (
      select 1 from members
      where members.group_id = restaurant_history.group_id
        and members.user_id  = auth.uid()
    )
  );

-- Solo el organizador del evento puede cargar el restaurante
create policy "restaurant_history: insert organizer"
  on restaurant_history for insert
  with check (
    exists (
      select 1 from events
      where events.id          = restaurant_history.event_id
        and events.organizer_id = auth.uid()
    )
  );

-- El organizador puede actualizar el nombre si lo dejó vacío al cerrar
create policy "restaurant_history: update organizer"
  on restaurant_history for update
  using (auth.uid() = created_by);


-- -----------------------------------------------------------------------------
-- 12. checklist_templates
-- Templates de checklist reutilizables (US-20).
-- Admins gestionan. global = true para templates del sistema.
-- -----------------------------------------------------------------------------

create table if not exists checklist_templates (
  id          uuid primary key default uuid_generate_v4(),
  group_id    uuid references groups(id) on delete cascade, -- null = template global
  label       text not null,
  description text,
  order_index int  not null default 0,
  global      boolean not null default false,
  created_at  timestamptz not null default now()
);

create index idx_checklist_templates_group_id on checklist_templates(group_id);

alter table checklist_templates enable row level security;

-- Miembros ven templates de su grupo + templates globales
create policy "checklist_templates: select members or global"
  on checklist_templates for select
  using (
    global = true
    or exists (
      select 1 from members
      where members.group_id = checklist_templates.group_id
        and members.user_id  = auth.uid()
    )
  );

-- Solo admins pueden crear, editar y eliminar templates de grupo
create policy "checklist_templates: insert admin"
  on checklist_templates for insert
  with check (
    exists (
      select 1 from members
      where members.group_id = checklist_templates.group_id
        and members.user_id  = auth.uid()
        and members.role     = 'admin'
    )
  );

create policy "checklist_templates: update admin"
  on checklist_templates for update
  using (
    exists (
      select 1 from members
      where members.group_id = checklist_templates.group_id
        and members.user_id  = auth.uid()
        and members.role     = 'admin'
    )
  );


-- -----------------------------------------------------------------------------
-- 13. checklist_items
-- Tareas del checklist del organizador (US-20).
-- Instanciadas a partir de templates al asignar el turno.
-- -----------------------------------------------------------------------------

create type checklist_status as enum ('pending', 'done');

create table if not exists checklist_items (
  id           uuid primary key default uuid_generate_v4(),
  event_id     uuid not null references events(id) on delete cascade,
  template_id  uuid references checklist_templates(id) on delete set null,
  label        text not null,
  status       checklist_status not null default 'pending',
  order_index  int  not null default 0,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_checklist_items_event_id on checklist_items(event_id);

alter table checklist_items enable row level security;

-- Solo el organizador del evento puede ver y gestionar su checklist
create policy "checklist_items: all organizer"
  on checklist_items for all
  using (
    exists (
      select 1 from events
      where events.id          = checklist_items.event_id
        and events.organizer_id = auth.uid()
    )
  );


-- =============================================================================
-- REALTIME
-- Habilitar realtime para las tablas que requieren actualizaciones en vivo
-- (US-07: confirmaciones en tiempo real, US-18: porcentajes de votación)
-- =============================================================================

-- Ejecutar en el panel de Supabase → Database → Replication, o via SQL:
-- alter publication supabase_realtime add table attendances;
-- alter publication supabase_realtime add table poll_votes;
-- alter publication supabase_realtime add table events;


-- =============================================================================
-- SEED — Templates globales de checklist (US-20)
-- =============================================================================

insert into checklist_templates (label, order_index, global) values
  ('Crear el evento del mes',          1, true),
  ('Abrir votación de restaurantes',   2, true),
  ('Notificar al grupo',               3, true),
  ('Revisar confirmaciones',           4, true),
  ('Confirmar reserva en el restaurante', 5, true),
  ('Cerrar el evento y cargar restaurante', 6, true);


-- =============================================================================
-- FIN DEL SCHEMA
-- monthly-dinner · MVP v1.0 · Marzo 2026
-- =============================================================================
