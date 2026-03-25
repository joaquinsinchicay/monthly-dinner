# API Contracts — monthly-dinner

Firmas de inputs y outputs de los Server Actions principales.
Cada action valida `auth.uid()` antes de ejecutar cualquier operación de escritura.
Los tipos referenciados están definidos en `types/index.ts`.

> **Para agentes de IA:** usar estas firmas como contrato al generar Server Actions.
> No inferir inputs ni outputs — respetar los tipos definidos aquí y en `types/index.ts`.

---

## E00 — Creación de grupo

### `createGroup`
```ts
// app/(dashboard)/group/actions.ts
async function createGroup(
  input: {
    name: string
    frequency: 'mensual' | 'quincenal' | 'semanal'
    meeting_day_of_week?: 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado' | 'domingo'  // para frecuencia semanal y quincenal
    meeting_day_of_month?: number  // 1-31, para frecuencia mensual
  }
): Promise<ActionResult<Group>>
```
- Inserta en `groups` con `created_by = auth.uid()`
- El trigger `on_group_created` inserta al creador en `members` como `admin`
- El trigger `on_group_created_invitation` genera el primer `invitation_link`
- Retorna el grupo creado
- **US-00d:** la respuesta `Group` de esta action alimenta directamente la pantalla de confirmación post-creación (`/grupo-creado`). El componente cliente recibe el objeto y lo renderiza sin fetch adicional.
- **Validación:** exactamente uno de `meeting_day_of_week` o `meeting_day_of_month` debe estar presente según la frecuencia:
  - `frequency = 'mensual'` → `meeting_day_of_month` requerido, `meeting_day_of_week` debe ser `undefined`
  - `frequency = 'semanal' | 'quincenal'` → `meeting_day_of_week` requerido, `meeting_day_of_month` debe ser `undefined`

### `revokeInvitationLink`
```ts
async function revokeInvitationLink(
  input: { link_id: string }
): Promise<ActionResult>
```
- Valida que `auth.uid()` sea admin del grupo
- Actualiza `revoked_at = now()` en `invitation_links`

### `generateNewInvitationLink`
```ts
async function generateNewInvitationLink(
  input: { group_id: string }
): Promise<ActionResult<InvitationLink>>
```
- Valida que `auth.uid()` sea admin del grupo
- Inserta un nuevo registro en `invitation_links` con `expires_at = now() + 30 days`

---

## E01 — Acceso & Autenticación

### `joinGroupByToken`
```ts
// app/(auth)/join/actions.ts
async function joinGroupByToken(
  input: { token: string }
): Promise<ActionResult<Group>>
```
- Busca el `invitation_link` por `token`
- Valida que `revoked_at IS NULL` y `expires_at > now()`
- Verifica que el usuario no sea ya miembro (`unique group_id + user_id`)
- Inserta en `members` con `role = 'member'`
- Retorna el grupo al que se unió

### `signOut`
```ts
// app/(auth)/actions.ts
async function signOut(): Promise<ActionResult>
```
- Llama a `supabase.auth.signOut()`
- Redirige a `/`

---

## E02 — Panel de evento mensual

### `createEvent`
```ts
// app/(dashboard)/events/actions.ts
async function createEvent(
  input: {
    group_id: string
    event_date: string     // ISO date: '2026-04-03'
    place?: string
    description?: string
  }
): Promise<ActionResult<Event>>
```
- Valida que `auth.uid()` sea el organizador del mes en `rotation`
- Valida que no exista ya un evento para `group_id + month`
- `month` se calcula como `date_trunc('month', event_date)`
- Inserta en `events` con `status = 'pending'` y `organizer_id = auth.uid()`

### `updateEvent`
```ts
async function updateEvent(
  input: {
    event_id: string
    event_date?: string
    place?: string
    description?: string
  }
): Promise<ActionResult<Event>>
```
- Valida que `auth.uid() = organizer_id` y `status != 'closed'`
- `organizer_id` es inmutable — no permitir su modificación
- Actualiza solo los campos provistos

### `notifyGroup`
```ts
async function notifyGroup(
  input: { event_id: string }
): Promise<ActionResult>
```
- Valida que `auth.uid() = organizer_id`
- Actualiza `status = 'published'` y `notified_at = now()`
- Dispara notificación in-app a todos los miembros del grupo

---

## E03 — Turno rotativo

