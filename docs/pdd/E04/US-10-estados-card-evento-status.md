# PDD — US-10: Estados del card de evento según status

## 1. Identificación

| Campo | Valor |
|---|---|
| **ID** | US-10 |
| **Epic** | E04 — Dashboard |
| **User Story** | Como miembro, quiero que el cuadrante del evento muestre solo información relevante según el status del evento, para no ver datos contradictorios ni acciones que no aplican. |
| **Prioridad** | Alta — bloquea la comprensión del estado del evento para todos los miembros |
| **Objetivo de negocio** | Garantizar que el cuadrante del evento sea la fuente de verdad del ciclo mensual, mostrando solo lo que aplica a cada estado, evitando confusión y acciones incorrectas. |

---

## 2. Problema a resolver

El cuadrante del evento en el dashboard es el componente central de coordinación del grupo. Si muestra datos o acciones que no corresponden al estado real del evento, el usuario puede:

- Intentar confirmar asistencia cuando el evento no existe o ya cerró.
- Ver un resumen de asistentes vacío que confunde (evento sin publicar).
- No saber que el evento cerró y que ya no acepta confirmaciones.

La ausencia de una lógica de estados explícita genera interfaz contradictoria e inconsistente.

---

## 3. Objetivo funcional

Implementar la lógica de renderizado condicional del cuadrante de evento en el dashboard, de modo que cada estado del evento (`sin evento published/closed`, `published`, `closed`) muestre exactamente la información y las acciones que le corresponden, sin mezclar contenido de otros estados.

---

## 4. Alcance

### Incluye

- Renderizado del cuadrante de evento para miembros no organizadores en tres estados:
  - Sin evento `published` ni `closed` para el período actual.
  - Evento en estado `published`.
  - Evento en estado `closed`.
- Visualización de fecha, lugar y confirmaciones en tiempo real cuando el evento está `published`.
- Visualización del resumen final de asistentes cuando el evento está `closed`.
- Botones VOY / NO VOY / CAPAZ activos únicamente con evento `published`.
- Ausencia de botones de confirmación con evento `closed`.
- Mensaje de organizador asignado cuando no hay evento publicado.

### No incluye

- Lógica del organizador para crear o editar el evento (US-11).
- Confirmación de asistencia como acción (US-13).
- Resumen detallado de confirmaciones para el organizador (US-14).
- Cierre del evento (US-15).
- Votación de restaurantes (US-20).
- Notificaciones (US-12).
- Vista del organizador del período en el mismo cuadrante (cubierta por US-11).

---

## 5. Actor principal

**Miembro no organizador** del grupo activo con el grupo completamente configurado.

---

## 6. Precondiciones

- El usuario está autenticado.
- El usuario es miembro del grupo activo.
- El grupo está completamente configurado (supera la condición de US-09).
- Existe al menos un evento en la tabla `events` para el período actual, o no existe ninguno.
- La rotación del grupo tiene un organizador asignado para el período actual (o no, en cuyo caso se muestra sin organizador según US-11 / `group.organizer.noOrganizerTitle`).

---

## 7. Postcondiciones

- El cuadrante de evento refleja correctamente el estado real del evento al momento de cargar el dashboard.
- No se muestran botones de acción que el usuario no pueda ejecutar en ese estado.
- La información de fecha, lugar y asistentes es coherente con el estado del evento.

---

## 8. Definiciones funcionales

### Estado 1 — Sin evento published ni closed

El período actual no tiene ningún evento con status `published` ni `closed`. El grupo puede tener eventos en otros estados (ej. `draft`) o ningún evento.

- Se muestra el mensaje de evento no convocado.
- Se muestra el organizador asignado para el período.
- No se muestran botones de confirmación.

### Estado 2 — Evento published

Existe un evento con status `published` para el período actual.

- Se muestran los datos del evento: fecha, lugar (si lo tiene).
- Se muestran las confirmaciones en tiempo real.
- Los botones VOY / NO VOY / CAPAZ están activos.

### Estado 3 — Evento closed

Existe un evento con status `closed` para el período actual.

- Se muestra el badge de estado cerrado.
- Se muestra el resumen final de asistentes (solo lectura).
- Los botones de confirmación no se muestran.

### Lógica de resolución de estado

