# PDD — US-06: Configuración de miembros del grupo

---

## 1. Identificación

| Campo | Valor |
|---|---|
| **Epic** | E03 — Settings |
| **User Story** | US-06 — Configuración de miembros del grupo |
| **Prioridad** | Alta — prerequisito para rotación, invitaciones y onboarding del grupo |
| **Objetivo de negocio** | Permitir al admin gestionar los miembros del grupo: ver quién pertenece, invitar nuevos, agregar guests y cambiar roles, sin depender de flujos externos |

---

## 2. Problema a resolver

El admin necesita un punto centralizado para gestionar la composición del grupo. Sin esta pantalla:

- No puede ver quiénes son miembros ni sus roles actuales.
- No tiene forma de invitar a personas que aún no tienen cuenta.
- No puede agregar participantes externos (guests) sin cuenta de Google.
- No puede promover miembros a admin ni degradar admins a miembros.

Esta US entrega la pantalla `/dashboard/[groupId]/settings` como punto de acceso a todas las operaciones de membresía.

---

## 3. Objetivo funcional

Implementar la pantalla de configuración de miembros del grupo con las siguientes capacidades:

1. Listar todos los miembros del grupo con nombre, avatar y rol.
2. Ofrecer acceso a un modal con dos solapas para agregar miembros: por link de invitación o sin cuenta.
3. Mostrar el link de invitación activo con opción de copiado al portapapeles.
4. Permitir agregar miembros sin cuenta (guests) con solo un nombre.
5. Permitir cambiar el rol de cualquier miembro (admin ↔ member), con restricción cuando el actor es el único admin.
6. Proteger el acceso a la pantalla: solo admins pueden ingresar; no admins son redirigidos al dashboard.
7. Proveer navegación de retorno al dashboard del grupo.

---

## 4. Alcance

### Incluye
- Pantalla `/dashboard/[groupId]/settings` accesible solo para admins
- Lista de miembros con nombre, avatar y rol (`ADMIN` / `MIEMBRO`)
- Modal de agregar con dos solapas: "Invitar por link" y "Agregar sin Cuenta"
- Solapa "Invitar por link": muestra link activo + botón copiar al portapapeles + feedback visual al copiar
- Solapa "Agregar sin Cuenta": campo de texto "Nombre" (obligatorio) + botones "Cerrar" y "Agregar"
- Alta de guest y su aparición inmediata en la lista tras confirmar
- Menú de opciones por miembro (⋮) con acción de cambio de rol
- Validación de unicidad del rol admin: no se puede quitar el rol a uno mismo si es el único admin
- Botón de retorno al dashboard ("Dashboard" con flecha hacia atrás)
- Redirección con mensaje de acceso denegado para no admins que intenten acceder por URL

### No incluye
- Eliminación de miembros del grupo (no está en el Gherkin de esta US)
- Edición del nombre del grupo (cubierto por US-08)
- Configuración de rotación (cubierto por US-07)
- Vinculación de guests a miembros con cuenta (cubierto por US-19)
- Generación de múltiples links de invitación simultáneos
- Revocación del link de invitación desde este flujo
- Edición del nombre o avatar de un miembro

---

## 5. Actor principal

Admin del grupo activo (`members.role = 'admin'` para el `group_id` en contexto).

---

## 6. Precondiciones

- El usuario está autenticado (`auth.uid()` válido).
- El usuario es admin del grupo activo (`members.role = 'admin'`).
- Existe al menos un `invitation_link` activo para el grupo (necesario para Scenario 04; si no existe, debe generarse o manejarse como edge case — ver sección 18).
- El grupo ya fue creado y tiene al menos un miembro (el propio admin).

---

## 7. Postcondiciones

Según la acción ejecutada:

