# PDD — US-08: Configuración de nombre del grupo

## 1. Identificación

| Campo | Valor |
|---|---|
| Epic | E03 — Settings |
| User Story | US-08 — Configuración de nombre del grupo |
| Prioridad | MVP — Fase 1 |
| Objetivo de negocio | Permitir al admin personalizar la identidad del grupo dentro de la app |

---

## 2. Problema a resolver

El grupo no tiene mecanismo para actualizar su nombre una vez creado. Si el nombre elegido al crear el grupo fue provisional, incorrecto o cambia con el tiempo, no hay forma de corregirlo. Esto genera inconsistencias en la identidad del grupo a lo largo de toda la app.

---

## 3. Objetivo funcional

Proveer al admin del grupo una interfaz para visualizar y editar el nombre del grupo, con validaciones de longitud y formato, persistencia inmediata y reflejo del cambio en toda la app.

---

## 4. Alcance

### Incluye
- Visualización del nombre actual del grupo en la sección de configuración
- Edición inline del nombre desde la misma pantalla
- Validación: campo obligatorio
- Validación: mínimo 3 caracteres, máximo 50 caracteres
- Trim de espacios al inicio y al final antes de persistir
- Feedback visual de éxito y error al guardar
- Cancelación de la edición sin cambios
- Restricción de acceso: solo admins pueden editar el nombre
- Reflejo del nombre actualizado en el header y resto de la app

### No incluye
- Cambio de otros atributos del grupo (frecuencia, configuración, etc.)
- Historial de nombres anteriores
- Notificación a miembros del cambio de nombre
- Edición de nombre por parte de miembros no admin

---

## 5. Actor principal

**Admin del grupo** — único rol habilitado para editar el nombre.

---

## 6. Precondiciones

- El usuario está autenticado
- El usuario es admin del grupo activo
- El grupo tiene un nombre actual registrado en la tabla `groups`
- El usuario accedió a la sección "Configuración del grupo"

---

## 7. Postcondiciones

**Éxito:**
- El nombre del grupo queda actualizado en la tabla `groups`
- El nuevo nombre se refleja en el header y en toda la app de forma inmediata
- Se muestra mensaje de confirmación al admin

**Error:**
- El nombre no se actualiza en la base de datos
- El campo vuelve al valor anterior o queda en estado editable
- Se muestra mensaje de error descriptivo

**Cancelación:**
- El nombre permanece sin cambios
- El campo vuelve al estado de solo lectura con el valor original

---

## 8. Definiciones funcionales

### 8.1 Nombre del grupo
- Campo de texto libre con restricciones de longitud
- Mínimo: 3 caracteres (tras trim)
- Máximo: 50 caracteres (tras trim)
- No puede estar vacío
- Se normaliza con trim antes de persistir y validar

### 8.2 Edición inline
- El campo de nombre se activa para edición al tocarlo
- Muestra el valor actual precargado al activarse
- Mientras está activo: disponibles acciones Guardar y Cancelar
- Mientras está inactivo: solo lectura

### 8.3 Reflejo del cambio
- Una vez persistido, el nuevo nombre debe verse en:
  - Header de la app (GroupSelector / nombre activo)
  - Cualquier otro punto de la UI que renderice el nombre del grupo activo

---

## 9. Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | Solo el admin del grupo puede editar el nombre |
| RN-02 | El nombre no puede estar vacío (incluso tras trim) |
| RN-03 | El nombre debe tener entre 3 y 50 caracteres (después de trim) |
| RN-04 | El sistema aplica trim al inicio y final antes de validar y guardar |
| RN-05 | Los miembros no admin no ven la opción de editar el nombre |
| RN-06 | Ante error del sistema, el nombre no se actualiza y se muestra feedback |
| RN-07 | La cancelación no persiste ningún cambio |

---

## 10. Flujo principal

1. El admin accede a la sección "Configuración del grupo"
2. El sistema muestra el nombre actual del grupo (solo lectura)
3. El admin toca el campo del nombre
4. El campo pasa a modo edición con el valor actual precargado
5. El admin modifica el nombre
6. El admin confirma la acción de guardar
7. El sistema aplica trim al valor ingresado
8. El sistema valida: no vacío, entre 3 y 50 caracteres
9. Si válido: el sistema persiste el nuevo nombre en `groups`
10. El sistema muestra mensaje de confirmación
11. El nombre se refleja de forma inmediata en toda la app

---

## 11. Flujos alternativos

