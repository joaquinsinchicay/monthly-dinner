-- =============================================================================
-- RPC: get_invitation_link_by_token
-- US-04 — Join por invitación
--
-- Problema: invitation_links tiene RLS "select members", pero el invitado
-- no es miembro todavía. Esta función bypasea RLS con security definer
-- y retorna solo los campos necesarios para validar el link públicamente.
--
-- Ejecutar en Supabase → SQL Editor antes de deployar US-04.
-- =============================================================================

create or replace function get_invitation_link_by_token(p_token text)
returns table (
  id          uuid,
  group_id    uuid,
  group_name  text,
  expires_at  timestamptz,
  revoked_at  timestamptz
)
language plpgsql
security definer
stable
as $$
begin
  return query
    select
      il.id,
      il.group_id,
      g.name  as group_name,
      il.expires_at,
      il.revoked_at
    from invitation_links il
    join groups g on g.id = il.group_id
    where il.token = p_token;
end;
$$;

-- Revocar permisos por defecto y conceder solo a usuarios autenticados y anónimos
-- (el invitado puede no estar autenticado aún cuando carga la página)
revoke all on function get_invitation_link_by_token(text) from public;
grant execute on function get_invitation_link_by_token(text) to anon, authenticated;
