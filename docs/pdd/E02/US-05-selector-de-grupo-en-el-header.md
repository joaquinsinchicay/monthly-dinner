# PDD — US-05: Selector de grupo en el header

---

## 1. Identificación

| Campo | Valor |
|---|---|
| **Epic** | E02 — Navegación |
| **User Story** | US-05 — Selector de grupo en el header |
| **Prioridad** | Alta — componente estructural de navegación global |
| **Objetivo de negocio** | Permitir al usuario navegar entre sus grupos sin fricción desde cualquier pantalla de la aplicación |

---

## 2. Problema a resolver

Los usuarios pueden pertenecer a más de un grupo. Sin un selector de grupo persistente en el header, cambiar de contexto requeriría flujos alternativos no definidos, generando desorientación y pérdida del grupo activo entre sesiones.

El header debe mostrar siempre el grupo activo y, cuando corresponda, permitir al usuario cambiar de grupo de forma directa sin salir del flujo actual.

---

## 3. Objetivo funcional

Implementar un componente de selector de grupo en el header que:
1. Muestre siempre el nombre del grupo activo y la etiqueta "GRUPO ACTUAL" en cualquier pantalla.
2. Presente un chevron indicando interactividad cuando el usuario pertenece a más de un grupo.
3. Despliegue un dropdown con todos los grupos del usuario, destacando el activo, cuando el usuario tiene múltiples grupos.
4. Permita cambiar el grupo activo actualizando el dashboard y el header en consecuencia.
5. Sea no interactivo (sin chevron, sin dropdown) cuando el usuario pertenece a un único grupo.

---

## 4. Alcance

### Incluye
- Label "GRUPO ACTUAL" + nombre del grupo activo en el header en todas las pantallas protegidas
- Chevron de interactividad visible solo cuando el usuario tiene más de un grupo
- Dropdown con lista completa de grupos del usuario al tocar el selector (solo con múltiples grupos)
- Resaltado visual del grupo activo dentro del dropdown
- Cambio de grupo activo al seleccionar otro del dropdown
- Actualización del header y del dashboard al cambiar de grupo
- Estado sin chevron y sin dropdown para usuarios con un único grupo

### No incluye
- Creación de grupos desde este componente
- Gestión de invitaciones desde este componente
- Edición del nombre del grupo desde este componente
- Avatar del usuario (cubierto por US-04)
- Persistencia del grupo activo entre sesiones en cookie (cubierto por US-01 Scenario 04 / US-02 Scenario 01)

---

## 5. Actor principal

Cualquier miembro autenticado que pertenezca a uno o más grupos.

---

## 6. Precondiciones

- El usuario está autenticado.
- El usuario pertenece a al menos un grupo.
- Existe un grupo activo seleccionado en la sesión del usuario.
- El usuario se encuentra en cualquier pantalla protegida de la aplicación.

---

## 7. Postcondiciones

- El header siempre refleja el grupo activo actual.
- Si el usuario cambió de grupo, el dashboard muestra el contexto del nuevo grupo activo.
- El grupo activo seleccionado queda actualizado en la sesión.

---

## 8. Definiciones funcionales

### Grupo activo
El grupo que el sistema usa como contexto de todas las operaciones del dashboard. Se inicializa desde la cookie `last_group_id` (ver US-01 / US-02). Puede cambiarse mediante este componente.

### Selector interactivo
Variante del componente que muestra chevron y habilita el dropdown. Se activa únicamente cuando el usuario pertenece a más de un grupo.

### Selector no interactivo
Variante del componente que muestra solo el nombre del grupo sin chevron y sin comportamiento de dropdown. Se muestra cuando el usuario pertenece a un único grupo.

### Dropdown de grupos
Panel que lista todos los grupos del usuario autenticado. El grupo activo aparece visualmente diferenciado del resto. Al seleccionar un grupo diferente, se ejecuta el cambio de contexto.

---

## 9. Reglas de negocio

