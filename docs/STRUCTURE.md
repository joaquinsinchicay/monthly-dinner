# Estructura del proyecto

## US-01 · Registro con Google

- `app/(auth)/login/page.tsx`: página pública de login como Server Component. Valida sesión existente y muestra el CTA de Google.
- `app/(auth)/login/actions.ts`: Server Action `signInWithGoogle` que inicia OAuth con Supabase y redirige al proveedor.
- `app/auth/callback/route.ts`: Route Handler que intercambia el `code` OAuth por una sesión con Supabase.
- `middleware.ts`: protege las rutas autenticadas y deja públicas `/`, `/login`, `/auth/callback` y `/join/[token]`.
- `lib/supabase/server.ts`: factoría `createServerClient` para Server Components, Route Handlers y Server Actions.
- `lib/supabase/client.ts`: factoría `createBrowserClient` reservada para Client Components futuros.
