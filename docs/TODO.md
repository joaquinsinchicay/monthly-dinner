# Mejoras pendientes

- **US-02 · Login con sesión existente:** reutilizar la base OAuth actual para sesiones persistentes y recuperación silenciosa.
- **US-03 · Cierre de sesión:** agregar acción de sign out con limpieza explícita de cookies/tokens y retorno controlado a `/login`.
- **US-04 · Join por invitación:** consumir `groups.invite_token` para onboarding por link compartido.
- **E02 · Panel mensual:** implementar CRUD y vistas de `events` sobre el schema ya creado.
- **RLS de escritura:** refinar políticas de `groups`, `group_members` y `events` para inserts/updates/deletes controlados por rol.