1. El selector es visible en **todas** las pantallas protegidas de la aplicación, sin excepción.
2. El label "GRUPO ACTUAL" es fijo e invariable como etiqueta superior del selector.
3. El chevron solo se renderiza si el usuario pertenece a **más de un grupo**.
4. El dropdown solo se despliega si el usuario pertenece a **más de un grupo**.
5. El grupo activo aparece **destacado visualmente** dentro del dropdown.
6. Al seleccionar un grupo diferente al activo, el cambio se aplica de forma inmediata.
7. El cambio de grupo debe actualizar tanto el header como el contenido del dashboard.
8. Un usuario con un único grupo no puede abrir dropdown ni cambiar de grupo desde este componente.
9. La lista de grupos del dropdown debe incluir **todos** los grupos del usuario, sin paginación ni filtrado en MVP.
10. El sistema no permite seleccionar el grupo ya activo como si fuera un cambio (no produce recargas innecesarias).

---

## 10. Flujo principal

**Usuario con múltiples grupos — cambio de grupo activo**

1. El usuario está en cualquier pantalla protegida.
2. El header muestra el label "GRUPO ACTUAL" y el nombre del grupo activo con chevron.
3. El usuario toca el selector de grupo.
4. Se despliega el dropdown con todos sus grupos; el activo aparece destacado.
5. El usuario selecciona un grupo diferente al activo.
6. El dropdown se cierra.
7. El header actualiza el nombre del grupo activo.
8. El dashboard actualiza su contenido con el contexto del nuevo grupo seleccionado.

---

## 11. Flujos alternativos

### FA-01: Usuario con un solo grupo
1. El usuario está en cualquier pantalla protegida.
2. El header muestra el label "GRUPO ACTUAL" y el nombre del grupo sin chevron.
3. No existe comportamiento de dropdown ni interacción posible.

### FA-02: El usuario toca el selector pero no cambia de grupo
1. El dropdown se despliega.
2. El usuario toca fuera del dropdown o no selecciona ningún ítem.
3. El dropdown se cierra sin ejecutar cambio alguno.
4. El grupo activo permanece igual.

### FA-03: El usuario selecciona el grupo ya activo
1. El dropdown se despliega.
2. El usuario selecciona el grupo que ya está activo.
3. No se produce ningún cambio ni recarga.
4. El dropdown se cierra.

---

## 12. UI / UX

### Fuente de verdad
Referenciar: `docs/design/design-system.md`

### Comportamientos requeridos
- El selector ocupa una zona delimitada del header; no comparte espacio con el avatar (US-04).
- En la variante con múltiples grupos, el componente es tappable en toda su área (label + nombre + chevron).
- El chevron debe indicar visualmente la dirección del dropdown (hacia abajo cuando cerrado).
- El dropdown se posiciona por debajo del header, alineado al selector.
- El grupo activo dentro del dropdown tiene un tratamiento visual diferenciado (no solo tipográfico).
- El cierre del dropdown ocurre al: seleccionar un ítem, tocar fuera del dropdown, presionar ESC.
- El componente debe funcionar correctamente en mobile-first; el área de tap debe ser suficientemente grande.
- No usar bordes sólidos de 1px para separar grupos en el dropdown; aplicar cambios de fondo, espacio negativo o jerarquía tipográfica.
- Los estados loading, empty y error deben contemplarse en el componente (ver sección 15).

---

## 13. Mensajes y textos

### Fuente de verdad
Referenciar: `lib/texts.json`

### Tipos de mensajes requeridos
- **Label fijo del selector:** etiqueta estática "GRUPO ACTUAL" — centralizar en `texts.json`
- **Estado de carga:** mensaje o skeleton mientras se resuelve la lista de grupos
- **Estado de error:** mensaje informativo si la lista de grupos no puede resolverse

No se definen textos literales en este documento.

---

## 14. Persistencia

| Dato | Tabla | Columna | Operación |
|---|---|---|---|
| Lista de grupos del usuario | `members` | `group_id` | SELECT — grupos donde `user_id = auth.uid()` |
| Nombre del grupo | `groups` | `name` | SELECT — join con members |
| Grupo activo | Cookie `last_group_id` | — | Escritura al cambiar de grupo |

