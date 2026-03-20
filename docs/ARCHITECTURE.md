# Arquitectura de autenticación

## Módulo OAuth Google vía Supabase Auth

Monthly Dinner usa Supabase Auth como orquestador del flujo OAuth con Google. La UI inicia el flujo desde `/login`, Supabase gestiona el redirect al proveedor y el callback `/auth/callback` intercambia el `code` por la sesión HTTP que luego reutilizan middleware, route handlers y futuras server actions.

## Relación entre `auth.users` y `public.profiles`

- `auth.users` es la fuente de verdad de identidad y credenciales administrada por Supabase.
- `public.profiles` contiene los datos de aplicación mínimos del MVP: `email`, `full_name`, `avatar_url` y timestamps.
- La sincronización se resuelve con el trigger `on_auth_user_created`, evitando que el frontend o el callback creen perfiles manualmente.

## Diagrama ASCII

```text
Browser
  │ click "Ingresar con Google"
  ▼
Google OAuth
  │ consentimiento / cancelación / error
  ▼
Supabase Auth
  │ exchangeCodeForSession
  ▼
Trigger public.handle_new_user()
  │ inserta o reutiliza public.profiles
  ▼
public.profiles
  │ sesión confirmada
  ▼
/dashboard
```

## Decisión de diseño: trigger vs inserción manual

Se eligió trigger porque:

1. centraliza la creación del perfil junto al alta real del usuario en `auth.users`;
2. elimina condiciones de carrera entre callback, cliente y jobs futuros;
3. permite que login, registro, invitaciones y backoffice reutilicen exactamente la misma garantía de consistencia;
4. con `ON CONFLICT (id) DO NOTHING` evita perfiles duplicados si el mismo usuario reintenta el flujo.

## Schema base del MVP

- `profiles`: identidad visible de la app.
- `groups`: estructura raíz para cenas e invitaciones.
- `group_members`: base de autorización por grupo y roles.
- `events`: esquema inicial para el panel mensual E02.

Este diseño deja listas las dependencias de US-02, US-03 y US-04 sin refactor estructural.

## RLS y aislamiento de datos

- `profiles_self`: cada usuario sólo puede operar sobre su propio perfil.
- `groups_members_only`: sólo miembros del grupo pueden consultar ese grupo.
- `group_members_same_group`: los miembros pueden ver la membresía de sus propios grupos.
- `events` queda con RLS habilitado desde el día uno para endurecer el modelo antes de abrir consultas y escrituras en historias futuras.
