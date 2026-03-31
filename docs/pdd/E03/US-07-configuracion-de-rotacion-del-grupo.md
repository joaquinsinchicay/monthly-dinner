# PDD — US-07: Configuración de rotación del grupo

---

## 1. Identificación

| Campo | Valor |
|---|---|
| **Epic** | E03 — Settings |
| **User Story** | US-07 — Configuración de rotación del grupo |
| **Prioridad** | Alta — MVP |
| **Tabla principal** | `rotation` |
| **Actor principal** | Admin del grupo |
| **Objetivo de negocio** | Establecer el turno rotativo de organizadores del grupo para que cada cena tenga un responsable asignado de forma ordenada, equitativa y sin intervención manual constante. |

---

## 2. Problema a resolver

Sin rotación configurada, el turno del organizador queda sin registro formal. Siempre organiza la misma persona. No hay visibilidad del orden ni posibilidad de planificar con anticipación quién organiza cada cena. El admin no tiene herramientas dentro del producto para resolver esto.

---

## 3. Objetivo funcional

Proveer al admin del grupo una pantalla de configuración de rotación que le permita:
- Generar una rotación aleatoria automáticamente.
- Configurar manualmente qué miembro organiza cada próximo evento.
- Ver y modificar una rotación ya existente.
- Bloquear la configuración cuando el grupo tiene un solo miembro.

---

## 4. Alcance

### Incluye
- Visualización del estado actual de la rotación (existente o vacía).
- Generación aleatoria de rotación (sin persistir hasta confirmar).
- Configuración manual con selector de organizador por evento.
- Guardado de la rotación (manual y aleatoria).
- Modificación de una rotación guardada.
- Bloqueo funcional cuando el grupo tiene un único miembro.

### No incluye
- Aplicación automática del turno al cierre del evento (Fase 2).
- Notificaciones al organizador asignado.
- Eliminación completa de la rotación (reseteo).
- Configuración de rotación para grupos sin eventos futuros creados.
- Gestión del turno actual en curso (eso corresponde a US-11/US-13).

---

## 5. Actor principal

**Admin del grupo.** Solo los admins pueden acceder a esta pantalla. Cualquier otro rol debe ser bloqueado con respuesta 403/redirect.

---

## 6. Precondiciones

1. El usuario está autenticado.
2. El usuario tiene rol `admin` en el grupo.
3. El grupo existe y el usuario pertenece a él.
4. Accede desde la pantalla de configuración del grupo (`/groups/[groupId]/settings`).

---

## 7. Postcondiciones

| Acción | Postcondición |
|---|---|
| Guardar rotación aleatoria | La rotación queda persistida en `rotation` con los miembros asignados a cada evento. |
| Guardar rotación manual | Los eventos con miembro asignado quedan persistidos; los sin asignar quedan sin responsable en `rotation`. |
| Modificar rotación existente | La tabla `rotation` se actualiza con las nuevas asignaciones. |
| Grupo con un miembro | Sin cambios — ninguna escritura se realiza. |

---

## 8. Definiciones funcionales

### 8.1 — Rotación

Una rotación es una colección de asignaciones `(event_id, member_id)` que indica qué miembro del grupo es responsable de organizar cada evento futuro.

- Vive en la tabla `rotation`.
- Se establece por grupo.
- Un evento puede tener asignado 0 o 1 responsable en la rotación.
- No existe una "rotación activa única" — es una lista de asignaciones individuales por evento.

### 8.2 — Próximos eventos

Los "próximos eventos" son los registros en la tabla `events` del grupo con estado distinto a `closed`. Son los candidatos para recibir un organizador asignado.

### 8.3 — Generación aleatoria

El sistema distribuye aleatoriamente los miembros activos del grupo (excluyendo guests) entre los próximos eventos. La asignación es provisional — no se persiste hasta que el admin confirma explícitamente.

### 8.4 — Configuración manual

El admin asigna manualmente un miembro a cada evento a través de un selector. Puede dejar eventos sin asignar. Los eventos sin asignar quedan sin responsable en `rotation`.

### 8.5 — Estado "sin rotación configurada"

Se da cuando ningún registro en `rotation` existe para los próximos eventos del grupo. En ese estado se muestran las opciones de inicio de configuración.

### 8.6 — Miembros elegibles para rotación

Todos los miembros activos del grupo son elegibles, incluyendo guests sin cuenta (accountless members). La rotación soporta members, admins y guests (US-11c). El campo `display_name` se usa para identificar slots sin `user_id`.