| Acción | Estado post-operación |
|---|---|
| Acceso a settings | Pantalla cargada con lista de miembros actualizada |
| Copiar link | Portapapeles contiene el link; feedback visual mostrado |
| Agregar guest | Nuevo registro en `members` con `user_id = null`; aparece en lista |
| Cambio de rol a admin | `members.role = 'admin'` para el miembro seleccionado |
| Cambio de rol a member | `members.role = 'member'` para el miembro seleccionado |
| Intento de cambio denegado | `members.role` sin cambios; mensaje de error mostrado |
| No admin intenta acceder | Redirigido a `/dashboard/[groupId]`; mensaje de acceso denegado |

---

## 8. Definiciones funcionales

### Guest (miembro sin cuenta)
Miembro agregado manualmente por el admin. Se almacena en `members` con `user_id = null` y el campo `guest_name` (o equivalente) con el nombre ingresado. No puede autenticarse ni ver la app por sí mismo. Su historial puede vincularse posteriormente mediante US-19.

### Rol ADMIN
`members.role = 'admin'`. Puede ejecutar todas las acciones de esta US. Debe existir al menos un admin activo por grupo en todo momento.

### Rol MIEMBRO
`members.role = 'member'`. Puede ver la app como miembro, pero no accede a settings ni ejecuta acciones administrativas.

### Link de invitación activo
Registro en `invitation_links` con `group_id` correspondiente y estado activo (no expirado, no revocado). Se asume uno por grupo en MVP.

### Menú de opciones (⋮)
Acción contextual por fila de miembro en la lista. Muestra las opciones de cambio de rol disponibles según el rol actual del miembro seleccionado.

---

## 9. Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | Solo usuarios con `members.role = 'admin'` para el `group_id` activo pueden acceder a `/dashboard/[groupId]/settings`. |
| RN-02 | Un admin no puede cambiar su propio rol si es el único admin activo del grupo. |
| RN-03 | El cambio de rol siempre es bidireccional: `admin → member` o `member → admin`. La opción disponible en el menú (⋮) es la opuesta al rol actual del miembro. |
| RN-04 | Un guest se agrega con `user_id = null`. El campo nombre es obligatorio y no puede estar vacío. |
| RN-05 | Un guest agregado aparece inmediatamente en la lista de miembros tras confirmar el alta. |
| RN-06 | La copia del link al portapapeles no genera un nuevo link; solo copia el link activo existente. |
| RN-07 | El cambio de rol es efectivo de inmediato; no requiere confirmación adicional fuera del menú. |
| RN-08 | Los cambios de rol se validan server-side verificando `auth.uid()` y el rol actual antes de ejecutar la mutación. |
| RN-09 | La pantalla de settings no es accesible por URL directa para no admins; el middleware o server action redirige al dashboard con mensaje informativo. |
| RN-10 | Cada miembro de la lista muestra su avatar (foto de perfil si tiene cuenta) o iniciales si no tiene foto; los guests muestran iniciales del nombre ingresado. |

---

## 10. Flujo principal

**Precondición:** usuario autenticado, admin del grupo activo.

1. El admin toca su avatar en el header.
2. Selecciona "Configuración del grupo" en el menú del avatar (US-04).
3. Es redirigido a `/dashboard/[groupId]/settings`.
4. La pantalla carga la lista de miembros del grupo activo con nombre, avatar y rol.
5. El admin puede:
   - **Agregar miembros:** toca "Agregar" → se abre el modal → navega entre solapas → completa la acción.
   - **Cambiar rol:** toca (⋮) en un miembro → selecciona nuevo rol → cambio aplicado inmediatamente.
   - **Volver al dashboard:** toca el botón "Dashboard" con flecha hacia atrás → redirigido a `/dashboard/[groupId]`.

---

## 11. Flujos alternativos

### FA-01: Acceso denegado a no admin
- El usuario no admin accede directamente a `/dashboard/[groupId]/settings` por URL.
- El sistema detecta que `members.role ≠ 'admin'` para ese `group_id`.
- Redirige a `/dashboard/[groupId]`.
- Muestra mensaje de acceso denegado (tipo: warning/info).

