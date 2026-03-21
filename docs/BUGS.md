# Bugs y hallazgos durante la refactorización

## Comportamientos inesperados

1. El repo ya traía una implementación auth simplificada con `app/login/page.tsx` y `app/invite/[token]/page.tsx`, pero sin separar copy ni validar tokens reales.
2. El primer refactor E01 quedó desalineado con el schema real de Supabase porque usó `group_members`, `invite_tokens` y `profiles.display_name`; el fix actual corrige las referencias a `members`, `invitation_links` y `profiles.full_name`.

## Diferencias entre prototipo React y Next.js App Router

- El prototipo standalone asumía estado local en cliente; en App Router hubo que mover la validación de sesión y de invitación al servidor.
- En Next.js, el redirect post-login conviene resolverlo en `middleware.ts` y en el callback para evitar flashes entre pantallas.
- El callback OAuth no puede depender solo del cliente porque debe intercambiar el `code` y persistir cookies HTTP-only.

## Race conditions detectadas

### OAuth cancelado vs. callback tardío

**Reproducción:** cancelar el popup de Google y reintentar rápidamente puede dejar feedback ambiguo si el cliente solo mira estado local.

**Solución:** el callback y `completeOAuthSignIn()` normalizan `error_code=access_denied` a `status=oauth_cancelled`, dejando la UI idempotente al volver a `/login`.

### Join por invitación duplicado

**Reproducción:** abrir el mismo invite link desde una sesión ya miembro o repetir el callback con el mismo usuario.

**Solución:** `members` usa `UNIQUE (group_id, profile_id)` y el callback hace `upsert` con `onConflict`, evitando duplicados y derivando al estado `already_member` cuando aplica.

## Bug resuelto: desajuste de schema E01

El refactor anterior apuntaba a nombres de tablas/columnas que no existen en la base real (`group_members`, `invite_tokens`, `profiles.display_name`). Quedó corregido para usar `members`, `invitation_links`, `profiles.full_name` y validación adicional por `invitation_links.revoked = false`.
