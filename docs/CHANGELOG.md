# CHANGELOG
## monthly-dinner

Registro de implementación del MVP — ordenado por fecha de merge a `main`.

> **Para agentes de IA:** leer este archivo antes de implementar cualquier US.
> Indica qué está implementado, qué está en progreso y qué está pendiente.
> No regenerar ni sobreescribir código de US marcadas como `✅ Done`.

---

## Estado actual del MVP

| Total US | Done | In Progress | Pendiente |
|---|---|---|---|
| 19 | 10 | 0 | 9 |

---

## [0.1.1] — 2026-03-24

### Added
- **US-08** Recibir notificación de convocatoria — `lib/actions/attendances.ts`, `components/group/ConvocatoriaNotification.tsx`, `app/(auth)/grupo/[id]/page.tsx`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Notificación recibida con acción directa → `ConvocatoriaNotification` muestra fecha, lugar, descripción y CTA "Confirmar asistencia" cuando `status=published` y el miembro no ha confirmado aún
  - ✅ Recordatorio por falta de respuesta → `isReminder()` detecta ≥48h desde `events.notified_at`; el componente cambia a variante "Recordatorio" (badge rojo, mensaje urgente)
  - ✅ Acceso desde notificación → routing `/dashboard → /grupo/[id]` preexistente garantiza que el usuario llega al panel del evento; `ConvocatoriaNotification` es visible en esa ruta

  **Nota:** Notificaciones in-app only en MVP — no hay push ni email. El "recordatorio único" se implementa como variante visual de la misma card. La acción de confirmación (botón CTA) se completa en US-09.

---

## [0.1.0] — 2026-03-23

### Added
- **US-00** Crear grupo — `app/(auth)/crear-grupo/page.tsx`, `components/group/CreateGroupForm.tsx`, `lib/actions/groups.ts`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Creación exitosa → INSERT a `groups`, trigger asigna admin en `members`, redirect a `/grupo/[id]`
  - ✅ Nombre obligatorio → validación server-side, error inline, formulario no se limpia
  - ✅ Nombre duplicado mismo usuario → query `ilike` + mensaje con sugerencia
  - ✅ Visibilidad → RLS `groups: select members` garantiza aislamiento por grupo

- **US-04** Join por invitación — `app/join/[token]/page.tsx`, `components/join/JoinGroupView.tsx`, `lib/actions/join.ts`, `supabase/migrations/20260323_get_invitation_link_by_token.sql`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Join con cuenta nueva → OAuth con `next=/join/TOKEN` → callback preserva token → `joinGroup()` → INSERT members
  - ✅ Join con cuenta existente → `JoinGroupView` con botón "Unirme" → `joinGroup()` → INSERT members
  - ✅ Link expirado/inválido → UI de error con mensaje claro e instrucción para pedir nuevo link
  - ✅ Ya miembro → Server Component detecta membership y redirige a `/grupo/[id]` sin duplicar

  **Nota:** Requiere ejecutar `supabase/migrations/20260323_get_invitation_link_by_token.sql` en Supabase antes de deployar.

- **US-01** Registro con Google — `app/auth/login/page.tsx`, `components/auth/GoogleSignInButton.tsx`, `lib/actions/auth.ts`, `app/auth/callback/route.ts`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Registro exitoso → `signInWithOAuth` → trigger `handle_new_user()` crea perfil → `/auth/callback` → `/dashboard`
  - ✅ Email ya registrado → Supabase maneja nativamente: misma cuenta inicia sesión sin duplicar
  - ✅ Cancelación OAuth → `/auth/callback` detecta `error`/ausencia de `code` → redirect a `/auth/login` sin error crítico

- **US-00b** Generar link de invitación — `app/(auth)/grupo/[id]/page.tsx`, `components/group/InvitationLinkPanel.tsx`, `lib/actions/invitation-links.ts`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Link generado automáticamente → trigger DB `on_group_created_invitation` + redirect a `/grupo/[id]` post-creación
  - ✅ Link copiado al portapapeles → `navigator.clipboard` + confirmación visual "¡Copiado!" por 2s
  - ✅ Link reutilizable con expiración → `getInvitationLinkStatus()` detecta expirado, admin puede generar nuevo
  - ✅ Revocar link activo → `UPDATE revoked_at`, UI refleja estado sin link

