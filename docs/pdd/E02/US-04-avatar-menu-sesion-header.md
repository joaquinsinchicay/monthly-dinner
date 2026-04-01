# PDD — US-04: Avatar con menú de sesión en el header

---

## 1. Identificación

| Campo | Valor |
|---|---|
| **Epic** | E02 — Navegación |
| **User Story** | US-04 — Avatar con menú de sesión en el header |
| **Prioridad** | Alta — componente estructural de navegación global |
| **Objetivo de negocio** | Proveer acceso persistente e inmediato a las acciones de sesión y configuración sin interrumpir el flujo principal del usuario |

---

## 2. Problema a resolver

El header de la aplicación requiere un punto de acceso identificable para el usuario autenticado que permita:
- visualizar la identidad del usuario en todo momento
- acceder a la configuración del grupo (solo para admins)
- cerrar sesión de forma controlada con confirmación

Sin este componente, el usuario no tiene un lugar claro para gestionar su sesión ni los administradores tienen acceso rápido a la configuración del grupo desde cualquier pantalla.

---

## 3. Objetivo funcional

Implementar un componente de avatar en el header que:
1. Sea visible en todas las pantallas de la aplicación mientras el usuario está autenticado.
2. Muestre la foto de perfil de Google del usuario o sus iniciales como fallback.
3. Despliegue un menú contextual con opciones condicionadas al rol del usuario en el grupo activo.
4. Permita navegar a la configuración del grupo (solo admins).
5. Permita cerrar sesión con diálogo de confirmación.
6. Se cierre ante cualquier interacción de dismiss estándar.

---

## 4. Alcance

### Incluye
- Componente de avatar en el header (foto o iniciales)
- Menú desplegable al hacer tap/click sobre el avatar
- Opción "Cerrar sesión" visible para todos los usuarios autenticados
- Opción "Configuración del grupo" visible exclusivamente para admins del grupo activo
- Diálogo de confirmación antes de ejecutar el cierre de sesión
- Comportamiento de dismiss del menú (tap fuera, re-tap avatar, ESC)
- Redirección a `/dashboard/[groupId]/settings` al seleccionar configuración
- Redirección a `/home` (login) al confirmar cierre de sesión

### No incluye
- Edición de perfil de usuario desde este componente
- Cambio de foto de perfil
- Gestión de notificaciones
- Acceso a configuración de grupos no activos
- Selector de grupo (cubierto por US-05)

---

## 5. Actor principal

- **Miembro autenticado** (cualquier rol): accede a "Cerrar sesión"
- **Admin del grupo activo**: accede además a "Configuración del grupo"

---

## 6. Precondiciones

| # | Precondición |
|---|---|
| PC-01 | El usuario está autenticado (sesión activa en Supabase Auth) |
| PC-02 | El usuario pertenece a al menos un grupo (tiene entrada en `members`) |
| PC-03 | Existe un grupo activo en la sesión del usuario |
| PC-04 | El perfil del usuario está disponible en `profiles` (foto y/o nombre) |

---

## 7. Postcondiciones

| Acción | Postcondición |
|---|---|
| Tap en avatar | Menú desplegado visible |
| Seleccionar "Configuración del grupo" | Navegación a `/dashboard/[groupId]/settings`, menú cerrado |
| Confirmar "Cerrar sesión" | Sesión invalidada en Supabase, cookie/token eliminado, redirección a `/home` |
| Dismiss del menú | Menú cerrado, ninguna mutación ejecutada |

---

## 8. Definiciones funcionales

### Avatar
El avatar del usuario se construye con la siguiente lógica de prioridad:
1. Si `profiles.avatar_url` tiene valor → se muestra la foto de Google
2. Si no → se muestran las iniciales derivadas de `profiles.full_name` o `profiles.username`

### Grupo activo
El grupo activo es el último grupo visitado por el usuario, persistido en cookie `last_group_id` (implementado en US-01). Se usa para determinar el `groupId` en la navegación a settings y para evaluar el rol del usuario.