### FA-02: Agregar guest — campo vacío
- El admin toca "Agregar" en la solapa "Agregar sin Cuenta" con el campo "Nombre" vacío.
- El sistema no ejecuta la mutación.
- Muestra error inline indicando que el nombre es obligatorio.
- El modal permanece abierto con el campo en foco.

### FA-03: Cambio de rol denegado (único admin)
- El admin intenta cambiar su propio rol siendo el único admin del grupo.
- El sistema detecta que no hay otro miembro con `role = 'admin'`.
- No ejecuta la mutación.
- Muestra mensaje de error indicando que debe haber al menos un admin.

### FA-04: Modal cerrado sin acción
- El admin abre el modal de agregar y lo cierra sin completar ninguna acción (toca fuera, "Cerrar" o ESC si aplica).
- El modal se cierra. No se ejecuta ninguna mutación. La lista de miembros no cambia.

### FA-05: Error de red al cambiar rol
- El admin intenta cambiar un rol y ocurre un error en el servidor.
- El sistema muestra un mensaje de error.
- El rol del miembro no cambia en la lista (rollback visual).

### FA-06: Error al agregar guest
- El admin intenta agregar un guest y ocurre un error en el servidor.
- El sistema muestra un mensaje de error.
- El guest no aparece en la lista.
- El modal permanece abierto para reintentar.

### FA-07: Invitation link no disponible
- El admin accede a la solapa "Invitar por link" y no existe un link activo para el grupo.
- El sistema muestra un estado informativo indicando que no hay link activo.
- No se muestra el botón de copiar (ver sección 18 — Definiciones abiertas).

---

## 12. UI / UX

### Fuente de verdad
Toda definición visual debe respetar: `docs/design/design-system.md`

### Comportamientos requeridos

- La pantalla de settings carga con un estado de **loading** antes de mostrar la lista de miembros.
- Si la lista está vacía (improbable pero posible), muestra un **empty state** explícito.
- El botón "Agregar" debe estar deshabilitado mientras una operación de alta está en curso (**submitting**).
- El menú (⋮) por fila de miembro debe cerrarse si el usuario toca fuera de él.
- El modal de agregar se abre con la solapa "Invitar por link" activa por defecto.
- El feedback de "copiado al portapapeles" es visual y temporal (desaparece automáticamente).
- Las solapas del modal son navegables sin cerrar el modal.
- La lista de miembros se actualiza inmediatamente tras agregar un guest (sin recarga de página).
- El cambio de rol se refleja inmediatamente en la fila del miembro (sin recarga de página).
- Los estados de error en el menú (⋮) son inline, no reemplazan la pantalla.
- El botón de retorno ("Dashboard" con flecha hacia atrás) sigue la convención de navegación interna del design system.

---

## 13. Mensajes y textos

### Fuente de verdad
Todos los textos estáticos deben definirse en: `lib/texts.json`

### Tipos de mensajes requeridos

| Contexto | Tipo |
|---|---|
| Acceso denegado a no admin | Warning / Info |
| Confirmación visual de link copiado | Success (transitorio) |
| Error: nombre de guest vacío | Error inline |
| Error: cambio de rol denegado (único admin) | Error inline |
| Error: fallo de red al cambiar rol | Error inline |
| Error: fallo de red al agregar guest | Error inline |
| Empty state: no hay link activo | Info |
| Título del modal de agregar | Label / Heading |
| Labels de solapas ("Invitar por link", "Agregar sin Cuenta") | Label |
| Label del campo "Nombre" en solapa de guest | Label |
| Labels de botones ("Agregar", "Cerrar", "Copiar") | Label |
| Label de roles en lista ("ADMIN", "MIEMBRO") | Label uppercase |
| Botón de retorno ("Dashboard") | Label |

---

## 14. Persistencia

### Tablas afectadas

