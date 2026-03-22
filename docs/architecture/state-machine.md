# State Machines — monthly-dinner

---

## Event

Estados:
- pending
- published
- closed

Transiciones:

pending → published
published → closed

Restricciones:
- No editar en closed
- No confirmar asistencia en closed

---

## Attendance

Estados:
- yes
- no
- maybe

Transiciones:
- cualquier estado → otro estado (hasta cierre de evento)

Restricción:
- locked cuando event = closed

---

## Poll

Estados:
- active
- closed

Transiciones:
active → closed

Restricciones:
- no votar cuando closed
- solo 1 poll activa por evento

---

## InvitationLink

Estados:
- active
- expired
- revoked

Transiciones:
active → expired
active → revoked

---

## Rotation

Estados:
- active (1 por grupo)
- inactive

Transición:
active → siguiente miembro

---

## ChecklistItem

Estados:
- pending
- completed

Transición:
pending → completed