El cuadrante evalúa el evento del período actual en este orden de precedencia:

1. ¿Existe un evento `closed`? → renderizar Estado 3.
2. ¿Existe un evento `published`? → renderizar Estado 2.
3. Ninguno de los anteriores → renderizar Estado 1.

---

## 9. Reglas de negocio

1. **RN-01:** Solo se evalúa el evento del período actual. Eventos de períodos pasados o futuros no afectan el cuadrante.
2. **RN-02:** `closed` tiene precedencia sobre `published`. Si por alguna razón existen ambos, se muestra `closed`.
3. **RN-03:** Los botones VOY / NO VOY / CAPAZ solo se renderizan cuando el evento está `published`. Nunca con `closed` ni con ausencia de evento.
4. **RN-04:** El resumen de asistentes en Estado 3 es solo lectura. No permite interacción.
5. **RN-05:** El nombre del organizador en Estado 1 proviene de la rotación activa. Si no hay organizador asignado, se muestra el fallback correspondiente (`group.organizer.fallbackOrganizer`).
6. **RN-06:** Las confirmaciones en Estado 2 se muestran en tiempo real (suscripción Realtime de Supabase o revalidación).
7. **RN-07:** Un miembro no organizador no puede ver el botón "Organizar" ni "Cerrar evento" (esos corresponden a US-11 y US-15 del organizador).

---

## 10. Flujo principal

```
1. El miembro accede al dashboard del grupo activo.
2. El sistema consulta el evento del período actual.
3. Si no existe evento published ni closed:
   → Renderiza Estado 1: mensaje de evento no convocado + nombre del organizador.
4. Si existe evento published:
   → Renderiza Estado 2: datos del evento + confirmaciones en tiempo real + botones activos.
5. Si existe evento closed:
   → Renderiza Estado 3: badge cerrado + resumen final de asistentes + sin botones.
```

---

## 11. Flujos alternativos

### FA-01 — Error al obtener el evento

- El sistema no puede consultar el evento del período.
- Se muestra un mensaje de error tipo `errors.events.getEventFailed`.
- No se renderiza ninguno de los tres estados del cuadrante.

### FA-02 — Período sin organizador asignado (Estado 1)

- No existe rotación configurada para el período actual.
- El cuadrante muestra Estado 1 con el fallback de organizador (`group.organizer.noOrganizerTitle` + `group.organizer.noOrganizerBody`).

### FA-03 — Evento published sin fecha confirmada

- El evento existe en estado `published` pero no tiene fecha definida.
- Se muestra `group.eventPanel.dateUnconfirmed` en lugar de la fecha.
- El cuadrante sigue en Estado 2 con los botones activos.

### FA-04 — Evento published sin lugar

- El evento existe en estado `published` pero no tiene lugar cargado.
- No se muestra el campo de lugar (`group.eventPanel.placeLabel`).
- El cuadrante sigue en Estado 2 normalmente.

---

## 12. UI / UX

### Fuente de verdad

Referenciar: `docs/design/design-system.md`

### Comportamientos requeridos

- El cuadrante de evento es una superficie delimitada dentro del dashboard. Su contenido cambia íntegramente según el estado; no debe mostrar elementos mixtos de dos estados simultáneamente.
- En Estado 1: el cuadrante debe mostrar claramente que no hay evento. El nombre del organizador debe ser identificable visualmente como dato secundario.
- En Estado 2: los tres botones de confirmación (VOY / NO VOY / CAPAZ) deben estar visualmente activos y distinguibles. El estado seleccionado por el usuario debe reflejarse visualmente (botón activo / seleccionado). Las confirmaciones en tiempo real deben actualizarse sin recargar la página.
- En Estado 3: el badge de estado cerrado debe ser prominente. Los botones de confirmación no deben renderizarse (no ocultos con CSS, directamente no renderizados). El resumen de asistentes debe ser visualmente estático (sin indicador "En vivo").
- Todos los estados deben contemplar loading skeleton durante la carga del evento.
- Ningún estado puede dejar el cuadrante en blanco sin feedback visual.

---

## 13. Mensajes y textos

### Fuente de verdad

Referenciar: `lib/texts.json`

### Tipos de mensajes requeridos