| Tabla | Operación | Descripción |
|---|---|---|
| `members` | `SELECT` | Listar miembros del grupo con `profile_id`, `role`, `guest_name` |
| `members` | `INSERT` | Alta de guest (`user_id = null`, `guest_name = nombre ingresado`, `role = 'member'`) |
| `members` | `UPDATE` | Cambio de rol (`role = 'admin'` o `role = 'member'`) |
| `profiles` | `SELECT` | Obtener `full_name` y `avatar_url` para miembros con cuenta |
| `invitation_links` | `SELECT` | Obtener link activo del grupo para mostrar en solapa "Invitar por link" |

### Campos clave

- `members.role` — enum: `'admin'` | `'member'`
- `members.user_id` — `null` para guests
- `members.is_guest` — `boolean`; `true` cuando `user_id = null`
- `members.display_name` — nombre del guest (no nulo cuando `is_guest = true`); equivale al `guest_name` referenciado en secciones anteriores
- `members.group_id` — FK al grupo activo
- `invitation_links.token` — string aleatorio único; la URL compartible se construye como `[base_url]/join/[token]`
- `invitation_links.group_id` — FK al grupo

> **Corrección post-auditoría 2026-03-31:** el campo de nombre de guest es `display_name` (no `guest_name`). El link de invitación expone `token`, no una columna `url`. Las referencias a `guest_name` e `invitation_links.url` en secciones anteriores del PDD son incorrectas y serán corregidas en la próxima revisión de este documento.

### Validaciones server-side previas a mutación

- Alta de guest: `guest_name` no vacío, `group_id` pertenece al admin autenticado.
- Cambio de rol a `member`: verificar que quedan ≥ 1 admin restante en el grupo tras el cambio.
- Cambio de rol a `admin`: el miembro target pertenece al grupo y el solicitante es admin.

---

## 15. Seguridad

- Acceso a la pantalla protegido por middleware: valida `auth.uid()` y `members.role = 'admin'` para el `group_id` antes de renderizar.
- RLS en `members`: un usuario solo puede leer miembros del grupo al que pertenece.
- RLS en `members` (escritura): solo admins del grupo pueden hacer `INSERT` (guest) o `UPDATE` (rol).
- RLS en `invitation_links`: solo admins del grupo pueden leer el link activo.
- Nunca confiar solo en el frontend para verificar el rol. Toda mutación valida `auth.uid()` en server action.
- El `group_id` en la URL debe validarse contra la membresía del usuario autenticado antes de responder cualquier query.
- No exponer `user_id` de otros miembros ni datos de otros grupos en la respuesta.

---

## 16. Dependencias

| Dependencia | Tipo | Descripción |
|---|---|---|
| US-04 — Avatar menú | Upstream | El punto de entrada a settings es el menú del avatar. Settings debe recibir el `groupId` activo del contexto de sesión. |
| US-05 — Selector de grupo | Upstream | El grupo activo en contexto determina qué miembros se muestran. |
| US-07 — Configuración de rotación | Downstream | La rotación se construye sobre la lista de miembros gestionada aquí. |
| US-08 — Configuración de nombre | Sibling | Misma pantalla de settings, sección diferente. Comparte layout y guard de acceso. |
| US-18 — Join por invitación | Dependencia técnica | El link de invitación mostrado en la solapa "Invitar por link" es generado y gestionado por el flujo de US-18. |
| US-19 — Vincular guest a cuenta | Downstream | El menú (⋮) de guests incluirá "Vincular cuenta" en US-19. Esta US sienta las bases del listado. |

---

## 17. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Admin degrada su propio rol quedando el grupo sin admin | Media | Alto | RN-02 + validación server-side antes de ejecutar UPDATE |
| Link de invitación no existente en la DB al acceder a la solapa | Baja | Medio | FA-07: mostrar estado informativo en lugar de error técnico |
| Race condition: dos admins cambian el rol del mismo miembro al mismo tiempo | Muy baja | Medio | La validación server-side es atómica; el segundo UPDATE fallará si el estado cambió |
| Guest agregado con nombre duplicado confunde a admins | Baja | Bajo | No es una restricción del Gherkin; aceptable en MVP. Contemplar en futuras iteraciones |
| El admin actualiza la lista desde dos tabs simultáneas | Muy baja | Bajo | La lista se actualiza optimísticamente; sin sincronización en tiempo real en MVP |

