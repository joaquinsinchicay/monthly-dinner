# Technical Decisions — monthly-dinner

Fuente de verdad de decisiones técnicas del MVP. Ante cualquier contradicción
con otros archivos, este documento tiene precedencia sobre comentarios inline
pero no sobre `schema.sql` ni los CA Gherkin del backlog.

---

## Arquitectura

- Next.js 14 App Router
- Server Components por defecto — `"use client"` solo cuando sea estrictamente necesario
- Server Actions para todas las operaciones de escritura
- Supabase como única fuente de datos — no hay backend adicional

---

## Auth

- Supabase Google OAuth — sin email/password
- Sesión validada en servidor con `getUser()` — nunca con `getSession()` del cliente
- Token validado en cada Server Action antes de cualquier operación de escritura
- Perfil creado automáticamente via trigger en `auth.users`

---

## Data fetching

- Lectura desde Server Components — nunca fetch directo a DB desde el cliente
- Re-fetch tras mutaciones (invalidación de cache de Next.js)
- Realtime via `supabase.channel()` para tablas que lo requieren (ver sección Realtime)

---

## Realtime

**MVP: SÍ incluye realtime** para las siguientes tablas:

| Tabla | US | Motivo |
|---|---|---|
| `attendances` | US-07, US-10 | El contador de confirmaciones debe actualizarse sin recargar (CA de US-07) |
| `poll_votes` | US-18 | Los porcentajes de votación deben reflejar cambios en vivo |
| `events` | US-07 | Cambios de estado del evento visibles sin recargar |

**Implementación:**
```ts
supabase
  .channel('channel-name')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'attendances',
    filter: `event_id=eq.${eventId}`
  }, handler)
  .subscribe()
```

**Habilitar en Supabase** — ejecutar en Database → Replication:
```sql
alter publication supabase_realtime add table attendances;
alter publication supabase_realtime add table poll_votes;
alter publication supabase_realtime add table events;
```

**Estrategia complementaria:** optimistic UI para acciones propias del usuario
(confirmar asistencia, emitir voto) — no esperar al evento realtime para reflejar
el cambio en la UI del usuario que ejecutó la acción.

---

## Notificaciones

- MVP: solo in-app (badge / indicador en panel al abrir la app)
- No push notifications en MVP
- No email en MVP
- Trigger manual — el organizador decide cuándo notificar (US-06)
- Fase 2: notificaciones automáticas al grupo

---

## Validación

- Validación en servidor obligatoria en todos los Server Actions
- Validación en cliente opcional — solo para UX (no como garantía de seguridad)
- Los formularios no se limpian ante un error — el usuario no pierde su input
- Errores mostrados inline dentro del componente, nunca como `alert()` del navegador

---

## Seguridad

- RLS obligatorio en todas las tablas — nunca desactivar en producción
- `auth.uid()` validado en cada Server Action antes de cualquier escritura
- Nunca confiar en datos del cliente para autorización
- Inmutabilidad de campos críticos (ej: `organizer_id` en events) validada en Server Action — RLS no lo garantiza

---

## RLS: problemas conocidos y soluciones aplicadas

### 1. Recursión infinita en `members` (error `42P17`)

**Problema:** la política `"members: select same group"` usaba un subquery `exists (select 1 from members ...)` dentro de una policy de la misma tabla `members`. Postgres evalúa las políticas RLS antes de ejecutar la query, lo que genera recursión infinita.

**Error en Supabase:** `code: "42P17" — infinite recursion detected in policy for relation "members"`

**Solución:** función `is_group_member(p_group_id uuid, p_user_id uuid)` con `security definer`. Al correr con permisos del owner (postgres), el SELECT interno bypasea RLS completamente — no hay recursión.

```sql
create or replace function is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from members where group_id = p_group_id and user_id = p_user_id);
$$;

-- Reemplazar la política recursiva:
drop policy if exists "members: select same group" on members;
create policy "members: select same group"
  on members for select using (is_group_member(group_id, auth.uid()));
```

