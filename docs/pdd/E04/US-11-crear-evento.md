# PDD — US-11: Crear evento

## 1. Identificación

| Campo | Valor |
|---|---|
| **Epic** | E04 — Dashboard |
| **User Story** | US-11 — Crear evento |
| **Prioridad** | Alta — es el núcleo del ciclo mensual del grupo |
| **Objetivo de negocio** | Permitir al organizador del período activar el evento del mes, centralizando fecha y lugar para que todos los miembros puedan verlo y confirmar asistencia. |

---

## 2. Problema a resolver

El organizador no tiene un mecanismo para convocar formalmente al grupo. Sin evento publicado, los miembros no pueden confirmar asistencia, votar restaurantes ni ver información del mes. El panel del dashboard queda en estado vacío hasta que el organizador crea el evento.

---

## 3. Objetivo funcional

Proveer al organizador del período actual un flujo (modal + formulario) para crear el evento del mes con fecha obligatoria y datos opcionales (lugar tentativo, descripción). Al confirmar, el evento queda en estado `Published` y visible para todos los miembros del grupo.

Adicionalmente, permitir la edición posterior del evento publicado mientras no esté cerrado.

---

## 4. Alcance

### Incluye
- Mostrar CTA "Organizar" en el cuadrante de evento del dashboard, exclusivamente para el organizador del período actual cuando no existe evento `Published`.
- Modal con formulario de creación de evento (fecha obligatoria, lugar tentativo opcional, descripción opcional).
- Validación de campo fecha antes de guardar.
- Creación del evento con estado `Published`.
- Actualización del cuadrante de evento en el dashboard tras la creación exitosa.
- Detección de evento `Published` ya existente en el período: ofrecer edición en lugar de duplicar.
- Edición posterior del evento `Published` (lugar y otros campos editables).
- Ocultamiento del CTA "Organizar" para usuarios no organizadores.

### No incluye
- Notificación al grupo tras la creación (US-12).
- Confirmación de asistencia (US-13 / US-10).
- Cierre del evento (US-15).
- Votación de restaurantes.
- Checklist del organizador.
- Cambio de estado del evento a `Closed`.

---

## 5. Actor principal

**Organizador del período actual** — miembro del grupo asignado en la tabla `rotation` para el evento en curso.

Actores secundarios:
- **Miembro no organizador** — no ve el CTA "Organizar"; ve el cuadrante de evento en estado vacío hasta que el organizador publique.

---

## 6. Precondiciones

1. El usuario está autenticado (`auth.uid()` válido).
2. El usuario es miembro del grupo activo.
3. El usuario es el organizador asignado para el período actual (registro en tabla `rotation`).
4. No existe un evento con estado `Published` para el período actual del grupo. *(Caso alternativo: ya existe → Scenario 05).*
5. El grupo está completamente configurado (rotación asignada).

---

## 7. Postcondiciones

- Existe un registro en tabla `events` con `status = 'published'`, `group_id` del grupo activo, fecha confirmada, y campos opcionales completados.
- El cuadrante de evento en el dashboard refleja el nuevo evento publicado con sus datos.
- Todos los miembros del grupo pueden ver el evento desde su sesión.

---

## 8. Definiciones funcionales

### 8.1 Período actual
El "período actual" corresponde al próximo evento generado por la configuración de frecuencia del grupo. La tabla `events` tiene registros generados automáticamente; el período activo es aquel cuya fecha es el próximo según la frecuencia configurada y cuyo `status` no es `closed`.

### 8.2 Estado del evento
| Estado | Descripción |
|---|---|
| `pending` | Evento generado automáticamente, aún no convocado por el organizador |
| `published` | Evento creado/confirmado por el organizador, visible para el grupo |
| `closed` | Evento cerrado después de la cena |

### 8.3 Organizador del período actual
El miembro asignado en la tabla `rotation` para el evento del período actual. Se determina cruzando `rotation.event_id` con el evento activo del grupo.