---

## 18. Casos borde

| Caso | Comportamiento esperado |
|---|---|
| Grupo con un solo miembro (el admin) | La lista muestra solo al admin. La opción de cambio de rol está deshabilitada para sí mismo. No hay otros miembros para mostrar. |
| Admin intenta cambiar su propio rol (único admin) | El sistema bloquea la acción (FA-03). Mensaje de error visible. |
| Admin con múltiples grupos accede a settings de un grupo ajeno por URL | El middleware valida que el `group_id` de la URL corresponde a un grupo donde el usuario es admin. Si no, redirige. |
| Nombre de guest con solo espacios | Debe tratarse como vacío (trimming server-side y/o frontend). Mostrar error de campo obligatorio. |
| Nombre de guest extremadamente largo | Definir límite máximo de caracteres (sugerido: 50). Validar antes de ejecutar INSERT. (Ver Definiciones abiertas). |
| Invitation link expirado o revocado presente en DB | La solapa muestra el link como no disponible. No mostrar links inactivos como válidos. |
| Guest con el mismo nombre que un miembro existente | Permitido en MVP. No hay unicidad por nombre en el dominio. |

---

## 19. Criterios de aceptación desarrollados

### Scenario 01: Acceso desde el menú del avatar
- **Dado:** usuario autenticado, admin del grupo activo.
- **Cuando:** toca avatar → selecciona "Configuración del grupo".
- **Entonces:** es redirigido a `/dashboard/[groupId]/settings` correctamente.
- **Validaciones:** `groupId` en URL corresponde al grupo activo en sesión. El layout de settings carga con la lista de miembros del grupo correcto.

---

### Scenario 02: Ver lista de miembros
- **Dado:** el admin está en `/dashboard/[groupId]/settings`.
- **Cuando:** la pantalla carga.
- **Entonces:** se muestra la lista de todos los miembros del grupo. Cada fila contiene: avatar (foto o iniciales), nombre completo (o `guest_name` para guests), y etiqueta de rol (`ADMIN` / `MIEMBRO`).
- **Validaciones:** los datos provienen de `members` + `profiles`. No se muestran miembros de otros grupos.

---

### Scenario 03: Modal para agregar miembros
- **Dado:** el admin está en la sección de miembros.
- **Cuando:** toca "Agregar".
- **Entonces:** se abre un modal con dos solapas visibles: "Invitar por link" (activa por defecto) y "Agregar sin Cuenta".
- **Validaciones:** el modal tiene foco accesible. Las solapas son navegables sin cerrar el modal.

---

### Scenario 04: Agregar miembro via link de invitación
- **Dado:** el modal está abierto en la solapa "Invitar por link".
- **Cuando:** el admin visualiza esa solapa.
- **Entonces:** ve el link de invitación activo del grupo. Hay un botón para copiar al portapapeles. Al copiar, aparece confirmación visual.
- **Validaciones:** el link copiado es el de `invitation_links` activo para el `group_id`. El feedback visual es transitorio.

---

### Scenario 05: Agregar miembro sin Cuenta (solapa)
- **Dado:** el modal está abierto, el admin navega a la solapa "Agregar sin Cuenta".
- **Cuando:** llega a esa solapa.
- **Entonces:** ve campo de texto "Nombre" (obligatorio), botón "Cerrar" y botón "Agregar".
- **Validaciones:** el campo está vacío al abrir la solapa. "Agregar" dispara validación antes de mutar.

---

### Scenario 06: Miembro agregado (guest)
- **Dado:** modal abierto, solapa "Agregar sin Cuenta", nombre válido ingresado.
- **Cuando:** el admin selecciona "Agregar".
- **Entonces:** el modal se cierra. El guest aparece inmediatamente en la lista de miembros con su nombre y rol `MIEMBRO`.
- **Validaciones:** se crea registro en `members` con `user_id = null` y `guest_name = nombre ingresado`. El avatar del guest muestra iniciales del nombre. El `group_id` es el del grupo activo.

