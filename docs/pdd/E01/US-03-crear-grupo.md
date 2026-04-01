# PDD — US-03 · Crear grupo

---

## 1. Identificación

| Campo | Valor |
|---|---|
| **Epic** | E01 — Creación de grupo |
| **User Story** | US-03 — Crear grupo |
| **Prioridad** | P0 — Bloqueante (precondición para todo el producto) |
| **Objetivo de negocio** | Permitir que un usuario autenticado cree su propio grupo de cenas, defina su frecuencia de reunión y quede establecido como admin, habilitando así el acceso al resto de las funcionalidades del producto. |

---

## 2. Problema a resolver

Sin grupo creado, el usuario no tiene contexto operativo en el producto. Actualmente no existe un flujo estructurado que capture nombre, frecuencia y día de reunión en un solo paso, ni que genere automáticamente los próximos eventos según esa configuración. Esto fuerza coordinación manual y elimina la propuesta de valor central del producto.

---

## 3. Objetivo funcional

Al completar el flujo de creación de grupo:
- El grupo queda persistido con `name`, `frequency`, `meeting_week` (cuando aplique) y `meeting_day_of_week`.
- El usuario creador queda registrado como miembro con `role = admin`.
- El sistema genera automáticamente los próximos 3 eventos del grupo según la configuración ingresada.
- El usuario es redirigido al dashboard del grupo recién creado (`/dashboard/[groupId]`).

---

## 4. Alcance

### Incluye

- Formulario de creación de grupo accesible en `/grupo/new`.
- Campos: nombre del grupo, frecuencia (semanal / dos veces por mes / mensual), semana del mes (condicional), día de la semana.
- Vista previa dinámica del texto de recurrencia según la configuración seleccionada.
- Validación de campos obligatorios con mensajes de error inline.
- Validación de nombre duplicado para el mismo usuario.
- Persistencia del grupo en tabla `groups`, membresía en tabla `members` con `role = admin`.
- Generación automática de los próximos 3 eventos del grupo en tabla `events`.
- Restricción de acceso al grupo: ningún usuario externo puede ver el grupo sin link de invitación válido.
- Redirección al dashboard del grupo creado al confirmar.

### No incluye

- Gestión de miembros post-creación (cubierto por US-06).
- Configuración de rotación (cubierto por US-07).
- Edición de nombre del grupo post-creación (cubierto por US-08).
- Generación o distribución de links de invitación (cubierto por US-06).
- Notificaciones al grupo (no aplica en creación — grupo sin miembros aún).
- Configuración del organizador inicial.

---

## 5. Actor principal

**Usuario autenticado** — cualquier usuario con sesión activa. No requiere pertenecer a ningún grupo previo.

---

## 6. Precondiciones

- El usuario debe estar autenticado (sesión válida).
- El usuario puede no pertenecer a ningún grupo aún (flujo de onboarding) o pertenecer a uno o más grupos existentes.
- La ruta `/grupo/new` debe estar protegida por middleware (solo accesible para usuarios autenticados).

---

## 7. Postcondiciones

- Existe un registro en tabla `groups` con los campos completados.
- Existe un registro en tabla `members` con `user_id = auth.uid()` y `role = admin` asociado al grupo creado.
- Existen 3 registros en tabla `events` generados automáticamente con fechas calculadas según `frequency`, `meeting_week` y `meeting_day_of_week`.
- La cookie `last_group_id` se actualiza con el `id` del grupo recién creado.
- El usuario visualiza el dashboard del nuevo grupo.

---

## 8. Definiciones funcionales

### Frecuencias disponibles

| Valor en DB | Etiqueta en UI | Campos requeridos adicionales | Vista previa |
|---|---|---|---|
| `semanal` | Semanal | Solo `meeting_day_of_week` | "Todos los {day}" |
| `quincenal` | Dos veces por mes | `meeting_week` (opciones: "1° y 3°" / "2° y 4°") + `meeting_day_of_week` | "El {weeks} {day} de cada mes" |
| `mensual` | Mensual | `meeting_week` (opciones: 1°, 2°, 3°, 4°, Última) + `meeting_day_of_week` | "El {ordinal} {day} de cada mes" |

