-- Migration: profiles: select group members
-- US-10 — Ver resumen de confirmaciones
--
-- La política "profiles: select own" solo permite ver el propio perfil.
-- Para mostrar nombres de confirmaciones en el resumen necesitamos que
-- miembros del mismo grupo puedan verse entre sí.
--
-- Ejecutar en Supabase → SQL Editor antes de deployar US-10.

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
