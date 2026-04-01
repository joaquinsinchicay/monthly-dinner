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

create policy "profiles: select own"
  on profiles for select
  using (auth.uid() = id);

-- Permite ver el perfil de cualquier miembro del mismo grupo.
-- Necesario para US-10 (nombres en resumen) y US-11 (nombre del organizador para otros miembros).
create policy "profiles: select group members"
  on profiles for select
  using (
    exists (
      select 1
      from members m1
      join members m2 on m1.group_id = m2.group_id
      where m1.user_id = profiles.id
        and m2.user_id = auth.uid()
    )
  );

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
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null,
  frequency             text not null check (frequency in ('mensual', 'quincenal', 'semanal')),
  meeting_day_of_week   text check (meeting_day_of_week in ('lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo')),
  meeting_week          integer check (meeting_week between 1 and 5),
  -- 1=primera, 2=segunda, 3=tercera, 4=cuarta, 5=última
  -- NULL cuando frequency = 'semanal'
  -- Para frequency = 'quincenal': meeting_week = 1 → "1° y 3° semana"
  --                               meeting_week = 2 → "2° y 4° semana"
  created_by            uuid not null references profiles(id) on delete restrict,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table groups drop constraint if exists meeting_day_consistency;

alter table groups
  add constraint meeting_day_consistency check (
    (frequency = 'semanal'
      and meeting_day_of_week is not null
      and meeting_week is null) or
    (frequency = 'mensual'
      and meeting_day_of_week is not null
      and meeting_week between 1 and 5) or
    (frequency = 'quincenal'
      and meeting_day_of_week is not null
      and meeting_week in (1, 2))
    -- meeting_week = 1 representa "1° y 3° semana"
    -- meeting_week = 2 representa "2° y 4° semana"
  );

alter table groups enable row level security;

create policy "groups: select members"
  on groups for select
  using (
    exists (
      select 1 from members
      where members.group_id = groups.id
        and members.user_id  = auth.uid()
    )
  );

create policy "groups: insert creator"
  on groups for insert
  with check (auth.uid() = created_by);

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
-- IMPORTANTE: 'organizer' NO es un valor válido de este enum.
-- El organizador del mes se determina via rotation.user_id, no via members.role.
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

-- IMPORTANTE: la política "select same group" NO puede usar un subquery directo
-- sobre members — genera recursión infinita (error 42P17 en Supabase).
-- Solución: función security definer que bypasea RLS para el check interno.
-- Ver docs/architecture/technical-decisions.md → "RLS: recursión infinita en members"
create or replace function is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from members
    where group_id = p_group_id
      and user_id  = p_user_id
  );
$$;

revoke all on function is_group_member(uuid, uuid) from public;
grant execute on function is_group_member(uuid, uuid) to authenticated;

create policy "members: select same group"
  on members for select
  using (is_group_member(group_id, auth.uid()));

create policy "members: insert self"
  on members for insert
  with check (auth.uid() = user_id);

create policy "members: update own"
  on members for update
  using (auth.uid() = user_id);

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
  token       text not null unique default replace(replace(encode(gen_random_bytes(24), 'base64'), '+', '-'), '/', '_'),
  created_by  uuid not null references profiles(id) on delete restrict,
  expires_at  timestamptz not null default (now() + interval '30 days'),
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index idx_invitation_links_token    on invitation_links(token);
create index idx_invitation_links_group_id on invitation_links(group_id);

alter table invitation_links enable row level security;

create policy "invitation_links: select members"
  on invitation_links for select
  using (
    exists (
      select 1 from members
      where members.group_id = invitation_links.group_id
        and members.user_id  = auth.uid()
    )
  );

-- NOTA: la política de INSERT usa exists(members) pero el trigger on_group_created_invitation
-- corre ANTES de que el admin exista en members (el trigger on_group_created lo inserta
-- en el mismo ciclo). El trigger es security definer y bypasea RLS — no modificar
-- el orden de los triggers ni remover security definer sin entender esta dependencia.
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

-- Trigger: crear link de invitación automáticamente al crear el grupo.
-- Corre security definer para bypasear RLS — el admin aún no existe en members
-- en este punto del ciclo (on_group_created lo inserta en el mismo after insert).
-- No cambiar a security invoker.
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
  month         date not null,        -- primer día del mes: 2026-04-01
  notified_at   timestamptz,          -- cuándo se notificó al organizador
  created_at    timestamptz not null default now(),
  unique (group_id, month)
);

create index idx_rotation_group_id on rotation(group_id);
create index idx_rotation_month    on rotation(month);

alter table rotation enable row level security;

create policy "rotation: select members"
  on rotation for select
  using (
    exists (
      select 1 from members
      where members.group_id = rotation.group_id
        and members.user_id  = auth.uid()
    )
  );

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
  organizer_id    uuid references profiles(id) on delete restrict,
  -- NULL cuando el evento fue generado automáticamente al crear el grupo (US-03 Scenario 11).
  -- Se asigna cuando el organizador acepta el turno (US-07 / rotación).
  month           date not null,      -- primer día del mes: 2026-04-01
  status          event_status not null default 'pending',
  event_date      date,
  place           text,
  description     text,
  notified_at     timestamptz,        -- cuándo se notificó al grupo (US-06)
  closed_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (group_id, month)
);

create index idx_events_group_id on events(group_id);
create index idx_events_month    on events(month);

alter table events enable row level security;

create policy "events: select members"
  on events for select
  using (
    exists (
      select 1 from members
      where members.group_id = events.group_id
        and members.user_id  = auth.uid()
    )
  );