### Rol del usuario en el grupo activo
El rol se determina consultando `members.role` donde `members.group_id = [groupId activo]` y `members.user_id = auth.uid()`. Si `role = 'admin'` → se muestra la opción de configuración.

### Menú contextual
El menú es un componente flotante que se posiciona debajo del avatar. Su contenido varía según el rol:

| Rol | Opciones visibles |
|---|---|
| `member` | "Cerrar sesión" |
| `admin` | "Configuración del grupo" + "Cerrar sesión" |

### Cierre de sesión
El cierre de sesión requiere confirmación explícita mediante un diálogo modal. La acción no es reversible dentro del flujo: el usuario deberá volver a autenticarse con Google para reingresar.

---

## 9. Reglas de negocio

| ID | Regla |
|---|---|
| RN-01 | El avatar debe estar visible en todas las pantallas protegidas de la aplicación |
| RN-02 | Un usuario con rol `member` NO debe ver la opción "Configuración del grupo" |
| RN-03 | La opción "Configuración del grupo" refleja el rol en el grupo ACTIVO, no en todos los grupos del usuario |
| RN-04 | El cierre de sesión siempre requiere confirmación — no puede ejecutarse en un solo tap |
| RN-05 | El menú debe cerrarse sin ejecutar acciones al hacer dismiss |
| RN-06 | El rol debe consultarse desde el servidor — no se puede confiar en estado de cliente para condicionar opciones |
| RN-07 | Si el usuario no tiene grupo activo resuelto, la opción de configuración no debe mostrarse (estado degradado) |

---

## 10. Flujo principal

```
1. Usuario autenticado accede a cualquier pantalla protegida
2. Header renderiza componente Avatar con foto o iniciales del usuario
3. Usuario toca el avatar
4. Sistema consulta rol del usuario en el grupo activo
5. Se despliega menú con opciones según rol
   → Si admin: "Configuración del grupo" + "Cerrar sesión"
   → Si member: "Cerrar sesión"
6a. Usuario selecciona "Configuración del grupo"
    → Sistema navega a /dashboard/[groupId]/settings
    → Menú se cierra
6b. Usuario selecciona "Cerrar sesión"
    → Se muestra diálogo de confirmación
    → Usuario confirma
    → Sistema ejecuta signOut en Supabase Auth
    → Sistema redirige a /home
6c. Usuario hace dismiss del menú
    → Menú se cierra sin acción
```

---

## 11. Flujos alternativos

### FA-01: El usuario no tiene foto de perfil
- `profiles.avatar_url` es null o vacío
- El avatar muestra las iniciales del usuario (derivadas de `full_name` o `username`)
- El comportamiento del menú no cambia

### FA-02: El usuario cancela el diálogo de cierre de sesión
- El diálogo se cierra
- La sesión permanece activa
- El usuario regresa a la pantalla donde estaba
- El menú del avatar permanece cerrado

### FA-03: Error al cerrar sesión
- El sistema muestra un mensaje de error (tipo: error)
- La sesión no se invalida
- El usuario permanece en la pantalla actual
- Texto referenciado en: `lib/texts.json` → `auth.errors.signOutFailed`

### FA-04: Usuario sin grupo activo resuelto
- La opción "Configuración del grupo" no se renderiza independientemente del rol
- Solo se muestra "Cerrar sesión"

### FA-05: El usuario abre el menú y presiona ESC (desktop)
- El menú se cierra sin ejecutar ninguna acción

---

## 12. UI / UX

### Fuente de verdad
Referenciar: [docs/design/design-system.md](../../design/design-system.md)

### Comportamientos requeridos

