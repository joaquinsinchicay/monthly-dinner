# Technical Decisions — monthly-dinner

---

## Arquitectura

- Next.js 14 App Router
- Server Components por defecto
- Server Actions para escritura
- Supabase como única fuente de datos

---

## Auth

- Supabase Google OAuth
- No email/password
- Sesión validada en server

---

## Data fetching

- Server Components para lectura
- No fetch desde cliente directo a DB
- Re-fetch tras mutaciones

---

## Realtime

- MVP: NO realtime
- Estrategia: re-fetch + optimistic UI

---

## Notificaciones

- MVP: solo in-app
- No push / email
- Trigger manual (no automático)

---

## Validación

- Validación en server (obligatoria)
- Validación opcional en client

---

## Manejo de errores

- Inline errors
- No alerts del navegador
- No pérdida de input

---

## Seguridad

- RLS obligatorio en todas las tablas
- auth.uid() validado en cada operación
- Nunca confiar en client

---

## Performance

- No optimización avanzada en MVP
- Prioridad: claridad > performance

---

## Testing

- MVP: manual + smoke tests
- Futuro: Playwright

---

## Logging

- console + logs básicos
- sin observabilidad avanzada

---

## Convenciones

- TypeScript estricto
- No select(*)
- No hardcodes
- Naming consistente DB ↔ TS

---

## Scope MVP

Incluye:
- Auth
- Grupo
- Evento
- Confirmación

Excluye:
- Notificaciones avanzadas
- Tiempo real
- Analytics
- Gamificación