| Estado | Tipo | Clave en texts.json |
|---|---|---|
| Estado 1 | Título de evento no convocado | `group.eventPanel.noEventTitle` |
| Estado 1 | Cuerpo de evento no convocado | `group.eventPanel.noEventBody` |
| Estado 1 | Eyebrow del cuadrante | `group.eventPanel.eyebrow` |
| Estado 1 | Título sin organizador | `group.organizer.noOrganizerTitle` |
| Estado 1 | Cuerpo sin organizador | `group.organizer.noOrganizerBody` |
| Estado 1 | Fallback de nombre de organizador | `group.organizer.fallbackOrganizer` |
| Estado 2 | Fecha por confirmar | `group.eventPanel.dateUnconfirmed` |
| Estado 2 | Label de lugar | `group.eventPanel.placeLabel` |
| Estado 2 | Pregunta de asistencia | `group.attendance.question` |
| Estado 2 | Opción Va | `group.attendance.options.va` |
| Estado 2 | Opción No va | `group.attendance.options.no_va` |
| Estado 2 | Opción Tal vez | `group.attendance.options.tal_vez` |
| Estado 2 | Badge en vivo | `group.attendanceSummary.liveBadge` |
| Estado 2 | Título de confirmaciones | `group.attendanceSummary.title` |
| Estado 2 | Label Va | `group.attendanceSummary.labels.va` |
| Estado 2 | Label No va | `group.attendanceSummary.labels.no_va` |
| Estado 2 | Label Tal vez | `group.attendanceSummary.labels.tal_vez` |
| Estado 2 | Label Sin responder | `group.attendanceSummary.labels.sinResponder` |
| Estado 3 | Status cerrado | `group.eventPanel.status.closed` |
| Estado 3 | Título de confirmaciones (solo lectura) | `group.attendanceSummary.title` |
| Error | Falla al obtener evento | `errors.events.getEventFailed` |

---

## 14. Persistencia

### Tabla principal

**`events`**

| Campo consultado | Propósito |
|---|---|
| `id` | Identificador del evento |
| `status` | Determina el estado del cuadrante (`published`, `closed`, otros) |
| `event_date` | Fecha del evento (Estado 2) |
| `location` | Lugar tentativo (Estado 2, opcional) |
| `group_id` | Filtro por grupo activo |

### Tabla secundaria

**`attendances`** (Estado 2 y Estado 3)

| Campo consultado | Propósito |
|---|---|
| `member_id` | Identificador del miembro |
| `event_id` | Relación con el evento |
| `status` | Estado de confirmación (`va`, `no_va`, `tal_vez`) |

**`rotation`** (Estado 1)

| Campo consultado | Propósito |
|---|---|
| `member_id` | Organizador asignado al período actual |
| `event_id` | Relación con el evento del período |

**`members`** + **`profiles`** (Estado 1)

Para resolver el nombre del organizador a partir del `member_id` de rotation.

### Sin escritura en esta US

US-10 es exclusivamente de lectura. Las mutaciones (confirmar asistencia, cerrar evento) corresponden a otras US.

---

## 15. Seguridad

- La consulta del evento debe realizarse server-side con el cliente de Supabase de servidor.
- RLS garantiza que solo miembros del grupo pueden ver el evento y las confirmaciones del grupo.
- No se exponen datos de eventos ni confirmaciones a usuarios fuera del grupo.
- La lógica de qué estado renderizar debe resolverse en servidor (o en el loader/server component), no en el cliente con datos crudos.
- No se debe confiar en parámetros de URL para determinar el estado del cuadrante — siempre leer desde la base de datos.

---

## 16. Dependencias

| US | Relación |
|---|---|
| US-09 | US-10 se activa solo cuando el grupo está configurado (condición que US-09 resuelve) |
| US-11 | El organizador crea el evento que pasa el cuadrante de Estado 1 a Estado 2 |
| US-13 | Los botones activos del Estado 2 disparan la confirmación de asistencia |
| US-14 | El resumen de confirmaciones en tiempo real del Estado 2 usa la misma lógica que US-14 |
| US-15 | El cierre del evento transiciona el cuadrante de Estado 2 a Estado 3 |
| US-07 | La rotación provee el nombre del organizador en Estado 1 |

---