### 8.4 Campos del formulario

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| Fecha de la cena | Date | Sí | No puede estar vacía al guardar |
| Lugar tentativo | Text | No | Máx. longitud no definida en el Gherkin — ver sección 24 |
| Descripción | Text | No | Campo libre para notas adicionales |

### 8.5 Creación vs. edición
- Si no existe evento `Published` → flujo de **creación**: el evento pasa de `pending` a `published` con los datos ingresados.
- Si ya existe evento `Published` → flujo de **edición**: el modal se abre precargado con los datos existentes.

---

## 9. Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | Solo el organizador del período actual puede crear el evento. |
| RN-02 | La fecha es obligatoria. No se puede guardar un evento sin fecha. |
| RN-03 | No puede existir más de un evento `Published` por grupo por período. |
| RN-04 | Si ya existe un evento `Published`, el sistema ofrece editarlo en lugar de crear uno nuevo. |
| RN-05 | Un evento `closed` no puede volver a editarse por esta vía. |
| RN-06 | El botón "Organizar" no se muestra a usuarios no organizadores. |
| RN-07 | La validación de permisos debe realizarse server-side; no basta con ocultar el CTA en UI. |
| RN-08 | Al guardar cambios en edición, todos los miembros ven la información actualizada inmediatamente. |
| RN-09 | El lugar tentativo y la descripción son opcionales y pueden quedar vacíos. |

---

## 10. Flujo principal

**Escenario: Organizador crea el evento por primera vez en el período**

1. El organizador accede al dashboard del grupo activo.
2. El sistema verifica que es el organizador del período actual y que no existe evento `Published`.
3. El cuadrante de evento muestra el mensaje y el botón correspondiente (→ `texts.json: group.organizer.iAmOrganizerTitle`, `group.organizer.nextStepBody`, `group.eventPanel`).
4. El organizador toca "Organizar".
5. Se abre el modal con el formulario de creación de evento.
6. El organizador completa: fecha (obligatoria), lugar tentativo (opcional), descripción (opcional).
7. El organizador confirma (botón submit).
8. El sistema valida que la fecha esté completa.
9. Se ejecuta la server action de creación:
   - Verifica `auth.uid()` y rol de organizador.
   - Crea el evento con `status = 'published'`.
10. El modal se cierra.
11. El cuadrante de evento se actualiza mostrando los datos del evento publicado.

---

## 11. Flujos alternativos

### FA-01: Fecha vacía al guardar
- En paso 8, la validación detecta fecha vacía.
- Se muestra error inline en el campo fecha (→ `texts.json: errors.events.dateRequired`).
- El evento no se guarda. El modal permanece abierto.

### FA-02: Ya existe un evento `Published`
- En paso 3, el sistema detecta evento `Published` existente.
- No se muestra el botón "Organizar" para crear uno nuevo.
- Se muestra directamente el cuadrante con los datos del evento y la opción de editar.
- Si el organizador intenta crear vía otro acceso, el sistema responde con el mensaje de conflicto (→ `texts.json: errors.events.alreadyExists`).

### FA-03: Edición posterior de evento publicado
- El organizador ve el cuadrante del evento con la opción "Editar evento" (→ `texts.json: group.eventPanel.editSummary`).
- Se abre el modal precargado con los datos actuales.
- El organizador modifica lugar u otros campos y guarda.
- Se ejecuta la server action de edición.
- El cuadrante se actualiza con la información nueva, visible para todos los miembros.

### FA-04: Usuario no organizador accede al dashboard
- El sistema no muestra el botón "Organizar".
- El cuadrante muestra el estado vacío del evento (sin CTA de creación).

### FA-05: Error técnico al crear
- La server action falla.
- Se muestra error genérico (→ `texts.json: errors.events.createFailed`).
- El modal permanece abierto. El evento no se guarda.

### FA-06: Evento creado pero fallo al obtener datos del response
- La creación persiste en BD, pero el fetch posterior falla.
- Se muestra advertencia específica (→ `texts.json: errors.events.createButFetchFailed`).
- El organizador puede refrescar para ver el evento.

### FA-07: Intento de editar evento cerrado
- La server action rechaza la mutación (→ `texts.json: errors.events.cannotEditClosed`).
- No se ejecuta ninguna modificación.