### Semanas del mes

| Frecuencia | Opciones | Valor en DB |
|---|---|---|
| `quincenal` | "1° y 3°" / "2° y 4°" | `odd` / `even` |
| `mensual` | 1°, 2°, 3°, 4°, Última | `w1`, `w2`, `w3`, `w4`, `w5` |

### Días de la semana

Lunes a Domingo. Etiquetas abreviadas disponibles en `texts.json` → `group.createGroup.days.*`.

### Vista previa dinámica

- Aparece solo cuando la configuración está completa (frecuencia + todos los campos requeridos).
- Si la configuración queda incompleta (ej. se cambió la frecuencia y hay campos sin completar), la vista previa no se muestra o se oculta.
- Textos de vista previa en `texts.json` → `group.createGroup.previewSemanal`, `previewMensual`, `previewQuincenal`.

### Generación automática de eventos

- Al confirmar la creación, el sistema calcula las próximas 3 fechas de reunión según `frequency`, `meeting_week` y `meeting_day_of_week`, contando desde la fecha de creación del grupo.
- Los eventos se crean en tabla `events` asociados al `group_id` del nuevo grupo.
- El estado inicial de los eventos generados automáticamente debe ser coherente con el estado del producto en ese momento (sin organizador asignado aún).

---

## 9. Reglas de negocio

1. **Nombre único por usuario:** Un usuario no puede tener dos grupos con el mismo nombre. La validación es case-insensitive y contempla trim de espacios.
2. **Nombre obligatorio:** No se permite crear un grupo sin nombre.
3. **Frecuencia obligatoria:** Debe seleccionarse una frecuencia antes de confirmar.
4. **Semana condicional:** Para frecuencia `mensual` y `quincenal`, el campo de semana es obligatorio. Para `semanal`, no existe ni se valida.
5. **Día obligatorio:** El campo de día de la semana es obligatorio en todas las frecuencias.
6. **Reset de campos dependientes:** Al cambiar la frecuencia, solo se resetean los campos que no aplican a la nueva selección. El día se preserva si sigue siendo válido.
7. **Trim de nombre:** El nombre se guarda sin espacios al inicio o al final.
8. **Acceso al grupo:** El grupo no es visible para usuarios externos. El acceso solo es posible mediante link de invitación válido (gestionado en US-06).
9. **Admin automático:** El creador del grupo queda asignado automáticamente como admin (`role = admin` en tabla `members`).
10. **Generación de eventos:** El sistema genera exactamente los próximos 3 eventos al momento de la creación. La lógica de cálculo vive en el servidor.

---

## 10. Flujo principal

1. El usuario autenticado accede a `/grupo/new` (desde onboarding o desde el header).
2. Se muestra el formulario de creación de grupo.
3. El usuario completa el nombre del grupo.
4. El usuario selecciona la frecuencia.
5. Según la frecuencia seleccionada:
   - `semanal`: se muestra solo el selector de día.
   - `quincenal`: se muestran el selector de semanas del mes (dos opciones) y el selector de día.
   - `mensual`: se muestran el selector de semana del mes (cinco opciones) y el selector de día.
6. La vista previa se actualiza dinámicamente conforme el usuario completa los campos requeridos.
7. El usuario confirma tocando el botón de submit.
8. El sistema valida todos los campos obligatorios.
9. El sistema verifica que el nombre no esté duplicado para ese usuario.
10. Se persiste el grupo en tabla `groups`.
11. Se persiste la membresía del creador en tabla `members` con `role = admin`.
12. Se generan los próximos 3 eventos en tabla `events`.
13. Se actualiza la cookie `last_group_id`.
14. El usuario es redirigido a `/dashboard/[groupId]`.

---

## 11. Flujos alternativos

