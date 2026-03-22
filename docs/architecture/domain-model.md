# Domain Model — monthly-dinner

Fuente de verdad del modelo de dominio. Este documento NO se contradice con la base de datos.

---

## Entidades principales

### User (profiles)
- id (uuid, auth.uid)
- email
- display_name
- avatar_url
- created_at

---

### Group
- id
- name
- created_by (user_id)
- created_at

---

### Membership (members)
- user_id
- group_id
- role: admin | member | organizer
- joined_at

Relación:
- 1 User → N Groups
- 1 Group → N Users

---

### InvitationLink
- id
- group_id
- token
- expires_at
- created_by
- status: active | expired | revoked

---

### Event (dinner)
- id
- group_id
- date
- venue
- description
- organizer_id
- status: pending | published | closed
- created_at

Relación:
- 1 Group → N Events
- 1 Event → 1 Organizer (User)

---

### Attendance
- id
- event_id
- user_id
- status: yes | no | maybe
- updated_at

Relación:
- 1 Event → N Attendances
- 1 User → N Attendances

---

### Rotation
- id
- group_id
- user_id
- position
- is_active

---

### Poll
- id
- event_id
- created_by
- closes_at
- status: active | closed

---

### PollOption
- id
- poll_id
- name

---

### Vote
- id
- poll_id
- user_id
- option_id
- created_at

---

### RestaurantHistory
- id
- event_id
- group_id
- name
- visited_at

---

### ChecklistItem
- id
- event_id
- title
- order
- completed_at

---

## Reglas clave

- Un usuario SOLO accede a datos de sus grupos
- Un evento pertenece a UN grupo
- Solo hay 1 evento activo por grupo por mes
- Un usuario tiene 1 estado de asistencia por evento
- Un usuario tiene 1 voto por votación

---

## Relaciones críticas

- User ↔ Membership ↔ Group
- Group → Event → Attendance
- Event → Poll → Vote
- Event → RestaurantHistory