create policy "events: insert organizer"
  on events for insert
  with check (auth.uid() = organizer_id);

-- Eventos generados automáticamente al crear el grupo (organizer_id IS NULL).
-- Solo el admin del grupo puede insertarlos.
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

-- NOTA: RLS no impide que un UPDATE malicioso modifique organizer_id.
-- La inmutabilidad de organizer_id debe validarse en el server action
-- antes de ejecutar el UPDATE — no asumir que RLS lo cubre.
create policy "events: update organizer"
  on events for update
  using (
    auth.uid() = organizer_id
    and status != 'closed'
  );

-- US-11: permite al organizador asignado en rotation actualizar un evento
-- auto-generado (organizer_id IS NULL) para reclamarlo y publicarlo directamente.
create policy "events: update rotation organizer pending"
  on events for update
  using (
    status = 'pending'
    and organizer_id is null
    and exists (
      select 1 from rotation
      where rotation.group_id = events.group_id
        and rotation.user_id  = auth.uid()
        and rotation.month    = events.month
    )
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

create policy "attendances: select members"
  on attendances for select
  using (
    exists (
      select 1 from events
      join members on members.group_id = events.group_id
      where events.id       = attendances.event_id
        and members.user_id = auth.uid()
    )
  );

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
  unique (event_id)
);

create index idx_polls_event_id on polls(event_id);
create index idx_polls_group_id on polls(group_id);

alter table polls enable row level security;

create policy "polls: select members"
  on polls for select
  using (
    exists (
      select 1 from members
      where members.group_id = polls.group_id
        and members.user_id  = auth.uid()
    )
  );

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
  unique (poll_id, user_id)
);

create index idx_poll_votes_poll_id on poll_votes(poll_id);
create index idx_poll_votes_user_id on poll_votes(user_id);

alter table poll_votes enable row level security;

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
  name         text,                  -- nullable: cierre sin restaurante registrado (US-14)
  visited_at   date not null,
  attendee_ids uuid[] not null default '{}',   -- snapshot de confirmados al cierre
  created_by   uuid not null references profiles(id) on delete restrict,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (event_id)
);

create index idx_restaurant_history_group_id   on restaurant_history(group_id);
create index idx_restaurant_history_visited_at on restaurant_history(visited_at);

alter table restaurant_history enable row level security;

create policy "restaurant_history: select members"
  on restaurant_history for select
  using (
    exists (
      select 1 from members
      where members.group_id = restaurant_history.group_id
        and members.user_id  = auth.uid()
    )
  );

create policy "restaurant_history: insert organizer"
  on restaurant_history for insert
  with check (
    exists (
      select 1 from events
      where events.id           = restaurant_history.event_id
        and events.organizer_id = auth.uid()
    )
  );

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
  group_id    uuid references groups(id) on delete cascade,  -- null = template global
  label       text not null,
  description text,
  order_index int  not null default 0,
  global      boolean not null default false,
  created_at  timestamptz not null default now()
);

create index idx_checklist_templates_group_id on checklist_templates(group_id);

alter table checklist_templates enable row level security;

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
-- Políticas separadas por operación (no usar FOR ALL — ver nota).
-- NOTA: FOR ALL aplica USING como WITH CHECK en INSERT, lo cual es ambiguo
-- en algunas versiones. Se usan políticas individuales para mayor claridad.
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

create policy "checklist_items: select organizer"
  on checklist_items for select
  using (
    exists (
      select 1 from events
      where events.id           = checklist_items.event_id
        and events.organizer_id = auth.uid()
    )
  );

create policy "checklist_items: insert organizer"
  on checklist_items for insert
  with check (
    exists (
      select 1 from events
      where events.id           = checklist_items.event_id
        and events.organizer_id = auth.uid()
    )
  );

create policy "checklist_items: update organizer"
  on checklist_items for update
  using (
    exists (
      select 1 from events
      where events.id           = checklist_items.event_id
        and events.organizer_id = auth.uid()
    )
  );

create policy "checklist_items: delete organizer"
  on checklist_items for delete
  using (
    exists (
      select 1 from events
      where events.id           = checklist_items.event_id
        and events.organizer_id = auth.uid()
    )
  );


-- =============================================================================
-- REALTIME
-- Habilitar realtime para las tablas que requieren actualizaciones en vivo.
-- US-07: confirmaciones en tiempo real.
-- US-18: porcentajes de votación en tiempo real.
-- Ejecutar en Supabase → Database → Replication, o descomentar las líneas:
-- =============================================================================

-- US-07 / US-10: confirmaciones en tiempo real
alter publication supabase_realtime add table attendances;
-- US-18: porcentajes de votación en tiempo real
alter publication supabase_realtime add table poll_votes;
-- US-07: cambios de estado del evento
alter publication supabase_realtime add table events;


-- =============================================================================
-- SEED — Templates globales de checklist (US-20)
-- =============================================================================

insert into checklist_templates (label, order_index, global) values
  ('Crear el evento del mes',               1, true),
  ('Abrir votación de restaurantes',         2, true),
  ('Notificar al grupo',                     3, true),
  ('Revisar confirmaciones',                 4, true),
  ('Confirmar reserva en el restaurante',    5, true),
  ('Cerrar el evento y cargar restaurante',  6, true);


-- =============================================================================
-- FIN DEL SCHEMA
-- monthly-dinner · MVP v1.0 · Marzo 2026
-- =============================================================================