- La lista de grupos se obtiene consultando `members` filtrada por `user_id = auth.uid()` con join a `groups` para obtener el nombre.
- Al cambiar de grupo activo, se actualiza la cookie `last_group_id` con el nuevo `group_id`.
- No se persiste el estado del dropdown en base de datos.

---

## 15. Seguridad

- La lista de grupos se obtiene **server-side** desde `members` con RLS activo; el usuario solo puede ver grupos de los que forma parte.
- No se puede inferir la existencia de grupos de terceros desde este componente.
- El `group_id` del grupo activo se valida server-side en cada request protegido; no se confía únicamente en la cookie del cliente.
- El cambio de grupo activo no requiere ningún permiso especial; cualquier miembro puede cambiar entre sus propios grupos.
- Un usuario no puede seleccionar un grupo al que no pertenece, dado que el dropdown solo lista sus grupos según RLS.

---

## 16. Dependencias

| Dependencia | Tipo | Descripción |
|---|---|---|
| US-01 — Registro con Google | Funcional | Define la cookie `last_group_id` y el grupo activo inicial |
| US-02 — Login con Google | Funcional | Define la restauración del grupo activo desde cookie |
| US-03 — Crear grupo | Funcional | Un usuario con grupo recién creado verá ese grupo como único y activo |
| US-04 — Avatar con menú de sesión | Estructural | Ambos componentes coexisten en el header sin solapamiento |
| US-06 — Configuración de miembros | Contextual | El grupo activo definido aquí determina qué grupo se configura |
| `members` (RLS) | Datos | La lista de grupos del usuario depende de las políticas RLS sobre `members` |
| `groups` | Datos | El nombre del grupo activo se obtiene de esta tabla |
| Cookie `last_group_id` | Infraestructura | Mecanismo de persistencia del grupo activo entre sesiones |

---

## 17. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| La cookie `last_group_id` apunta a un grupo al que el usuario ya no pertenece | Media | Alto | Validar server-side que el `group_id` de la cookie está en `members`; si no, seleccionar el primer grupo disponible |
| Carga lenta de la lista de grupos genera header inconsistente | Baja | Medio | Mostrar skeleton en el selector mientras resuelve |
| El usuario pertenece a muchos grupos y el dropdown se vuelve extenso | Baja | Bajo | Listar todos los grupos en MVP; evaluar scroll interno si el listado supera la pantalla |
| Inconsistencia entre el grupo activo del header y el contexto del dashboard tras un cambio | Media | Alto | Asegurar que el cambio de grupo activo dispara actualización coordinada de header y dashboard |

---

## 18. Casos borde

| Caso | Comportamiento esperado |
|---|---|
| Usuario pertenece a exactamente un grupo | Selector no interactivo; sin chevron; sin dropdown |
| Usuario pertenece a dos o más grupos | Selector interactivo con chevron y dropdown |
| La cookie `last_group_id` es inválida o no existe | El sistema selecciona el primer grupo disponible del usuario |
| El usuario accede a una URL con `[groupId]` de un grupo al que no pertenece | RLS bloquea el acceso; se redirige al dashboard del grupo activo válido |
| El usuario selecciona el mismo grupo que ya está activo | No se ejecuta cambio; el dropdown se cierra silenciosamente |
| La lista de grupos no puede cargarse por error del servidor | Se muestra mensaje de error informativo en el selector; no se colapsa el header |
| El usuario cambia de grupo mientras tiene un modal abierto | El modal se cierra y el dashboard actualiza el contexto; no se ejecutan mutaciones pendientes del modal anterior |

---

## 19. Criterios de aceptación desarrollados

### Scenario 01 — Header muestra el grupo activo

**Precondiciones:**
- Usuario autenticado
- Pertenece a al menos un grupo
- Tiene un grupo activo en sesión
- Está en cualquier pantalla protegida

**Resultado esperado:**
- El header muestra el label "GRUPO ACTUAL"
- El header muestra el nombre del grupo activo
- Hay un chevron visible indicando que el selector es clickeable