---

## 9. Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | Solo un admin puede configurar o modificar la rotación. |
| RN-02 | Si el grupo tiene un único miembro, la configuración de rotación está bloqueada. |
| RN-03 | La rotación aleatoria no se guarda automáticamente — requiere confirmación explícita del admin. |
| RN-04 | Al guardar rotación manual, los eventos sin miembro asignado quedan sin responsable (no se persiste fila para ellos). |
| RN-05 | Todos los miembros del grupo son elegibles, incluyendo guests sin cuenta (US-11c). Los slots sin `user_id` usan `display_name` para identificación. |
| RN-06 | La validación de rol admin debe hacerse en el servidor, no solo en la UI. |
| RN-07 | Un evento puede tener como máximo un responsable asignado en la rotación. |
| RN-08 | Al modificar una rotación existente, los cambios solo se aplican al guardar — no hay autoguardado. |

---

## 10. Flujo principal

**Flujo A — Sin rotación previa (≥2 miembros)**

1. Admin accede a configuración del grupo.
2. El sistema detecta que no existe rotación configurada para próximos eventos.
3. Se muestran las opciones: "Generar aleatoriamente" y "Configurar manualmente".
4. Admin elige una opción → ver Flujo B o Flujo C.

**Flujo B — Generación aleatoria**

1. Admin selecciona "Generar aleatoriamente".
2. El sistema genera una asignación aleatoria de miembros elegibles entre próximos eventos.
3. Se muestra la lista de eventos con los responsables asignados (estado provisional).
4. Admin visualiza el resultado y puede confirmar con "Guardar rotación".
5. Al confirmar, la rotación se persiste en `rotation`.
6. La pantalla refleja la rotación guardada.

**Flujo C — Configuración manual**

1. Admin selecciona "Configurar manualmente".
2. El sistema muestra la lista de próximos eventos del grupo.
3. Cada evento tiene un selector de miembro organizador (vacío por defecto).
4. Admin asigna miembros a los eventos que desea.
5. Admin selecciona "Guardar rotación".
6. El sistema persiste solo las asignaciones completadas.
7. Los eventos sin asignar permanecen sin responsable.

**Flujo D — Ver / modificar rotación existente**

1. Admin accede a configuración.
2. El sistema detecta que ya existe rotación guardada.
3. Se muestra la lista de eventos con sus responsables asignados.
4. Admin puede modificar cualquier asignación.
5. Al confirmar cambios, se actualiza `rotation`.

---

## 11. Flujos alternativos

### FA-01 — Grupo con un único miembro
- El sistema detecta que el grupo tiene solo 1 miembro.
- La pantalla de rotación está bloqueada.
- Se muestra mensaje informativo indicando que se requieren al menos dos miembros.
- No se renderiza ningún selector ni opción de configuración.

### FA-02 — Admin cancela configuración manual
- Admin selecciona "Cancelar" durante la configuración manual.
- No se persiste ningún cambio.
- La pantalla vuelve al estado inicial (sin rotación o rotación existente según corresponda).

### FA-03 — Sin próximos eventos creados
- El grupo no tiene eventos futuros en estado no-cerrado.
- La pantalla de rotación indica que no hay eventos próximos para asignar.
- No se muestran selectores ni opciones de generación.
- *(Definición abierta — ver sección 24)*

### FA-04 — Error al guardar
- Si la mutación falla (error de red, RLS, etc.), se muestra mensaje de error tipo `error`.
- La rotación no se altera.
- El admin puede reintentar.

---

## 12. UI / UX

### Fuente de verdad
Toda definición visual debe seguir: `docs/design/design-system.md`

### Comportamientos requeridos

- La pantalla de rotación es accesible desde la sección de configuración del grupo.
- El estado inicial (sin rotación, con rotación, bloqueado) debe determinarse en server-side antes de renderizar.
- Las opciones "Generar aleatoriamente" y "Configurar manualmente" se muestran solo en ausencia de rotación guardada y con ≥2 miembros.
- La lista de eventos con responsables asignados usa tonal layering para separar filas — sin bordes de 1px.
- El selector de organizador por evento debe mostrar solo miembros elegibles (no guests).
- El botón de confirmar/guardar debe estar deshabilitado si no hay cambios respecto al estado actual.
- El estado provisional de la rotación aleatoria (no guardada) debe distinguirse visualmente del estado guardado.
- El bloqueo por un solo miembro debe mostrar el mensaje de forma clara y deshabilitar toda interacción de configuración.
- Durante el guardado debe mostrarse un estado `submitting` — la acción no puede dispararse dos veces.
- La pantalla debe contemplar los estados: `loading`, `empty` (sin rotación), `with-data` (rotación existente), `blocked` (1 miembro), `error`.

