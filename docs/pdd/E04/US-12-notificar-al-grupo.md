# PDD — US-12: Notificar al grupo

## 1. Identificación

| Campo | Valor |
|---|---|
| **Epic** | E04 — Dashboard |
| **User Story** | US-12 — Notificar al grupo |
| **Prioridad** | Alta — cierra el ciclo de creación del evento: sin notificación, los miembros no saben que la cena fue convocada |
| **Objetivo de negocio** | Garantizar que todos los miembros del grupo sean informados cuando el evento del mes fue creado o actualizado en datos relevantes (fecha o lugar), eliminando la dependencia de WhatsApp para comunicar la convocatoria. |

---

## 2. Problema a resolver

Cuando el organizador crea el evento del mes, los miembros no reciben ningún aviso activo. Sin un mecanismo de notificación, los miembros deben acceder proactivamente a la app para enterarse de la convocatoria, lo que reduce la tasa de confirmaciones tempranas. Del mismo modo, si el organizador modifica la fecha o el lugar después de publicar el evento, los miembros que ya lo vieron pueden estar trabajando con información desactualizada.

---

## 3. Objetivo funcional

Proveer al organizador dos mecanismos de notificación in-app:

1. **Notificación automática al crear el evento:** al publicar el evento, `events.notified_at` se registra automáticamente. Esto activa el indicador de convocatoria (`ConvocatoriaNotification`) en el panel de todos los miembros del grupo cuando ingresan a la app.

2. **Re-notificación manual por cambios relevantes:** al editar fecha o lugar de un evento ya publicado, el sistema ofrece al organizador una opción explícita para volver a notificar al grupo. Si el organizador confirma, `events.notified_at` se actualiza al momento del guardado, reactivando el indicador para miembros que aún no confirmaron asistencia.

> **MVP: notificaciones in-app únicamente.** No hay push notifications ni email en esta fase. El mecanismo es visual: `ConvocatoriaNotification` aparece en el dashboard de cada miembro cuando `events.notified_at` es reciente o fue actualizado.

---

## 4. Alcance

### Incluye
- Registro automático de `events.notified_at` al crear el evento (al momento del INSERT).
- Visualización del indicador de convocatoria (`ConvocatoriaNotification`) para todos los miembros cuando el evento existe y tiene `notified_at` seteado.
- Checkbox "Notificar al grupo sobre los cambios" en el formulario de edición, visible solo cuando se modifica `event_date` o `place`.
- Si el checkbox está activo y se guarda: actualizar `events.notified_at = now()`.
- Comportamiento para miembros sin sistema de notificación activo: el evento aparece igualmente en su panel al ingresar a la app (no depende de notificación externa).
- Link directo al evento incluido en la card de `ConvocatoriaNotification`.

### No incluye
- Push notifications (Fase 2+).
- Email al grupo (Fase 2+).
- Preferencias de notificación por miembro (no existe en MVP).
- Notificaciones para cambios no relevantes (solo fecha y lugar disparan re-notificación).
- Historial de notificaciones enviadas.
- Notificación individual miembro a miembro.

---

## 5. Actor principal

**Organizador del período actual** — crea el evento y decide si re-notifica ante cambios. Los **miembros del grupo** son los receptores pasivos de la notificación in-app.

---

## 6. Precondiciones

- El usuario autenticado es el organizador del período actual en el grupo.
- Existe un grupo con miembros activos.
- **Scenario 01:** no existe evento `Published` para el período actual → se está creando.
- **Scenario 03:** existe un evento con `status = published` y el organizador modifica `event_date` o `place`.

---

## 7. Postcondiciones

- **Scenario 01:** `events.notified_at` queda seteado al timestamp del INSERT. `ConvocatoriaNotification` es visible para todos los miembros del grupo al acceder al dashboard.
- **Scenario 02:** el evento es visible en el panel del miembro independientemente de si tiene notificaciones externas activas.
- **Scenario 03 (con checkbox activo):** `events.notified_at` se actualiza al timestamp del UPDATE. `ConvocatoriaNotification` vuelve a mostrarse para los miembros que aún no confirmaron asistencia.
- **Scenario 03 (con checkbox inactivo):** `events.notified_at` no se modifica. Los miembros no ven nueva notificación por ese cambio.

---

## 8. Definiciones funcionales