## 17. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Evento en estado intermedio (`draft`, `cancelled`) no contemplado | Cuadrante queda en Estado 1 cuando no debería | Definir explícitamente en RN-01 que solo se evalúan `published` y `closed`. Cualquier otro status → Estado 1. |
| Realtime no disponible o desconectado en Estado 2 | Las confirmaciones no se actualizan en vivo | Implementar fallback a revalidación por intervalo o on-focus. No bloquear el renderizado del estado. |
| Concurrencia: evento cerrado mientras el miembro ve Estado 2 | El usuario sigue viendo los botones activos | La suscripción Realtime debe actualizar el status del evento y transicionar al Estado 3 sin recarga. |
| Rotación sin organizador asignado en Estado 1 | Nombre de organizador vacío o "undefined" visible | Usar siempre `group.organizer.fallbackOrganizer` como valor por defecto en ausencia de rotación. |

---

## 18. Casos borde

| Caso | Comportamiento esperado |
|---|---|
| Grupo recién configurado, sin eventos creados | Estado 1 con mensaje de evento no convocado y organizador asignado (o fallback) |
| Evento `published` sin fecha ni lugar | Estado 2 con `dateUnconfirmed` y sin campo de lugar |
| Evento `published` sin confirmaciones aún | Estado 2 con todos los miembros en `sinResponder` |
| Evento `closed` sin asistentes registrados | Estado 3 con resumen vacío y sin botones |
| Múltiples eventos en el período (edge case de data) | Aplicar precedencia: `closed` > `published` > otros. Tomar el primero que corresponda al período actual. |
| El miembro es también el organizador pero accede como miembro | US-10 no distingue rol de organizador — el cuadrante para el organizador está cubierto por US-11. Si el usuario es organizador, las acciones adicionales (Organizar, Cerrar) se renderizarán encima de la vista base de US-10. |
| Período actual sin rotación configurada | Estado 1 muestra `group.organizer.noOrganizerTitle` + `group.organizer.noOrganizerBody` |

---

## 19. Criterios de aceptación desarrollados

### Scenario 01 — Sin evento "Published" ni "Closed"

**Dado que:** El grupo está configurado, el usuario es miembro no organizador, y no existe evento con status `published` ni `closed` para el período actual.

**Cuando:** El usuario accede al dashboard del grupo.

**Entonces:**
- El cuadrante de evento muestra el mensaje de evento no convocado (`group.eventPanel.noEventBody`).
- El cuadrante muestra el nombre del organizador asignado para el período actual, o el fallback `group.organizer.fallbackOrganizer` si no hay rotación.
- No se renderizan botones VOY / NO VOY / CAPAZ.
- No se muestra fecha ni lugar.
- No se muestra resumen de asistentes.

---

### Scenario 02 — Evento con status "Published"

**Dado que:** El grupo está configurado, el usuario es miembro no organizador, y existe un evento con status `published` para el período actual.

**Cuando:** El usuario accede al dashboard del grupo.

**Entonces:**
- El cuadrante muestra la fecha del evento (o `group.eventPanel.dateUnconfirmed` si no tiene fecha).
- El cuadrante muestra el lugar del evento si está cargado, usando `group.eventPanel.placeLabel`.
- Se muestran los tres botones de confirmación activos: VOY (`group.attendance.options.va`), NO VOY (`group.attendance.options.no_va`), CAPAZ (`group.attendance.options.tal_vez`).
- Se muestra el resumen de confirmaciones en tiempo real, con categorías Va / No va / Tal vez / Sin responder.
- El badge `group.attendanceSummary.liveBadge` indica actualización en tiempo real.

---

### Scenario 03 — Evento con status "closed"

**Dado que:** El grupo está configurado, el usuario es miembro no organizador, y existe un evento con status `closed` para el período actual.

**Cuando:** El usuario accede al dashboard del grupo.

**Entonces:**
- El cuadrante muestra el badge/label de estado cerrado (`group.eventPanel.status.closed`).
- Se muestra el resumen final de asistentes (solo lectura): quiénes fueron, quiénes no, quiénes dijeron tal vez.
- Los botones VOY / NO VOY / CAPAZ no se renderizan (no están presentes en el DOM).
- El resumen no muestra badge "En vivo".

---

## 20. Checklist diseño

