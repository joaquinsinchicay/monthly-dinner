-- =============================================================================
-- US-21 — Agregar miembro sin cuenta (guest)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PASO 1 — Columnas en members
-- -----------------------------------------------------------------------------

-- Hacer user_id nullable (guests no tienen cuenta)
ALTER TABLE members ALTER COLUMN user_id DROP NOT NULL;

-- Agregar columnas para guests
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS is_guest boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_name text;

-- Constraint: todo member debe tener identidad (user_id o display_name)
ALTER TABLE members
  ADD CONSTRAINT members_identity_check
  CHECK (user_id IS NOT NULL OR display_name IS NOT NULL);

-- Constraint: guests tienen user_id NULL + display_name; no-guests tienen user_id
ALTER TABLE members
  ADD CONSTRAINT members_guest_coherence
  CHECK (
    (is_guest = true  AND user_id IS NULL    AND display_name IS NOT NULL) OR
    (is_guest = false AND user_id IS NOT NULL)
  );

-- -----------------------------------------------------------------------------
-- PASO 2 — Convertir attendances.member_id de user_id a members.id
--
-- El esquema original almacenaba auth.uid() en member_id.
-- US-21 unifica el campo: member_id siempre referencia members.id,
-- lo que permite incluir guests (que no tienen user_id).
-- -----------------------------------------------------------------------------

-- Actualizar filas existentes: user_id → members.id
UPDATE attendances a
SET member_id = m.id
FROM members m, events e
WHERE e.id    = a.event_id
  AND m.user_id   = a.member_id
  AND m.group_id  = e.group_id;

-- -----------------------------------------------------------------------------
-- PASO 3 — Actualizar RLS de members para guests
-- -----------------------------------------------------------------------------

-- INSERT para guests — solo admins del grupo
CREATE POLICY "members: insert guest"
ON members FOR INSERT
TO authenticated
WITH CHECK (
  is_guest = true
  AND EXISTS (
    SELECT 1 FROM members m
    WHERE m.group_id = members.group_id
      AND m.user_id  = auth.uid()
      AND m.role     = 'admin'
  )
);

-- DELETE para guests — solo admins del grupo
CREATE POLICY "members: delete guest"
ON members FOR DELETE
TO authenticated
USING (
  is_guest = true
  AND EXISTS (
    SELECT 1 FROM members m
    WHERE m.group_id = members.group_id
      AND m.user_id  = auth.uid()
      AND m.role     = 'admin'
  )
);

-- -----------------------------------------------------------------------------
-- PASO 4 — Actualizar RLS de attendances
--
-- La política original: member_id = auth.uid()
-- Nueva política: member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
-- Esto cubre tanto el flujo normal como la delegación admin → guest.
-- La validación de permisos para confirmar por guests se hace en el server action.
-- -----------------------------------------------------------------------------

-- Eliminar política original si existe
DROP POLICY IF EXISTS "attendances: all own" ON attendances;
DROP POLICY IF EXISTS "attendances: insert own" ON attendances;
DROP POLICY IF EXISTS "attendances: update own" ON attendances;
DROP POLICY IF EXISTS "attendances: delete own" ON attendances;

-- Nueva política unificada para INSERT/UPDATE/DELETE del propio miembro
CREATE POLICY "attendances: write own"
ON attendances
FOR ALL
TO authenticated
USING (
  member_id IN (
    SELECT id FROM members WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  member_id IN (
    SELECT id FROM members WHERE user_id = auth.uid()
  )
);

-- Política adicional: admins pueden escribir attendances de guests de su grupo
CREATE POLICY "attendances: admin write guest"
ON attendances
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM members guest_m
    JOIN members admin_m ON admin_m.group_id = guest_m.group_id
    JOIN events e ON e.id = attendances.event_id
    WHERE guest_m.id       = attendances.member_id
      AND guest_m.is_guest = true
      AND guest_m.group_id = e.group_id
      AND admin_m.user_id  = auth.uid()
      AND admin_m.role     = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM members guest_m
    JOIN members admin_m ON admin_m.group_id = guest_m.group_id
    JOIN events e ON e.id = attendances.event_id
    WHERE guest_m.id       = attendances.member_id
      AND guest_m.is_guest = true
      AND guest_m.group_id = e.group_id
      AND admin_m.user_id  = auth.uid()
      AND admin_m.role     = 'admin'
  )
);