---

### Scenario 07: Cambiar rol de un miembro
- **Dado:** el admin está en la lista de miembros.
- **Cuando:** toca (⋮) en un miembro → selecciona el nuevo rol.
- **Entonces:** el cambio se aplica inmediatamente. La fila del miembro refleja el nuevo rol.
- **Validaciones:** solo se muestra la opción opuesta al rol actual (si es admin, aparece "Hacer miembro"; si es member, aparece "Hacer admin"). La mutación valida `auth.uid()` server-side.

---

### Scenario 08: No se puede cambiar el rol del propio admin (único)
- **Dado:** el admin es el único con `role = 'admin'` en el grupo.
- **Cuando:** intenta cambiar su propio rol.
- **Entonces:** el sistema bloquea la acción. Aparece mensaje de error indicando que debe haber al menos un admin.
- **Validaciones:** no se ejecuta UPDATE en `members`. La validación ocurre server-side antes de mutar.

---

### Scenario 09: Volver al dashboard desde configuración
- **Dado:** el admin está en `/dashboard/[groupId]/settings`.
- **Cuando:** toca el botón "Dashboard" con flecha hacia atrás.
- **Entonces:** es redirigido a `/dashboard/[groupId]`.
- **Validaciones:** la navegación preserva el `groupId` activo. No hay pérdida de sesión ni de contexto de grupo.

---

### Scenario 10: Usuario no admin no puede acceder a configuración
- **Dado:** el usuario autenticado tiene `members.role = 'member'` para el `group_id` en la URL.
- **Cuando:** intenta acceder a `/dashboard/[groupId]/settings` directamente.
- **Entonces:** es redirigido a `/dashboard/[groupId]`. Ve un mensaje de acceso denegado.
- **Validaciones:** la redirección y el mensaje se muestran sin renderizar ningún contenido de settings. El guard ocurre server-side (middleware o server component), no solo en UI.

---

## 20. Checklist diseño

- [ ] La pantalla no usa bordes sólidos de 1px para separar secciones — usa cambios de superficie, espacio o sombra.
- [ ] Los roles (`ADMIN`, `MIEMBRO`) se muestran con el estilo `Label`: uppercase, tracking amplio, `DM Sans 600`.
- [ ] El avatar de cada miembro sigue el patrón del design system: foto de perfil si existe, iniciales si no.
- [ ] El modal usa superficie `surface_lowest` como fondo elevado sobre el resto de la pantalla.
- [ ] El feedback de "copiado" usa el token de color `tertiary` para indicar estado success.
- [ ] El estado de error usa el token `error` sin exponer detalles técnicos.
- [ ] El botón de retorno ("Dashboard" con flecha) sigue la convención de navegación interna del design system.
- [ ] Las solapas del modal usan la convención de `Tab` del design system (`docs/design/design-system.md`).
- [ ] El estado loading de la lista usa skeleton, no spinner solo.
- [ ] El empty state de la lista (si aplica) es explícito, con texto y sin pantalla en blanco.

> **Auditoría 2026-03-31:** checklist de diseño pendiente de validación visual. No se detectaron issues de diseño en la revisión de código — requiere revisión manual contra el design system.

---

## 21. Checklist desarrollo