---

## 13. Mensajes y textos

### Fuente de verdad
Todos los textos estáticos deben consumirse desde: `lib/texts.json`

### Tipos de mensajes requeridos

| Tipo | Descripción |
|---|---|
| `info` | Mensaje de bloqueo cuando el grupo tiene un único miembro |
| `info` | Indicador de estado provisional de rotación generada (no guardada aún) |
| `success` | Confirmación visual tras guardar la rotación exitosamente |
| `error` | Error al intentar guardar la rotación (falla de red o servidor) |
| `label` | Etiqueta para eventos sin responsable asignado ("Sin asignar" / equivalente) |

**Claves relevantes en `texts.json`:**
- `group.rotation.editRotation`
- `group.rotation.generateRandomly`
- `group.rotation.configureManually`
- `group.rotation.regenerate`
- `group.rotation.confirm` / `group.rotation.save`
- `group.rotation.unassigned`
- `common.cancel`
- `common.save`

---

## 14. Persistencia

### Tabla principal: `rotation`

| Campo | Uso |
|---|---|
| `group_id` | Identificador del grupo |
| `month` | Primer día del mes asignado (`YYYY-MM-01`). Unique constraint con `group_id`. |
| `user_id` | Usuario autenticado asignado (nullable — null para accountless members) |
| `member_id` | FK a `members.id` — siempre presente (incluye guests) |
| `display_name` | Nombre visible cuando `user_id` es null (accountless) |

> **Nota:** La rotación opera por mes, no por event_id. Cada entrada asigna un responsable al mes en que ocurrirá la cena. La correspondencia con el evento surge de que `events` también usa `month` como clave única por grupo.

### Operaciones esperadas

| Operación | Descripción |
|---|---|
| `SELECT` | Obtener todas las entradas del grupo ordenadas por `month` ascending |
| `INSERT` | Crear nuevas asignaciones por mes al guardar rotación (manual o aleatoria) |
| `UPDATE` | Modificar la asignación de un mes existente |

### Regla de guardado
Al guardar la rotación manual o aleatoria, el sistema inserta una entrada por cada mes con `member_id` asignado. Los meses sin asignar no generan fila. La acción usa `generateRandomRotation` con las entries filtradas.

### Consultas auxiliares

- `members` → obtener todos los miembros del grupo (incluye guests/accountless para US-11c).
- `rotation` con `order('month', ascending: true)` → estado actual de la rotación.

---

## 15. Seguridad

| Control | Detalle |
|---|---|
| **Autenticación** | `getUser()` del servidor antes de cualquier operación. |
| **Autorización de rol** | Verificar `members.role = admin` para `group_id` + `auth.uid()` en el servidor antes de cualquier lectura o escritura. |
| **RLS — `rotation`** | Solo miembros del grupo pueden leer. Solo admins pueden insertar/actualizar/eliminar. |
| **Validación server-side** | No asumir que el `member_id` enviado es válido — revalidar que pertenece al grupo antes de persistir. |
| **Guard de un solo miembro** | Verificar cantidad de miembros en servidor; no depender solo de la UI para bloquear la acción. |
| **No exponer datos** | No retornar datos de miembros de otros grupos en los selectores. |

---

## 16. Dependencias

| Dependencia | Tipo | Detalle |
|---|---|---|
| `rotation` table | DB | Tabla principal de persistencia |
| `events` table | DB | Fuente de próximos eventos del grupo |
| `members` table | DB | Fuente de miembros elegibles |
| US-05 / US-06 | Funcional | Pantalla de settings del grupo ya debe existir como contenedor |
| US-11 / US-13 | Funcional | Uso del turno rotativo en el ciclo mensual — downstream de US-07 |

---

## 17. Riesgos