### FA-01: Nombre duplicado (Scenario 03)
- En el paso 9, si ya existe un grupo con ese nombre para el mismo usuario:
  - Se muestra un mensaje de error inline indicando que el nombre ya está en uso.
  - El grupo no se crea.
  - El formulario permanece con los datos ingresados (no se limpia).

### FA-02: Campos obligatorios vacíos (Scenario 09)
- En el paso 8, si algún campo visible y obligatorio está vacío:
  - Se indican los campos faltantes con mensajes de error inline.
  - El grupo no se crea.
  - El formulario permanece con los datos ingresados.

### FA-03: Cambio de frecuencia con campos ya completados (Scenario 08)
- Si el usuario cambia la frecuencia después de haber completado semana y/o día:
  - Solo se resetean los campos que no aplican a la nueva frecuencia.
  - Si la configuración queda incompleta, la vista previa se oculta o se actualiza.
  - Si la configuración queda completa, la vista previa se actualiza.

### FA-04: Acceso sin invitación (Scenario 04)
- Si otro usuario intenta acceder al grupo sin link de invitación válido:
  - El grupo no es visible ni accesible para ese usuario.
  - Este comportamiento está garantizado por RLS en tabla `groups` y `members`.

---

## 12. UI / UX

### Fuente de verdad

Referenciar: [design/design-system.md](../design/design-system.md)

### Comportamientos requeridos

- El formulario debe mostrar y ocultar campos de manera reactiva según la frecuencia seleccionada, sin recargar la página.
- La vista previa debe actualizarse en tiempo real conforme se completan los campos.
- Si la configuración queda incompleta tras un cambio de frecuencia, la vista previa debe ocultarse o indicar que faltan datos.
- Los errores de validación deben mostrarse inline, junto al campo correspondiente, sin limpiar el valor ingresado.
- El botón de submit debe mostrarse en estado `submitting` (texto `group.createGroup.submitPending`) mientras la mutación está en curso.
- El botón de submit debe deshabilitarse durante el estado de `submitting` para evitar envíos duplicados.
- La pantalla debe contemplar los estados: loading (si precarga datos), error (si la creación falla), submitting y success (redirección).
- Mobile-first: la composición del formulario y sus campos deben estar optimizados para pantallas móviles.

---

## 13. Mensajes y textos

### Fuente de verdad

Referenciar: [lib/texts.json](../../lib/texts.json)

### Claves de texts.json relevantes

| Tipo | Clave |
|---|---|
| Labels e instrucciones del formulario | `group.createGroup.*` |
| Días de la semana | `group.createGroup.days.*` |
| Semanas del mes (mensual) | `group.createGroup.weeks.*` |
| Semanas del mes (quincenal) | `group.createGroup.biweeklyWeeks.*` |
| Ordinales para vista previa | `group.createGroup.ordinals.*` |
| Vista previa semanal | `group.createGroup.previewSemanal` |
| Vista previa mensual | `group.createGroup.previewMensual` |
| Vista previa quincenal | `group.createGroup.previewQuincenal` |
| Botón submit idle | `group.createGroup.submitIdle` |
| Botón submit pending | `group.createGroup.submitPending` |
| Nota sobre rol de creador | `group.createGroup.creatorNote` |
| Pantalla de grupo creado | `group.groupCreated.*` |
| Error nombre requerido | `group.createGroup.errors.nameRequired` |
| Error frecuencia requerida | `group.createGroup.errors.frequencyRequired` |
| Error semana requerida (mensual) | `group.createGroup.errors.weekRequired` |
| Error semanas requeridas (quincenal) | `group.createGroup.errors.weeksRequired` |
| Error día requerido | `group.createGroup.errors.dayRequired` |
| Error nombre duplicado | `errors.groups.duplicateName` |
| Error creación fallida | `errors.groups.createFailed` |
| Error frecuencia inválida | `errors.groups.invalidFrequency` |

### Tipos de mensajes requeridos

