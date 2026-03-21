# Architecture

monthly-dinner es una app mobile-first para coordinar cenas mensuales grupales y reemplazar la coordinación informal por WhatsApp.

```text
Browser (React Client Components)
  -> Next.js App Router (Server Components + Server Actions)
    -> Supabase (Postgres + Auth + Realtime)
    -> Google OAuth (via Supabase Auth)
  -> Vercel (deploy automático desde GitHub)
```

## Decisiones de diseño

- Se eligió Supabase en lugar de Firebase porque el modelo relacional de grupos, eventos, asistencias y turnos necesita SQL real.
- Se eligió Google OAuth en lugar de magic link porque el grupo ya opera con Google a diario y reduce dependencia del inbox.

## Patrón Realtime

- El canal de Realtime se abre dentro del Client Component `EventPanel` al montar la vista del dashboard.
- La suscripción usa `supabase.channel()` y filtra por `event_id` para reducir tráfico innecesario en cambios de `attendances`.
- El `cleanup` del `useEffect` remueve el canal al desmontar el componente para evitar listeners huérfanos.
- Cada evento `INSERT` o `UPDATE` de asistencia vuelve a sincronizar el resumen local de React sin recargar la página.

## Flujo de onboarding

```text
Login con Google
  -> /api/auth/callback
    -> ensureProfile()
    -> consultar members por auth.uid()
      -> tiene grupo: /dashboard
      -> no tiene grupo: /onboarding
        -> crear grupo: /onboarding/new-group
        -> unirse con invitación: /join o /join/[token]
```

- El middleware protege `/onboarding` y `/onboarding/new-group` con sesión activa, pero no decide membresía.
- La decisión de enviar a `/dashboard` o `/onboarding` vive en el callback OAuth y se refuerza en los Server Components de onboarding.
- La RPC `create_group_with_admin(group_name text)` usa `SECURITY DEFINER` porque necesita insertar en `groups` y `members` dentro del mismo bloque transaccional de Postgres, evitando estados parciales si falla el segundo insert.
- Las políticas RLS siguen aplicando para lecturas y para inserts directos, mientras la RPC encapsula el alta inicial del grupo administrador.