- [x] Guard de acceso implementado server-side: valida `auth.uid()` + `members.role = 'admin'` para el `group_id` antes de renderizar la página. _(settings/page.tsx)_
- [x] Query de lista de miembros usa `.select()` con campos explícitos. _(settings/page.tsx carga members + profiles)_
- [x] Server action para INSERT de guest: valida nombre no vacío y `group_id` perteneciente al admin. _(lib/actions/members.ts — `addGuestMember()`)_
- [x] Server action para UPDATE de rol: valida que quedan ≥ 1 admin tras el cambio. _(settings/actions.ts — `updateMemberRole()`)_
- [x] Query para `invitation_links`: obtiene link activo por `group_id`. _(lib/actions/invitation-links.ts — `getActiveInvitationLink()`)_
- [x] Todos los textos estáticos viven en `lib/texts.json`. _(verificado — sin hardcoding detectado)_
- [x] No hay queries directas a Supabase desde componentes UI. _(componentes reciben datos por props desde page.tsx)_
- [x] El cliente usado en server actions es el cliente server de Supabase.
- [x] El nombre del guest se limpia de espacios al inicio y al final antes de enviarse al servidor. _(addGuestMember() aplica trim)_
- [x] **[ISSUE-01 ✅]** RLS policy `members: update admin` creada. _(migración `20260331_members_update_admin_rls.sql`)_
- [x] **[ISSUE-01 ✅]** Comentario de auditoría actualizado en `actions.ts` — issue cerrado.
- [x] **[ISSUE-02 ✅]** Opción "Eliminar del grupo" removida del menú (⋮) para miembros con cuenta. Solo guests conservan la opción de eliminar. _(SettingsMembersSection.tsx)_
- [x] **[ISSUE-03 ✅]** Modal `changeRoleDialog` eliminado; cambio de rol ejecuta `handleRoleChange()` directamente al seleccionar la opción. _(SettingsMembersSection.tsx)_
- [x] La página de settings está en `app/(dashboard)/dashboard/[groupId]/settings/page.tsx`. _(nota: difiere de la estructura en CLAUDE.md — ver ISSUE-06)_
- [ ] **[DA-01]** Límite de caracteres del nombre de guest alineado entre PDD y `addGuestMember()` (actualmente 80 chars en código; PDD sugiere 50). Decidir y corregir.
- [x] El feedback de rol cambiado es optimista con rollback en caso de error. _(implementado en SettingsMembersSection.tsx)_

---

## 22. Checklist QA

> **Prerequisito:** los items marcados con 🔴 no pueden testearse hasta que ISSUE-01 esté resuelto (RLS policy faltante).

- [ ] **Scenario 01:** admin accede a settings desde el menú del avatar. URL correcta. Contenido del grupo correcto.
- [ ] **Scenario 02:** la lista muestra nombre, avatar y rol de cada miembro. Los guests muestran iniciales basadas en `display_name`.
- [ ] **Scenario 03:** el modal abre con solapa "Invitar por link" activa. Ambas solapas son navegables sin cerrar el modal.
- [ ] **Scenario 04:** el link de invitación se muestra. El botón copiar funciona. El feedback visual aparece y desaparece automáticamente.
- [ ] **Scenario 05:** la solapa "Agregar sin Cuenta" muestra campo Nombre + botones Cerrar y Agregar.
- [ ] **Scenario 06:** guest agregado con nombre válido aparece en lista inmediatamente. Modal se cierra. Sin recarga de página.
- [ ] **Scenario 06 (FA-02):** agregar guest con nombre vacío → error inline visible. Modal no se cierra. No se ejecuta mutación.
- [ ] **Scenario 07:** cambio de rol sobre otro miembro se refleja inmediatamente (sin modal de confirmación). El menú (⋮) muestra la opción opuesta al rol actual.
- [ ] **Scenario 07 — self:** admin cambia su propio rol cuando hay otro admin en el grupo → cambio aplicado.
- [ ] **Scenario 08:** único admin intenta cambiar su propio rol → sistema bloquea. Error visible. Rol no cambia en DB.
- [ ] **Scenario 09:** botón "Dashboard" redirige a `/dashboard/[groupId]` correctamente.
- [ ] **Scenario 10:** usuario no admin redirigido a dashboard. Mensaje de acceso denegado visible. Settings no se renderiza.
- [ ] **FA-03:** admin intenta degradar a otro admin siendo el único admin restante → bloqueado con mensaje de error.
- [ ] **FA-05:** fallo de red al cambiar rol → error visible, rol no cambia en lista (rollback visual).
- [ ] **FA-06:** fallo de red al agregar guest → error visible, guest no aparece en lista, modal permanece abierto.
- [ ] **Seguridad:** admin de grupo A intenta acceder a `/dashboard/[groupId-B]/settings` por URL → redirección.
- [ ] **Seguridad:** mutación de rol vía herramienta externa sin ser admin → rechazada por RLS.
- [ ] **Edge case:** nombre de guest con solo espacios → tratado como vacío, error de campo obligatorio.
- [ ] **Edge case:** nombre de guest en el límite máximo de caracteres → validar que se acepta. Por encima del límite → error inline.