| Riesgo | Mitigación |
|---|---|
| Admin guarda rotación aleatoria sin revisarla | El estado provisional debe estar claramente diferenciado del guardado. El botón de guardar requiere acción explícita. |
| Accountless member sin `user_id` en el selector | Mostrar `display_name` con badge "SIN CUENTA". El selector ya maneja este caso vía `getMemberName()`. |
| Concurrencia — dos admins guardan al mismo tiempo | Upsert con manejo adecuado de conflictos. En MVP es riesgo bajo dado el tamaño de los grupos. |
| Grupo sin eventos futuros — UX sin cobertura | Definir estado vacío explícito (ver FA-03 y sección 24). |
| Rotación guardada para evento que luego se cancela | Fuera de scope para esta US. Gestión del evento cancelado es independiente. |

---

## 18. Casos borde

| Caso | Comportamiento esperado |
|---|---|
| Grupo con 1 miembro | Pantalla bloqueada con mensaje informativo. Sin acceso a configuración. |
| Grupo con exactamente 2 miembros | Rotación válida. Generación aleatoria asigna los 2 miembros a eventos consecutivos. |
| Más eventos que miembros elegibles | La generación aleatoria cicla los miembros para cubrir todos los eventos. |
| Más miembros que eventos | No todos los miembros reciben un evento asignado. Es comportamiento válido. |
| Admin guarda sin asignar ningún evento (manual) | Sin filas a insertar — operación vacía. Debería mostrarse un estado que indique que no hay cambios para guardar. *(Ver sección 24)* |
| Admin modifica una sola asignación de rotación existente | Solo esa fila se actualiza — el resto permanece igual. |
| Evento sin fecha definida | Debe mostrarse en la lista si su estado no es `closed`. *(Ver sección 24 — orden de eventos)* |

---

## 19. Criterios de aceptación desarrollados

### Scenario 01 — No hay rotación configurada

**Dado:** Admin accede a la pantalla de configuración del grupo.
**Cuando:** No existe ninguna asignación en `rotation` para los próximos eventos del grupo, Y el grupo tiene más de un miembro.
**Entonces:**
- Se muestran las opciones "Generar aleatoriamente" y "Configurar manualmente".
- No se muestra ninguna lista de asignaciones.
- La pantalla renderiza el estado `empty`.

**Mapeo técnico:**
- Query a `rotation` filtrando por `group_id` devuelve array vacío.
- `members` prop tiene length > 1.
- `RotationManager` determina estado `empty` + `!isBlocked` antes de renderizar opciones.

---

### Scenario 02 — Configuración aleatoria

**Dado:** Admin está en la pantalla de configuración, grupo tiene ≥2 miembros.
**Cuando:** Selecciona "Generar aleatoriamente".
**Entonces:**
- El sistema genera una asignación aleatoria de todos los miembros del grupo (incluye accountless) a los próximos N meses.
- Se muestra la lista de eventos con los responsables asignados.
- El estado es provisional — no persistido en `rotation` aún.
- Se muestra estado visual diferenciado de "no guardado".
- El botón "Guardar rotación" está disponible.
- Al presionar "Guardar rotación", las asignaciones se persisten en `rotation`.

**Mapeo técnico:**
- La generación aleatoria ocurre en client o server (state provisional no requiere DB).
- El guardado es una Server Action que hace upsert en `rotation`.
- RLS + validación de rol en el servidor antes del upsert.

---

### Scenario 03 — Configuración manual — visualización

**Dado:** Admin está en la pantalla de configuración Y selecciona "Configurar manualmente".
**Cuando:** La pantalla carga.
**Entonces:**
- Se muestra la lista de próximos eventos del grupo.
- Cada evento tiene un selector de miembro organizador (estado vacío por defecto).
- Se muestran las opciones "Cancelar" y "Guardar rotación".

**Mapeo técnico:**
- Lista de meses: genera los próximos N meses desde la fecha actual (client-side).
- Selector de miembro: todos los miembros del grupo pasados como prop desde server-side.
- Los miembros se cargan en `settings/page.tsx` y se pasan a `RotationManager`.

---

### Scenario 04 — Guardar configuración manual

**Dado:** Admin está configurando la rotación manualmente.
**Cuando:** Asigna al menos un responsable y selecciona "Guardar rotación".
**Entonces:**
- Los eventos con miembro asignado se persisten en `rotation`.
- Los eventos sin asignar no generan fila en `rotation`.
- Se muestra confirmación de éxito.