- **Error inline por campo:** nombre requerido, frecuencia requerida, semana requerida, día requerido.
- **Error inline de negocio:** nombre duplicado para el mismo usuario.
- **Error de sistema:** fallo al crear el grupo (toast o inline).
- **Estado de carga del botón:** submitting mientras la mutación está en curso.

---

## 14. Persistencia

### Tabla `groups`

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | uuid | Sí (auto) | PK del grupo |
| `name` | text | Sí | Nombre del grupo (trimmed) |
| `frequency` | text | Sí | `semanal` / `quincenal` / `mensual` |
| `meeting_week` | text | Condicional | `null` para semanal; `odd`/`even` para quincenal; `w1`–`w5` para mensual |
| `meeting_day_of_week` | text | Sí | Día de la semana en español (lunes–domingo) |
| `created_at` | timestamptz | Sí (auto) | Timestamp de creación |

### Tabla `members`

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `group_id` | uuid | Sí | FK al grupo creado |
| `user_id` | uuid | Sí | `auth.uid()` del creador |
| `role` | text | Sí | Valor fijo: `admin` |

### Tabla `events`

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `group_id` | uuid | Sí | FK al grupo creado |
| `date` | date | Sí | Fecha calculada según configuración del grupo |
| *(otros campos)* | — | — | Según schema de events definido en la arquitectura |

- Se generan exactamente 3 registros, calculados desde la fecha de creación del grupo hacia adelante.
- La lógica de cálculo debe vivir en una Server Action o función server-side; nunca en el cliente.

---

## 15. Seguridad

- La ruta `/grupo/new` debe estar protegida por middleware; usuarios no autenticados son redirigidos al login.
- La Server Action de creación debe validar `auth.uid()` antes de ejecutar cualquier mutación.
- La validación de nombre duplicado debe realizarse server-side, no solo en el cliente.
- RLS en tabla `groups`: un usuario solo puede leer grupos de los que es miembro.
- RLS en tabla `members`: un usuario solo puede ver membresías de sus propios grupos.
- RLS en tabla `events`: un usuario solo puede ver eventos de grupos de los que es miembro.
- La generación de eventos automáticos debe ejecutarse server-side dentro de la misma transacción que la creación del grupo.
- No confiar en validaciones del cliente para restricciones de seguridad o unicidad.

### Casos a contemplar

| Caso | Comportamiento esperado |
|---|---|
| Usuario no autenticado intenta acceder a `/grupo/new` | Redirigido al login por middleware |
| Usuario autenticado crea grupo con nombre duplicado | Error de negocio devuelto por server action, no se persiste |
| Usuario externo intenta acceder al grupo por URL directa | RLS bloquea el acceso; redirigido o recibe 403 |
| Usuario autenticado intenta crear grupo con frecuencia inválida | Validación server-side rechaza la mutación |

---

## 16. Dependencias

| Dependencia | Tipo | Descripción |
|---|---|---|
| US-01 / US-02 | Funcional (previa) | El usuario debe estar autenticado para acceder al flujo |
| US-06 | Funcional (posterior) | La gestión de miembros e invitaciones usa el `groupId` creado aquí |
| US-07 | Funcional (posterior) | La configuración de rotación usa los eventos generados aquí |
| Tabla `groups` | Datos | Persistencia del grupo creado |
| Tabla `members` | Datos | Asignación del creador como admin |
| Tabla `events` | Datos | Generación automática de los próximos 3 eventos |
| Cookie `last_group_id` | Infraestructura | Debe actualizarse al crear el grupo para que el login posterior redirija correctamente |

---

## 17. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Lógica de cálculo de fechas incorrecta para casos borde (ej. mes sin 5° semana) | Media | Alto | Cubrir con tests unitarios para cada combinación de frecuencia/semana/día |
| Creación parcial: grupo guardado pero eventos no generados | Baja | Alto | Ejecutar todo en una única transacción server-side; rollback si falla alguna parte |
| Nombre duplicado por race condition (dos peticiones simultáneas) | Muy baja | Medio | Constraint UNIQUE a nivel DB en `(user_id, name)` además de validación server-side |
| Campo `meeting_week` enviado para frecuencia semanal | Baja | Medio | Validación server-side que rechaza `meeting_week` no nulo cuando `frequency = semanal` |