**Notas:** El chevron solo corresponde si el usuario tiene más de un grupo. Este scenario no especifica cantidad de grupos; ver Scenario 04 para el caso de un único grupo.

---

### Scenario 02 — Dropdown lista los grupos del usuario

**Precondiciones:**
- Usuario autenticado
- Pertenece a más de un grupo
- Está en cualquier pantalla protegida

**Trigger:** El usuario toca el selector de grupo.

**Resultado esperado:**
- Se despliega un dropdown con todos los grupos del usuario
- El grupo activo aparece destacado visualmente dentro del dropdown

---

### Scenario 03 — Cambio de grupo activo

**Precondiciones:**
- Usuario autenticado
- Pertenece a más de un grupo
- El dropdown está abierto

**Trigger:** El usuario selecciona un grupo diferente al activo.

**Resultado esperado:**
- El dashboard actualiza su contenido mostrando el contexto del grupo seleccionado
- El header refleja el nuevo grupo activo
- El dropdown se cierra

---

### Scenario 04 — Usuario con un solo grupo

**Precondiciones:**
- Usuario autenticado
- Pertenece a exactamente un grupo
- Tiene un grupo activo en sesión

**Trigger:** El usuario visualiza el header.

**Resultado esperado:**
- El nombre del grupo se muestra sin chevron
- No existe comportamiento de dropdown al tocar el selector

---

## 20. Checklist diseño

- [ ] El selector respeta el sistema de tipografía de `docs/design/design-system.md`
- [x] El label "GRUPO ACTUAL" usa el tratamiento visual correcto para labels secundarios — `text-[11px] font-semibold uppercase tracking-[0.05em] text-[#585f6c]`
- [x] El chevron usa el ícono definido en el design system — `ChevronDown` de `lucide-react`, 14px, rotación 180° cuando abierto
- [x] El dropdown usa cambios de fondo y espacio negativo para separar ítems (sin bordes sólidos de 1px) — `hover:bg-[#f6f3f2]` y `bg-[#f6f3f2]` para activo
- [x] El grupo activo en el dropdown usa tratamiento visual diferenciado por color de superficie o jerarquía tipográfica — `bg-[#f6f3f2] font-semibold text-[#004ac6]`
- [ ] El componente es mobile-first con área de tap adecuada
- [ ] El skeleton de carga es consistente con los demás skeletons de la app
- [ ] Los estados loading, error y vacío tienen tratamiento visual definido
- [ ] El dropdown no supera el viewport en pantallas pequeñas; hay comportamiento de scroll interno si aplica

---

## 21. Checklist desarrollo

- [x] Componente `GroupSelector` en `components/layout/` — decisión de implementación: componente de navegación global, no de dominio
- [x] La lista de grupos se obtiene server-side desde `members` join `groups` con `user_id = auth.uid()` — en `app/(dashboard)/layout.tsx`
- [x] No se usa `select(*)` en la query; solo los campos necesarios — `.select('group_id, role, groups(id, name)')`
- [x] El cambio de grupo activo actualiza la cookie `last_group_id` — manejado transparentemente por `middleware.ts` en cada navegación
- [x] El cambio de grupo activo dispara revalidación del dashboard — `router.push(\`/dashboard/${groupId}\`)` en `handleSelect`
- [x] La variante sin chevron se renderiza cuando `groups.length === 1` — `const hasMultiple = groups.length > 1`
- [x] La variante con chevron y dropdown se renderiza cuando `groups.length > 1` — `{hasMultiple && <ChevronDown ... />}`
- [x] El dismiss del dropdown funciona ante: tap fuera, ESC, selección de ítem — mousedown + keydown Escape + handleSelect
- [x] Textos estáticos centralizados en `lib/texts.json` — `t('group.groupSelector.label')`
- [x] El `group_id` de la cookie se valida server-side en cada request; fallback al primer grupo si inválido — en `app/(dashboard)/dashboard/page.tsx`
- [x] RLS garantiza que el usuario solo ve sus propios grupos — política activa en `members`
- [ ] No hay lógica de negocio en el componente UI; la lógica vive en `features/groups/` — N/A: el proyecto centraliza la lógica en `lib/actions/` y `app/`; GroupSelector no contiene lógica de dominio