### 8.1 Mecanismo de notificación in-app
La "notificación" en MVP se implementa íntegramente mediante el componente `ConvocatoriaNotification`. Este componente se muestra en el dashboard del miembro cuando:
- El evento del período tiene `status = published`.
- El miembro aún no ha confirmado asistencia (`attendances.status` para ese usuario es nulo o no existe).

No existe un sistema de preferencias de notificación per-miembro en MVP. El concepto "notificaciones desactivadas" del Scenario 02 se mapea como: el miembro accede al panel y ve el evento de todas formas, dado que la visibilidad del evento es independiente de cualquier canal de notificación externo.

### 8.2 Campo `events.notified_at`
- Tipo: `timestamptz`
- Seteado automáticamente en el INSERT del evento.
- Actualizado en el UPDATE si el organizador activa el checkbox de re-notificación.
- Usado por `ConvocatoriaNotification` para calcular el estado de recordatorio (≥48h desde `notified_at` → variante "Recordatorio").

### 8.3 Checkbox de re-notificación
- Solo visible en el formulario de edición de evento, no en la creación.
- Se activa únicamente cuando el organizador modifica `event_date` o `place`.
- Si ninguno de esos campos cambia, el checkbox no se muestra.
- El checkbox no está marcado por defecto: la re-notificación es opt-in.

### 8.4 Link directo al evento
El `ConvocatoriaNotification` existente ya incluye acceso al evento vía routing `/grupo/[id]`. No es necesario un link separado.

---

## 9. Reglas de negocio

| # | Regla |
|---|---|
| RN-01 | `events.notified_at` se setea automáticamente al crear el evento — sin acción adicional del organizador. |
| RN-02 | La notificación in-app es el único canal disponible en MVP. No hay push ni email. |
| RN-03 | `ConvocatoriaNotification` se muestra a todo miembro del grupo cuando `status = published` y no tiene confirmación de asistencia registrada. |
| RN-04 | El checkbox de re-notificación solo aparece en edición, no en creación. |
| RN-05 | El checkbox de re-notificación solo se habilita cuando el organizador modifica `event_date` o `place` en el formulario de edición. |
| RN-06 | Si el checkbox está inactivo al guardar, `notified_at` no se actualiza. |
| RN-07 | Si el checkbox está activo al guardar, `notified_at` se actualiza a `now()` en el mismo UPDATE del evento. |
| RN-08 | Un miembro sin sistema de notificación externo activo (push/email) igual ve el evento en su panel al ingresar a la app. |
| RN-09 | Solo el organizador del período actual puede desencadenar una re-notificación. |
| RN-10 | No existe un límite de re-notificaciones en MVP, pero cada re-notificación requiere acción explícita del organizador. |

---

## 10. Flujo principal

### Flujo A — Creación con notificación automática (Scenario 01)

```
1. Organizador crea el evento (formulario US-11)
2. Server Action: INSERT en events con notified_at = now()
3. Evento queda con status = published y notified_at seteado
4. Miembro ingresa al dashboard
5. Sistema evalúa: evento published + miembro sin asistencia registrada
6. ConvocatoriaNotification se muestra con fecha, lugar y acceso al evento
```

### Flujo B — Edición con re-notificación (Scenario 03)

```
1. Organizador abre el formulario de edición de evento publicado
2. Organizador modifica event_date o place
3. Sistema habilita y muestra checkbox "Notificar al grupo sobre los cambios"
4. Organizador activa el checkbox
5. Organizador guarda los cambios
6. Server Action: UPDATE evento + notified_at = now()
7. Miembros que ingresan ven ConvocatoriaNotification actualizada
```

---

## 11. Flujos alternativos

### FA-01 — Edición sin re-notificación (Scenario 03, checkbox inactivo)

```
1. Organizador edita fecha o lugar
2. Checkbox "Notificar al grupo" aparece pero el organizador no lo activa
3. Organizador guarda
4. UPDATE: solo se actualizan los campos modificados; notified_at no cambia
5. Los miembros no ven nueva notificación por ese cambio
```

### FA-02 — Edición de campo no relevante

```
1. Organizador edita solo description (no fecha ni lugar)
2. El checkbox de re-notificación no aparece
3. UPDATE normal sin modificar notified_at
```

### FA-03 — Miembro accede sin notificación activa (Scenario 02)

