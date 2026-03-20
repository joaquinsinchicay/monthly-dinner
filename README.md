# monthly-dinner · Cenas del Jueves MVP

Aplicación Next.js 14 App Router para coordinar cenas mensuales entre amigos con autenticación Google vía Supabase, eventos mensuales, confirmaciones de asistencia, votación de restaurantes, historial y checklist del organizador.

## Stack

- Next.js 14 App Router
- React 18
- Supabase (`@supabase/ssr` + `@supabase/supabase-js`)
- Vitest + Testing Library
- CSS global con el sistema visual **The Curated Table**

## Variables de entorno

Crear `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Setup local

```bash
npm install
npm run dev
```

Abrí `http://localhost:3000/login`.

## Flujo de desarrollo

1. Definir el schema y RLS en `supabase/schema.sql` y `supabase/rls.sql`.
2. Mantener los tipos de Supabase centralizados en `types/database.ts`.
3. Implementar server actions con `createServerClient` desde `@supabase/ssr`.
4. Probar lógica crítica con Vitest / Testing Library antes de commitear.

## Rutas del MVP

- `/login`
- `/invite/[token]`
- `/group/[groupId]`
- `/group/[groupId]/event/[eventId]`
- `/group/[groupId]/event/[eventId]/poll`
- `/group/[groupId]/history`
- `/group/[groupId]/checklist`

## Notas

- La app incluye datos mockeados para representar el MVP greenfield sin depender de infraestructura manual.
- Supabase Realtime queda reservado para `attendances`, `poll_votes` y `monthly_events`.
