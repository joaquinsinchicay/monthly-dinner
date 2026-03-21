# Estructura del módulo de autenticación

## Árbol de directorios

```text
app/
  (auth)/
    login/
      LoginCard.tsx
      page.tsx
    invite/
      [token]/
        InviteJoin.tsx
        page.tsx
  auth/
    callback/
      route.ts
components/
  auth/
    LogoutButton.tsx
lib/
  auth-copy.ts
  auth.ts
  invite.ts
  supabase.ts
  supabase/
    server.ts
public/
  locales/
    auth.json
middleware.ts
supabase/
  schema.sql
  rls.sql
```

## Descripción de archivos

- `app/(auth)/login/page.tsx`: Server Component; valida sesión SSR y redirige a `/dashboard` si ya existe usuario autenticado.
- `app/(auth)/login/LoginCard.tsx`: Client Component; renderiza la landing, estados OAuth y dispara `signInWithGoogle()`.
- `app/(auth)/invite/[token]/page.tsx`: Server Component; valida `invite_tokens`, decide entre `InviteExpired`, `AlreadyMember` o `InviteJoin`.
- `app/(auth)/invite/[token]/InviteJoin.tsx`: Client Component; inicia OAuth con el token de invitación embebido en el callback.
- `components/auth/LogoutButton.tsx`: Client Component reutilizable; muestra el bottom sheet de confirmación y ejecuta `signOut()`.
- `lib/auth-copy.ts`: helper para importar el JSON tipado y resolver estados de UI.
- `lib/auth.ts`: helpers de redirect seguro y construcción de callback OAuth.
- `lib/invite.ts`: validación tipada de `invite_tokens` y membresía actual.
- `lib/supabase/server.ts`: inicializa el cliente SSR con cookies de Next.js.
- `public/locales/auth.json`: fuente única de todos los textos visibles del flujo auth.
- `middleware.ts`: protege rutas, restaura contexto y evita mostrar `/login` a usuarios autenticados.

## `public/locales/auth.json`

El JSON se organiza por secciones del flujo (`landing`, `oauth_progress`, `invite`, `logout`, etc.). Se importa como módulo con `resolveJsonModule` y se expone centralizado a través de `lib/auth-copy.ts`.

Para extenderlo:

1. agregar la nueva sección o clave en `public/locales/auth.json`;
2. tipar o exponer el acceso desde `lib/auth-copy.ts` si hace falta helper adicional;
3. consumir esa clave desde el componente sin hardcodear copy visible.
