# Mejoras pendientes

## E02 · Panel de evento mensual

- Conectar `MEMBERS` con query real de Supabase sobre `members` + `profiles`.
- Conectar `CONFIRMATIONS_INIT` con query real de Supabase sobre `attendances`.
- Reemplazar el `useEffect` de simulación por `supabase.channel()` con filtro por `event_id`.
- Implementar compartir real con `navigator.share()` y fallback a `navigator.clipboard.writeText()`.
- Implementar server action para notificaciones push en `Notificando`.
- Evaluar mover `OrgHeader`, `InfoRow`, `EventoCard`, `ConfirmBar`, `Stat` y `ConfirmRow` a `components/event/`.