**Aplica también a:** cualquier política en `groups`, `invitation_links`, `rotation`, etc. que haga `exists (select 1 from members ...)`. Si alguna falla con `42P17`, reemplazar el subquery inline por `is_group_member(group_id, auth.uid())`.

---

### 2. Orden de creación de tablas — FK circular entre `groups` y `members`

**Problema:** `members.group_id` referencia `groups(id)`, pero las políticas RLS de `groups` hacen `exists (select 1 from members ...)`. Esto obliga a un orden específico de creación que no puede resolverse de forma lineal.

**Solución — orden correcto:**
1. Crear `profiles`
2. Crear `groups` **sin políticas RLS**
3. Crear `members` con políticas RLS completas + función `is_group_member`
4. Agregar políticas RLS a `groups` (ahora que `members` existe)
5. Crear triggers `on_group_created` y `on_group_created_invitation`

---

### 3. Usuario sin fila en `profiles` — trigger retroactivo (error `42501`)

**Problema:** el trigger `handle_new_user()` sobre `auth.users` no existía cuando el usuario se registró inicialmente. Como `groups.created_by` referencia `profiles(id)`, el INSERT a `groups` falla con violación de FK, lo cual se manifiesta como `42501` (RLS policy violation) porque Supabase no distingue FK errors de RLS errors en el cliente.

**Error en Supabase:** `code: "42501" — new row violates row-level security policy for table "groups"`

**Solución — sincronización manual, ejecutar una vez en SQL Editor:**
```sql
insert into profiles (id, email, full_name, avatar_url)
select
  id,
  email,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;
```

**Prevención:** el trigger `handle_new_user()` con `on conflict (id) do nothing` garantiza idempotencia para todos los registros futuros.

---

## Manejo de errores

- Estados de error inline dentro del componente
- Estados vacíos siempre con mensaje descriptivo (ej: `"La cena de este mes aún no fue convocada"`)
- No `alert()` ni `console.error()` expuesto al usuario
- Los formularios no pierden el input del usuario ante un error

---

## Performance

- No optimización avanzada en MVP — prioridad: claridad > performance
- Sin lazy loading, infinite scroll ni paginación en MVP (volumen de datos acotado)
- Sin caché avanzada — re-fetch estándar de Next.js es suficiente para el MVP

---

## Testing

- MVP: verificación manual de CA Gherkin en preview de Vercel antes de merge
- Una US se cierra solo si todos sus escenarios Gherkin pasan en la preview
- Fase 2: Playwright para e2e

---

## Logging

- `console.log` básico en desarrollo
- Sin observabilidad avanzada en MVP (sin Sentry, Datadog, etc.)
- Fase 2: logging estructurado

---

## Convenciones

- TypeScript estricto en todo el proyecto
- `select(*)` prohibido en producción — siempre campos explícitos
- Sin hardcodeo de IDs de grupos, usuarios ni eventos
- Naming consistente DB ↔ TypeScript — los nombres de columna del schema se usan tal cual en los tipos TS
- Enums del schema replicados como `const` en TypeScript — no como strings sueltos

---

## Scope MVP — 19 User Stories / 7 épicas

| Épica | US | Incluido en MVP |
|---|---|---|
| E00 Creación de grupo | US-00, US-00b | ✅ |
| E01 Acceso & Autenticación | US-01, US-02, US-03, US-04 | ✅ |
| E02 Panel de evento | US-05, US-06, US-07 | ✅ |
| E03 Turno rotativo | US-11, US-13 | ✅ |
| E04 Confirmación de asistencia | US-08, US-09, US-10 | ✅ |
| E05 Historial de restaurantes | US-14, US-16 | ✅ |
| E06 Votación de restaurantes | US-17, US-18 | ✅ |
| E07 Checklist del organizador | US-20 | ✅ |

**Excluido del MVP (Fase 2 y 3):**
- Notificaciones push y email
- Registro automático de turno al cierre
- Cierre automático de votación por fecha
- Perfil con estadísticas de asistencia
- Racha activa y comparativa grupal
- Puntuación de restaurantes
- Onboarding de nuevos miembros

---

*monthly-dinner · Technical Decisions · MVP v1.0 · Marzo 2026*