| Elemento | Comportamiento |
|---|---|
| Avatar en header | Siempre visible en la esquina superior derecha. Estado de carga hasta que `profiles` esté disponible. |
| Fallback de avatar | Mostrar iniciales cuando no hay `avatar_url`. |
| Menú desplegable | Aparece debajo del avatar. Contiene 1 o 2 opciones según rol. |
| Opción "Configuración del grupo" | Solo renderiza si `role = 'admin'`. No visible ni deshabilitado para no-admins. |
| Opción "Cerrar sesión" | Siempre visible para cualquier usuario autenticado. |
| Diálogo de confirmación | Interrumpe el flujo con confirmación explícita antes de ejecutar el signOut. |
| Estado submitting en signOut | El botón de confirmación muestra estado de carga mientras se ejecuta el signOut. |
| Dismiss | El menú responde a: tap fuera del área, re-tap sobre el avatar, tecla ESC. |
| Cierre tras navegación | Al seleccionar "Configuración del grupo" el menú se cierra junto con la navegación. |

---

## 13. Mensajes y textos

### Fuente de verdad
Referenciar: [lib/texts.json](../../../../lib/texts.json)

### Tipos de mensajes requeridos

| Tipo | Clave en texts.json | Uso |
|---|---|---|
| Label opción de sesión | `auth.signOut.trigger` | Texto de la opción "Cerrar sesión" en el menú |
| Título del diálogo de confirmación | `auth.signOut.title` | Encabezado del diálogo de confirmación |
| Cuerpo del diálogo | `auth.signOut.body` | Descripción informativa del diálogo |
| Botón confirmación idle | `auth.signOut.confirmIdle` | Botón de confirmar en estado normal |
| Botón confirmación pending | `auth.signOut.confirmPending` | Botón de confirmar durante el signOut |
| Label sección diálogo | `auth.signOut.eyebrow` | Etiqueta superior del diálogo |
| Label opción settings | `navigation.avatarMenu.settings` | Texto de la opción "Configuración del grupo" en el menú |
| Error al cerrar sesión | `auth.errors.signOutFailed` | Mensaje de error si el signOut falla |

---

## 14. Persistencia

| Operación | Tabla / Mecanismo | Detalle |
|---|---|---|
| Lectura de avatar y nombre | `profiles` | `avatar_url`, `full_name`, `username` del usuario autenticado |
| Lectura de rol en grupo activo | `members` | `role` donde `group_id = [groupId activo]` y `user_id = auth.uid()` |
| Invalidación de sesión | Supabase Auth (`signOut()`) | Elimina el token de sesión activo |
| Resolución de groupId activo | Cookie `last_group_id` | Utilizada para construir la ruta a settings y evaluar rol |

**No se realizan escrituras** en este flujo (excepto la invalidación de sesión a través de Supabase Auth).

---

## 15. Seguridad

| Riesgo | Mitigación |
|---|---|
| Mostrar opción de configuración a no-admins | El rol debe consultarse desde el servidor. No se puede derivar solo del estado de cliente. |
| Acceso a `/dashboard/[groupId]/settings` sin ser admin | La página de settings valida el rol server-side (middleware o server action). US-04 solo gestiona la navegación — la protección real es responsabilidad de US-06. |
| Cierre de sesión sin confirmación (tap accidental) | El diálogo de confirmación obligatorio previene ejecución accidental. |
| Exposición de datos de sesión en menú | El componente solo muestra datos del propio usuario autenticado (sin exponer tokens ni IDs sensibles en UI). |
| Estado degradado sin grupo activo | Si `last_group_id` no está disponible, la opción de settings no se renderiza para evitar navegación a rutas inválidas. |

---

## 16. Dependencias

| Dependencia | Tipo | Detalle |
|---|---|---|
| US-01 — Registro con Google | Upstream | `profiles` creado con `avatar_url` y `full_name`. Cookie `last_group_id` persistida. |
| US-02 — Login con Google | Upstream | Sesión activa disponible. |
| US-03 — Crear grupo | Upstream | Grupo activo resuelto para derivar `groupId`. |
| US-06 — Configuración de miembros del grupo | Downstream | Destino de la opción "Configuración del grupo" (`/dashboard/[groupId]/settings`). |
| Supabase Auth | Infraestructura | Método `signOut()` para invalidar sesión. |
| `profiles` table | Datos | `avatar_url`, `full_name`, `username`. |
| `members` table | Datos | `role` del usuario en el grupo activo. |
| Cookie `last_group_id` | Estado de sesión | Resolución del grupo activo para construcción de ruta y evaluación de rol. |