### FA-08: Intento de crear/editar sin ser organizador (validación server-side)
- La server action rechaza la operación (→ `texts.json: errors.events.notOrganizer` / `errors.events.cannotEditNotOrganizer`).

---

## 12. UI / UX

### Fuente de verdad
Consultar: `docs/design/design-system.md`

### Comportamientos requeridos

1. **Cuadrante de evento en dashboard** — cuando el organizador no ha creado el evento: mostrar título identificador del rol y CTA "Organizar" como botón primario. El cuadrante no debe mostrar datos de evento ni botones de asistencia.

2. **Cuadrante de evento para no organizador** — sin evento `Published`: mostrar estado vacío sin CTA de creación. Ver `texts.json: dashboard.emptyMember*` para el copy.

3. **Modal de creación** — debe deslizarse desde la parte inferior en mobile (sheet), no como modal centrado. Usar `shadow_md` para elevación. `border-radius` redondeado en el contenedor. Fondo `surface_lowest`.

4. **Formulario** — campos con fondo `surface_low`, sin borde en reposo, borde `2px solid primary` en foco. Labels en uppercase con tracking aumentado (ver design system). El botón submit usa gradiente primario, completamente redondeado. Estado loading deshabilitado mientras la mutación está en curso.

5. **Validación inline** — el error de campo obligatorio aparece debajo del input correspondiente. No se limpia el formulario en caso de error.

6. **Estado submitting** — el botón muestra el texto de estado pending (→ `texts.json: group.eventForm.submitCreating` / `group.eventForm.submitSaving`) y se deshabilita durante la operación.

7. **Cuadrante post-creación** — se actualiza sin necesidad de reload completo de página. Refleja fecha, lugar (si fue completado) y habilita los botones de asistencia para los miembros.

8. **Edición posterior** — el modal se abre precargado. El botón submit refleja el estado de "edición" (→ `texts.json: group.eventForm.submitSave` / `group.eventForm.submitSaving`).

---

## 13. Mensajes y textos

### Fuente de verdad
Consultar: `lib/texts.json`

### Tipos de mensajes requeridos

| Tipo | Clave en texts.json | Contexto de uso |
|---|---|---|
| Título cuadrante organizador | `group.organizer.iAmOrganizerTitle` | Dashboard, cuadrante evento, organizador sin evento creado |
| Cuerpo cuadrante organizador | `group.organizer.iAmOrganizerBody` | Descripción del rol actual |
| CTA próximo paso | `group.organizer.nextStepEyebrow`, `group.organizer.nextStepBody` | Instrucción para crear el evento |
| Eyebrow del panel de evento | `group.eventPanel.eyebrow` | Encabezado del cuadrante |
| Estado sin evento | `group.eventPanel.noEventTitle`, `group.eventPanel.noEventBody` | Cuadrante miembro sin evento |
| Label fecha | `group.eventForm.dateLabel` | Formulario creación/edición |
| Label lugar | `group.eventForm.placeLabel`, `group.eventForm.placeLabelOptional` | Formulario |
| Placeholder lugar | `group.eventForm.placePlaceholder` | Input lugar tentativo |
| Label descripción | `group.eventForm.descriptionLabel` | Formulario |
| Placeholder descripción | `group.eventForm.descriptionPlaceholder` | Input descripción |
| Submit crear | `group.eventForm.submitCreate` | Botón acción creación |
| Submit creando | `group.eventForm.submitCreating` | Estado loading creación |
| Submit guardar | `group.eventForm.submitSave` | Botón acción edición |
| Submit guardando | `group.eventForm.submitSaving` | Estado loading edición |
| Error fecha obligatoria | `errors.events.dateRequired` | Validación inline |
| Error ya existe evento | `errors.events.alreadyExists` | Conflicto de duplicado |
| Error creación fallida | `errors.events.createFailed` | Error técnico general |
| Error creado sin datos | `errors.events.createButFetchFailed` | Creación OK pero fetch falló |
| Error no organizador | `errors.events.notOrganizer` | Intento no autorizado (server) |
| Error no puede editar cerrado | `errors.events.cannotEditClosed` | Intento de editar evento closed |
| Error no puede editar no organizador | `errors.events.cannotEditNotOrganizer` | Edición no autorizada (server) |
| Error guardar cambios | `errors.events.saveFailed` | Error técnico en edición |
| Editar evento (label) | `group.eventPanel.editSummary` | CTA edición en cuadrante |

