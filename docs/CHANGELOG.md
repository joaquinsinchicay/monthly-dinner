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
| 21 | 21 | 0 | 0 |

> **MVP completo** — todas las US implementadas.

---

## [0.2.8] — 2026-03-25

### Added
- **US-00d** Pantalla de confirmación post-creación de grupo — `app/(auth)/grupo-creado/[id]/page.tsx`, `components/group/GroupCreatedView.tsx`, `components/group/CreateGroupForm.tsx`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Redirección automática tras crear el grupo → `CreateGroupForm` usa `router.replace('/grupo-creado/[id]')` en lugar de `router.push`
  - ✅ No puedo volver con el botón atrás → `router.replace` reemplaza la entrada del historial del formulario
  - ✅ Resumen del grupo visible → nombre, frecuencia capitalizada, día formateado con `formatDay()` (mensual: "Día X de cada mes" / semanal: "Todos los [día]" / quincenal: "Cada dos [día]")
  - ✅ Mensaje de bienvenida al rol de admin → badge "Administrador" + párrafo explicando gestión de invitaciones, fechas y lugares
  - ✅ Próximos pasos visibles → "Invitar miembros" y "Configurar rotación", cada uno con descripción breve
  - ✅ Navegación al dashboard → botón "Ir al Dashboard" → `router.push('/grupo/[id]')`
  - ✅ Acceso directo por URL bloqueado → `page.tsx` verifica `created_at`: si el grupo tiene más de 10 minutos → `redirect('/grupo/[id]')`

---

## [0.2.7] — 2026-03-25

### Added
- **US-00c** Configurar frecuencia y día al crear el grupo — `types/index.ts`, `lib/actions/groups.ts`, `components/group/CreateGroupForm.tsx`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Frecuencia mensual muestra días del mes → selector numérico 1–31 renderizado cuando `frequency === 'mensual'`
  - ✅ Frecuencia semanal muestra días de la semana → `DAYS_OF_WEEK` renderizado cuando `frequency === 'semanal'`
  - ✅ Frecuencia quincenal muestra días de la semana → mismo bloque `else` cubre `quincenal` y `semanal`
  - ✅ Campos obligatorios — frecuencia y día → `handleSubmit` valida `!dayValue` con error inline; server action valida antes del INSERT
  - ✅ Mensaje informativo visible al cargar → `<p>` siempre visible al pie del formulario (no condicional)
  - ✅ Datos guardados con el grupo → INSERT incluye `frequency` + `meeting_day_of_month` o `meeting_day_of_week`; SELECT devuelve los tres campos

  **Nota:** Requiere ejecutar el ALTER TABLE en Supabase antes de deployar:
  ```sql
  ALTER TABLE groups
    ADD COLUMN frequency text NOT NULL DEFAULT 'mensual'
      CHECK (frequency IN ('mensual', 'quincenal', 'semanal')),
    ADD COLUMN meeting_day_of_week text
      CHECK (meeting_day_of_week IN ('lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo')),
    ADD COLUMN meeting_day_of_month integer
      CHECK (meeting_day_of_month BETWEEN 1 AND 31);

  ALTER TABLE groups
    ADD CONSTRAINT meeting_day_consistency CHECK (
      (frequency = 'mensual' AND meeting_day_of_month IS NOT NULL AND meeting_day_of_week IS NULL) OR
      (frequency IN ('semanal', 'quincenal') AND meeting_day_of_week IS NOT NULL AND meeting_day_of_month IS NULL)
    );
  ```

---

## [0.2.6] — 2026-03-24

### Verificado (no requirió código nuevo)
- **US-02** Login con Google — ya implementada como parte de US-01 (infraestructura OAuth)

  Todos los escenarios Gherkin cubiertos:
  - ✅ Login exitoso → `GoogleSignInButton` llama `signInWithGoogle` → redirect OAuth de Google → `app/auth/callback/route.ts` intercambia el código por sesión → `redirect('/dashboard')`
  - ✅ Sesión persistente → `app/auth/login/page.tsx` llama `supabase.auth.getUser()` al renderizar; si hay sesión activa hace `redirect('/dashboard')` sin mostrar el login. El middleware replica la misma lógica para rutas protegidas
  - ✅ Token expirado → `middleware.ts` llama `supabase.auth.getUser()` en cada request; si no hay usuario en ruta no pública, redirige a `/` (landing/login)

---

## [0.2.5] — 2026-03-24

### Added
- **US-20** Acceder al checklist del mes — `supabase/migrations/20260324_checklist_global_templates.sql`, `lib/actions/checklist.ts`, `components/group/ChecklistPanel.tsx`, `app/(auth)/grupo/[id]/page.tsx`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Checklist disponible al ser asignado → `getOrCreateChecklist` crea 5 items desde templates globales al primer acceso; `ChecklistPanel` muestra tareas ordenadas por `order_index` + barra de progreso `X/N` con gradiente azul
  - ✅ Tarea completada → `toggleChecklistItem` actualiza `status='done'` + `completed_at`; optimistic update inmediato; label tachado; progreso se recalcula; siguiente tarea se habilita (lógica secuencial: `items[idx-1].status === 'done'`)
  - ✅ Checklist no disponible para no organizadores → `ChecklistPanel` con `isOrganizer=false` muestra "El checklist está disponible únicamente para el organizador del mes"
  - ✅ Retomar checklist incompleto → `getOrCreateChecklist` detecta items existentes (`existing.length > 0`) y los devuelve sin recrear; `initialItems` prop hidrata el estado inicial sin flicker