---

## 17. Riesgos

| ID | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| R-01 | La cookie `last_group_id` no está disponible al renderizar el header | El avatar no puede determinar el rol del usuario | Mostrar menú sin opción de settings como fallback seguro |
| R-02 | `profiles.avatar_url` nulo o URL rota | Avatar muestra imagen rota | Implementar fallback a iniciales |
| R-03 | Latencia al consultar rol del usuario | El menú puede abrirse antes de tener el rol resuelto | Mostrar estado de carga o diferir apertura del menú hasta tener el rol |
| R-04 | El usuario tiene rol diferente en distintos grupos | La opción de settings se mostraría incorrectamente | El rol siempre se evalúa en el contexto del grupo ACTIVO únicamente |
| R-05 | Error de red durante el signOut | La sesión no se cierra correctamente | Mostrar mensaje de error y permitir reintento |

---

## 18. Casos borde

| Caso | Comportamiento esperado |
|---|---|
| Usuario sin foto de perfil en Google | Mostrar iniciales derivadas de `full_name` o `username` |
| Usuario admin en grupo A, member en grupo B, con grupo B activo | Menú muestra solo "Cerrar sesión" (rol evaluado en grupo activo) |
| Usuario que pierde conexión durante el signOut | Mostrar error de tipo `auth.errors.signOutFailed`, no redirigir |
| Usuario que abre menú y navega con back del browser | El menú debe cerrarse al cambiar de ruta |
| Usuario presiona ESC en desktop | El menú se cierra sin acción |
| Avatar renderizado antes de cargar `profiles` | Mostrar skeleton o placeholder hasta que los datos estén disponibles |
| `full_name` vacío y sin `username` | Mostrar inicial genérica o avatar placeholder neutral |

---

## 19. Criterios de aceptación desarrollados

### Scenario 01: Avatar visible en el header
**Cobertura:** Renderizado del componente Avatar en el layout global.

- El componente `Avatar` en el header es visible en toda pantalla que extienda el layout protegido
- Muestra `profiles.avatar_url` si tiene valor
- Si `avatar_url` es null o falla la carga → muestra iniciales derivadas de `profiles.full_name`
- El avatar está posicionado en la esquina superior derecha del header

### Scenario 02: Menú del avatar muestra una opción para usuarios no admin
**Cobertura:** Condicional de rol — solo "Cerrar sesión" para members.

- Al tocar el avatar se despliega el menú
- Si `members.role ≠ 'admin'` para el grupo activo → el menú contiene únicamente la opción "Cerrar sesión"
- La opción "Configuración del grupo" NO se renderiza (ni visible ni deshabilitada)

### Scenario 03: Menú del avatar muestra dos opciones para Admins
**Cobertura:** Condicional de rol — dos opciones para admins.

- Al tocar el avatar se despliega el menú
- Si `members.role = 'admin'` para el grupo activo → el menú contiene: "Configuración del grupo" y "Cerrar sesión"
- El orden es: configuración primero, cerrar sesión segundo

### Scenario 04: Acceso a configuración del grupo
**Cobertura:** Navegación desde el menú a settings.

- Al seleccionar "Configuración del grupo" → el sistema navega a `/dashboard/[groupId]/settings`
- El `groupId` se resuelve desde la cookie `last_group_id`
- El menú se cierra inmediatamente al seleccionar la opción

### Scenario 05: Cierre de sesión desde el avatar
**Cobertura:** Flujo completo de signOut con confirmación.