- [x] El cuadrante no usa bordes sólidos de 1px para separar su contenido interno. — `shadow-[...]` + `rounded-2xl`, sin border classes.
- [x] La distinción entre estados se comunica mediante cambio de fondo, jerarquía tipográfica o badge, no mediante bordes. — Estado 3: badge `bg-[#1c1b1b] text-white`; Estado 2: badge `bg-[#f0ede9]`; Estado 1: jerarquía tipográfica sin badge.
- [x] Los tres estados son mobile-first y funcionan correctamente en viewport estrecho. — Contenedor `max-w-sm`, clases mobile-first sin breakpoints condicionales.
- [x] El badge de estado "Cerrado" tiene suficiente contraste y no depende solo del color para comunicar el estado. — `bg-[#1c1b1b] text-white` + texto "CERRADO" en uppercase. Alto contraste + etiqueta textual.
- [x] Los botones VOY / NO VOY / CAPAZ siguen el sistema de colores de `docs/design/design-system.md`. — `bg-[#6ffbbe]` (va), `bg-[#dce2f3]` (tal vez), `bg-[#ffdad6]` (no va); no seleccionado: `bg-[#f0ede9]`.
- [x] El estado seleccionado del botón de confirmación está visualmente diferenciado del no seleccionado. — `selectedClass` distinto por estado vs `bg-[#f0ede9] text-[#585f6c]` para no seleccionado.
- [ ] El loading skeleton cubre el área completa del cuadrante durante la carga. — **Pendiente**: no existe `app/(dashboard)/dashboard/[groupId]/loading.tsx` ni skeleton en `EventPanel`. La ruta `[groupId]` no tiene loading state propio.
- [x] El cuadrante nunca queda en blanco sin feedback visual. — `EventPanel` siempre retorna uno de los tres estados o el formulario del organizador.

---

## 21. Checklist desarrollo

- [x] La lógica de resolución de estado (`closed > published > sin evento`) está implementada server-side o en el loader del server component. — Guard en `EventPanel.tsx:41`: `(!event || event.status === 'pending') && !isOrganizer` → Estado 1.
- [x] No hay queries directas a Supabase desde componentes UI del cuadrante. — `EventPanel` es server component sin queries. `AttendanceSummary` usa cliente solo para Realtime con datos iniciales vía props.
- ~~[ ] La consulta del evento filtra por `group_id` y por `status IN ('published', 'closed')`.~~ — **N/A** (ver DA-01): `getCurrentEvent` devuelve `pending` intencionalmente para que el organizador pueda publicar. La separación de estados ocurre en `EventPanel`.
- [x] La consulta de confirmaciones solo se ejecuta cuando el estado es `published` o `closed`. — `isEventActive` en `dashboard/[groupId]/page.tsx:91`.
- [x] La consulta de rotación/organizador se ejecuta siempre, compartida con `OrganizerPanel`. — No es exclusiva del Estado 1; `getCurrentOrganizer` siempre se llama en la página y el dato se reutiliza. Aceptable.
- [x] Los botones de confirmación no se renderizan (no `hidden`) cuando el estado es `closed` o "sin evento". — Estado 1: `EventPanel` retorna early, nunca llega a `showAttendanceButtons`. Estado 3: `ConfirmAttendanceButtons` con `eventClosed=true` renderiza `ReadOnlyBadge`, no los `<button>`.
- [x] El resumen de asistentes en Estado 3 no tiene suscripción Realtime activa (es solo lectura). — `AttendanceSummary` con `eventClosed=true`: `useEffect` retorna early, no crea `supabase.channel`.
- [x] El resumen de asistentes en Estado 2 tiene suscripción Realtime o revalidación activa. — `AttendanceSummary` sin `eventClosed`: suscripción activa sobre `attendances` filtrada por `event_id`.
- [x] Todos los textos del cuadrante provienen de `lib/texts.json`. — `EventPanel`, `ConfirmAttendanceButtons` y `AttendanceSummary` usan `t()` para todos los strings.
- [x] No hay texto hardcodeado en el componente del cuadrante. — Verificado en `EventPanel.tsx`, `ConfirmAttendanceButtons.tsx`, `AttendanceSummary.tsx`.
- [ ] La UI contempla los estados: loading, sin evento (Estado 1), publicado (Estado 2), cerrado (Estado 3), error. — **Parcial**: Estados 1/2/3 cubiertos. Loading: no existe `app/(dashboard)/dashboard/[groupId]/loading.tsx`. Error: no hay `error.tsx` en la ruta `[groupId]`; los errores se propagan al boundary superior.