---

## [0.2.4] — 2026-03-24

### Added
- **US-13** Próximo organizador tras el cierre — `supabase/migrations/20260324_assign_next_rotation.sql`, `lib/actions/rotation.ts`, `lib/actions/restaurant.ts`, `components/group/OrganizerPanel.tsx`, `app/(auth)/grupo/[id]/page.tsx`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Siguiente organizador visible tras el cierre → `assign_next_rotation` (security definer) se llama al cerrar el evento; `getNextOrganizer` consulta `rotation` para el próximo mes; `OrganizerPanel` muestra `NextOrganizerBadge` con nombre y mes
  - ✅ Notificación al próximo organizador → badge in-app en `OrganizerPanel`: "Te toca organizar el próximo mes" (si soy yo) o "Organiza [nombre]" (si es otro); visible inmediatamente tras el cierre del evento
  - ✅ Rotación completa reinicia el ciclo → lógica modular en SQL: `v_next_index := (v_last_index % array_length(v_members, 1)) + 1`; cuando el último organiza, el índice vuelve al primero

---

## [0.2.3] — 2026-03-24

### Added
- **US-16** Consultar historial de restaurantes — `lib/actions/restaurant.ts`, `components/group/RestaurantHistory.tsx`, `app/(auth)/grupo/[id]/page.tsx`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Historial con registros → `getRestaurantHistory` devuelve entradas ordenadas por `visited_at` desc con nombres de asistentes resueltos desde `profiles`; cada card muestra nombre, fecha y pills de asistentes
  - ✅ Historial vacío → `entries.length === 0` → card con &ldquo;Todavía no hay cenas registradas&rdquo;
  - ✅ Búsqueda → input con `useState` filtra `entries` por `name` case-insensitive; muestra &ldquo;No hay resultados&rdquo; cuando no hay matches

---

## [0.2.2] — 2026-03-24

### Added
- **US-14** Cargar restaurante al cerrar evento — `lib/actions/restaurant.ts`, `components/group/CloseEventForm.tsx`, `components/group/EventPanel.tsx`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Restaurante cargado al cerrar → `closeEvent` INSERT `restaurant_history` con snapshot `attendee_ids` (va) + UPDATE `events.status='closed'`; `router.refresh()` actualiza la vista
  - ✅ Restaurante ya en el historial → check `ilike` en `restaurant_history` del grupo → devuelve `alreadyVisited`; `CloseEventForm` muestra advertencia con fecha anterior + "Confirmar igual" (re-envío con `force=true`)
  - ✅ Cierre sin restaurante → campo opcional; `name=null` en `restaurant_history`; nota en el form avisa "Sin restaurante registrado"

---

## [0.2.1] — 2026-03-24

### Added
- **US-18** Votar por un restaurante — `lib/actions/polls.ts`, `components/group/PollVoting.tsx`, `components/group/PollPanel.tsx`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Voto registrado → `castVote` UPSERT INSERT; actualización optimista inmediata; porcentajes visibles tras votar; realtime actualiza cuando otro miembro vota
  - ✅ Cambio de voto dentro del plazo → misma UI, `castVote` UPSERT UPDATE; barra de porcentaje se recalcula
  - ✅ Intento de votar fuera del plazo → `castVote` rechaza si `status=closed` o `closes_at` en el pasado; UI con botones deshabilitados y resultado final siempre visible
  - ✅ Miembro que no votó antes del cierre → `!open && !userVoted` → badge "No participaste en esta votación"; resultado final visible

  **Nota:** Requiere habilitar realtime para `poll_votes` en Supabase:
  ```sql
  alter publication supabase_realtime add table poll_votes;
  ```

---

## [0.2.0] — 2026-03-24

### Added
- **US-17** Abrir votación de restaurantes — `lib/actions/polls.ts`, `components/group/PollForm.tsx`, `components/group/PollPanel.tsx`, `app/(auth)/grupo/[id]/page.tsx`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Votación creada exitosamente → `createPoll` INSERT poll + opciones, `status='open'`; `PollPanel` visible para todos los miembros (notificación in-app); `router.refresh()` actualiza la vista
  - ✅ Menos de 2 opciones → validación client-side en `PollForm` + server-side en `createPoll`; error inline; form no se limpia
  - ✅ Fecha de cierre en el pasado → input con `min=tomorrow` en UI + validación `closesAtDate <= new Date()` en server action; error inline
  - ✅ Solo una votación activa por evento → check previo al INSERT; error "Ya existe... Podés editarla"; `PollPanel` muestra aviso al organizador cuando ya hay poll activo