---

## 18. Casos borde

| Caso | Comportamiento esperado |
|---|---|
| Nombre con solo espacios | El sistema aplica trim y lo trata como nombre vacío → error de validación |
| Cambio de frecuencia de `mensual` a `semanal` con semana y día ya seleccionados | Se resetea `meeting_week`; el día se preserva si el usuario ya lo había elegido |
| Cambio de frecuencia de `quincenal` a `mensual` | Se resetea `meeting_week` (las opciones de quincenal no son válidas para mensual); el día se preserva |
| El usuario tiene 1 grupo y crea otro con distinto nombre | Se permite; los dos grupos coexisten bajo el mismo usuario |
| Fallo de red durante el submit | La Server Action retorna error; el formulario permanece con los datos ingresados y muestra mensaje de error |
| El usuario crea el grupo y luego otro usuario accede a la URL directa sin invitación | RLS impide la lectura; el usuario externo no puede ver el grupo |
| `meeting_day_of_week = domingo` con frecuencia mensual y semana "Última" | El sistema debe calcular correctamente la fecha del último domingo del mes |

---

## 19. Criterios de aceptación desarrollados

### Scenario 01 — Formulario
- **Precondición:** Usuario autenticado.
- **Trigger:** Accede a `/grupo/new`.
- **Resultado esperado:** Se renderiza el formulario de creación de grupo con los campos correspondientes a la sección `group.createGroup` del design system y `texts.json`.
- **Cobertura:** Sección 10 (flujo principal, paso 2), Sección 12 (UI/UX).

---

### Scenario 02 — Creación exitosa
- **Precondición:** Usuario autenticado con datos válidos completos en el formulario.
- **Trigger:** Confirma el formulario.
- **Resultado esperado:**
  - Registro en `groups` con todos los campos persistidos.
  - Registro en `members` con `role = admin` y `user_id = auth.uid()`.
  - 3 registros en `events` generados automáticamente.
  - Redirección a `/dashboard/[groupId]`.
- **Cobertura:** Sección 10 (pasos 8–14), Sección 14 (persistencia).

---

### Scenario 03 — Nombre duplicado del mismo usuario
- **Precondición:** El usuario ya tiene un grupo con el mismo nombre.
- **Trigger:** Intenta confirmar el formulario con ese nombre.
- **Resultado esperado:**
  - Error inline indicando nombre duplicado (`errors.groups.duplicateName`).
  - El grupo no se crea.
  - El formulario mantiene los datos ingresados.
- **Cobertura:** Sección 9 (regla 1), Sección 11 (FA-01).

---

### Scenario 04 — Acceso restringido al grupo
- **Precondición:** El grupo fue creado exitosamente.
- **Trigger:** Otro usuario sin invitación intenta acceder al grupo.
- **Resultado esperado:**
  - RLS bloquea el acceso a datos del grupo desde cualquier query.
  - El grupo no es visible para ese usuario.
- **Cobertura:** Sección 9 (regla 8), Sección 15 (seguridad).

---

### Scenario 05 — Frecuencia semanal muestra solo día
- **Precondición:** Usuario en el formulario.
- **Trigger:** Selecciona frecuencia "Semanal".
- **Resultado esperado:**
  - Solo se muestra el selector de día de la semana.
  - No se muestra el campo de semana del mes.
  - La vista previa muestra el texto correspondiente a `group.createGroup.previewSemanal` cuando el día está seleccionado.
- **Cobertura:** Sección 8 (frecuencias), Sección 12 (comportamientos reactivos).

---