---

## 22. Checklist QA

- [x] **Scenario 01:** header muestra "GRUPO ACTUAL" + nombre del grupo + chevron para usuario con múltiples grupos
- [x] **Scenario 02:** dropdown lista todos los grupos del usuario; el activo aparece destacado
- [x] **Scenario 03:** al seleccionar otro grupo, header y dashboard actualizan su contexto
- [x] **Scenario 04:** usuario con un único grupo no ve chevron y no puede abrir dropdown
- [x] FA-02: el dropdown se cierra sin cambiar grupo al tocar fuera — handler `mousedown`
- [x] FA-03: seleccionar el grupo activo no produce cambios ni recargas — guard `if (groupId === activeGroupId) return`
- [x] Cookie `last_group_id` inválida → sistema selecciona primer grupo disponible — validado en `dashboard/page.tsx` con fallback a `joined_at desc`
- [ ] Usuario sin grupos → el selector no se renderiza (flujo no cubierto por esta US, no generar estado roto)
- [x] Verificar que RLS impide ver grupos de otros usuarios — RLS sobre `members` activo
- [ ] Verificar estado loading con skeleton mientras carga la lista de grupos
- [ ] Verificar estado error si la query falla
- [ ] Verificar que el cambio de grupo no permite mutaciones pendientes del grupo anterior

---

## 23. Trazabilidad

| Scenario Gherkin | Sección PDD | Cobertura |
|---|---|---|
| Scenario 01 — Header muestra el grupo activo | §9 RN1-2-3, §10 Flujo principal, §19 CA-01 | Completa |
| Scenario 02 — Dropdown lista los grupos del usuario | §9 RN4-5-9, §10 Flujo principal, §19 CA-02 | Completa |
| Scenario 03 — Cambio de grupo activo | §9 RN6-7, §10 Flujo principal, §19 CA-03 | Completa |
| Scenario 04 — Usuario con un solo grupo | §9 RN3-4-8, §11 FA-01, §19 CA-04 | Completa |

---

## 24. Definiciones abiertas

| # | Ambigüedad | Impacto | Decisión sugerida |
|---|---|---|---|
| 1 | Scenario 01 incluye el chevron pero no aclara que aplica solo con múltiples grupos | Podría malinterpretarse que siempre hay chevron | Resolver con Scenario 04: sin chevron con un único grupo. El sistema debe bifurcar el renderizado según `groups.length` |
| 2 | No se define el comportamiento al cambiar de grupo si hay un modal abierto en el dashboard | Podría generar estado inconsistente | Decisión en §18: cerrar el modal y actualizar el contexto sin ejecutar mutaciones pendientes |
| 3 | No se especifica el comportamiento del selector cuando el usuario no pertenece a ningún grupo | Fuera del alcance de esta US (requiere al menos un grupo) | El selector no debe renderizarse; el flujo de usuarios sin grupo está cubierto por US-02 Scenario 02 |
| 4 | La cantidad máxima de grupos que un usuario puede tener no está definida en el backlog | Afecta el diseño del dropdown para listas extensas | Tratar como ilimitado en MVP con scroll interno en el dropdown si supera la altura del viewport |

---

## 25. Resumen

**US-05** implementa el selector de grupo persistente en el header, componente central de la navegación multi-grupo de la aplicación.

El componente tiene dos variantes excluyentes:
- **Un solo grupo:** muestra nombre sin interacción.
- **Múltiples grupos:** muestra nombre con chevron y dropdown con cambio de contexto.

El cambio de grupo activo actualiza la cookie `last_group_id` y recarga el contexto del dashboard. La seguridad se garantiza por RLS en `members`; el servidor valida el `group_id` en cada request. Todos los textos estáticos se centralizan en `lib/texts.json`.

La US tiene **4 scenarios cubiertos** con trazabilidad completa, sin dependencias bloqueantes no resueltas. Las 4 definiciones abiertas detectadas tienen decisión sugerida y no bloquean el inicio de desarrollo.