---

## [0.1.3] — 2026-03-24

### Added
- **US-10** Ver resumen de confirmaciones — `lib/actions/attendances.ts`, `components/group/AttendanceSummaryDetailed.tsx`, `components/group/EventPanel.tsx`, `docs/architecture/schema.sql`, `supabase/migrations/20260324_profiles_select_group_members.sql`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Resumen completo visible → `AttendanceSummaryDetailed` muestra nombres por categoría (Van / Tal vez / No van) como pills coloreados + sección "Sin responder" cuando aplica. Solo visible para el organizador
  - ✅ Todos confirmaron → `sin_responder.length === 0` oculta la sección y muestra badge verde "Todos respondieron"
  - ✅ Compartir resumen → botón genera texto formateado con emoji + categorías + nombres, `navigator.clipboard.writeText()`, feedback visual "¡Copiado!" por 2s

  **Nota:** Requiere ejecutar `supabase/migrations/20260324_profiles_select_group_members.sql` en Supabase antes de deployar. Agrega la política `"profiles: select group members"` necesaria para leer nombres de otros miembros.

---

## [0.1.2] — 2026-03-24

### Added
- **US-09** Confirmar asistencia — `lib/actions/attendances.ts`, `components/group/ConfirmAttendanceButtons.tsx`, `components/group/ConvocatoriaNotification.tsx`, `components/group/EventPanel.tsx`, `app/(auth)/grupo/[id]/page.tsx`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Confirmación exitosa → `ConfirmAttendanceButtons` en `ConvocatoriaNotification` (primera vez sin fila previa) → `upsertAttendance` INSERT, `router.refresh()` actualiza la página
  - ✅ Cambio de estado → sección "Tu respuesta" en `EventPanel` con `ConfirmAttendanceButtons` cuando `userAttendance` existe → UPSERT actualiza la fila existente; `AttendanceSummary` refleja el cambio vía realtime
  - ✅ Estado "Tal vez" → mismo flujo con `status='tal_vez'`, badge azul para el estado seleccionado
  - ✅ Confirmación después del evento → `upsertAttendance` rechaza si `status=closed`; UI muestra `ReadOnlyBadge` sin botones

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

### Estado de implementación

| # | ID | User Story | Épica | Esfuerzo | Estado |
|---|---|---|---|---|---|
| 1 | US-00 | Crear grupo | E00 Creación de grupo | M (3-4d) | ✅ Done |
| 2 | US-00b | Generar link de invitación al crear el grupo | E00 Creación de grupo | S (1-2d) | ✅ Done |
| 3 | US-00c | Configurar frecuencia y día al crear el grupo | E00 Creación de grupo | S (1-2d) | ✅ Done |
| 4 | US-00d | Pantalla de confirmación post-creación de grupo | E00 Creación de grupo | S (1-2d) | ✅ Done |
| 5 | US-01 | Registro con Google | E01 Acceso & Autenticación | S (1-2d) | ✅ Done |
| 6 | US-02 | Login con Google | E01 Acceso & Autenticación | S (1-2d) | ✅ Done |
| 7 | US-04 | Join por invitación | E01 Acceso & Autenticación | M (3-4d) | ✅ Done |
| 8 | US-03 | Cerrar sesión | E01 Acceso & Autenticación | XS (<1d) | ✅ Done |
| 9 | US-11 | Ver organizador del mes | E03 Turno rotativo | S (1-2d) | ✅ Done |
| 10 | US-05 | Crear evento del mes | E02 Panel de evento | S (1-2d) | ✅ Done |
| 11 | US-06 | Notificar al grupo | E02 Panel de evento | M (3-4d) | ✅ Done |
| 12 | US-07 | Ver estado del evento en tiempo real | E02 Panel de evento | S (1-2d) | ✅ Done |
| 13 | US-08 | Recibir notificación de convocatoria | E04 Confirmación | M (3-4d) | ✅ Done |
| 14 | US-09 | Confirmar asistencia | E04 Confirmación | S (1-2d) | ✅ Done |
| 15 | US-10 | Ver resumen de confirmaciones | E04 Confirmación | S (1-2d) | ✅ Done |
| 16 | US-17 | Abrir votación de restaurantes | E06 Votación | M (3-4d) | ✅ Done |
| 17 | US-18 | Votar por un restaurante | E06 Votación | S (1-2d) | ✅ Done |
| 18 | US-14 | Cargar restaurante al cerrar evento | E05 Historial | S (1-2d) | ✅ Done |
| 19 | US-16 | Consultar historial de restaurantes | E05 Historial | S (1-2d) | ✅ Done |
| 20 | US-13 | Próximo organizador tras el cierre | E03 Turno rotativo | M (3-4d) | ✅ Done |
| 21 | US-20 | Acceder al checklist del mes | E07 Checklist | M (3-4d) | ✅ Done |

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
- `1.0.0` — MVP completo con las 21 US en producción

---

*monthly-dinner · MVP v1.0 · Marzo 2026*