### Scenario 06 — Frecuencia dos veces por mes muestra semanas en par y día
- **Precondición:** Usuario en el formulario.
- **Trigger:** Selecciona frecuencia "Dos veces por mes".
- **Resultado esperado:**
  - Se muestra el selector de semanas con opciones "1° y 3°" y "2° y 4°" (`group.createGroup.biweeklyWeeks.*`).
  - Se muestra el selector de día de la semana.
  - La vista previa usa `group.createGroup.previewQuincenal` cuando ambos campos están completos.
- **Cobertura:** Sección 8 (frecuencias), Sección 12 (comportamientos reactivos).

---

### Scenario 07 — Frecuencia mensual muestra semana del mes y día
- **Precondición:** Usuario en el formulario.
- **Trigger:** Selecciona frecuencia "Mensual".
- **Resultado esperado:**
  - Se muestra el selector de semana del mes con opciones 1°, 2°, 3°, 4°, Última (`group.createGroup.weeks.*`).
  - Se muestra el selector de día de la semana.
  - La vista previa usa `group.createGroup.previewMensual` con ordinal (`group.createGroup.ordinals.*`) cuando ambos campos están completos.
- **Cobertura:** Sección 8 (frecuencias), Sección 12 (comportamientos reactivos).

---

### Scenario 08 — Cambio de frecuencia resetea campos dependientes
- **Precondición:** El usuario ya seleccionó frecuencia, semana y día.
- **Trigger:** Cambia la frecuencia a otro valor.
- **Resultado esperado:**
  - Solo se resetean los campos que no aplican a la nueva frecuencia.
  - Si la configuración queda incompleta, la vista previa se oculta o desaparece.
  - Si la configuración queda completa con la nueva frecuencia, la vista previa se actualiza.
- **Cobertura:** Sección 9 (regla 6), Sección 11 (FA-03).

---

### Scenario 09 — Campos obligatorios vacíos
- **Precondición:** Usuario en el formulario con campos visibles sin completar.
- **Trigger:** Intenta confirmar.
- **Resultado esperado:**
  - Se muestran mensajes de error inline para cada campo faltante (usando claves `group.createGroup.errors.*`).
  - El grupo no se crea.
- **Cobertura:** Sección 9 (reglas 2–5), Sección 11 (FA-02).

---

### Scenario 10 — Datos guardados correctamente
- **Precondición:** Usuario completa nombre, frecuencia, semana (si aplica) y día.
- **Trigger:** Confirma el formulario.
- **Resultado esperado:**
  - En tabla `groups`: `frequency`, `meeting_week` y `meeting_day_of_week` guardados con los valores correctos según la frecuencia seleccionada.
  - Para `semanal`: `meeting_week = null`.
  - Para `quincenal`: `meeting_week = 'odd'` o `'even'`.
  - Para `mensual`: `meeting_week = 'w1'`…`'w5'`.
- **Cobertura:** Sección 8 (definiciones funcionales), Sección 14 (persistencia).

---

### Scenario 11 — Generación automática de eventos
- **Precondición:** Grupo creado exitosamente con frecuencia, semana y día definidos.
- **Trigger:** Confirmación de creación del grupo.
- **Resultado esperado:**
  - Se crean exactamente 3 registros en tabla `events` asociados al `group_id` del nuevo grupo.
  - Las fechas de los eventos corresponden a las próximas 3 ocurrencias según la configuración del grupo.
  - La generación ocurre en el mismo proceso server-side que la creación del grupo.
- **Cobertura:** Sección 9 (regla 10), Sección 14 (persistencia), Sección 15 (seguridad).

---

## 20. Checklist diseño