**Mapeo técnico:**
- Server Action `generateRandomRotation` recibe array de `{ month, member_id, user_id, display_name }`.
- Solo se envían las tuplas donde `member_id !== null` (filtrado client-side antes de llamar la acción).
- Insert en `rotation` para las asignaciones válidas.
- Validación server-side: admin rol + `member_id` pertenece al grupo.

---

### Scenario 05 — Ver rotación existente

**Dado:** Admin accede a la pantalla de configuración.
**Cuando:** Existen asignaciones previas en `rotation` para próximos eventos.
**Entonces:**
- Se muestra la lista de eventos con los responsables actualmente asignados.
- El admin puede modificar cualquier asignación.
- Los cambios se aplican al confirmar — no hay autoguardado.

**Mapeo técnico:**
- Query a `rotation` JOIN `profiles` para el grupo, ordenada por `month` ascending.
- La UI precarga las asignaciones en modo `edit` — selector por mes con el miembro actual preseleccionado.
- Al guardar, `updateRotationEntry` se ejecuta solo para las entradas modificadas.

---

### Scenario 06 — Grupo con un solo miembro

**Dado:** Admin accede a la pantalla de configuración.
**Cuando:** El grupo tiene exactamente un miembro.
**Entonces:**
- La pantalla de rotación está en estado bloqueado.
- Se muestra mensaje informativo indicando que se requieren al menos dos miembros.
- No se renderizan opciones de configuración ni selectores.

**Mapeo técnico:**
- Query a `members` donde `group_id = X` devuelve count = 1.
- Server Component determina estado `blocked` y renderiza mensaje desde `texts.json`.
- Validación también en Server Action para evitar bypass desde cliente.

---

## 20. Checklist diseño

- [x] No se usan bordes de 1px para separar contenido — filas separadas por `space-y-2` y `py-1`, sin clases `border` en separadores de contenido.
- [x] Lista de rotación usa `bg-white` (surface_lowest) sobre fondo `bg-[#fcf9f8]` — sin divisores visuales entre filas.
- [ ] **GAP DE DISEÑO:** El selector de miembro en manual-config y edit mode usa `<select>` HTML nativo. El design system requiere un componente custom. Pendiente de reemplazar por un selector tonal alineado al sistema visual.
- [x] Estado provisional diferenciado — label "VISTA PREVIA — AÚN NO GUARDADO" en uppercase tracking text visible antes de confirmar.
- [x] Estado bloqueado (1 miembro) usa color secundario `text-[#585f6c]` — consistente con mensajes informativos del sistema.
- [x] Estado `submitting` — botón deshabilitado con `disabled={loading}` y texto "Guardando…" durante la mutación.
- [x] Todos los textos estáticos consumidos desde `lib/texts.json` vía `t()` — sin hardcodeo detectado.
- [x] Tipografía: título con `DM Serif Display italic`, labels con `DM Sans` — alineado a `design-system.md`.

---

## 21. Checklist desarrollo

- [x] Server Action `generateRandomRotation` — insert en `rotation` con validación de rol admin. (`app/(dashboard)/rotation/actions.ts`)
- [x] Server Action `updateRotationEntry` — update de entrada individual con validación admin. (`app/(dashboard)/rotation/actions.ts`)
- [x] Server Action valida `member_id` pertenece al grupo antes de persistir.
- [x] Loader de miembros del grupo en server-side — `settings/page.tsx` query a `members`.
- [x] Loader de rotación existente en server-side — `settings/page.tsx` query a `rotation`.
- [x] Lógica de generación aleatoria (Fisher-Yates) encapsulada en `RotationManager` — no en `app/`.
- [x] Textos estáticos consumidos desde `lib/texts.json`.
- [x] Sin `select(*)` — campos explícitos en todas las queries.
- [x] Sin queries desde componentes de UI — datos pasados como props desde Server Component.
- [x] Estados de UI: `empty`, `with-data`, `submitting`, `error` — implementados.
- [x] RLS completo en `rotation`: select members / insert-update-delete admin.
- [x] Admin-only guard en `settings/page.tsx` — redirect a dashboard si rol != admin.
- [ ] Estado `blocked` (1 miembro) en `RotationManager` — guard `isBlocked` implementado en esta US. ✅ resuelto
- [ ] Asignación parcial en manual config — filtro `member_id !== null` implementado en esta US. ✅ resuelto

---

## 22. Checklist QA

