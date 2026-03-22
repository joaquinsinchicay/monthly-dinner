# Roles & Permissions — monthly-dinner

---

## Roles

El sistema tiene dos roles de membresía almacenados en `members.role`:

| Rol | Valor en DB | Descripción |
|---|---|---|
| **Admin** | `admin` | Crea el grupo, gestiona invitaciones y rotación. Hay al menos 1 por grupo. |
| **Member** | `member` | Participa en eventos, vota y confirma asistencia. |

> ⚠️ **Organizador no es un rol.** El organizador del mes es el miembro cuyo `user_id`
> coincide con el registro de `rotation` para el `month` actual del grupo.
> Se valida en runtime comparando `rotation.user_id = auth.uid()`, no por `members.role`.
> No existe el valor `organizer` en el enum `member_role` — no usar ese valor.

---

## Grupo

| Acción | Admin | Organizador del mes | Member |
|---|---|---|---|
| Crear grupo | ✅ | — | — |
| Editar nombre del grupo | ✅ | ❌ | ❌ |
| Generar link de invitación | ✅ | ❌ | ❌ |
| Revocar link de invitación | ✅ | ❌ | ❌ |
| Ver grupo | ✅ | ✅ | ✅ |
| Unirse al grupo (via link) | ✅ | ✅ | ✅ |
| Gestionar rotación | ✅ | ❌ | ❌ |

---

## Eventos

| Acción | Admin | Organizador del mes | Member |
|---|---|---|---|
| Crear evento del mes | ❌ | ✅ | ❌ |
| Editar evento | ❌ | ✅ | ❌ |
| Publicar / notificar al grupo | ❌ | ✅ | ❌ |
| Cerrar evento | ❌ | ✅ | ❌ |
| Ver evento | ✅ | ✅ | ✅ |

---

## Asistencia

| Acción | Admin | Organizador del mes | Member |
|---|---|---|---|
| Confirmar asistencia propia | ✅ | ✅ | ✅ |
| Cambiar estado de asistencia | ✅ | ✅ | ✅ |
| Ver resumen (contadores) | ✅ | ✅ | ✅ |
| Ver resumen con nombres completos | ✅ | ✅ | ✅ |
| Compartir resumen | ❌ | ✅ | ❌ |

> El resumen con nombres es visible para todos los miembros (US-10).
> La acción "Compartir resumen" es exclusiva del organizador.

---

## Votación

| Acción | Admin | Organizador del mes | Member |
|---|---|---|---|
| Crear votación | ❌ | ✅ | ❌ |
| Editar votación | ❌ | ✅ | ❌ |
| Votar | ✅ | ✅ | ✅ |
| Cambiar voto (antes del cierre) | ✅ | ✅ | ✅ |
| Ver resultados parciales | ✅ | ✅ | ✅ |
| Ver resultado final | ✅ | ✅ | ✅ |

> El organizador es también miembro del grupo — puede y debe poder votar (US-18).

---

## Historial

| Acción | Admin | Organizador del mes | Member |
|---|---|---|---|
| Registrar restaurante al cerrar | ❌ | ✅ | ❌ |
| Editar restaurante post-cierre | ❌ | ✅ | ❌ |
| Ver historial | ✅ | ✅ | ✅ |
| Buscar en historial | ✅ | ✅ | ✅ |

---

## Checklist

| Acción | Admin | Organizador del mes | Member |
|---|---|---|---|
| Ver checklist | ❌ | ✅ | ❌ |
| Completar tareas | ❌ | ✅ | ❌ |
| Gestionar templates de checklist | ✅ | ❌ | ❌ |

---

## Rotación

| Acción | Admin | Organizador del mes | Member |
|---|---|---|---|
| Configurar orden de rotación | ✅ | ❌ | ❌ |
| Asignar organizador del mes | ✅ | ❌ | ❌ |
| Ver organizador actual | ✅ | ✅ | ✅ |
| Ver próximo organizador | ✅ | ✅ | ✅ |

---

## Reglas clave

- `organizer` no existe como valor en `members.role` — no usar ese valor en código.
- El organizador del mes se determina comparando `rotation.user_id = auth.uid()` para el `month` actual.
- Un Admin puede ser también el organizador del mes si le toca el turno en `rotation`.
- Toda acción de escritura valida `auth.uid()` via RLS antes de ejecutarse — nunca confiar solo en el frontend.
- Las columnas `Admin` y `Member` en las matrices corresponden a `members.role`. La columna `Organizador del mes` es un estado derivado de `rotation`, no un rol.

---

*monthly-dinner · Roles & Permissions · Marzo 2026*