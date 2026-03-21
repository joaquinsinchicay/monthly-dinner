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

## Autenticación

El flujo E01 quedó refactorizado para Next.js 14 App Router con Supabase Auth SSR:

1. `GET /login` valida la sesión en servidor y redirige a `/dashboard` si el usuario ya está autenticado.
2. `LoginCard` inicia Google OAuth con `supabase.auth.signInWithOAuth` y envía al callback `/auth/callback`.
3. El callback intercambia el `code`, crea o actualiza `profiles`, procesa el `invite_token` si existe y redirige a `/dashboard` o a la ruta preservada en `?redirect=`.
4. `middleware.ts` protege `/dashboard`, `/groups` y `/group`, además de restaurar el contexto cuando la sesión expiró.
5. `LogoutButton` confirma el cierre en un bottom sheet, ejecuta `supabase.auth.signOut()` y limpia el estado local antes de volver a `/login`.

## Textos de UI

Todos los textos visibles del flujo de autenticación viven en `public/locales/auth.json`.

- Editá ese archivo para cambiar títulos, subtítulos, botones, disclaimers o mensajes de estado.
- Los componentes de auth importan el JSON vía `lib/auth-copy.ts`, por lo que no hace falta tocar JSX para actualizar copy.
- Para extender a otro idioma, usá la misma estructura de claves y agregá otro archivo de locale paralelo.

## Flujo de desarrollo

1. Definir el schema y RLS en `supabase/schema.sql` y `supabase/rls.sql`.
2. Mantener los tipos de Supabase centralizados en `types/database.ts`.
3. Implementar server actions con `createServerClient` desde `@supabase/ssr`.
4. Probar lógica crítica con Vitest / Testing Library antes de commitear.

## Rutas del MVP

- `/login`
- `/invite/[token]`
- `/dashboard`
- `/group/[groupId]`
- `/group/[groupId]/event/[eventId]`
- `/group/[groupId]/event/[eventId]/poll`
- `/group/[groupId]/history`
- `/group/[groupId]/checklist`

## Notas

- La app incluye datos mockeados para representar el MVP greenfield sin depender de infraestructura manual.
- Supabase Realtime queda reservado para `attendances`, `poll_votes` y `monthly_events`.
