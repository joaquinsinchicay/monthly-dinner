# PDD — US-09: Estado vacío del dashboard con configuraciones pendientes

## 1. Identificación

| Campo | Valor |
|---|---|
| **Epic** | E04 — Dashboard |
| **User Story** | US-09 — Estado vacío del dashboard con configuraciones pendientes |
| **Prioridad** | Alta — es la primera pantalla que ve cualquier miembro al unirse a un grupo recién creado |
| **Objetivo de negocio** | Reducir la fricción post-creación: guiar al admin para que complete la configuración y evitar que los miembros queden sin contexto mientras el grupo no está listo |

---

## 2. Problema a resolver

Cuando un grupo es creado pero aún no está completamente configurado (sin miembros suficientes o sin rotación definida), el dashboard puede mostrar un estado vacío ambiguo. Un admin no sabe exactamente qué le falta completar; un miembro no admin no entiende por qué no hay contenido. Esto genera confusión, abandono temprano y mensajes de coordinación fuera de la app.

---

## 3. Objetivo funcional

Mostrar en el dashboard un estado vacío diferenciado según el rol del usuario cuando el grupo no está completamente configurado:

- **Admin:** mensaje de acción + CTA que lleva directamente a la pantalla de configuración.
- **Miembro no admin:** mensaje informativo de espera, sin opción de acción.

---

## 4. Alcance

### Incluye

- Detección del estado "grupo no completamente configurado" al cargar el dashboard.
- Renderizado del estado vacío de admin con CTA.
- Renderizado del estado vacío de miembro no admin sin CTA.
- Redirección del CTA a `/dashboard/[groupId]/settings`.
- Lectura de rol del usuario autenticado en el contexto del grupo activo.

### No incluye

- Definición de qué configuraciones son obligatorias (pendiente — ver sección 24).
- Notificaciones push o in-app al admin sobre configuraciones pendientes.
- Lógica de auto-redireccionamiento si el admin entra al dashboard sin configurar.
- Pantalla de configuración en sí (cubierta por US-06, US-07, US-08).
- Cualquier estado del dashboard con grupo completamente configurado (cubierto por US-10 y siguientes).

---

## 5. Actor principal

- **Admin del grupo:** ve el estado vacío con CTA y puede completar la configuración.
- **Miembro no admin (incluye guests):** ve el estado vacío informativo sin acción disponible.

---

## 6. Precondiciones

1. El usuario está autenticado.
2. El usuario pertenece al grupo activo como miembro o admin (registrado en tabla `members`).
3. El grupo activo existe en tabla `groups`.
4. El grupo no está completamente configurado (según criterios definidos — ver sección 24).

---

## 7. Postcondiciones

- El dashboard muestra el estado vacío correcto según el rol.
- Si el admin toca "Completar configuración", es redirigido a `/dashboard/[groupId]/settings`.
- No se realizan mutaciones de datos en esta US — es puramente lectura y navegación.

---

## 8. Definiciones funcionales

### Estado "grupo no completamente configurado"

El grupo se considera **no completamente configurado** cuando no cumple con todas las condiciones habilitantes para operar (ver sección 24 para la definición abierta que debe cerrarse con el equipo).

### Estado vacío del dashboard

Es la pantalla principal del dashboard cuando no hay evento activo publicado Y el grupo no está completamente configurado. Esta pantalla reemplaza todos los cuadrantes funcionales del dashboard.

### Rol del usuario en contexto del grupo

Se determina leyendo `members.role` para el `auth.uid()` actual en el `group_id` activo. Los valores posibles son `admin` y `member`.

---

## 9. Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | Solo el usuario con `members.role = 'admin'` ve el CTA "Completar configuración". |
| RN-02 | Los usuarios con `members.role = 'member'` ven únicamente el mensaje de espera. |
| RN-03 | Este estado vacío se muestra **solo** cuando el grupo no está completamente configurado. Si el grupo ya está configurado, aplican los estados definidos en US-10. |
| RN-04 | El estado se evalúa server-side. No se puede confiar solo en el rol del cliente. |
| RN-05 | Guests (miembros sin cuenta) son tratados como `member` a efectos de esta pantalla — ven el mensaje de espera sin CTA. |
| RN-06 | El CTA redirige siempre a `/dashboard/[groupId]/settings` con el `groupId` del grupo activo. |

