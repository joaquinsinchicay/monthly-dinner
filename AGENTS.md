# AGENTS.md

## Propósito del producto

monthly-dinner es una app mobile-first para coordinar cenas mensuales grupales. Reemplaza la coordinación por WhatsApp con una experiencia simple, autenticada y preparada para crecer en eventos, votaciones, historial y checklist.

## Stack tecnológico y justificación

- **Next.js 14 App Router**: routing file-based, Server Components por defecto y buen soporte para despliegue en Vercel.
- **TypeScript estricto**: contrato fuerte entre UI, auth, middleware y schema.
- **Supabase**: Postgres relacional, Auth con Google OAuth, cookies SSR y RLS en la misma plataforma.
- **Tailwind CSS + primitives estilo shadcn/ui**: velocidad para construir UI consistente sin intervención de diseño dedicada.
- **Vercel + GitHub**: deploy automático sin carga DevOps manual.

## Schema base de datos (14 tablas)

1. `profiles`: `id uuid`, `email text unique`, `full_name text`, `avatar_url text`, `display_name text`, `created_at timestamptz`, `updated_at timestamptz`.
2. `groups`: `id uuid`, `name text`, `created_by uuid`, `created_at timestamptz`.
3. `members`: `id uuid`, `group_id uuid`, `user_id uuid`, `full_name text`, `avatar_url text`, `role text`, `joined_at timestamptz`, `unique(group_id, user_id)`.
4. `invitation_links`: `id uuid`, `group_id uuid`, `token text unique`, `created_by uuid`, `expires_at timestamptz`, `revoked boolean`, `created_at timestamptz`.
5. `events`: `id uuid`, `group_id uuid`, `organizer_id uuid`, `title text`, `event_date date`, `event_year integer`, `event_month integer`, `location text`, `description text`, `status text`, `restaurant_name text`, `created_at timestamptz`, `updated_at timestamptz`.
6. `attendances`: `id uuid`, `event_id uuid`, `member_id uuid`, `status text`, `updated_at timestamptz`, `unique(event_id, member_id)`.
7. `rotation`: `id uuid`, `group_id uuid`, `user_id uuid`, `order_index integer`, `cycle integer`, `month date`, `is_current boolean`, `unique(group_id, month)`.
8. `polls`: `id uuid`, `event_id uuid`, `created_by uuid`, `closes_at timestamptz`, `status text`, `created_at timestamptz`.
9. `poll_options`: `id uuid`, `poll_id uuid`, `label text`, `created_at timestamptz`.
10. `poll_votes`: `id uuid`, `poll_id uuid`, `option_id uuid`, `user_id uuid`, `voted_at timestamptz`, `unique(poll_id, user_id)`.
11. `restaurant_history`: `id uuid`, `group_id uuid`, `event_id uuid`, `restaurant_name text`, `visited_at date`, `attendees_count integer`, `created_by uuid nullable`, `created_at timestamptz`.
12. `checklist_templates`: `id uuid`, `group_id uuid nullable`, `label text`, `order_index integer`, `is_active boolean`.
13. `checklist_items`: `id uuid`, `event_id uuid`, `template_id uuid nullable`, `label text`, `order_index integer`, `is_done boolean`, `completed_at timestamptz`.
14. `notifications`: `id uuid`, `group_id uuid`, `event_id uuid`, `user_id uuid`, `type text`, `is_read boolean`, `created_at timestamptz`.

## RLS resumido por tabla

- `profiles`: cada usuario inserta, consulta y actualiza solo su propio perfil.
- `groups`: el creador administra; los miembros consultan sus grupos.
- `members`: inserción/actualización propia; lectura solo dentro de grupos compartidos.
- `invitation_links`: admins crean/actualizan; miembros del grupo consultan.
- `events`: organizer crea/actualiza; miembros del grupo consultan.
- `attendances`: cada usuario gestiona su asistencia; miembros del grupo consultan.
- `rotation`: admins gestionan; miembros consultan.
- `polls` y `poll_options`: organizer del evento gestiona; miembros consultan.
- `poll_votes`: cada usuario gestiona su voto; miembros del grupo consultan.
- `restaurant_history`: organizer del evento inserta; miembros consultan.
- `checklist_templates`: admin del grupo gestiona o plantilla global; miembros consultan plantillas globales o de su grupo.
- `checklist_items`: organizer del evento consulta y gestiona.
- `notifications`: el organizer del evento asociado inserta; cada usuario consulta y actualiza solo sus propias notificaciones.

## Design system

- Tokens en `app/globals.css` y `tailwind.config.ts`.
- Tipografías: DM Serif Display para títulos, DM Sans para body.
- Cards: sin borde, `rounded-2xl`, sombra con `--shadow`.
- Botón primary: gradiente de `--primary` a `--primary-cont`, `rounded-full`.
- Botón secondary: `surface-high`, sin borde.
- Inputs: `surface-low`, sin borde en reposo, foco con 2px `primary`.
- Labels: uppercase + tracking.
- Bottom nav: glassmorphism con opacidad y blur.
- Mobile-first: preferir sheets desde abajo; evitar modales centrados cuando no sean confirmaciones breves.
- Nunca usar `hr`; separar con espacio y tono de fondo.

## Backlog MVP (17 US)

- E01 US-01 Registro con Google — **Done**.
- E01 US-02 Login con Google — **Done**.
- E01 US-03 Cerrar sesión — **Done**.
- E01 US-04 Join por invitación — **Done**.
- E00 US-21 Crear grupo — **Completada**.
- E02 US-05 Crear evento del mes — **Completada**.
- E02 US-06 Notificar al grupo — **Completada**.
- E02 US-07 Ver estado del evento en tiempo real — **Completada**.
- E03 US-08 Crear evento mensual — Pending.
- E03 US-09 Publicar evento — Pending.
- E03 US-10 Confirmar asistencia — Pending.
- E04 US-11 Gestionar rotación — Pending.
- E04 US-12 Ver responsable del mes — Pending.
- E05 US-13 Crear votación — Pending.
- E05 US-14 Votar restaurante — Pending.
- E06 US-15 Registrar historial — Pending.
- E06 US-16 Consultar historial — Pending.
- E07 US-17 Checklist compartida — Pending.

## Convenciones de código

- TypeScript estricto y sin `any`.
- Server Components por defecto; `"use client"` solo cuando sea imprescindible.
- Consultas a Supabase desde server o route handlers; cliente solo para estado estrictamente local como sign-out.
- Actualizar `types/database.ts` en el mismo cambio que cualquier modificación del schema.
- Mantener `middleware.ts` como contrato de rutas públicas y protegidas.

## Lo que nunca hay que hacer

- No usar `select(*)`; listar columnas explícitas.
- No usar bordes sólidos de 1px como separadores de contenido.
- No hardcodear IDs de grupos, usuarios o eventos.
- No crear `.env.local` en el repositorio.
- No romper el contrato del schema sin migración explícita.

## Arquitectura de onboarding

- Post-login: `login -> /api/auth/callback -> verificar members -> /dashboard | /onboarding`.
- `/onboarding` y `/onboarding/new-group` requieren sesión activa, pero no membresía previa.
- La creación de grupo inserta `groups` y luego `members` desde la Server Action usando `user.id` obtenido en el servidor de Next.js.
