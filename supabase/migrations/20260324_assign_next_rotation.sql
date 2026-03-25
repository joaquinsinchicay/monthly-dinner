-- Migration: assign_next_rotation
-- US-13 — Próximo organizador tras el cierre
--
-- Función security definer que auto-asigna el organizador del próximo mes
-- al cerrar el evento. Bypasea la política RLS "rotation: insert admin"
-- para que el organizador (que puede ser un member regular) pueda
-- desencadenar la asignación al cerrar su evento.
--
-- Escenarios cubiertos:
--   - Siguiente organizador: siguiente en la lista de members por joined_at
--   - Rotación completa reinicia: módulo sobre la cantidad de members
--   - Idempotente: si ya existe la rotación del próximo mes, no hace nada
--
-- Ejecutar en Supabase → SQL Editor antes de deployar US-13.

create or replace function assign_next_rotation(p_group_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_next_month    date;
  v_members       uuid[];
  v_last_organizer uuid;
  v_last_index    int;
  v_next_index    int;
  v_next_user     uuid;
begin
  -- Primer día del próximo mes
  v_next_month := date_trunc('month', now() + interval '1 month')::date;

  -- Idempotente: si ya existe la rotación del próximo mes, salir
  if exists (
    select 1 from rotation
    where group_id = p_group_id
      and month    = v_next_month
  ) then
    return;
  end if;

  -- Todos los miembros del grupo ordenados por joined_at (orden de ingreso)
  select array_agg(user_id order by joined_at)
  into v_members
  from members
  where group_id = p_group_id;

  if v_members is null or array_length(v_members, 1) = 0 then
    return;
  end if;

  -- Organizador del mes actual (puede no existir si la rotación fue manual)
  select user_id into v_last_organizer
  from rotation
  where group_id = p_group_id
    and month    = date_trunc('month', now())::date;

  if v_last_organizer is null then
    -- Sin organizador actual → empezar desde el primer miembro
    v_next_user := v_members[1];
  else
    -- Scenario: siguiente en la lista. array_position retorna 1-indexed.
    v_last_index := array_position(v_members, v_last_organizer);
    if v_last_index is null then
      v_last_index := 0;
    end if;
    -- Scenario: Rotación completa reinicia — módulo sobre la cantidad de miembros
    v_next_index := (v_last_index % array_length(v_members, 1)) + 1;
    v_next_user  := v_members[v_next_index];
  end if;

  -- Insertar la rotación del próximo mes
  insert into rotation (group_id, user_id, month)
  values (p_group_id, v_next_user, v_next_month)
  on conflict (group_id, month) do nothing;
end;
$$;

-- Solo usuarios autenticados pueden llamar esta función
revoke all on function assign_next_rotation(uuid) from public;
grant execute on function assign_next_rotation(uuid) to authenticated;