### `getOrganizerThisMonth`
```ts
// app/(dashboard)/rotation/actions.ts
async function getOrganizerThisMonth(
  input: { group_id: string }
): Promise<ActionResult<RotationWithProfile | null>>
```
- Busca en `rotation` donde `group_id = input.group_id` y `month = date_trunc('month', now())`
- Retorna `null` si no hay organizador asignado para el mes

### `assignNextOrganizer`
```ts
async function assignNextOrganizer(
  input: {
    group_id: string
    user_id: string        // próximo organizador
    month: string          // '2026-05-01'
  }
): Promise<ActionResult<Rotation>>
```
- Valida que `auth.uid()` sea admin del grupo
- Inserta en `rotation` — falla si ya existe un registro para ese `group_id + month`
- Actualiza `notified_at` al notificar al organizador

---

## E04 — Confirmación de asistencia

### `upsertAttendance`
```ts
// app/(dashboard)/events/actions.ts
async function upsertAttendance(
  input: {
    event_id: string
    status: AttendanceStatus   // 'va' | 'no_va' | 'tal_vez'
  }
): Promise<ActionResult<Attendance>>
```
- Valida que el evento no esté `closed`
- Upsert en `attendances` con `member_id = auth.uid()`
- Actualiza `updated_at = now()`

### `getAttendanceSummary`
```ts
async function getAttendanceSummary(
  input: { event_id: string }
): Promise<ActionResult<AttendanceSummary>>
```
- Devuelve confirmaciones agrupadas en `va`, `no_va`, `tal_vez` y `sin_respuesta`
- `sin_respuesta` = miembros del grupo sin registro en `attendances` para ese evento

---

## E05 — Historial de restaurantes

### `closeEvent`
```ts
// app/(dashboard)/events/actions.ts
async function closeEvent(
  input: {
    event_id: string
    restaurant_name?: string   // nullable — puede cerrarse sin nombre
  }
): Promise<ActionResult<RestaurantHistory>>
```
- Valida que `auth.uid() = organizer_id` y `status = 'published'`
- Actualiza `events.status = 'closed'` y `closed_at = now()`
- Inserta en `restaurant_history` con snapshot de `attendee_ids` (miembros con `status = 'va'`)
- `name` puede ser `null`

### `updateRestaurantName`
```ts
async function updateRestaurantName(
  input: {
    history_id: string
    name: string
  }
): Promise<ActionResult<RestaurantHistory>>
```
- Valida que `auth.uid() = created_by`
- Permite agregar el nombre después del cierre si quedó vacío

---

## E06 — Votación de restaurantes

### `createPoll`
```ts
// app/(dashboard)/poll/actions.ts
async function createPoll(
  input: {
    event_id: string
    group_id: string
    closes_at: string          // ISO datetime — debe ser futuro
    options: string[]          // mínimo 2 labels
  }
): Promise<ActionResult<PollWithOptions>>
```
- Valida que `auth.uid()` sea el organizador del evento
- Valida que `closes_at > now()`
- Valida que `options.length >= 2`
- Valida que no exista ya un poll para ese `event_id`
- Inserta en `polls` y en `poll_options` (una por opción)

### `upsertVote`
```ts
async function upsertVote(
  input: {
    poll_id: string
    option_id: string
  }
): Promise<ActionResult<PollVote>>
```
- Valida que `poll.status = 'open'` y `closes_at > now()` — validar en server action, no solo en RLS
- Upsert en `poll_votes` con `user_id = auth.uid()`
- Actualiza `updated_at = now()`

---

## E07 — Checklist del organizador

### `getChecklist`
```ts
// app/(dashboard)/checklist/actions.ts
async function getChecklist(
  input: { event_id: string }
): Promise<ActionResult<ChecklistProgress>>
```
- Valida que `auth.uid() = organizer_id` del evento
- Si no existen items, los instancia desde `checklist_templates` (globales + del grupo)
- Retorna items ordenados por `order_index` con progreso calculado

### `toggleChecklistItem`
```ts
async function toggleChecklistItem(
  input: {
    item_id: string
    status: ChecklistStatus    // 'pending' | 'done'
  }
): Promise<ActionResult<ChecklistItem>>
```
- Valida que `auth.uid()` sea el organizador del evento via `checklist_items → events`
- Actualiza `status` y `completed_at` (null si `status = 'pending'`, `now()` si `done`)

---

*monthly-dinner · API Contracts · MVP v1.0 · Marzo 2026*