### FA-01: Nombre vacío al guardar
- Paso 8: valor vacío (o solo espacios)
- El sistema muestra mensaje de error: nombre obligatorio
- El campo permanece en modo edición
- No se persiste ningún cambio

### FA-02: Longitud fuera de rango al guardar
- Paso 8: menos de 3 o más de 50 caracteres (tras trim)
- El sistema muestra mensaje de error correspondiente (mínimo o máximo)
- El campo permanece en modo edición
- No se persiste ningún cambio

### FA-03: Cancelar edición
- En cualquier momento mientras el campo está activo
- El admin toca la acción de cancelar
- El campo vuelve al valor original (sin cambios)
- El campo pasa a solo lectura

### FA-04: Error al guardar (falla del sistema)
- Paso 9: el sistema recibe error al intentar actualizar `groups`
- El sistema muestra mensaje de error
- El nombre no se actualiza en la DB
- El campo puede volver al modo edición o mostrar el valor anterior

### FA-05: Acceso de miembro no admin
- El usuario accede a la sección de ajustes
- El sistema no muestra la opción de editar el nombre
- Solo visualización sin acciones de mutación disponibles

---

## 12. UI / UX

### Fuente de verdad
`docs/design/design-system.md`

### Comportamientos requeridos

- El campo de nombre debe ser tocable para activar la edición (no requiere botón de "editar" separado, es inline)
- El valor actual del grupo debe estar precargado al abrir el modo edición
- Mientras el campo está en modo edición, deben ser visibles las acciones Guardar y Cancelar
- Los errores de validación deben mostrarse inline, sin limpiar el campo
- El campo no debe deshabilitarse visualmente mientras la mutación está en curso; el botón de guardar sí debe deshabilitarse para evitar doble envío
- El estado de carga debe ser visible durante el proceso de guardado
- Los miembros no admin ven la pantalla de configuración sin el campo editable del nombre (o directamente sin esa sección)

---

## 13. Mensajes y textos

### Fuente de verdad
`lib/texts.json`

### Tipos de mensajes requeridos

| Tipo | Contexto |
|---|---|
| Error inline | Campo vacío o solo espacios |
| Error inline | Nombre con menos de 3 caracteres |
| Error inline | Nombre con más de 50 caracteres |
| Error toast / inline | Falla del sistema al guardar |
| Success toast / feedback | Nombre guardado correctamente |

> Todos los textos literales deben estar definidos en `lib/texts.json`. No hardcodear en componentes ni páginas.

---

## 14. Persistencia

### Tabla afectada

**`groups`**
- Campo: `name`
- Operación: `UPDATE`
- Condición: `id = groupId` del grupo activo
- Valor: nombre ingresado por el admin, con trim aplicado

### Consideraciones
- La mutación debe realizarse vía Server Action
- Validar `auth.uid()` en servidor antes de ejecutar el UPDATE
- Confirmar que el usuario es admin del grupo antes de permitir la escritura
- No actualizar si la validación falla

---

## 15. Seguridad

### RLS
- La política de UPDATE en `groups` debe restringir la operación a admins del grupo
- Un miembro no admin no puede actualizar `groups.name`, ni siquiera si intenta hacerlo por fuera de la UI

### Validación server-side
- Verificar `auth.uid()` en la Server Action
- Verificar rol `admin` del usuario en la tabla `members` para el grupo correspondiente
- Aplicar las mismas validaciones de longitud y formato en el servidor (no confiar solo en validación de cliente)
- No ejecutar el UPDATE si alguna validación falla

### Superficie de ataque
- No exponer el `groupId` de forma manipulable sin validar pertenencia y rol
- Sanitizar el input de nombre en servidor antes de persistir

---

## 16. Dependencias

| Dependencia | Tipo | Descripción |
|---|---|---|
| `groups` | Tabla DB | Campo `name` a actualizar |
| `members` | Tabla DB | Para verificar rol `admin` del usuario |
| Auth (Supabase) | Infraestructura | `getUser()` servidor para identificar al actor |
| GroupSelector / Header | Componente UI | Debe reaccionar al cambio de nombre tras mutación |
| `lib/texts.json` | Texto | Mensajes de validación, éxito y error |
| US-00 | US | Creación del grupo donde se define el nombre inicial |
| US-05 | US | Selector de grupo en el header — consume `groups.name` |

---