- **US-07** Ver estado del evento en tiempo real — `lib/actions/events.ts`, `components/group/AttendanceSummary.tsx`, `components/group/EventPanel.tsx`, `app/(auth)/grupo/[id]/page.tsx`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Panel con evento activo → fecha, lugar, organizador (OrganizerPanel) y conteos va/no_va/tal_vez
  - ✅ Panel sin evento activo → "La cena de este mes aún no fue convocada" (EventPanel empty state)
  - ✅ Actualización en tiempo real → `supabase.channel()` en `AttendanceSummary`, re-fetch en cada INSERT/UPDATE/DELETE de `attendances`

  **Nota:** Habilitar realtime en Supabase → Database → Replication:
  ```sql
  alter publication supabase_realtime add table attendances;
  alter publication supabase_realtime add table events;
  ```

- **US-06** Notificar al grupo — `lib/actions/events.ts`, `components/group/NotifyButton.tsx`, `components/group/EventForm.tsx`, `components/group/EventPanel.tsx`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Notificación enviada al publicar → `publishEvent` sets `status=published` + `notified_at=now()`, botón en EventPanel cuando `status=pending`
  - ✅ Miembro sin notificaciones activas → el evento aparece en el panel al abrir la app (RLS members, in-app only per technical-decisions.md)
  - ✅ Re-notificación por cambio de datos → checkbox "Notificar al grupo sobre los cambios" en EventForm para eventos publicados, `updateEvent` setea `notified_at` si `notify=true`

- **US-05** Crear evento del mes — `lib/actions/events.ts`, `components/group/EventForm.tsx`, `components/group/EventPanel.tsx`, `app/(auth)/grupo/[id]/page.tsx`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Creación exitosa → validación de organizador via rotation, INSERT separado, estado `pending`, visible para miembros
  - ✅ Campos obligatorios vacíos → `event_date` requerida, error inline, form no se limpia
  - ✅ Evento ya existente en el mes → check previo al INSERT, mensaje con opción de editar
  - ✅ Edición posterior → `updateEvent` valida organizer_id inmutable + status ≠ closed, `<details>` inline en el panel

- **US-11** Ver organizador del mes — `lib/actions/rotation.ts`, `components/group/OrganizerPanel.tsx`, `app/(auth)/grupo/[id]/page.tsx`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Organizador visible en el panel → nombre del organizador del mes actual destacado en la card
  - ✅ El organizador soy yo → indicación "Te toca organizar" con badge + próximo paso hacia el evento
  - ✅ Sin organizador asignado → mensaje "El turno de este mes aún no fue asignado"

- **US-03** Cerrar sesión — `components/auth/SignOutButton.tsx`, `lib/actions/auth.ts`, `app/(auth)/grupo/[id]/page.tsx`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Cierre de sesión exitoso → `signOut()` invalida sesión en Supabase → redirect a `/`
  - ✅ Confirmación antes de cerrar → bottom sheet glassmorphism con "Sí, cerrar sesión" / "Cancelar"
  - ✅ Datos locales limpios → `supabase.auth.signOut()` limpia cookies/tokens; próximo usuario no ve datos anteriores

### Fixed (Supabase RLS)

- **RLS recursión infinita en `members`** — `"members: select same group"` usaba subquery sobre la misma tabla → error `42P17`. Reemplazada por función `is_group_member(uuid, uuid)` con `security definer`. Ver `docs/architecture/technical-decisions.md`.

- **Orden de creación de tablas** — FK circular entre `groups` y `members` requiere crear `groups` sin políticas, luego `members` con políticas, luego agregar políticas a `groups`. Documentado en `technical-decisions.md`.

- **Usuario sin fila en `profiles`** — trigger `handle_new_user()` no existía al momento del primer registro. El INSERT a `groups` fallaba con `42501` por FK violation en `created_by`. Solución: SQL de sincronización retroactiva + trigger con `on conflict do nothing`.

- **Post-login routing** — agregado `app/(dashboard)/dashboard/page.tsx` como smart redirect: si tiene grupo → `/grupo/[id]`, si no → `/onboarding`. Eliminado duplicado en `app/(auth)/dashboard/page.tsx` (conflicto de rutas, error build).

- **Pantalla onboarding** — `app/(auth)/onboarding/page.tsx` + `components/onboarding/OnboardingView.tsx`: dos opciones post-login para usuarios sin grupo — crear grupo o pegar link de invitación.

---