```
1. El evento tiene status = published con notified_at seteado
2. Miembro ingresa a la app (sin haber recibido push/email — no existen en MVP)
3. Sistema evalúa el estado del evento y la asistencia del miembro
4. ConvocatoriaNotification se muestra igualmente en el panel
```

### FA-04 — Organizador crea evento y hay error de persistencia

```
1. Server Action intenta INSERT
2. Falla la operación en Supabase
3. notified_at no queda seteado
4. El evento no se crea (transacción atómica: si falla el evento, no hay notified_at)
5. UI muestra mensaje de error (tipo: error)
```

---

## 12. UI / UX

### Fuente de verdad
Referenciar: `docs/design/design-system.md`

### Comportamientos requeridos

- **Checkbox de re-notificación:** se renderiza en el formulario de edición de evento, debajo del campo `place`. Aparece condicionalmente: solo si el valor actual de `event_date` o `place` difiere del valor guardado en DB.
- **Estado del checkbox:** no marcado por defecto. El organizador debe activarlo deliberadamente.
- **Estado del botón "Guardar cambios":** no cambia su comportamiento ni apariencia por el estado del checkbox.
- **`ConvocatoriaNotification`:** el componente existente se mantiene sin cambios de layout. La re-notificación no genera un nuevo componente: recalcula la visibilidad basada en el nuevo `notified_at`.
- **Botón "Notificar al grupo":** visible en el cuadrante del evento solo si el organizador quiere notificar de forma standalone (sin editar campos). Ver sección 24 — punto abierto sobre si este flujo standalone es parte de US-12 o US-08.
- **Estado loading del botón:** usar texto del tipo `pending` mientras la mutación está en curso, deshabilitar el botón para evitar doble envío.
- **Feedback post-acción:** mensaje de tipo success al completar la notificación / re-notificación.

---

## 13. Mensajes y textos

### Fuente de verdad
Referenciar: `lib/texts.json`

### Tipos de mensajes requeridos

| Tipo | Contexto |
|---|---|
| `notifyCheckbox` | Label del checkbox de re-notificación en formulario de edición |
| `notifyButton.idle` | Estado por defecto del botón de notificación standalone |
| `notifyButton.pending` | Estado de carga del botón de notificación standalone |
| success | Confirmación tras notificar / re-notificar exitosamente |
| error | Fallo al intentar notificar o guardar con re-notificación activa |

> Todos los textos ya están definidos en `lib/texts.json` bajo las claves relevantes. No escribir textos literales en componentes.

---

## 14. Persistencia

### Tabla afectada: `events`

| Campo | Operación | Condición |
|---|---|---|
| `notified_at` | SET `now()` en INSERT | Siempre al crear el evento |
| `notified_at` | SET `now()` en UPDATE | Solo si el organizador activa el checkbox de re-notificación |

### No se crean tablas adicionales

No hay tabla de historial de notificaciones en MVP. El campo `notified_at` es el único registro de estado de notificación.

### Atomicidad

- La creación del evento y el seteo de `notified_at` deben ser parte del mismo INSERT. No son dos operaciones separadas.
- La edición del evento y el update de `notified_at` (cuando aplica) deben ser parte del mismo UPDATE.

---

## 15. Seguridad

### Validaciones server-side obligatorias antes de cualquier mutación

1. `auth.uid()` del solicitante es válido y pertenece al grupo.
2. El usuario es el organizador del período actual (`rotation` table — `user_id = auth.uid()` para el `month` actual del `group_id`).
3. El evento pertenece al `group_id` correcto.
4. El evento tiene `status = published` (para re-notificación — no se puede re-notificar un evento cerrado o pendiente).

### RLS

- La política de UPDATE en `events` debe cubrir el caso del organizador actualizando `notified_at`.
- Ningún miembro no-organizador puede triggear una re-notificación (validación server-side + RLS).

### Principio

No confiar solo en restricciones visuales. El checkbox oculto no garantiza seguridad. Toda escritura en `notified_at` debe pasar por Server Action con validación de identidad.

---

## 16. Dependencias

| Dependencia | Tipo | Detalle |
|---|---|---|
| US-11 — Crear evento | Funcional | El evento debe existir con `status = published` antes de notificar |
| US-08 — Recibir notificación de convocatoria | Funcional | `ConvocatoriaNotification` es el componente receptor de la notificación in-app |
| US-10 — Confirmar asistencia | Funcional | La visibilidad de `ConvocatoriaNotification` depende del estado de asistencia del miembro |
| `events.notified_at` | DB | Columna existente en schema — no requiere migración |
| `ConvocatoriaNotification` | Componente | Componente existente, se mantiene sin cambios estructurales |