---

## 10. Flujo principal

### Flujo A — Admin con grupo no configurado

1. Admin autenticado accede a `/dashboard/[groupId]`.
2. El servidor detecta que el grupo no está completamente configurado.
3. El servidor determina que el usuario es admin del grupo.
4. El dashboard renderiza el estado vacío de admin:
   - Mensaje de encabezado (eyebrow + heading desde `texts.json`).
   - Cuerpo descriptivo (desde `texts.json`).
   - Botón CTA "Completar configuración".
5. Admin toca el CTA.
6. El sistema redirige a `/dashboard/[groupId]/settings`.

### Flujo B — Miembro no admin con grupo no configurado

1. Miembro autenticado (no admin) accede a `/dashboard/[groupId]`.
2. El servidor detecta que el grupo no está completamente configurado.
3. El servidor determina que el usuario es miembro (no admin).
4. El dashboard renderiza el estado vacío de miembro:
   - Mensaje de espera informativo (desde `texts.json`).
   - Sin CTA.

---

## 11. Flujos alternativos

### FA-01: Grupo completamente configurado

El grupo ya cumple todos los criterios de configuración. El dashboard **no** entra en este estado vacío y muestra los cuadrantes funcionales definidos en US-10.

### FA-02: Error al cargar el estado del grupo

Si la carga de datos falla (error de red, error Supabase), el dashboard muestra un estado de error genérico. No debe quedar en pantalla en blanco.

### FA-03: Usuario no pertenece al grupo

Si `auth.uid()` no tiene fila en `members` para el `groupId`, el sistema redirige al dashboard raíz o al onboarding. Este caso es manejado por el middleware y no llega a esta pantalla.

---

## 12. UI / UX

### Fuente de verdad

`docs/design/design-system.md` — The Culinary Editorial design system.

### Comportamientos requeridos

- El estado vacío ocupa el área principal del dashboard, reemplazando los cuadrantes funcionales.
- El estado de admin y el de miembro deben ser visualmente distintos (el de admin tiene jerarquía de acción; el de miembro es informativo/pasivo).
- El CTA (solo para admin) debe ser claramente interactivo y diferenciado del copy informativo.
- El layout sigue el principio "no-line rule": sin bordes de 1px. Separación por espaciado y cambios de superficie.
- Aplica el principio de tonal layering: el card de estado vacío puede apoyarse en `surface_low` para diferenciarse del fondo base.
- Los textos usan la escala tipográfica del design system: eyebrow en Label (uppercase + letter-spacing), heading en Display, body en Body medium.
- Mobile-first. El layout en móvil es una columna centrada.
- El estado de carga previo al render del estado vacío debe contemplar un skeleton o indicador de loading (ver sección 15).

---

## 13. Mensajes y textos

### Fuente de verdad

`lib/texts.json`

### Tipos de mensajes requeridos

| Ubicación | Tipo | Clave en texts.json | Rol |
|---|---|---|---|
| Estado vacío — admin | Eyebrow | `dashboard.emptyAdmin.eyebrow` | Admin |
| Estado vacío — admin | Heading | `dashboard.emptyAdmin.heading` | Admin |
| Estado vacío — admin | Body | `dashboard.emptyAdmin.body` | Admin |
| Estado vacío — admin | CTA label | `dashboard.emptyAdmin.cta` | Admin |
| Estado vacío — miembro | Mensaje de espera | `dashboard.emptyMember` o clave equivalente para configuraciones pendientes (ver sección 24) | Miembro |
| Estado vacío — miembro | Eyebrow card | `dashboard.emptyMemberCardEyebrow` | Miembro |
| Estado vacío — miembro | Heading card | `dashboard.emptyMemberCardHeading` | Miembro |

