# Estructura del proyecto

## Árbol principal Next.js 14 App Router

```text
app/
  (auth)/
    callback/route.ts
    login/page.tsx
  (protected)/
    dashboard/page.tsx
  groups/page.tsx
  layout.tsx
  page.tsx
components/
  google-sign-in-button.tsx
  layout/
  shared/
  ui/
lib/
  auth.ts
  env.ts
  supabase/
    client.ts
    server.ts
supabase/
  migrations/
    001_initial_schema.sql
tests/
  auth.test.ts
types/
  database.types.ts
```

## Archivos nuevos o reestructurados en esta implementación

- `app/(auth)/login/page.tsx`: pantalla de login con CTA de Google y mensajes suaves de cancelación/error.
- `app/(auth)/callback/route.ts`: handler que intercambia el código OAuth por la sesión de Supabase.
- `app/(protected)/dashboard/page.tsx`: panel principal protegido post-login.
- `lib/supabase/client.ts`: helper reusable para componentes client-side.
- `lib/supabase/server.ts`: helper reusable para middleware, route handlers y server components.
- `middleware.ts`: protección de rutas con listas separadas de rutas públicas y protegidas.
- `supabase/migrations/001_initial_schema.sql`: DDL base del MVP con RLS y trigger.
- `types/database.types.ts`: tipos TypeScript en formato compatible con Supabase para el schema público.