---

## 17. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| El checkbox se muestra incorrectamente cuando no hubo cambio en fecha o lugar | Media | Medio | Comparar valores del formulario contra los valores de DB antes de renderizar el checkbox |
| Re-notificación no actualiza `notified_at` por error en Server Action | Baja | Alto | Validar en Server Action y retornar error explícito; UI muestra feedback |
| `ConvocatoriaNotification` no refresca tras el update de `notified_at` | Media | Medio | Llamar `router.refresh()` tras el UPDATE exitoso |
| Doble click en "Notificar" genera múltiples updates de `notified_at` | Baja | Bajo | Deshabilitar el botón/checkbox mientras la mutación está en curso |

---

## 18. Casos borde

| Caso | Comportamiento esperado |
|---|---|
| Organizador modifica un campo no relevante (solo description) | El checkbox de re-notificación no aparece |
| Organizador activa el checkbox pero cancela el formulario sin guardar | `notified_at` no se modifica |
| Evento ya cerrado — organizador intenta re-notificar | Acción bloqueada server-side; UI no debería mostrar la opción de edición para eventos cerrados |
| Miembro ya confirmó asistencia | `ConvocatoriaNotification` no se muestra (ya confirmó) — el update de `notified_at` no la reactiva para él |
| Grupo sin miembros activos (solo organizador) | La notificación se registra igual; el organizador puede verla en su propio panel si corresponde |
| `notified_at` ya tiene un valor reciente y el organizador re-notifica | Se sobreescribe con el nuevo `now()` — no hay bloqueo por frecuencia en MVP |
| Error de red al guardar con checkbox activo | UI muestra error; `notified_at` no se actualizó; el organizador puede reintentar |

---

## 19. Criterios de aceptación desarrollados

### Scenario 01: Notificación enviada al crear

**Dado** que soy el organizador del período actual
**Cuando** creo el evento del período (Scenario 01 de US-11)
**Entonces:**
- El INSERT en `events` incluye `notified_at = now()`
- `ConvocatoriaNotification` aparece en el dashboard de todos los miembros del grupo al acceder a la app
- La card incluye fecha del evento, lugar (si fue cargado) y acceso directo al panel del evento

### Scenario 02: Miembro sin notificaciones activas

**Dado** que un miembro no recibe notificaciones push ni email (no existen en MVP)
**Cuando** el evento es creado con `notified_at` seteado
**Entonces:**
- El evento aparece en el panel del miembro al ingresar a la app
- La visibilidad del evento no depende de ningún canal de notificación externo
- `ConvocatoriaNotification` se renderiza basándose únicamente en el estado del evento y la asistencia del miembro

### Scenario 03: Ofrecer re-notificación por cambios relevantes

**Dado** que el evento ya fue creado con `status = published`
**Cuando** el organizador modifica `event_date` o `place` y guarda
**Entonces:**
- El formulario de edición muestra el checkbox "Notificar al grupo sobre los cambios"
- Si el checkbox está activo al guardar: `notified_at` se actualiza a `now()` en el mismo UPDATE
- Si el checkbox está inactivo al guardar: `notified_at` no se modifica
- Tras guardar con re-notificación activa: `ConvocatoriaNotification` vuelve a mostrarse para los miembros que no han confirmado asistencia

---

## 20. Checklist diseño

- [ ] El checkbox de re-notificación usa componente de design system (`Checkbox` de shadcn/ui) — sin bordes sólidos de 1px como separador visual
- [ ] El checkbox respeta la jerarquía tipográfica del formulario de edición
- [ ] El estado de carga del botón de notificación standalone respeta los estados del design system (disabled + texto `pending`)
- [ ] La aparición del checkbox no altera el layout del formulario de edición de forma disruptiva
- [ ] `ConvocatoriaNotification` no cambia su diseño visual — US-12 solo modifica el dato subyacente (`notified_at`)

---

## 21. Checklist desarrollo

