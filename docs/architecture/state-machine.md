# State Machines — monthly-dinner

Fuente de verdad de estados y transiciones. Los valores de enum deben coincidir
exactamente con los definidos en `schema.sql` — no usar sinónimos ni traducciones.

---

## Event (`events.status`)

```
pending → published → closed
```

| Estado | Valor en DB | Descripción |
|---|---|---|
| Pendiente | `pending` | Evento creado, no notificado al grupo |
| Publicado | `published` | Grupo notificado, confirmaciones abiertas |
| Cerrado | `closed` | Evento realizado, historial registrado |

**Transiciones válidas:**
- `pending → published` — cuando el organizador notifica al grupo (US-06)
- `published → closed` — cuando el organizador cierra el evento (US-14)

**Transiciones inválidas:**
- `closed → cualquier estado` — irreversible
- `pending → closed` — debe pasar por `published`

**Restricciones:**
- No se puede editar el evento cuando `status = closed`
- No se puede confirmar asistencia cuando `status = closed`
- No se puede votar en un poll cuando el evento está `closed`
- Solo el organizador puede ejecutar transiciones de estado

---

## Attendance (`attendances.status`)

```
[sin respuesta] → va | no_va | tal_vez → va | no_va | tal_vez
```

| Estado | Valor en DB | Descripción |
|---|---|---|
| Va | `va` | Miembro confirmó asistencia |
| No va | `no_va` | Miembro confirmó que no asiste |
| Tal vez | `tal_vez` | Miembro no tiene certeza |

> ⚠️ Los valores son en español. No usar `yes`, `no`, `maybe` ni ninguna otra variante.

**Transiciones válidas:**
- Sin registro → cualquier estado (primer INSERT)
- Cualquier estado → cualquier otro estado (UPDATE, mientras evento no esté `closed`)

**Restricciones:**
- Bloqueado cuando `event.status = closed` — el registro queda en solo lectura
- Cada miembro tiene máximo 1 registro por evento (`unique event_id + member_id`)

---

## Poll (`polls.status`)

```
open → closed
```

| Estado | Valor en DB | Descripción |
|---|---|---|
| Abierta | `open` | Votación activa, miembros pueden votar |
| Cerrada | `closed` | Plazo vencido, resultado final visible |

**Transiciones válidas:**
- `open → closed` — cuando se alcanza `closes_at` o el organizador cierra manualmente

**Transiciones inválidas:**
- `closed → open` — irreversible

**Restricciones:**
- No se puede votar cuando `status = closed`
- Solo 1 poll por evento (`unique event_id`)
- El cierre puede ser manual (organizador) o automático (cuando `closes_at < now()`)

---

## PollVote

No tiene columna `status`. El estado del voto se deriva del estado del poll:

- Si `poll.status = open` → el voto es modificable (UPDATE permitido por RLS)
- Si `poll.status = closed` → el voto es de solo lectura (validar en server action)

> La inmutabilidad post-cierre no está garantizada por RLS — debe validarse
> en el server action antes de ejecutar cualquier UPDATE o DELETE sobre `poll_votes`.

---

## InvitationLink

No tiene columna `status`. El estado se deriva en runtime:

```
active → expired  (cuando expires_at < now())
active → revoked  (cuando revoked_at IS NOT NULL)
```

| Estado | Condición en DB | Descripción |
|---|---|---|
| Activo | `revoked_at IS NULL AND expires_at > now()` | Link válido para hacer join |
| Expirado | `expires_at <= now()` | Venció el plazo de 30 días |
| Revocado | `revoked_at IS NOT NULL` | Admin lo desactivó manualmente |

**Restricciones:**
- Un link expirado o revocado no permite hacer join al grupo
- Solo admins pueden revocar links
- El admin puede generar un nuevo link en cualquier momento

---

## Rotation

No tiene columna `status`. El organizador activo se determina por fecha:

```sql
select user_id from rotation
where group_id = :group_id
  and month = date_trunc('month', now())::date
```

**Ciclo de vida:**
- Al asignar el mes siguiente: admin inserta un nuevo registro en `rotation` con el `user_id` del próximo organizador y `month` del mes siguiente
- Al completar todos los miembros: el ciclo reinicia desde el primer miembro (US-13)
- No hay transición de estado — hay inserción de nuevos registros

**Restricciones:**
- `unique (group_id, month)` — solo un organizador por mes por grupo
- Solo admins pueden insertar y modificar registros en `rotation`

---

## ChecklistItem (`checklist_items.status`)

```
pending → done
```

| Estado | Valor en DB | Descripción |
|---|---|---|
| Pendiente | `pending` | Tarea no completada |
| Completada | `done` | Tarea marcada como completada |

> ⚠️ El valor es `done`, no `completed`. No usar otras variantes.

**Transiciones válidas:**
- `pending → done` — cuando el organizador marca la tarea (US-20)
- `done → pending` — reversible mientras el evento no esté `closed`

**Restricciones:**
- Solo el organizador del evento puede cambiar el estado de sus checklist items
- Cuando `event.status = closed`, los items quedan en solo lectura

---

*monthly-dinner · State Machines · Marzo 2026*