---

## 14. Persistencia

### Tabla afectada: `events`

| Operación | Campos escritos | Notas |
|---|---|---|
| Crear | `group_id`, `status = 'published'`, `date`, `location` (nullable), `description` (nullable), `organizer_id`, timestamps | `organizer_id` se infiere del organizador del período actual |
| Editar | `date`, `location`, `description`, `updated_at` | Solo campos editables; `status` y `group_id` no cambian |

### Estado permitido post-operación
- `status` solo puede pasar a `published` desde `pending` mediante esta US.
- El paso a `closed` corresponde a US-15.

### Visibilidad
Un evento `published` debe ser legible por todos los miembros del grupo (RLS de lectura por `group_id`). La escritura está restringida al organizador del período.

---

## 15. Seguridad

| Control | Detalle |
|---|---|
| Autenticación | Verificar `auth.uid()` en server action antes de cualquier mutación. |
| Autorización — creación | Validar que `auth.uid()` corresponde al organizador del período actual en tabla `rotation`. |
| Autorización — edición | Validar que `auth.uid()` es el organizador Y que el evento no está `closed`. |
| Unicidad de evento | Verificar en server action que no existe evento `published` para el grupo/período antes de insertar. |
| RLS | La policy de `events` debe permitir `INSERT` y `UPDATE` solo al organizador del período. `SELECT` permitido a todos los miembros del grupo. |
| No confiar en UI | La restricción de visibilidad del botón "Organizar" es solo orientativa; toda validación crítica ocurre server-side. |

---

## 16. Dependencias

| Dependencia | Tipo | Detalle |
|---|---|---|
| US-07 — Configuración de rotación | Prerequisito funcional | Sin rotación configurada no hay organizador asignado; el período actual queda sin responsable. |
| US-10 — Estados del card de evento | Dependencia de estado UI | US-10 define cómo se renderiza el cuadrante según el status del evento; US-11 genera el estado `Published` que US-10 consume. |
| US-12 — Notificar al grupo | Dependencia posterior | La notificación se dispara post-creación del evento; US-12 consume el evento recién creado. |
| US-13 — Confirmar asistencia | Dependencia posterior | Solo disponible cuando existe evento `Published`. |
| Tabla `rotation` | Dependencia de datos | Para determinar el organizador del período actual. |
| Tabla `events` | Dependencia de datos | CRUD del evento. |

---

## 17. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Condición de carrera: dos requests simultáneos crean dos eventos `published` | Baja | Alto | Constraint de unicidad en BD (`unique` o check en `events` por `group_id + status + período`). La server action debe verificar existencia antes de insertar. |
| Organizador no asignado en `rotation` | Media | Medio | El cuadrante muestra estado "sin organizador" (ver `texts.json: group.organizer.noOrganizerTitle`). El botón "Organizar" no se muestra. |
| Fetch del evento post-creación falla | Baja | Bajo | Se maneja con `errors.events.createButFetchFailed`. El registro persiste; el usuario puede recargar. |
| Evento `published` preexistente no detectado en tiempo real | Baja | Medio | El cuadrante debe consultar el estado real del evento al cargar la página, no depender de caché local. |

---

## 18. Casos borde

