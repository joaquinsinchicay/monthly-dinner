-- =============================================================================
-- Remove Member — RLS policies para limpieza de datos al eliminar un miembro
-- =============================================================================

-- Admin puede eliminar cualquier attendance de su grupo
-- (necesario para limpiar datos al remover un miembro no-guest)
CREATE POLICY "attendances: admin delete any"
ON attendances FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM events e
    JOIN members m ON m.group_id = e.group_id
    WHERE e.id      = attendances.event_id
      AND m.user_id = auth.uid()
      AND m.role    = 'admin'
  )
);

-- Admin puede eliminar cualquier poll_vote de su grupo
-- (necesario para limpiar datos al remover un miembro no-guest)
CREATE POLICY "poll_votes: admin delete any"
ON poll_votes FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM polls p
    JOIN members m ON m.group_id = p.group_id
    WHERE p.id      = poll_votes.poll_id
      AND m.user_id = auth.uid()
      AND m.role    = 'admin'
  )
);