> **Nota de discrepancia detectada:** Los textos literales del Gherkin ("Tu grupo aún no está listo…", "Faltan configuraciones. El administrador está finalizando el grupo.") difieren del copy actual en `texts.json`. Los textos de `texts.json` son la fuente de verdad. Si el PO requiere alinear el Gherkin a los textos actuales o viceversa, debe resolverse antes de implementar (ver sección 24, DA-02).

---

## 14. Persistencia

Esta US es **solo lectura**. No genera escrituras en base de datos.

### Datos necesarios para el render

| Tabla | Columnas | Motivo |
|---|---|---|
| `members` | `role`, `user_id`, `group_id` | Determinar si el usuario es admin o miembro del grupo activo |
| `groups` | `id`, y columnas de configuración relevantes | Determinar si el grupo está completamente configurado |
| `rotation` | Existencia de filas para el `group_id` | Parte de la evaluación de "grupo configurado" (ver sección 24) |

---

## 15. Seguridad

- La evaluación del rol del usuario (`admin` vs `member`) se realiza **server-side** antes de renderizar.
- No se expone información del estado de configuración del grupo a usuarios que no pertenecen al grupo.
- RLS en `members` garantiza que solo usuarios del grupo pueden leer sus propias filas.
- RLS en `groups` garantiza que solo miembros del grupo pueden leer los datos del grupo.
- El CTA de redirección a `/settings` no otorga acceso: la page de settings tiene su propio guard de rol (definido en US-06 — `Scenario 10`).
- No se debe confiar en el rol pasado desde el cliente para tomar decisiones de seguridad.

---

## 16. Dependencias

| US | Relación |
|---|---|
| US-03 — Crear grupo | Genera el estado inicial del grupo (no configurado) |
| US-06 — Configuración de miembros | Destino del CTA; resuelve parte de la configuración |
| US-07 — Configuración de rotación | Resuelve parte de la configuración; su existencia define si el grupo está "listo" |
| US-08 — Configuración de nombre | Parte de la pantalla de settings a la que redirige el CTA |
| US-10 — Estados del card de evento | US-09 aplica antes que US-10; si el grupo no está configurado, US-10 no aplica |
| middleware.ts | Valida que el usuario pertenece al grupo antes de cargar el dashboard |

---

## 17. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| La definición de "grupo completamente configurado" no está cerrada | Alto — condicional principal de la US | Resolver DA-01 antes de implementar (ver sección 24) |
| Un miembro ve el estado admin por error de rol | Alto — expone CTA incorrecto | Validar rol siempre server-side |
| Textos del Gherkin y texts.json no están alineados | Medio — inconsistencia de comunicación de producto | Resolver DA-02 (ver sección 24) |
| El estado de carga tarda y el usuario ve pantalla vacía transitoria | Bajo | Implementar skeleton loading |

---

## 18. Casos borde

| Caso | Comportamiento esperado |
|---|---|
| Admin que también es el único miembro del grupo (grupo recién creado) | Ve el estado vacío de admin con CTA |
| Guest en grupo no configurado | Ve el estado vacío de miembro (sin CTA), igual que `member` |
| Grupo con solo 1 miembro (el admin) sin rotación | Se considera no configurado; aplica esta US |
| Admin que ya configuró rotación pero el grupo tiene 1 solo miembro | Definir en DA-01 si sigue mostrando estado vacío |
| Admin completa configuración y vuelve al dashboard | El dashboard ya no debe mostrar este estado vacío; aplica US-10 |
| Error al evaluar si el grupo está configurado | Mostrar estado de error, no estado vacío de configuración pendiente |
| Usuario intenta acceder directamente a `/dashboard/[groupId]/settings` sin CTA | La page de settings tiene su propio guard (US-06) |

---

## 19. Criterios de aceptación desarrollados

### Scenario 01 — Admin ve el estado vacío con CTA

**Given** soy el admin del grupo activo
**And** el grupo no está completamente configurado
**When** ingreso al dashboard del grupo
**Then:**

