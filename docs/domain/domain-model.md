# Domain Model — monthly-dinner

Fuente de verdad del modelo de dominio. Este documento NO se contradice con el schema SQL.
Ante cualquier discrepancia entre este archivo y `schema.sql`, el schema tiene precedencia.

---

## Entidades principales

### User (profiles)
- id (uuid = auth.uid())
- email
- full_name
- avatar_url
- created_at
- updated_at

---

### Group (groups)
- id
- name
- created_by (user_id)
- created_at
- updated_at

---

### Membership (members)
- id
- user_id
- group_id
- role: `admin` | `member`
- joined_at

> ⚠️ `organizer` NO es un rol de membresía. El organizador del mes es el miembro
> cuyo `user_id` aparece en `rotation` para el `month` actual. No modificar el enum.

Relación:
- 1 User → N Groups (via members)
- 1 Group → N Users (via members)

---

### InvitationLink (invitation_links)
- id
- group_id
- token (generado automáticamente, único)
- created_by (user_id)
- expires_at (default: 30 días desde creación)
- revoked_at (null = activo)
- created_at

> El estado se deriva: `revoked_at IS NOT NULL` → revocado / `expires_at < now()` → expirado / resto → activo.
> No hay columna `status` — se calcula en query.

---

### Rotation (rotation)
- id
- group_id
- user_id (organizador asignado)
- month (date — primer día del mes, ej: `2026-04-01`)
- notified_at (timestamptz — cuándo se notificó al organizador)
- created_at

> Un registro por mes por grupo. `month` + `group_id` es unique.
> No hay columna `position` ni `is_active`.

Relación:
- 1 Group → N Rotation records (uno por mes)

---

### Event (events)
- id
- group_id
- organizer_id (user_id)
- month (date — primer día del mes, ej: `2026-04-01`)
- status: `pending` | `published` | `closed`
- event_date (date — día exacto de la cena)
- place (text)
- description (text, opcional)
- notified_at (timestamptz — cuándo se notificó al grupo)
- closed_at (timestamptz)
- created_at
- updated_at

> Un solo evento activo por grupo por mes. `group_id` + `month` es unique.

Relación:
- 1 Group → N Events
- 1 Event → 1 Organizer (User via organizer_id)

---

### Attendance (attendances)
- id
- event_id
- member_id (user_id)
- status: `va` | `no_va` | `tal_vez`
- updated_at

> ⚠️ Los valores del enum son exactamente `va`, `no_va`, `tal_vez` en español.
> No usar `yes`, `no`, `maybe` ni ninguna otra variante.

Relación:
- 1 Event → N Attendances
- 1 User → 1 Attendance por Event (unique event_id + member_id)

---

### Poll (polls)
- id
- event_id
- group_id
- created_by (user_id = organizer_id del evento)
- status: `open` | `closed`
- closes_at (timestamptz)
- closed_at (timestamptz)
- created_at

> Un solo poll por evento (unique event_id).

---

### PollOption (poll_options)
- id
- poll_id
- label (text)
- created_at

> Mínimo 2 opciones por poll (validación en server action, no en DB constraint).

---

### PollVote (poll_votes)
- id
- poll_id
- option_id
- user_id
- created_at
- updated_at

> 1 voto por usuario por poll (unique poll_id + user_id). Modificable antes del cierre.

Relación:
- 1 Poll → N PollOptions
- 1 Poll → N PollVotes
- 1 User → 1 PollVote por Poll

---

### RestaurantHistory (restaurant_history)
- id
- event_id
- group_id
- name (text, nullable — puede cerrarse sin restaurante registrado)
- visited_at (date)
- attendee_ids (uuid[] — snapshot de asistentes confirmados al momento del cierre)
- created_by (user_id = organizer_id del evento)
- created_at
- updated_at

> Un registro por evento (unique event_id).

Relación:
- 1 Event → 0..1 RestaurantHistory

---

### ChecklistTemplate (checklist_templates)
- id
- group_id (nullable — null = template global del sistema)
- label
- description
- order_index
- global (boolean)
- created_at

---

### ChecklistItem (checklist_items)
- id
- event_id
- template_id (nullable — referencia al template origen)
- label
- status: `pending` | `done`
- order_index
- completed_at (timestamptz)
- created_at
- updated_at

Relación:
- 1 Event → N ChecklistItems
- 1 ChecklistTemplate → N ChecklistItems

---

## Reglas de dominio

- Un usuario **solo accede a datos de sus grupos** — garantizado por RLS en todas las tablas.
- Un evento pertenece a **un solo grupo**.
- Solo hay **1 evento activo por grupo por mes** — unique constraint en `(group_id, month)`.
- Un usuario tiene **1 estado de asistencia por evento** — unique constraint en `(event_id, member_id)`.
- Un usuario tiene **1 voto por votación** — unique constraint en `(poll_id, user_id)`.
- El organizador es el miembro en `rotation` para el `month` actual — no un rol de membresía.
- Un link de invitación expirado o revocado no puede usarse para hacer join.

---

## Relaciones críticas

```
User ↔ Membership ↔ Group
Group → Rotation → User (organizador del mes)
Group → Event → Attendance (va | no_va | tal_vez)
Event → Poll → PollOption → PollVote
Event → RestaurantHistory
Event → ChecklistItem ← ChecklistTemplate
```

---

*monthly-dinner · Domain Model · Marzo 2026*