- [x] No se usan bordes sólidos de 1px para separar campos o secciones del formulario.
- [x] La jerarquía entre campos usa tonal layering, espaciado (`spacing-8` a `spacing-16`) y tipografía, no líneas.
- [x] Los campos de input usan `surface_low` (`bg-[#f6f3f2]`) como fondo sin borde en reposo; `focus:ring-2 focus:ring-[#004ac6]` en foco.
- [x] Los labels están en `text-[11px] font-semibold uppercase tracking-[0.05em]` — cumple especificación label size.
- [x] El botón de submit usa gradiente `from-[#004ac6] to-[#2563eb]` con `rounded-full` — cumple estilo Primary.
- [x] La vista previa usa `text-sm text-[#585f6c]` — tipografía correcta para información no interactiva.
- [x] Los mensajes de error usan `text-[#ba1a1a]` — color `error` del design system.
- [ ] El layout respeta márgenes `spacing-12` / `spacing-16` en mobile. *(verificar en contexto de pantalla completa)*
- [x] No hay esquinas cuadradas: inputs usan `rounded-xl`, botones usan `rounded-full`.

---

## 21. Checklist desarrollo

- [x] La ruta `/grupo/new` está protegida por middleware para usuarios no autenticados.
- [ ] El formulario vive en `features/groups/` siguiendo la arquitectura del proyecto. *(actualmente en `components/group/` — pendiente mover)*
- [x] La Server Action de creación valida `auth.uid()` antes de ejecutar mutaciones.
- [x] La validación de nombre duplicado se realiza server-side.
- [x] La validación de `meeting_week` es condicional según `frequency` y se valida server-side.
- [x] La generación de eventos automáticos ocurre server-side al crear el grupo. *(implementado en `lib/actions/groups.ts` — no en transacción atómica: si el INSERT de eventos falla, el grupo ya fue creado)*
- [x] No se usa `select(*)` en queries de producción.
- [x] No hay queries a Supabase directamente desde componentes de UI.
- [x] Los textos estáticos del formulario se consumen desde `lib/texts.json`.
- [x] El nombre del grupo se guarda con `trim()` aplicado.
- [ ] La cookie `last_group_id` se actualiza al finalizar la creación. *(pendiente — el middleware la setea al navegar `/dashboard/[groupId]`, pero el flujo post-creación pasa por `/grupo-creado/[id]`)*
- [x] El estado `submitting` deshabilita el botón y muestra el texto `group.createGroup.submitPending`.
- [x] La lógica de cálculo de fechas de eventos vive en `lib/utils/event-dates.ts`.

---

## 22. Checklist QA

- [ ] Scenario 01: El formulario se renderiza correctamente para usuario autenticado en `/grupo/new`.
- [ ] Scenario 02: Creación exitosa persiste grupo, membresía admin y 3 eventos; redirige a `/grupo-creado/[id]` y luego al dashboard.
- [ ] Scenario 03: Nombre duplicado del mismo usuario → error inline, no crea grupo, formulario mantiene datos.
- [ ] Scenario 04: Usuario externo sin invitación no puede ver ni acceder al grupo (RLS verificado).
- [ ] Scenario 05: Frecuencia semanal → solo muestra día; vista previa usa `previewSemanal`.
- [ ] Scenario 06: Frecuencia quincenal → muestra semanas en par y día; vista previa usa `previewQuincenal`.
- [ ] Scenario 07: Frecuencia mensual → muestra semana (5 opciones) y día; vista previa usa `previewMensual` con ordinal.
- [x] Scenario 08: Cambio de frecuencia resetea `meeting_week` pero preserva `meeting_day`; vista previa se actualiza o desaparece.
- [ ] Scenario 09: Intentar confirmar con campos visibles vacíos → errores inline por campo, no crea grupo.
- [ ] Scenario 10: Datos persistidos correctamente en `groups` según frecuencia (incluyendo `meeting_week = null` para semanal).
- [ ] Scenario 11: Se generan exactamente 3 eventos con fechas correctas según configuración del grupo.
- [ ] Nombre con solo espacios → tratado como vacío, error de validación.
- [ ] Fallo de red al confirmar → formulario mantiene datos, muestra error de sistema.
- [ ] Nombre del grupo se guarda sin espacios al inicio/final.
- [ ] Dos grupos con el mismo nombre para distinto usuario → permitido (restricción solo para el mismo usuario).