- Al seleccionar "Cerrar sesión" → se muestra un diálogo de confirmación (no se ejecuta el signOut inmediatamente)
- El diálogo muestra: eyebrow, título, descripción y botón de confirmación
- Al confirmar → se ejecuta `signOut()` de Supabase Auth
- El botón muestra estado "pending" (`auth.signOut.confirmPending`) mientras se procesa
- Al completarse → el usuario es redirigido a `/home`

### Scenario 06: Cierre del menú sin acción
**Cobertura:** Comportamiento de dismiss del menú.

- Tap fuera del área del menú → menú se cierra, ninguna acción ejecutada
- Re-tap sobre el avatar con menú abierto → menú se cierra, ninguna acción ejecutada
- Tecla ESC (en desktop) → menú se cierra, ninguna acción ejecutada
- En todos los casos el usuario permanece en la pantalla actual

---

## 20. Checklist diseño

- [x] El avatar respeta los tamaños definidos en `design-system.md` para iconos/avatares en header — `size="md"` (36px) en `AvatarUser`
- [x] El fallback de iniciales usa la tipografía y colores del design system — `DM Serif Display`, `#1c1b1b` sobre `#f6f3f2`
- [x] El menú desplegable usa superficie elevada sin borde sólido de 1px — shadow `0px 8px 24px -4px` sin border
- [x] La separación entre opciones del menú usa espacio negativo, no bordes — `<div className="h-1" />`
- [x] El diálogo de confirmación sigue el patrón de modal definido en el design system — glassmorphism bottom sheet con `backdrop-filter: blur(16px)`
- [ ] Los estados de loading/skeleton del avatar respetan el sistema visual — pendiente de implementar skeleton en layout
- [x] El componente es mobile-first y funcional con touch — interacciones con `onClick` compatibles con touch

---

## 21. Checklist desarrollo

- [x] Componente `Avatar` implementado en `components/ui/avatar-user.tsx` (sin conocimiento de dominio)
- [x] Perfil consultado server-side en `app/(dashboard)/layout.tsx` desde `profiles`
- [x] Rol del usuario consultado server-side en `app/(dashboard)/layout.tsx` — `members.role` incluido en query
- [x] Memberships con role pasados a `AvatarMenu` via `DashboardHeader`
- [x] Opción "Configuración del grupo" condicionada a `isAdmin` derivado del grupo activo
- [x] Menú contextual en `components/layout/AvatarMenu.tsx`
- [x] `signOut()` implementado como Server Action en `lib/actions/auth.ts`
- [x] Redirección post-signOut a `/` (ruta canónica del login — ver DA-01 resuelto)
- [x] Redirección a `/dashboard/[groupId]/settings` usa `activeGroupId` de URL params
- [x] Fallback de iniciales implementado cuando `avatar_url` es null
- [x] Todos los textos consumen `lib/texts.json` — sin hardcode
- [ ] Estado de error en signOut manejado y visible en UI
- [x] Comportamientos de dismiss (fuera, re-tap, ESC) implementados
- [x] No hay queries a Supabase desde el componente de UI — lógica en layout server component

---

## 22. Checklist QA

