# Roles & Permissions — monthly-dinner

---

## Roles

- admin
- organizer
- member

---

## Matriz de permisos

| Acción | Admin | Organizer | Member |
|--------|------|----------|--------|
| Crear grupo | ✅ | ❌ | ❌ |
| Editar grupo | ✅ | ❌ | ❌ |
| Generar link invitación | ✅ | ❌ | ❌ |
| Unirse a grupo | ✅ | ✅ | ✅ |
| Ver grupo | ✅ | ✅ | ✅ |

---

## Eventos

| Acción | Admin | Organizer | Member |
|--------|------|----------|--------|
| Crear evento | ❌ | ✅ | ❌ |
| Editar evento | ❌ | ✅ | ❌ |
| Publicar evento | ❌ | ✅ | ❌ |
| Ver evento | ✅ | ✅ | ✅ |

---

## Asistencia

| Acción | Admin | Organizer | Member |
|--------|------|----------|--------|
| Confirmar asistencia | ✅ | ✅ | ✅ |
| Ver resumen | ✅ | ✅ | ❌ |

---

## Votación

| Acción | Admin | Organizer | Member |
|--------|------|----------|--------|
| Crear votación | ❌ | ✅ | ❌ |
| Votar | ❌ | ❌ | ✅ |
| Ver resultados | ✅ | ✅ | ✅ |

---

## Historial

| Acción | Admin | Organizer | Member |
|--------|------|----------|--------|
| Registrar restaurante | ❌ | ✅ | ❌ |
| Ver historial | ✅ | ✅ | ✅ |

---

## Checklist

| Acción | Admin | Organizer | Member |
|--------|------|----------|--------|
| Ver checklist | ❌ | ✅ | ❌ |
| Completar tareas | ❌ | ✅ | ❌ |

---

## Reglas clave

- Organizer = rol dinámico basado en rotación
- Admin gestiona estructura, no eventos
- Member solo interactúa (no crea)