---

## 23. Trazabilidad

| Scenario Gherkin | Sección(es) del PDD | Cobertura |
|---|---|---|
| Scenario 01 — Formulario | §10, §12 | Renderizado del formulario, estados de interfaz |
| Scenario 02 — Creación exitosa | §10, §14, §15 | Flujo principal, persistencia, seguridad |
| Scenario 03 — Nombre duplicado | §9 (RN1), §11 (FA-01), §13 | Validación de negocio, mensajes de error |
| Scenario 04 — Acceso restringido | §9 (RN8), §15 | RLS, seguridad server-side |
| Scenario 05 — Semanal solo día | §8, §12 | Lógica reactiva del formulario, vista previa |
| Scenario 06 — Quincenal semanas y día | §8, §12 | Lógica reactiva del formulario, vista previa |
| Scenario 07 — Mensual semana y día | §8, §12 | Lógica reactiva del formulario, vista previa |
| Scenario 08 — Reset al cambiar frecuencia | §9 (RN6), §11 (FA-03), §12 | Reset condicional de campos, vista previa |
| Scenario 09 — Campos obligatorios vacíos | §9 (RN2–5), §11 (FA-02), §13 | Validación inline, mensajes de error |
| Scenario 10 — Datos guardados correctamente | §8, §14 | Mapeo de valores al schema de DB |
| Scenario 11 — Generación automática de eventos | §9 (RN10), §14, §15 | Generación server-side, persistencia, transacción |

---

## 24. Definiciones abiertas

### DA-01: Estado inicial de los eventos generados automáticamente
El Gherkin del Scenario 11 especifica que el sistema genera los próximos 3 eventos, pero no define el `status` inicial de esos eventos. Se asume `pending` hasta que el organizador los active, pero debe confirmarse con el backlog de US-11 (Crear evento) para evitar conflictos en la lógica del dashboard.

### DA-02: Comportamiento del campo "día" al cambiar de frecuencia ✅ Resuelto
`handleFrequencyChange()` preserva `meetingDay` y solo resetea `meetingWeek`. Los errores del campo de semana se limpian; el error del campo día se preserva solo si ya existía (no se introduce un error nuevo por el cambio de frecuencia).

### DA-03: Ruta de acceso a "Crear grupo" desde el header (para usuarios con grupos existentes)
El Scenario 01 menciona `/grupo/new` como la ruta del formulario, y US-04 (avatar menu) incluye `group.avatarMenu.createGroup` como texto de menú. La conexión entre ambas US debe verificarse durante la implementación de US-04 para asegurar que la navegación sea consistente.

---

## 25. Resumen

| Sección | Estado |
|---|---|
| Identificación y objetivo | ✅ |
| Alcance (incluye / no incluye) | ✅ |
| Actor y precondiciones | ✅ |
| Postcondiciones | ✅ |
| Definiciones funcionales (frecuencias, semanas, vista previa) | ✅ |
| Reglas de negocio (10 reglas) | ✅ |
| Flujo principal (14 pasos) | ✅ |
| Flujos alternativos (4 FA) | ✅ |
| UI/UX — comportamientos requeridos | ✅ (sin inventar diseño) |
| Mensajes y textos — claves de texts.json | ✅ (sin inventar copies) |
| Persistencia (3 tablas afectadas) | ✅ |
| Seguridad (RLS + validación server-side) | ✅ |
| Dependencias | ✅ |
| Riesgos (4 identificados) | ✅ |
| Casos borde (8 casos) | ✅ |
| Criterios de aceptación por Scenario (11/11) | ✅ |
| Checklist diseño | ✅ |
| Checklist desarrollo | ✅ |
| Checklist QA | ✅ |
| Trazabilidad Scenario → PDD | ✅ |
| Definiciones abiertas (3 DA) | ✅ |

---

*PDD generado por Claude Code · monthly-dinner · Marzo 2026*