| Caso | Comportamiento esperado |
|---|---|
| El organizador recarga la página después de crear el evento | El cuadrante refleja el evento `published` con los datos correctos. |
| Otro miembro del grupo accede al dashboard mientras el organizador está en el modal | Al publicar, el cuadrante del otro miembro debe actualizarse (o al recargar verá el evento publicado). |
| El organizador intenta crear un evento pero su rol fue cambiado mientras estaba en el modal | La server action rechaza la operación con `errors.events.notOrganizer`. |
| Lugar tentativo contiene solo espacios en blanco | El sistema debe normalizar el valor (trim) antes de guardar. Si queda vacío, se almacena como `null`. |
| Descripción contiene solo espacios en blanco | Idem — normalizar y almacenar como `null` si vacío post-trim. |
| El organizador guarda el mismo lugar sin cambios (edición sin modificaciones) | La operación debe completarse sin error; los datos se actualizan con el mismo valor. |
| El evento `published` fue cerrado antes de que el organizador intentara editarlo | El sistema responde con `errors.events.cannotEditClosed`. |

---

## 19. Criterios de aceptación desarrollados

### Scenario 01 — Cuadrante evento (organizador sin evento)
- **Dado:** usuario autenticado, organizador del período actual, sin evento `Published` en el período.
- **Comportamiento:** el cuadrante de evento en el dashboard muestra la identificación del organizador (`group.organizer.iAmOrganizerTitle`, `group.organizer.iAmOrganizerBody`) y el botón "Organizar" como CTA primario.
- **Verificación:** el botón "Organizar" es visible y accionable. No hay datos de evento renderizados.

### Scenario 02 — Abrir modal de creación
- **Dado:** organizador sin evento `Published`, visualizando el dashboard.
- **Acción:** toca "Organizar".
- **Comportamiento:** se abre el modal (sheet desde abajo en mobile) con el formulario de Creación de Evento. Los campos están vacíos. El botón submit muestra `group.eventForm.submitCreate`.
- **Verificación:** formulario visible, campos fecha, lugar tentativo y descripción presentes. Botón de cancelar/cerrar disponible.

### Scenario 03 — Creación exitosa
- **Dado:** formulario de Creación de Evento visible.
- **Acción:** completa fecha, lugar tentativo (opcional) y descripción (opcional); confirma.
- **Comportamiento:** se ejecuta la server action → evento creado con `status = 'published'` → modal se cierra → cuadrante de evento se actualiza mostrando fecha, lugar y el estado del evento publicado.
- **Verificación:** registro en tabla `events` con `status = 'published'`. Cuadrante refleja los datos ingresados. Todos los miembros pueden ver el evento.

### Scenario 04 — Fecha vacía
- **Dado:** formulario de Creación de Evento visible.
- **Acción:** intenta guardar sin completar la fecha.
- **Comportamiento:** error inline bajo el campo fecha (`errors.events.dateRequired`). El evento no se crea. El modal permanece abierto con los datos ingresados preservados.
- **Verificación:** no existe nuevo registro en `events`. El formulario muestra el error de validación.

### Scenario 05 — Evento ya existente en el período
- **Dado:** ya existe un evento `Published` para el período actual.
- **Acción:** el organizador intenta crear otro.
- **Comportamiento:** el sistema detecta el conflicto y muestra `errors.events.alreadyExists`. Ofrece la opción de editar el evento existente.
- **Verificación:** no se crea un segundo registro. El organizador puede acceder a la edición del evento existente.

### Scenario 06 — Edición posterior
- **Dado:** existe evento `Published` para el período actual.
- **Acción:** el organizador modifica el lugar del evento y guarda.
- **Comportamiento:** se ejecuta la server action de edición → los cambios se persisten → el cuadrante refleja la información actualizada para todos los miembros.
- **Verificación:** el campo `location` del registro en `events` contiene el nuevo valor. El cuadrante de todos los miembros muestra el lugar actualizado.

### Scenario 07 — No organizador no ve el botón
- **Dado:** usuario autenticado, no es el organizador del período actual.
- **Acción:** accede al dashboard.
- **Comportamiento:** el cuadrante no muestra el botón "Organizar". Muestra el estado vacío o el evento si ya fue publicado.
- **Verificación:** ausencia del botón "Organizar" en el DOM para usuarios no organizadores.

---

## 20. Checklist diseño