- El servidor evalúa server-side que el grupo no está configurado.
- El servidor evalúa server-side que el usuario es `admin` del grupo.
- El dashboard renderiza el estado vacío de admin.
- Se muestra el eyebrow definido en `texts.json` (`dashboard.emptyAdmin.eyebrow`).
- Se muestra el heading definido en `texts.json` (`dashboard.emptyAdmin.heading`).
- Se muestra el cuerpo descriptivo definido en `texts.json` (`dashboard.emptyAdmin.body`).
- Se muestra el botón CTA con el label definido en `texts.json` (`dashboard.emptyAdmin.cta`).
- Los cuadrantes funcionales del dashboard (evento, rotación, historial) **no** se muestran.

---

### Scenario 02 — Botón redirige a configuración del grupo

**Given** soy el admin del grupo activo
**And** el grupo no está completamente configurado
**And** el dashboard muestra el estado vacío por configuraciones pendientes
**When** toco "Completar configuración"
**Then:**

- El sistema redirige a `/dashboard/[groupId]/settings` con el `groupId` del grupo activo.
- La redirección es inmediata (client-side navigation, sin reload completo si aplica).
- No se realizan mutaciones de datos.

---

### Scenario 03 — Miembro ve mensaje de espera sin CTA

**Given** soy un miembro del grupo no admin
**And** el grupo no está completamente configurado
**When** ingreso al dashboard del grupo
**Then:**

- El servidor evalúa server-side que el grupo no está configurado.
- El servidor evalúa server-side que el usuario es `member` (no admin).
- El dashboard renderiza el estado vacío de miembro.
- Se muestra el mensaje informativo de espera (desde `texts.json`).
- El botón "Completar configuración" **no** se muestra.
- Los cuadrantes funcionales del dashboard **no** se muestran.

---

## 20. Checklist diseño

- [x] El estado vacío de admin usa tipografía Display (DM Serif Display 36px, italic para heading) — `EmptyDashboard.tsx`.
- [x] El estado vacío de miembro es visualmente menos activo: solo `<p>` sin CTA — `EmptyDashboard.tsx`.
- [x] No hay bordes de 1px — el componente no usa `border`. Separación por espaciado y superficie.
- [x] El layout es mobile-first: `flex flex-col items-center px-8`, funciona desde 375px.
- [x] El CTA usa `<Link>` con `rounded-full`, `bg-gradient-to-r`, `text-white` — consistente con el resto del sistema.
- [ ] Los estados de loading antes del render tienen skeleton o indicador apropiado — **pendiente**: no hay Suspense boundary explícito en la ruta del dashboard.
- [x] El área del estado vacío tiene espaciado generoso: `mt-6`, `mt-8`, `px-8`, `pt-10` en footer.

---

## 21. Checklist desarrollo

- [x] `isGroupConfigured()` implementada en `lib/actions/groups.ts` — evalúa `members` count ≥ 2 y `rotation` count > 0.
- [x] El rol del usuario se lee desde `members.role` server-side con `getUser()` — `page.tsx` línea 37.
- [x] No hay lógica de negocio en `app/` — `isGroupConfigured()` vive en `lib/actions/groups.ts`.
- [x] Los textos se consumen desde `lib/texts.json` vía `t()` — sin hardcoding en `EmptyDashboard.tsx`.
- [x] El componente de estado vacío vive en `components/group/EmptyDashboard.tsx` e importado desde `page.tsx`.
- [x] El CTA redirige a `/dashboard/${groupId}/settings` vía `<Link href>` — `EmptyDashboard.tsx` línea 44.
- [x] Error en `isGroupConfigured()` defaults a `groupConfigured = true` — no bloquea el dashboard.
- [x] Queries usan `select('id', { count: 'exact', head: true })` — sin `select(*)`.
- [x] RLS en `members` y `rotation` garantiza aislamiento por grupo.
- [x] Early return en `page.tsx` evita ejecutar queries innecesarias cuando el grupo no está configurado.
- [x] Prop `isAdminOrOrganizer` renombrada a `isAdmin` en `EmptyDashboard.tsx` — semántica correcta per PDD.