- [ ] **Scenario 01:** Sin rotación y ≥2 miembros → se muestran ambas opciones de configuración.
- [ ] **Scenario 02:** Generación aleatoria → lista provisional visible → guardar → rotación persistida.
- [ ] **Scenario 02:** Generación aleatoria → NO guardar → rotación no persistida.
- [ ] **Scenario 03:** Configurar manualmente → lista de eventos con selectores vacíos.
- [ ] **Scenario 03:** Todos los miembros elegibles aparecen en el selector (sin guests).
- [ ] **Scenario 04:** Asignar algunos eventos → guardar → solo los asignados persisten.
- [ ] **Scenario 04:** Eventos sin asignar → no generan fila en `rotation`.
- [ ] **Scenario 05:** Con rotación existente → asignaciones se precargan en selectores.
- [ ] **Scenario 05:** Modificar asignación → guardar → cambio persistido.
- [ ] **Scenario 06:** Grupo con 1 miembro → mensaje de bloqueo visible → sin opciones de configuración.
- [ ] Usuario no-admin → acceso bloqueado (403 o redirect).
- [ ] Error de red al guardar → mensaje de error → rotación sin alterar.
- [ ] Cancelar configuración manual → sin cambios persistidos.
- [ ] Double submit bloqueado — botón deshabilitado durante `submitting`.

---

## 23. Trazabilidad

| Scenario | Sección del PDD | Cobertura |
|---|---|---|
| SC-01 — Sin rotación configurada | §8.5, §10 Flujo A, §19 SC-01 | ✅ Completo |
| SC-02 — Configuración aleatoria | §8.3, §10 Flujo B, §19 SC-02 | ✅ Completo |
| SC-03 — Configuración manual - visualización | §8.4, §10 Flujo C, §19 SC-03 | ✅ Completo |
| SC-04 — Guardar configuración manual | §9 RN-04, §10 Flujo C, §19 SC-04 | ✅ Completo |
| SC-05 — Ver rotación existente | §10 Flujo D, §19 SC-05 | ✅ Completo |
| SC-06 — Grupo con un solo miembro | §9 RN-02, §11 FA-01, §19 SC-06 | ✅ Completo |

---

## 24. Definiciones abiertas

### DA-01 — Comportamiento cuando no hay próximos eventos
El Gherkin no cubre el caso donde el admin accede a configurar rotación pero el grupo no tiene eventos futuros creados. **¿Se bloquea la pantalla? ¿Se muestra mensaje vacío?** Sugerencia: mostrar estado `empty` con mensaje informativo y deshabilitar las opciones de configuración hasta que exista al menos un evento. Requiere decisión de producto antes de implementar.

### DA-02 — Guardar rotación manual sin ninguna asignación ✅ RESUELTO
El botón "Guardar" está deshabilitado cuando `manualItems.every(i => i.member_id === null)` — requiere al menos 1 asignación para habilitar el guardado. La server action también retorna error si `entries.length === 0` como segunda línea de defensa.

### DA-03 — Orden de meses en la lista ✅ RESUELTO
La rotación usa `month` como clave — las entradas se ordenan por `month` ascending (`settings/page.tsx`). Los meses en configuración manual y random preview se generan secuencialmente desde el mes siguiente.

### DA-04 — Regenerar rotación aleatoria ✅ RESUELTO
El botón "Regenerar" está implementado en `RotationManager` modo `random-preview`. Llama a `generatePreview()` nuevamente con nuevo shuffle sin persistir.

---

## 25. Resumen

**US-07** define la pantalla de configuración de rotación de organizadores del grupo, accesible solo para admins. Cubre dos modos de configuración (aleatorio y manual), la visualización y edición de una rotación existente, y el bloqueo cuando el grupo tiene un solo miembro.

La feature está implementada en `components/rotation/RotationManager.tsx` + `app/(dashboard)/rotation/actions.ts` + `app/(dashboard)/dashboard/[groupId]/settings/page.tsx`.

Los puntos cerrados en esta iteración:
1. **Guard de 1 miembro** — estado `isBlocked` en `RotationManager`, mensaje desde `texts.json`.
2. **Asignación parcial** — manual config permite guardar con meses sin asignar (solo persiste los asignados).
3. **Schema corregido** — rotación opera por `month`, no por `event_id`.
4. **Guests elegibles** — todos los miembros del grupo pueden ser asignados (US-11c).

Definiciones abiertas activas: DA-01 (sin próximos meses), DA-02 (guardar sin ninguna asignación).

---

*Versión: Marzo 2026 — Generado con product-pdd skill*