- [ ] `events.notified_at` se setea en el INSERT de creación del evento (Server Action de US-11 o Server Action nueva de US-12)
- [ ] Server Action de edición acepta flag `shouldNotify: boolean` y actualiza `notified_at` condicionalmente
- [ ] Validación server-side: solo el organizador del período puede actualizar `notified_at`
- [ ] Validación server-side: `status = published` antes de permitir re-notificación
- [ ] Checkbox de re-notificación aparece condicionalmente: solo cuando `event_date` o `place` cambiaron respecto a los valores en DB
- [ ] `router.refresh()` llamado tras UPDATE exitoso para refrescar `ConvocatoriaNotification`
- [ ] Botón deshabilitado durante la mutación (uso de `useTransition` o estado `pending`)
- [ ] Textos consumidos desde `lib/texts.json` (no hardcodeados)
- [ ] No se usa `select(*)` en ninguna query nueva
- [ ] RLS de UPDATE en `events` cubre la actualización de `notified_at` por el organizador

---

## 22. Checklist QA

- [ ] Crear evento → verificar que `events.notified_at` tiene valor en DB
- [ ] Miembro abre dashboard → `ConvocatoriaNotification` visible sin confirmación previa
- [ ] Miembro con asistencia confirmada → `ConvocatoriaNotification` no se muestra
- [ ] Organizador edita solo `description` → checkbox de re-notificación no aparece
- [ ] Organizador edita `event_date` → checkbox de re-notificación aparece
- [ ] Organizador edita `place` → checkbox de re-notificación aparece
- [ ] Guardar edición con checkbox inactivo → `notified_at` no cambia en DB
- [ ] Guardar edición con checkbox activo → `notified_at` se actualiza en DB
- [ ] Guardar edición con checkbox activo → `ConvocatoriaNotification` vuelve a aparecer para miembros sin confirmación
- [ ] Usuario no-organizador no puede actualizar `notified_at` (test server-side)
- [ ] Evento cerrado → opción de re-notificación no disponible
- [ ] Doble clic en guardar → solo un UPDATE ejecutado

---

## 23. Trazabilidad

| Scenario Gherkin | Sección del PDD | Cobertura |
|---|---|---|
| S01 — Notificación al crear | §8.1, §9 (RN-01, RN-02, RN-03), §10 Flujo A, §14, §19 S01 | Completa |
| S02 — Miembro sin notificaciones activas | §8.1 (definición in-app), §9 (RN-08), §11 FA-03, §19 S02 | Completa |
| S03 — Re-notificación por cambios relevantes | §8.3, §9 (RN-04–RN-07), §10 Flujo B, §11 FA-01/FA-02, §19 S03 | Completa |

---

## 24. Definiciones abiertas

### DA-01 — Botón "Notificar al grupo" standalone
`lib/texts.json` define `notifyButton.idle` y `notifyButton.pending`, que sugieren la existencia de un botón standalone de notificación (no vinculado al formulario de edición). Esto podría corresponder a:
- Un botón visible en el cuadrante del evento del dashboard solo para el organizador.
- Acción para notificar al grupo *sin editar el evento* (ej. enviar un recordatorio manual).

**Pregunta abierta:** ¿Este flujo standalone es parte de US-12 o fue cubierto por US-08? Si es parte de US-12, requiere un Scenario adicional y flujo propio.

**Recomendación:** Confirmar con el equipo antes de implementar el botón standalone. Si aplica a US-12, agregarlo como Scenario 04.

### DA-02 — "Notificaciones desactivadas" en Scenario 02
El Gherkin menciona "un miembro tiene las notificaciones desactivadas". En MVP no existe un sistema de preferencias de notificación. Se interpreta como: el miembro no tiene acceso a push/email (que no existen en MVP) y de todas formas ve el evento en su panel. Si en el futuro se implementan preferencias de notificación, este scenario deberá revisarse.

---

## 25. Resumen

US-12 cierra el ciclo de comunicación del evento mensual. El mecanismo es simple en MVP: `events.notified_at` como fuente de verdad para triggear `ConvocatoriaNotification` en el panel de cada miembro. La notificación al crear es automática (no requiere acción del organizador). La re-notificación por cambios relevantes es opt-in mediante checkbox en el formulario de edición, visible solo cuando se modifican `event_date` o `place`. No hay push ni email en esta fase. Los miembros que ingresan a la app siempre ven el evento en su panel, independientemente de canales externos. La única definición abierta relevante es si existe un botón standalone de notificación, que requiere confirmación antes de implementar.