- [x] El cuadrante de evento no usa bordes sólidos de 1px para separar contenido. — `EventPanel` usa `rounded-2xl bg-white shadow-[...]`, sin border.
- [x] El modal / sheet usa fondo glassmorphism con shadow elevada. — `bg-[rgba(252,249,248,0.88)] backdrop-blur-[16px] shadow-[0px_20px_60px_-12px_...]`, patrón establecido en el proyecto.
- [x] Los campos del formulario usan fondo neutro, sin borde en reposo, `ring-2 ring-[#004ac6]` en foco. — `bg-[#f0ede9]`, `focus:ring-2 focus:ring-[#004ac6]`.
- [x] Las labels de campo están en uppercase con letter-spacing aumentado. — `text-[11px] font-semibold uppercase tracking-[0.05em]`.
- [x] El botón submit es completamente redondeado (`rounded-full`) con gradiente primario. — `rounded-full bg-gradient-to-r from-[#004ac6] to-[#2563eb]`.
- [x] En mobile el modal se abre desde la parte inferior (sheet). — `fixed inset-0 z-50 flex items-end justify-center`.
- [x] Los errores inline respetan el color `error` (`#ba1a1a`) sin usar borders. — `text-sm text-[#ba1a1a]`.
- [x] El estado submitting deshabilita el botón y muestra texto de carga. — `disabled={isPending}` + `t('group.eventForm.submitCreating')`.
- [x] El cuadrante post-creación sigue el patrón `surface_lowest` sobre background (Tonal Layering). — `bg-white` (`surface_lowest`) sobre el fondo de página.
- [x] No hay texto hardcodeado en componentes — todo viene de `texts.json`. — todos los strings pasan por `t()`.

---

## 21. Checklist desarrollo

- [x] Server action `publishAndCreateEvent` implementada en `lib/actions/events.ts`. *(Arquitectura real del proyecto usa `lib/actions/` en lugar de `features/dinners/server/`.)*
- [x] Server action `updateEvent` implementada en `lib/actions/events.ts`.
- [x] Validación de `auth.uid()` en ambas actions antes de cualquier mutación. — `supabase.auth.getUser()` como primera operación.
- [x] Verificación de rol de organizador server-side. — `publishAndCreateEvent` valida contra tabla `rotation`; `updateEvent` valida `organizer_id === user.id`.
- [x] Verificación de unicidad de evento `published` por grupo/período antes de insertar. — `publishAndCreateEvent` retorna `alreadyExists` si detecta `status='published'` previo.
- [x] Verificación de estado `not closed` antes de permitir edición. — `updateEvent` rechaza con `cannotEditClosed`.
- [x] Normalización (trim) de campos opcionales antes de persistir. — `?.trim() || null` en ambas actions.
- [x] RLS de `events` cubre todos los casos: SELECT members, INSERT organizer, INSERT admin auto, UPDATE organizer (no closed), UPDATE rotation organizer pending (nuevo — migration `events_update_rotation_organizer_pending`).
- [x] El cuadrante consume el estado real del evento en cada render. — Server Component + `router.refresh()` post-mutación.
- [x] El formulario preserva datos ingresados al mostrar error de validación. — inputs no controlados, modal no se cierra en error.
- [x] El modal se cierra automáticamente tras creación exitosa. — `setOpen(false)` solo en rama `result.success`.
- [x] El cuadrante se actualiza sin reload completo post-creación. — `router.refresh()` (soft refresh Next.js).
- [x] Todos los textos provienen de `lib/texts.json`. — todos los strings pasan por `t()`. Clave `group.eventPanel.organizeButton` agregada.
- [x] No hay queries directas a Supabase desde componentes de UI. — `CreateEventModal` y `EventPanel` solo llaman server actions.
- [x] TypeScript estricto — sin `any`. — verificado con `tsc --noEmit`.

---

## 22. Checklist QA