---

## 22. Checklist QA

- [ ] Admin de grupo no configurado ve el estado vacío con eyebrow, heading, body y CTA.
- [ ] Admin de grupo no configurado toca CTA y es redirigido a `/dashboard/[groupId]/settings`.
- [ ] Miembro no admin de grupo no configurado ve el mensaje de espera.
- [ ] Miembro no admin de grupo no configurado **no** ve el botón CTA.
- [ ] Guest (sin cuenta) de grupo no configurado ve el mensaje de espera (sin CTA).
- [ ] Admin de grupo completamente configurado **no** ve este estado vacío.
- [ ] El estado vacío **no** se muestra cuando el grupo está configurado.
- [ ] El render correcto se produce incluso sin recargar la página al volver del settings.
- [ ] En condición de error de carga, el dashboard muestra un estado de error (no pantalla en blanco).
- [ ] Los textos mostrados coinciden exactamente con los definidos en `texts.json`.
- [ ] La pantalla carga correctamente en mobile (375px).

---

## 23. Trazabilidad

| Scenario | Sección del PDD | Cobertura |
|---|---|---|
| Scenario 01 — Admin ve estado vacío con CTA | §8 Definiciones, §9 RN-01/04, §10 Flujo A, §19 CA Sc01 | Completa |
| Scenario 02 — Botón redirige a /settings | §9 RN-06, §10 Flujo A (paso 5-6), §19 CA Sc02 | Completa |
| Scenario 03 — Miembro ve mensaje sin CTA | §8 Definiciones, §9 RN-02/04/05, §10 Flujo B, §19 CA Sc03 | Completa |

---

## 24. Definiciones abiertas

### DA-01 — ¿Qué define "grupo completamente configurado"? ✅ CERRADA

**Definición implementada en `lib/actions/groups.ts` → `isGroupConfigured()`:**

Un grupo se considera completamente configurado cuando cumple **todas** estas condiciones:
1. `members` count para el `group_id` ≥ 2 (admin + al menos 1 miembro más).
2. Al menos 1 fila en tabla `rotation` para el `group_id` (rotación configurada vía US-07).

Si alguna condición falla → `isGroupConfigured()` retorna `false` → dashboard muestra estado vacío US-09.

---

### DA-02 — Discrepancia entre textos del Gherkin y texts.json

Los textos literales del Gherkin (Scenario 01 y 03) no coinciden exactamente con los valores actuales en `texts.json`:

| Scenario | Texto en Gherkin | Clave en texts.json | Texto actual en texts.json |
|---|---|---|---|
| Sc01 — body admin | "Tu grupo aún no está listo. Completá la configuración para comenzar a organizar las cenas." | `dashboard.emptyAdmin.body` | "Tu clan está listo, finalizá la configuración para dar comienzo a la experiencia culinaria." |
| Sc03 — mensaje miembro | "Faltan configuraciones. El administrador está finalizando el grupo." | Sin clave específica para este caso | `dashboard.emptyMember` = "Aún no hay eventos. El organizador del mes está preparando la primera cita." |

**Resolución requerida:** El PO debe decidir si:
- Se actualiza `texts.json` para alinear con el Gherkin, o
- Se acepta el copy actual de `texts.json` como válido y se ajusta el Gherkin.

En cualquier caso, la fuente de verdad de implementación es `texts.json`. Si se necesita agregar la clave para el mensaje del miembro en estado de configuración pendiente, se debe crear `dashboard.emptyMemberPendingConfig` o similar.

---

## 25. Resumen

US-09 define el comportamiento del dashboard cuando un grupo no está completamente configurado. Es una US de **solo lectura y navegación**: detecta el estado del grupo y el rol del usuario server-side, y renderiza dos variantes de estado vacío — una activa con CTA para el admin, y una pasiva informativa para el miembro no admin. No hay mutaciones de datos. La implementación depende de cerrar la definición de DA-01 (criterios de "grupo configurado") y DA-02 (alineación de textos).

---

*PDD generado: 2026-03-31 · monthly-dinner MVP*