## 17. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Nombre actualizado no se refleja en el header inmediatamente | Medio | Invalidar/revalidar el dato del grupo activo tras el UPDATE exitoso |
| Validación solo en cliente permite nombres inválidos por llamada directa | Alto | Duplicar validación en Server Action |
| RLS mal configurada permite UPDATE de miembro no admin | Alto | Revisar y testear la policy de UPDATE en `groups` |
| Trim no aplicado → espacios guardados como parte del nombre | Bajo | Aplicar trim siempre en servidor antes de persistir |

---

## 18. Casos borde

| Caso | Comportamiento esperado |
|---|---|
| Nombre con solo espacios | Tras trim = vacío → error "nombre obligatorio" |
| Nombre con exactamente 3 caracteres | Válido, se guarda |
| Nombre con exactamente 50 caracteres | Válido, se guarda |
| Nombre con 2 caracteres | Error de longitud mínima |
| Nombre con 51 caracteres | Error de longitud máxima |
| Admin guarda el mismo nombre que ya tenía | Se permite; el UPDATE no falla aunque el valor sea idéntico |
| Falla de red durante el guardado | Error visible, sin cambios persistidos |
| Miembro intenta editar nombre por manipulación directa de API | RLS bloquea la operación; sin cambios en DB |
| Admin cancela inmediatamente sin cambiar nada | El campo vuelve a solo lectura con el valor original |

---

## 19. Criterios de aceptación desarrollados

### Scenario 01 — Visualización del nombre actual
- Admin autenticado accede a la sección "Configuración del grupo"
- El sistema consulta `groups.name` para el grupo activo
- Se renderiza el nombre actual en modo solo lectura

### Scenario 02 — Editar nombre del grupo
- Admin toca el campo del nombre
- El campo pasa a modo edición con el valor actual precargado
- Admin ingresa un nuevo nombre válido (no vacío, entre 3 y 50 chars)
- Admin confirma guardar
- El sistema aplica trim, valida, y ejecuta UPDATE en `groups`
- Se muestra mensaje de confirmación
- El nombre se refleja en el header y resto de la app
- El cambio queda persistido en la DB

### Scenario 03 — Nombre vacío no permitido
- Admin está en modo edición
- Admin vacía el campo e intenta guardar
- El sistema detecta campo vacío (o solo espacios tras trim)
- Muestra mensaje de error: nombre obligatorio
- No se ejecuta el UPDATE

### Scenario 04 — Validación de longitud
- Admin ingresa nombre con menos de 3 chars → error de mínimo
- Admin ingresa nombre con más de 50 chars → error de máximo
- En ambos casos, no se guarda y se muestra el error correspondiente

### Scenario 05 — Cancelar edición
- Admin está en modo edición
- Admin cancela
- El campo regresa al valor original
- No se persiste ningún cambio

### Scenario 06 — Acceso restringido a no admins
- Usuario con rol `member` accede a la sección de ajustes
- No se muestra la opción de editar el nombre del grupo
- No hay acción de mutación disponible para ese usuario

### Scenario 07 — Error al guardar
- Admin ingresa nombre válido y guarda
- El sistema recibe un error al intentar el UPDATE
- Se muestra mensaje de error
- El nombre en `groups` no se actualiza

### Scenario 08 — Eliminación de espacios innecesarios
- Admin ingresa nombre con espacios al inicio o final (ej: `"  Amigos  "`)
- El sistema aplica trim antes de validar y persistir
- El nombre guardado no contiene los espacios extra

---

## 20. Checklist diseño

- [~] El campo de nombre respeta los tokens tipográficos del design system — usa `text-[15px]` hardcodeado; pendiente validación visual contra design system
- [~] Las acciones Guardar y Cancelar usan variantes de botón definidas en el design system — botones con clases hardcodeadas (`rounded-full`, gradiente, outline); pendiente validación contra componentes del design system
- [~] Los mensajes de error inline respetan el componente de feedback del design system — usa `<p className="text-[13px] text-[#ba1a1a]">` sin componente de feedback dedicado; pendiente validación visual
- [~] El estado de carga usa el patrón de loading del design system — botón muestra texto "Guardando..." y `disabled`; sin spinner; pendiente validación si el design system define un patrón distinto
- [x] No se usan bordes sólidos de 1px para separar secciones — card usa sombra (`shadow-[...]`); el separador interno (`divide-y`) está dentro de la card, no entre secciones
- [x] La pantalla respeta mobile-first — layout vertical stack, botones full-width

---

## 21. Checklist desarrollo

