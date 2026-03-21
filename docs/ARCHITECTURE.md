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