---

## 23. Trazabilidad

| Scenario Gherkin | Sección PDD principal | Cobertura |
|---|---|---|
| Scenario 01 — Acceso desde el menú del avatar | §10 Flujo principal, §15 Seguridad, §19 CA-01 | Completa |
| Scenario 02 — Ver lista de miembros | §8 Definiciones, §14 Persistencia, §19 CA-02 | Completa |
| Scenario 03 — Modal para agregar miembros | §10 Flujo principal, §12 UI/UX, §19 CA-03 | Completa |
| Scenario 04 — Agregar miembro via link | §8 Definiciones, §14 Persistencia, §19 CA-04 | Completa |
| Scenario 05 — Agregar miembro sin Cuenta | §9 RN-04, §12 UI/UX, §19 CA-05 | Completa |
| Scenario 06 — Miembro agregado (guest) | §9 RN-04, RN-05, §14 Persistencia, §19 CA-06 | Completa |
| Scenario 07 — Cambiar rol de un miembro | §9 RN-03, RN-07, RN-08, §19 CA-07 | Completa |
| Scenario 08 — No se puede cambiar rol del único admin | §9 RN-02, §11 FA-03, §19 CA-08 | Completa |
| Scenario 09 — Volver al dashboard | §10 Flujo principal, §19 CA-09 | Completa |
| Scenario 10 — No admin no puede acceder | §9 RN-01, §11 FA-01, §15 Seguridad, §19 CA-10 | Completa |

---

## 24. Definiciones abiertas

### DA-01: Límite de caracteres del nombre del guest
El Gherkin no especifica longitud máxima. El código actual valida 80 chars en `addGuestMember()`. El PDD sugería 50 chars. **Pendiente:** decidir el valor definitivo y alinear código y PDD.

### DA-02: Comportamiento cuando no existe invitation link activo ✅ Resuelta
El link de invitación se genera automáticamente por trigger al crear el grupo. Si está expirado o revocado, `InvitationLinkPanel` ofrece regeneración. FA-07 es prácticamente inalcanzable en el flujo normal. La solapa "Invitar por link" siempre tendrá un link disponible o la opción de regenerar.

### DA-03: Cambio de rol de otro admin (cuando hay múltiples admins) ✅ Resuelta
El código no aplica restricción adicional cuando hay ≥ 2 admins. Un admin puede degradar a otro admin libremente. La única restricción es RN-02: no se puede degradar al último admin. Comportamiento confirmado.

### DA-04: Orden de la lista de miembros
El Gherkin no especifica criterio de ordenamiento. **Pendiente:** verificar el ORDER BY en la query de settings page y documentar el criterio definitivo.

---

## 25. Resumen

**US-06** entrega la pantalla de configuración de miembros del grupo en `/dashboard/[groupId]/settings`, accesible exclusivamente para admins. Permite ver la composición del grupo, invitar por link, agregar guests sin cuenta, y gestionar roles con restricción de unicidad de admin. Incluye 10 Scenarios Gherkin completamente cubiertos, 4 definiciones abiertas que requieren decisión antes de implementar, y un guard de seguridad server-side que redirige a cualquier no-admin que intente acceder por URL directa.

---

*PDD generado por Claude Code · monthly-dinner · Marzo 2026*