- [~] Server Action `updateGroupName` implementada en `app/(dashboard)/dashboard/[groupId]/settings/actions.ts` — desviación arquitectónica preexistente del proyecto (debería vivir en `features/groups/server/`)
- [x] Validación de `auth.uid()` antes de cualquier mutación
- [x] Verificación de rol `admin` en `members` para el grupo afectado
- [x] Trim aplicado en servidor antes de validar
- [x] Validaciones de longitud (3–50) en servidor
- [x] UPDATE en `groups` solo si todas las validaciones pasan
- [x] Revalidación del dato del grupo activo tras UPDATE exitoso (reflejo en header)
- [x] Todos los textos provienen de `lib/texts.json`
- [x] No hay `select(*)` en queries relacionadas
- [~] Lógica de negocio en `app/*` — desviación arquitectónica preexistente del proyecto
- [x] RLS de UPDATE en `groups` revisada y testeada

---

## 22. Checklist QA

- [ ] Scenario 01: admin ve el nombre actual al ingresar a configuración
- [ ] Scenario 02: flujo completo de edición exitosa con reflejo en header
- [ ] Scenario 03: nombre vacío → error inline, sin cambios en DB
- [ ] Scenario 04a: nombre < 3 chars → error de mínimo (validado en cliente y servidor)
- [ ] Scenario 04b: nombre > 50 chars → error de máximo (validado en cliente y servidor)
- [ ] Scenario 04c: nombre exactamente de 3 chars → válido
- [ ] Scenario 04d: nombre exactamente de 50 chars → válido
- [ ] Scenario 05: cancelar → campo regresa al valor original sin cambios
- [ ] Scenario 06: miembro no admin → sin opción de editar (redirige a 404)
- [ ] Scenario 07: error de sistema → feedback de error, sin cambios en DB
- [ ] Scenario 08: nombre con espacios → se guarda sin espacios extra
- [ ] Miembro no admin no puede hacer UPDATE directo a `groups` (test de RLS)
- [ ] Doble tap en guardar no genera doble escritura

---

## 23. Trazabilidad

| Scenario | Sección del PDD | Estado |
|---|---|---|
| 01 — Visualización del nombre | §10 Flujo principal, §14 Persistencia | Cubierto |
| 02 — Editar nombre válido | §10 Flujo principal, §8.1, §8.3, §14, §15 | Cubierto |
| 03 — Nombre vacío | §11 FA-01, §9 RN-02, §18 Casos borde | Cubierto |
| 04 — Validación de longitud | §11 FA-02, §9 RN-03, §8.1, §18 Casos borde | Cubierto |
| 05 — Cancelar edición | §11 FA-03, §9 RN-07 | Cubierto |
| 06 — Acceso restringido no admin | §11 FA-05, §9 RN-01, RN-05, §15 | Cubierto |
| 07 — Error al guardar | §11 FA-04, §17 Riesgos | Cubierto |
| 08 — Trim de espacios | §8.1, §9 RN-04, §18 Casos borde | Cubierto |

---

## 24. Definiciones abiertas

| # | Ambigüedad | Impacto | Decisión requerida |
|---|---|---|---|
| DA-01 | El Gherkin dice "edición inline" pero no especifica si el campo tiene un botón de editar explícito o si se activa al tocar directamente el texto | UX/Dev | Asumir: toque directo sobre el campo activa la edición. Si se quiere botón "Lápiz" separado, requiere ajuste de Scenario 02 |
| DA-02 | Scenario 07 no especifica si el campo queda en modo edición o regresa a solo lectura tras el error | UX | Asumir: campo permanece en modo edición para que el admin pueda reintentar sin volver a tocar |
| DA-03 | No se especifica si el miembro no admin ve el campo en modo solo lectura o si la sección de nombre directamente no aparece | UX | Asumir: la sección de nombre del grupo no aparece para no admins (no mostrar campos read-only de configuración estructural a roles sin permisos) |

---

## 25. Resumen

| Aspecto | Detalle |
|---|---|
| Actor principal | Admin del grupo |
| Acción principal | Editar el nombre del grupo inline desde la pantalla de configuración |
| Validaciones críticas | No vacío · Mínimo 3 chars · Máximo 50 chars · Trim aplicado en servidor |
| Persistencia | UPDATE en `groups.name` vía Server Action con validación de rol |
| Seguridad | RLS + verificación server-side de `auth.uid()` y rol admin |
| Reflejo en UI | El header y demás puntos que usan el nombre del grupo deben revalidarse tras el UPDATE |
| Escenarios Gherkin | 8 escenarios — todos cubiertos |
| Definiciones abiertas | 3 ambigüedades menores documentadas |