- [x] SC-01: Avatar visible en todas las pantallas protegidas con foto y con iniciales — `AvatarUser` con fallback a iniciales
- [x] SC-02: Menú con solo "Cerrar sesión" para usuario con rol `member` — `isAdmin` condiciona el render
- [x] SC-03: Menú con ambas opciones para usuario con rol `admin` — `isAdmin` habilita opción settings
- [x] SC-04: Navegación correcta a `/dashboard/[groupId]/settings` al seleccionar configuración
- [x] SC-04: Menú se cierra al navegar a settings — `setMenuOpen(false)` en `handleSettings`
- [x] SC-05: Diálogo de confirmación aparece antes de ejecutar signOut — `setDialogOpen(true)` sin ejecutar `signOut()`
- [x] SC-05: SignOut ejecutado correctamente al confirmar — `signOut()` Server Action via `useTransition`
- [x] SC-05: Redirección a `/` post-signOut (ruta canónica del login — DA-01 resuelto)
- [x] SC-06: Dismiss funciona con tap fuera del menú — `mousedown` listener
- [x] SC-06: Dismiss funciona con re-tap sobre el avatar — toggle `setMenuOpen((prev) => !prev)`
- [x] SC-06: Dismiss funciona con tecla ESC — `keydown` listener para `Escape`
- [ ] FA-03: Mensaje de error visible si signOut falla — pendiente manejo de error en UI
- [x] FA-04: Sin opción de settings si no hay grupo activo resuelto — `isAdmin` es `false` cuando `activeGroupId` es vacío
- [x] CE: Usuario admin en grupo B (activo) no ve settings si su grupo activo es member — `isAdmin` evalúa solo el grupo activo por URL
- [x] CE: Avatar con URL rota → muestra iniciales correctamente — `AvatarUser` con fallback a `fullName`

---

## 23. Trazabilidad

| Scenario Gherkin | Sección PDD | Cobertura |
|---|---|---|
| SC-01: Avatar visible en el header | §8 (Avatar), §10 (Flujo), §12 (UI), §14 (Persistencia) | ✅ Completa |
| SC-02: Menú — una opción para no admin | §8 (Menú), §9 (RN-02, RN-06), §10 (Flujo), §15 (Seguridad) | ✅ Completa |
| SC-03: Menú — dos opciones para admin | §8 (Menú, Rol), §9 (RN-03, RN-06), §10 (Flujo), §15 (Seguridad) | ✅ Completa |
| SC-04: Acceso a configuración del grupo | §8 (Grupo activo), §10 (Flujo 6a), §11 (FA-04), §14 (Cookie) | ✅ Completa |
| SC-05: Cierre de sesión desde el avatar | §8 (Cierre de sesión), §9 (RN-04), §10 (Flujo 6b), §11 (FA-02, FA-03), §14 (Auth) | ✅ Completa |
| SC-06: Cierre del menú sin acción | §8 (Menú), §9 (RN-05), §10 (Flujo 6c), §11 (FA-05) | ✅ Completa |

---

## 24. Definiciones abiertas

| ID | Ambigüedad detectada | Decisión sugerida |
|---|---|---|
| ~~DA-01~~ | ~~Inconsistencia de ruta entre `/home` (US-04) y `/login` (US-02).~~ | **Resuelto:** La ruta canónica es `/`. La implementación usa `redirect('/')` en `lib/actions/auth.ts`. El Scenario 05 del backlog debe corregirse de `/home` a `/`. |
| DA-02 | No se especifica el comportamiento del menú cuando el `groupId` activo no puede resolverse (usuario sin grupos). | Mostrar solo "Cerrar sesión" como fallback seguro. No renderizar la opción de settings. |
| DA-03 | No se define explícitamente si el diálogo de confirmación es un modal completo o un popover/sheet. | Referenciar patrón de diálogo de confirmación del design system (`docs/design/design-system.md`). |

---

## 25. Resumen

**US-04** implementa el componente de avatar en el header como punto de acceso a las acciones de sesión y configuración del grupo.

El componente es **global y transversal** a toda la aplicación protegida. Su correcta implementación requiere:
- resolución server-side del rol del usuario en el grupo activo
- lógica de fallback para avatar sin foto
- flujo de signOut con confirmación explícita
- dismiss estándar del menú (tap fuera, re-tap, ESC)

La diferenciación de opciones por rol es la regla de negocio más crítica. El rol debe evaluarse siempre en el contexto del **grupo activo**, no de forma global. La opción de configuración nunca debe mostrarse a no-admins, ni siquiera como elemento deshabilitado.

El componente depende de US-01 (persistencia de `last_group_id`) y es prerequisito funcional para US-06 (configuración de miembros), ya que es la única ruta de acceso definida hacia settings para el admin.

---

*Generado: Marzo 2026 · Versión: 1.0*