## [Unreleased] — En desarrollo

### Pendiente de implementación

| # | ID | User Story | Épica | Esfuerzo | Estado |
|---|---|---|---|---|---|
| 1 | US-00 | Crear grupo | E00 Creación de grupo | M (3-4d) | ✅ Done |
| 2 | US-00b | Generar link de invitación al crear el grupo | E00 Creación de grupo | S (1-2d) | ✅ Done |
| 3 | US-01 | Registro con Google | E01 Acceso & Autenticación | S (1-2d) | ✅ Done |
| 4 | US-02 | Login con Google | E01 Acceso & Autenticación | S (1-2d) | ⬜ Pendiente |
| 5 | US-04 | Join por invitación | E01 Acceso & Autenticación | M (3-4d) | ⬜ Pendiente |
| 6 | US-03 | Cerrar sesión | E01 Acceso & Autenticación | XS (<1d) | ✅ Done |
| 7 | US-11 | Ver organizador del mes | E03 Turno rotativo | S (1-2d) | ✅ Done |
| 8 | US-05 | Crear evento del mes | E02 Panel de evento | S (1-2d) | ✅ Done |
| 9 | US-06 | Notificar al grupo | E02 Panel de evento | M (3-4d) | ✅ Done |
| 10 | US-07 | Ver estado del evento en tiempo real | E02 Panel de evento | S (1-2d) | ✅ Done |
| 11 | US-08 | Recibir notificación de convocatoria | E04 Confirmación | M (3-4d) | ✅ Done |
| 12 | US-09 | Confirmar asistencia | E04 Confirmación | S (1-2d) | ⬜ Pendiente |
| 13 | US-10 | Ver resumen de confirmaciones | E04 Confirmación | S (1-2d) | ⬜ Pendiente |
| 14 | US-17 | Abrir votación de restaurantes | E06 Votación | M (3-4d) | ⬜ Pendiente |
| 15 | US-18 | Votar por un restaurante | E06 Votación | S (1-2d) | ⬜ Pendiente |
| 16 | US-14 | Cargar restaurante al cerrar evento | E05 Historial | S (1-2d) | ⬜ Pendiente |
| 17 | US-16 | Consultar historial de restaurantes | E05 Historial | S (1-2d) | ⬜ Pendiente |
| 18 | US-13 | Próximo organizador tras el cierre | E03 Turno rotativo | M (3-4d) | ⬜ Pendiente |
| 19 | US-20 | Acceder al checklist del mes | E07 Checklist | M (3-4d) | ⬜ Pendiente |

---

## Cómo actualizar este archivo

Al completar una US, moverla al bloque de la versión correspondiente con el formato:

```markdown
## [0.1.0] — YYYY-MM-DD

### Added
- **US-00** Crear grupo — `app/(auth)/create-group/`, `lib/supabase/groups.ts`
- **US-00b** Generar link de invitación — `app/(auth)/create-group/`, `lib/supabase/invitation-links.ts`
```

### Estados válidos

| Emoji | Estado | Significado |
|---|---|---|
| ⬜ | Pendiente | No iniciada |
| 🔄 | In Progress | En desarrollo en rama activa |
| ✅ | Done | Mergeada a `main`, todos los CA Gherkin cubiertos |
| 🚫 | Blocked | Se intentó implementar fuera de orden — su dependencia directa no está `✅ Done` |

### Reglas para agentes de IA

- Implementar siempre siguiendo el orden numérico de la tabla — no saltar US.
- La próxima US a implementar es siempre la primera `⬜ Pendiente` de la tabla, en orden.
- Una US es `✅ Done` **solo si todos sus escenarios Gherkin están cubiertos** — no solo el happy path.
- Al iniciar una US, cambiar su estado a `🔄 In Progress` en este archivo.
- Al completar una US, moverla al bloque de versión con fecha y archivos modificados.
- Marcar una US como `🚫 Blocked` solo si se detecta que su dependencia directa no está `✅ Done` y no es posible continuar — no como estado preventivo.

---

## Formato de versiones

El proyecto sigue [Semantic Versioning](https://semver.org/):

- `0.x.0` — iteraciones del MVP (cada épica completa sube el minor)
- `0.0.x` — fixes y ajustes dentro de una épica
- `1.0.0` — MVP completo con las 19 US en producción

---

*monthly-dinner · MVP v1.0 · Marzo 2026*