- [ ] **Happy path creación:** organizador crea evento con todos los campos → evento `published` visible para todos los miembros.
- [ ] **Happy path edición:** organizador edita lugar del evento → cambio visible para todos.
- [ ] **Validación fecha vacía:** intento de guardar sin fecha → error inline, no se crea evento.
- [ ] **Unicidad:** intento de crear segundo evento `published` → mensaje de conflicto + oferta de edición.
- [ ] **Visibilidad CTA:** miembro no organizador no ve botón "Organizar".
- [ ] **Autorización server-side:** llamada directa a la server action desde usuario no organizador → rechazo con error `notOrganizer`.
- [ ] **Edición post-creación:** modificar solo lugar → persiste correctamente sin alterar fecha ni estado.
- [ ] **Evento cerrado:** intento de editar evento `closed` → error `cannotEditClosed`.
- [ ] **Normalización de campos opcionales:** lugar con espacios en blanco → se almacena como `null`.
- [ ] **Estado submitting:** botón deshabilitado durante la mutación, texto de loading visible.
- [ ] **Formulario preservado en error:** al fallar validación, los datos ingresados permanecen.
- [ ] **Cuadrante actualizado:** después de crear, el cuadrante muestra los datos del evento sin recargar página.

---

## 23. Trazabilidad

| Scenario Gherkin | Sección PDD | Cobertura |
|---|---|---|
| Scenario 01 — Cuadrante evento | §8 Definiciones, §9 RN-01/RN-06, §10 Flujo principal, §19 CA-01 | ✅ |
| Scenario 02 — Crear evento (abrir modal) | §8.5, §10 Flujo principal paso 4-5, §12 UI, §19 CA-02 | ✅ |
| Scenario 03 — Creación exitosa | §8.4, §9 RN-02/RN-03, §10 Flujo principal paso 6-11, §14 Persistencia, §19 CA-03 | ✅ |
| Scenario 04 — Campos obligatorios vacíos | §9 RN-02, §11 FA-01, §13 errors.events.dateRequired, §19 CA-04 | ✅ |
| Scenario 05 — Evento ya existente | §8.5, §9 RN-03/RN-04, §11 FA-02, §13 errors.events.alreadyExists, §19 CA-05 | ✅ |
| Scenario 06 — Edición posterior | §8.5, §9 RN-05/RN-08, §11 FA-03, §14 Persistencia, §19 CA-06 | ✅ |
| Scenario 07 — No organizador no ve botón | §9 RN-06/RN-07, §11 FA-04, §15 Seguridad, §19 CA-07 | ✅ |

---

## 24. Definiciones abiertas

| ID | Ambigüedad detectada | Resolución |
|---|---|---|
| DA-01 | Scenario 05: el aviso de "ya hay evento Published" — ¿toast/modal o estado natural del cuadrante? | ✅ **Resuelto:** el aviso es reactivo — el error `alreadyExists` se muestra inline dentro del modal al intentar crear. El organizador cierra el modal y el cuadrante ya refleja el evento publicado con el CTA de edición. |
| DA-02 | Longitud máxima del campo "lugar tentativo" no definida en Gherkin. | ⚠️ **Abierto:** sin `maxlength` definido en el campo `place`. Pendiente de decisión de producto. |
| DA-03 | Checkbox `notifyCheckbox` en formulario de creación — ¿aplica a US-11 o solo US-12? | ✅ **Resuelto:** el checkbox NO aparece en `CreateEventModal` (solo en edición de evento ya Published, en `EventForm`). La notificación al crear corresponde exclusivamente a US-12. |
| DA-04 | Actualización del cuadrante post-creación — ¿optimista o revalidación? | ✅ **Resuelto:** revalidación post-confirmación via `router.refresh()`. El cuadrante se actualiza solo cuando el server confirma el evento como `published`. |

---

## 25. Resumen

US-11 define el flujo central de activación del ciclo mensual: el organizador del período crea el evento con fecha obligatoria y datos opcionales, publicándolo para todo el grupo. El PDD cubre 7 scenarios Gherkin, 9 reglas de negocio, 8 flujos alternativos y los controles de seguridad necesarios para garantizar que solo el organizador pueda crear o editar el evento, con validación tanto en UI como server-side. Se identificaron 4 definiciones abiertas que requieren decisión antes del desarrollo, siendo DA-03 (relación con el checkbox de notificación) la de mayor impacto en el alcance de implementación.

---

*monthly-dinner · PDD US-11 · Abril 2026*