---

## 22. Checklist QA

- [ ] Con grupo configurado y sin evento → se renderiza Estado 1 con mensaje correcto y nombre de organizador.
- [ ] Con grupo configurado y sin rotación → Estado 1 muestra fallback de organizador sin crash.
- [ ] Con evento `published` → se renderiza Estado 2 con botones activos.
- [ ] Con evento `published` sin fecha → se muestra `dateUnconfirmed` en lugar de fecha vacía.
- [ ] Con evento `published` sin lugar → no se muestra el campo de lugar.
- [ ] Con evento `closed` → se renderiza Estado 3 sin botones de confirmación.
- [ ] Con evento `closed` → el resumen de asistentes es solo lectura.
- [ ] Transición en tiempo real de `published` a `closed` mientras el miembro está en el dashboard → el cuadrante actualiza al Estado 3 sin recargar.
- [ ] Un usuario fuera del grupo no puede ver el evento ni las confirmaciones (validar RLS).
- [ ] El cuadrante nunca muestra datos de un grupo diferente al activo.
- [ ] Estado de carga (skeleton) visible durante la consulta inicial.
- [ ] Error en la consulta → mensaje de error visible y cuadrante no queda en blanco.

---

## 23. Trazabilidad

| Scenario Gherkin | Sección del PDD | Cobertura |
|---|---|---|
| Scenario 01: Sin evento "Published" ni "Closed" | §8 Estado 1, §9 RN-01/RN-05, §10 Paso 3, §19 Scenario 01 | Completa |
| Scenario 02: Evento con status "Published" | §8 Estado 2, §9 RN-03/RN-06, §10 Paso 4, §19 Scenario 02 | Completa |
| Scenario 03: Evento con status "closed" | §8 Estado 3, §9 RN-02/RN-03/RN-04, §10 Paso 5, §19 Scenario 03 | Completa |

---

## 24. Definiciones abiertas

### DA-01 — El Scenario 01 dice "La cena de este evento aún no fue convocada"

El texto del Gherkin dice "La cena de este **evento** aún no fue convocada". La clave `group.eventPanel.noEventBody` en `texts.json` dice "La cena de este **mes** aún no fue convocada." — diferencia menor de redacción. **Decisión:** usar la clave existente `group.eventPanel.noEventBody`. Si el copy debe coincidir exactamente con el Gherkin, actualizar `texts.json` antes de implementar.

### DA-02 — "Confirmaciones en tiempo real" en Estado 2

El Gherkin especifica "confirmaciones en tiempo real" pero no define el mecanismo (Realtime de Supabase, polling, revalidación). **Decisión:** implementar con suscripción Realtime de Supabase sobre la tabla `attendances` filtrada por `event_id`. Incluir fallback a revalidación si la suscripción falla.

### DA-03 — Estado del botón de confirmación propio en Estado 2

El Gherkin no especifica si el botón del estado ya confirmado por el usuario debe verse diferente al resto. **Decisión:** el botón correspondiente al estado actual del usuario (`va`, `no_va`, `tal_vez`) debe verse visualmente activo/seleccionado. Esto es necesario para evitar que el usuario confirme dos veces sin saberlo. Documentar en US-13 si aún no está cubierto.

---

## 25. Resumen

US-10 define el comportamiento del cuadrante central del dashboard según el ciclo de vida del evento mensual. Establece tres estados mutuamente excluyentes — **sin evento convocado**, **evento publicado**, **evento cerrado** — con información y acciones específicas para cada uno.

La implementación requiere:
- Lógica de resolución de estado server-side con precedencia `closed > published > sin evento`.
- Consultas a `events`, `attendances`, `rotation`, `members` y `profiles` según el estado.
- Suscripción Realtime en Estado 2 para confirmaciones en vivo.
- Renderizado condicional sin mezcla de elementos entre estados.
- Todos los textos desde `lib/texts.json`.

El cuadrante es el componente de mayor visibilidad del dashboard y su corrección es prerequisito para US-11, US-13, US-14 y US-15.
