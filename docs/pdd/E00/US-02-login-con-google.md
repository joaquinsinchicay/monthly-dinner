# PDD — US-02 · Login con Google

---

## 1. Identificación

| Campo | Valor |
|---|---|
| **Epic** | E00 — Acceso & Autenticación |
| **User Story** | US-02 — Login con Google |
| **Prioridad** | P0 — Bloqueante (acceso al producto para usuarios registrados) |
| **Objetivo de negocio** | Permitir que un usuario con cuenta existente acceda al producto sin fricción, aterrizando directamente en el contexto correcto según su estado (grupo activo, sin grupo, sesión persistente o sesión expirada). |

---

## 2. Problema a resolver

El usuario registrado necesita acceder a su grupo sin pasos adicionales. No existe un mecanismo que distinga entre usuario sin grupo, usuario con grupo, sesión persistente activa y sesión expirada — todos estos estados requieren comportamientos de redirección distintos, sin que el usuario tenga que tomar decisiones explícitas en cada caso.

---

## 3. Objetivo funcional

Al completar el flujo de login con Google:
- Si el usuario tiene cuenta y pertenece a al menos un grupo → redirigir a `/dashboard/[groupId]` del grupo activo en la última sesión.
- Si el usuario tiene cuenta pero no pertenece a ningún grupo → redirigir a `/onboarding`.
- Si el usuario ya tiene sesión activa (cookie válida) → redirigir directamente al dashboard del último grupo activo sin re-autenticar.
- Si el token de sesión expiró → redirigir al login preservando el contexto de navegación (URL original solicitada).

---

## 4. Alcance

### Incluye

- Inicio del flujo OAuth con Google desde la pantalla de login para usuarios con cuenta existente.
- Determinación del destino de redirección post-login según pertenencia a grupos.
- Persistencia de sesión entre visitas: si la cookie de sesión es válida, el usuario no pasa por OAuth.
- Detección de token expirado en rutas protegidas con redirección al login preservando el contexto de navegación.
- Lectura de la cookie `last_group_id` para determinar el grupo activo en la última sesión.

### No incluye

- Creación de cuenta nueva (cubierto por US-01).
- Gestión de perfil post-login.
- Cambio de cuenta de Google activa.
- Logout / cierre de sesión.
- Notificaciones al usuario sobre la sesión expirada.
- Renovación automática de tokens en segundo plano (responsabilidad del SDK de Supabase).

---

## 5. Actor principal

**Usuario registrado** — persona con cuenta existente en el sistema (perfil en `profiles` y registro en `auth.users`) que regresa al producto.

---

## 6. Precondiciones

- El usuario tiene una cuenta activa en `auth.users` y un perfil en `profiles`.
- La pantalla de login está disponible en `/` (ruta raíz, pública).
- El proveedor OAuth de Google está configurado en Supabase Auth.
- El Route Handler `/auth/callback` está operativo.
- El middleware verifica sesión en todas las rutas bajo `(protected)`.
- La cookie `last_group_id` puede o no estar presente en el dispositivo.

---

## 7. Postcondiciones

| Scenario | Estado esperado post-acción |
|---|---|
| Login exitoso con grupo | Sesión activa. Redirigido a `/dashboard/[groupId]` del último grupo activo. Sin pasos adicionales. |
| Login exitoso sin grupo | Sesión activa. Redirigido a `/onboarding`. Sin pasos adicionales. |
| Sesión persistente válida | Sin re-autenticación. Redirigido a `/dashboard/[groupId]` del último grupo activo. |
| Token expirado | Sin sesión activa. Redirigido a `/` (login) con el contexto de navegación preservado. |

---

## 8. Definiciones funcionales

**Usuario registrado:** Aquel que completó el flujo de US-01 en algún momento anterior. Tiene registro en `auth.users` y en `profiles`. Puede o no pertenecer a grupos.

**Sesión persistente:** El token de sesión de Supabase almacenado en cookie sigue siendo válido. El SDK de Supabase hace refresh automático en el cliente. Si el token aún no expiró, el middleware lo detecta y no redirige al login.

**Token expirado:** El token de sesión venció (inactividad prolongada, expiración de refresh token). El middleware lo detecta al verificar con `supabase.auth.getUser()`. La sesión no es renovable en este caso.

**Contexto de navegación:** La URL que el usuario intentó acceder antes de ser redirigido al login. Se preserva como parámetro en la URL del login (ej. `/login?redirect=/dashboard/[groupId]/dinners`). Post-login, el sistema redirige a esa URL en lugar del destino por defecto.

**Grupo activo en la última sesión:** Se determina con la cookie `last_group_id` (httpOnly, sameSite: lax, maxAge: 30 días, actualizada por el middleware en cada visita a `/dashboard/[groupId]`). Si la cookie existe y el usuario sigue siendo miembro de ese grupo, se usa ese groupId. Si no hay cookie o la membresía ya no es válida, se consulta `members` ordenado por `joined_at DESC` y se usa el grupo más recientemente unido.

**Sin grupo:** El usuario no tiene ninguna fila activa en `members` para ningún grupo. Puede ocurrir si nunca se unió a un grupo después del registro, o si fue eliminado de todos sus grupos.

---

## 9. Reglas de negocio

1. **No re-autenticar si hay sesión válida.** Si la cookie de sesión es válida y el token no expiró, el usuario no debe ver la pantalla de login — el middleware redirige directamente al dashboard.
2. **El destino post-login depende del estado de membresía.** El sistema verifica la tabla `members` tras completar el callback. Esta verificación ocurre server-side.
3. **Prioridad de redirect: cookie → membresía más reciente → /onboarding.** Nunca asumir que el usuario tiene grupos sin verificar.
4. **El contexto de navegación se preserva ante token expirado.** El redirect al login debe incluir la URL original como parámetro para restaurar el destino post re-login.
5. **El login y el registro usan el mismo flujo OAuth.** El sistema no distingue entre ambos en el botón — la diferencia está en el callback, donde la creación del perfil usa `ON CONFLICT DO NOTHING`.
6. **La verificación de membresía usa `getUser()` server-side.** No se infiere estado de grupo desde el cliente.
7. **El contexto de navegación no se preserva en todos los casos.** Solo ante token expirado (Scenario 04). En acceso sin sesión o logout explícito, el redirect post-login va al destino por defecto según membresía.

---

## 10. Flujo principal

**Login exitoso — usuario con grupo (Scenario 01)**

```
1. Usuario accede a / (ruta raíz, pública) sin sesión activa.
2. Usuario activa el botón de ingreso con Google.
3. Sistema inicia flujo OAuth: signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback' }).
4. Sistema redirige al usuario a la pantalla de autorización de Google.
5. Usuario autoriza el acceso (cuenta ya existente en Google).
6. Google redirige al callback: /auth/callback?code=...
7. Route Handler en /auth/callback intercambia el code por sesión (server-side, PKCE).
8. Supabase detecta que el email ya existe — no crea duplicado — inicia sesión en cuenta existente.
9. Trigger on_auth_user_created NO se activa (usuario ya existe en auth.users).
10. Callback redirige a /dashboard.
11. /dashboard lee cookie last_group_id.
12. Si cookie válida y usuario sigue siendo miembro → redirige a /dashboard/[groupId].
13. Si no hay cookie o membresía inválida → consulta members (joined_at DESC) → redirige al primer resultado.
14. Si sin membresías → redirige a /onboarding.
```

---

## 11. Flujos alternativos

### FA-01 — Usuario con cuenta pero sin grupos (Scenario 02)

```
1–9. Igual al flujo principal.
10. Callback redirige a /dashboard.
11. /dashboard verifica membresías → tabla members sin filas para este usuario.
12. Cookie last_group_id ausente o membresía inválida → no hay fallback.
13. Sistema redirige a /onboarding.
```

### FA-02 — Sesión persistente válida (Scenario 03)

```
1. Usuario accede a / (o a cualquier ruta protegida) con cookie de sesión válida.
2. Middleware verifica sesión con supabase.auth.getUser() → token válido.
3. Si el usuario accedió a /:
   — Middleware redirige a /dashboard.
   — /dashboard ejecuta lógica de smart redirect (cookie → joined_at DESC → /onboarding).
4. Si el usuario accedió directamente a una ruta protegida:
   — Middleware permite el acceso sin redirigir.
5. El flujo OAuth no se inicia en ningún caso.
6. No se renderiza la pantalla de login.
```

### FA-03 — Token expirado (Scenario 04)

```
1. Usuario intenta acceder a cualquier ruta protegida (ej. /dashboard/[groupId]/dinners).
2. Middleware llama a supabase.auth.getUser() → token inválido o expirado.
3. Middleware registra la URL solicitada como parámetro de redirect.
4. Middleware redirige a /?redirect=/dashboard/[groupId]/dinners (o equivalente definido en el proyecto).
5. Usuario ve la pantalla de login con el contexto de navegación preservado en la URL.
6. Usuario completa el flujo OAuth.
7. Post-login, el callback detecta el parámetro redirect y redirige a la URL original.
8. Si el parámetro redirect no existe o es inválido, usa el destino por defecto según membresía.
```

---

## 12. UI / UX

### Fuente de verdad

- `docs/design/design-system.md`

### Comportamientos requeridos

- El botón de ingreso con Google debe estar habilitado en el estado inicial de la pantalla de login.
- Mientras el flujo OAuth está en progreso (entre el clic y la redirección a Google), el botón debe mostrar estado de carga e impedir múltiples clics.
- Si el usuario ya tiene sesión válida y accede a `/`, la redirección es inmediata — sin renderizar la pantalla de login.
- Si el token expiró y el usuario es redirigido al login, la pantalla de login no debe mostrar mensajes de error por la expiración — solo el estado normal.
- Durante la redirección post-callback (verificación de membresías + redirect final), debe mostrarse un indicador de carga.
- El parámetro `redirect` en la URL del login no debe ser visible ni prominente para el usuario — es un parámetro técnico de preservación de contexto.
- Si el flujo OAuth falla antes de redirigir a Google (error de configuración del proveedor), mostrar mensaje de error inline en la pantalla de login.

---

## 13. Mensajes y textos

### Fuente de verdad

- `lib/texts.json`

### Tipos de mensajes requeridos

| Tipo | Clave en texts.json | Contexto de uso |
|---|---|---|
| Label del botón principal | `auth.continueWithGoogle` | Estado inicial del botón |
| Estado de carga del botón | `auth.redirecting` | Durante inicio del flujo OAuth (entre clic y redirect a Google) |
| Nota informativa bajo el botón | `auth.autoAccountCreation` | Texto aclaratorio debajo del CTA |
| Error de inicio de flujo | `auth.errors.authFlowFailed` | Si falla el inicio del proceso OAuth (antes de ir a Google) |

> El Scenario 04 (token expirado) no requiere mensajes adicionales. El usuario es redirigido al login en estado normal — sin texto de "tu sesión expiró".

---

## 14. Persistencia

### Operaciones en DB por scenario

| Scenario | Tabla | Operación | Condición |
|---|---|---|---|
| Login exitoso (S01, S02) | `auth.users` | Sin operación (usuario ya existe) | Supabase no duplica |
| Login exitoso (S01, S02) | `profiles` | Sin operación (`ON CONFLICT DO NOTHING` en trigger) | Perfil ya existe |
| Sesión persistente (S03) | — | Sin operación | No hay flujo OAuth |
| Token expirado (S04) | — | Sin operación (hasta re-login) | El re-login sigue S01 o S02 |

### Cookie `last_group_id`

| Evento | Comportamiento |
|---|---|
| Usuario visita `/dashboard/[groupId]` | Middleware actualiza cookie `last_group_id` con el groupId actual |
| Login post-redirect | Se lee la cookie para determinar destino. Si es inválida (no miembro), se ignora |
| Token expirado → re-login | La cookie persiste en el dispositivo durante la sesión expirada. Se lee post re-login |

**Atributos de la cookie `last_group_id`:** `httpOnly: true`, `sameSite: lax`, `maxAge: 30 días`, `path: /`

---

## 15. Seguridad

| Aspecto | Implementación requerida |
|---|---|
| **PKCE** | El flujo OAuth debe usar PKCE. Supabase lo implementa por defecto. No usar flujo implícito. |
| **State parameter** | El parámetro `state` se valida en el callback para prevenir CSRF. Supabase lo gestiona internamente. |
| **Code exchange server-side** | El `code` del callback se intercambia en el Route Handler (servidor), nunca en el cliente. |
| **getUser() obligatorio** | Para verificar sesión en el servidor, usar `supabase.auth.getUser()`, nunca `getSession()`. |
| **Rutas protegidas** | El middleware verifica sesión antes de permitir acceso a cualquier ruta dentro de `(protected)`. |
| **Parámetro redirect validado** | El parámetro `redirect` en la URL del login debe validarse para prevenir open redirect. Solo se permiten rutas relativas internas (que empiecen con `/`). No se aceptan URLs absolutas o externas. |
| **Cookie last_group_id** | La cookie es `httpOnly` — no accesible desde JS del cliente. La membresía siempre se verifica server-side antes de confiar en el valor. |
| **RLS activo** | La query a `members` para verificar pertenencia al grupo se ejecuta con el cliente server, respetando RLS. Un usuario solo puede ver sus propias filas en `members`. |

---

## 16. Dependencias

| Dependencia | Tipo | Detalle |
|---|---|---|
| Supabase Auth | Externa | Google OAuth configurado como proveedor activo |
| `auth.users` | Interna — DB | El usuario debe existir previamente (US-01 completada) |
| `profiles` | Interna — DB | Debe existir el perfil asociado al `auth.uid()` |
| `members` | Interna — DB | Se consulta post-login para determinar destino de redirección |
| `/auth/callback` route handler | Interna — código | Maneja el exchange del code y la lógica de redirect post-login |
| `middleware.ts` | Interna — código | Detecta sesión persistente, token expirado y preserva contexto de navegación |
| `app/(dashboard)/dashboard/page.tsx` | Interna — código | Smart redirect con lógica cookie → fallback → /onboarding |
| Cookie `last_group_id` | Interna — código | Escrita por middleware, leída por dashboard page server component |
| US-01 (Registro con Google) | Interna — US | US-02 presupone que el usuario completó US-01 previamente |

---

## 17. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Cookie `last_group_id` apunta a un grupo del que el usuario ya no es miembro | Media | Media | Verificar membresía activa en `members` antes de redirigir. Si falla, usar fallback `joined_at DESC`. |
| Parámetro `redirect` con URL externa (open redirect) | Baja | Alta | Validar que el valor empiece con `/` y no contenga protocolo. Rechazar todo lo que no sea ruta interna. |
| Loop de redirección entre middleware y callback | Media | Alta | Definir regla clara: si ya autenticado y accede a `/`, redirect a dashboard. Nunca redirigir de `/dashboard` de vuelta a `/`. |
| Token del middleware aparentemente válido pero rechazado por DB | Baja | Media | Usar `getUser()` que hace verificación real contra Supabase, no solo parsea el JWT local. |
| Query a `members` falla post-login | Baja | Media | Redirigir a `/onboarding` como fallback seguro si la query falla. No dejar al usuario sin destino. |
| Usuario con múltiples grupos y cookie stale | Media | Baja | Si el groupId en cookie ya no pertenece al usuario, usar fallback de membresía más reciente. |

---

## 18. Casos borde

| Caso | Comportamiento esperado |
|---|---|
| Cookie `last_group_id` con groupId de un grupo del que el usuario fue eliminado | Sistema detecta que no es miembro → ignora la cookie → fallback a membresía más reciente → si no hay, `/onboarding` |
| Usuario tiene sesión válida en un dispositivo y token expirado en otro | Cada dispositivo maneja su propia sesión. El dispositivo con token expirado redirige al login independientemente del otro |
| Token expirado al acceder directamente a una ruta protegida con query params (ej. `?filter=x`) | El parámetro `redirect` en el login debe preservar la URL completa incluyendo query params, no solo el path |
| Parámetro `redirect` en la URL del login apunta a una ruta inválida o inexistente | Post re-login, redirigir al destino por defecto (dashboard del último grupo activo o `/onboarding`). No generar 404. |
| El usuario completa el flujo OAuth pero falla la query a `members` por error de red | Redirigir a `/onboarding` como fallback. No mostrar pantalla en blanco ni error técnico. |
| Sesión persistente válida pero el usuario accede a `/onboarding` directamente | El middleware permite el acceso (ruta protegida válida). No redirigir al dashboard automáticamente. El redirect automático aplica solo en `/`. |
| Usuario con cuenta registrada pero sin `profiles` (perfil eliminado manualmente) | La query server-side falla. Redirigir a `/` y forzar re-login. |

---

## 19. Criterios de aceptación desarrollados

### Scenario 01 — Login exitoso

**Dado** que tengo una cuenta registrada y pertenezco a al menos un grupo

**Cuando** selecciono el botón de ingreso con Google y completo la autorización

**Entonces:**
- No se crea duplicado en `auth.users` ni en `profiles`
- El sistema consulta `members` para verificar pertenencia a grupos
- El sistema lee la cookie `last_group_id` si existe
- Si la cookie es válida y el usuario es miembro del grupo → redirige a `/dashboard/[last_group_id]`
- Si no hay cookie o la membresía es inválida → consulta `members ORDER BY joined_at DESC` → redirige al primer resultado
- La redirección ocurre sin pasos adicionales (sin pantallas intermedias)
- La sesión queda activa (cookie de Supabase válida)

---

### Scenario 02 — Usuario sin grupo

**Dado** que tengo una cuenta registrada y no pertenezco a ningún grupo

**Cuando** selecciono el botón de ingreso con Google y completo la autorización

**Entonces:**
- No se crea duplicado en `auth.users` ni en `profiles`
- El sistema consulta `members` → sin filas para este usuario
- El sistema redirige a `/onboarding`
- La redirección ocurre sin pasos adicionales
- La sesión queda activa

---

### Scenario 03 — Sesión persistente

**Dado** que ya inicié sesión anteriormente en este dispositivo y la sesión sigue válida

**Cuando** abro la app (accedo a `/` o a cualquier ruta protegida)

**Entonces:**
- El middleware detecta la sesión válida con `supabase.auth.getUser()`
- El flujo OAuth no se inicia
- La pantalla de login no se renderiza
- Si accedí a `/`: el sistema redirige a `/dashboard/[groupId]` del último grupo activo (cookie → `joined_at DESC` → `/onboarding`)
- Si accedí directamente a una ruta protegida: el middleware permite el acceso sin redirigir
- No se muestra ningún paso adicional

---

### Scenario 04 — Token expirado

**Dado** que mi sesión expiró por inactividad prolongada

**Cuando** intento acceder a cualquier pantalla protegida (ej. `/dashboard/[groupId]`)

**Entonces:**
- El middleware detecta el token inválido con `supabase.auth.getUser()`
- El sistema registra la URL solicitada
- El sistema redirige al login con el parámetro `redirect` apuntando a la URL original
- El usuario ve la pantalla de login en estado normal (sin mensaje de error por expiración)
- Al completar el login, el sistema redirige a la URL original preservada en el parámetro `redirect`
- El parámetro `redirect` es validado para aceptar solo rutas internas (empieza con `/`, sin protocolo)

---

## 20. Checklist diseño

- [x] El botón de ingreso respeta el componente de botón definido en `docs/design/design-system.md`
- [x] El estado de carga del botón usa el patrón de loading del design system (no spinner genérico)
- [x] La pantalla de login no usa bordes sólidos de 1px para separar secciones
- [x] La jerarquía visual usa tonal layering (cambios de superficie) en lugar de líneas divisorias
- [x] Los textos de la pantalla de login provienen de `lib/texts.json` (`auth.login.*`)
- [x] El botón usa tipografía `DM Sans` con peso correcto según el design system
- [x] Los colores de error usan el token `error` (`#ba1a1a`) del design system
- [x] El indicador de carga durante el redirect post-callback respeta el design system

---

## 21. Checklist desarrollo

- [x] `signInWithOAuth` usa `provider: 'google'` con `redirectTo` apuntando a `/auth/callback`
- [x] El flujo OAuth usa PKCE (no flujo implícito)
- [x] El Route Handler en `/auth/callback` intercambia el `code` por sesión server-side
- [x] El callback no intenta crear perfil si ya existe (`ON CONFLICT DO NOTHING` en trigger de DB)
- [x] El Route Handler lee el parámetro `redirect` y lo usa como destino post-login si es válido
- [x] El parámetro `redirect` es validado — solo se aceptan rutas internas (empieza con `/`, sin protocolo ni dominio externo)
- [x] El middleware usa `supabase.auth.getUser()`, no `getSession()`, para verificar sesión
- [x] El middleware redirige usuarios autenticados que acceden a `/` hacia `/dashboard`
- [x] El middleware preserva la URL solicitada como parámetro `redirect` al redirigir al login por token expirado
- [x] La lógica de smart redirect en `/dashboard` lee la cookie `last_group_id` y verifica membresía activa antes de usar el valor
- [x] Si la cookie apunta a un grupo del que el usuario no es miembro, usa el fallback de `members ORDER BY joined_at DESC`
- [x] Si sin membresías, redirige a `/onboarding`
- [x] La query a `members` usa campos explícitos (no `select(*)`)
- [x] La cookie `last_group_id` es `httpOnly`, `sameSite: lax`, `maxAge: 30 días`
- [x] El botón muestra estado de carga durante el redirect y está deshabilitado para evitar doble clic
- [x] Los textos se importan desde `lib/texts.json`

---

## 22. Checklist QA

- [ ] **Login con grupo:** Completar OAuth con cuenta existente con al menos un grupo → sin duplicado en DB → redirección directa a `/dashboard/[groupId]` → sin pasos intermedios
- [ ] **Login sin grupo:** Completar OAuth con cuenta existente sin grupos → redirección a `/onboarding`
- [ ] **Cookie válida:** Ingresar a app con sesión activa → no pasa por OAuth → redirige directamente al dashboard del último grupo
- [ ] **Cookie stale:** Forzar cookie `last_group_id` con groupId de grupo del que el usuario no es miembro → sistema ignora cookie → usa fallback correcto
- [ ] **Sin cookie:** Borrar cookie `last_group_id` con sesión activa → acceder a `/` → redirige al grupo con `joined_at` más reciente
- [ ] **Token expirado en ruta simple:** Acceder a `/dashboard/[groupId]` con token expirado → redirect al login → parámetro `redirect` en URL apunta a ruta original
- [ ] **Token expirado en ruta con query params:** Acceder a ruta con query params con token expirado → parámetro `redirect` preserva URL completa incluyendo query params
- [ ] **Re-login post expiración:** Completar login tras token expirado → redirige a la URL original del parámetro `redirect`
- [ ] **Open redirect bloqueado:** Manipular parámetro `redirect` con URL externa → sistema ignora el valor y usa destino por defecto
- [ ] **Múltiples grupos:** Login con cuenta que tiene múltiples grupos sin cookie → redirige al grupo con `joined_at DESC` más reciente
- [ ] **Sesión activa accede a /:** Sin re-autenticar → redirige al dashboard inmediatamente
- [ ] **Fallo de query a members:** Simular error en consulta de membresías post-login → redirige a `/onboarding` como fallback → sin error técnico visible

---

## 23. Trazabilidad

| Scenario Gherkin | Cubierto por | Secciones PDD |
|---|---|---|
| Scenario 01: Login exitoso | Flujo principal §10 + CA §19 + Persistencia §14 + Reglas §9 | §9, §10, §14, §19 |
| Scenario 02: Usuario sin grupo | FA-01 §11 + CA §19 + Reglas §9 | §9, §11, §19 |
| Scenario 03: Sesión persistente | FA-02 §11 + CA §19 + Definiciones §8 | §8, §11, §19 |
| Scenario 04: Token expirado | FA-03 §11 + CA §19 + Seguridad §15 + Reglas §9 | §9, §11, §15, §19 |

---

## 24. Definiciones abiertas

| # | Ambigüedad | Decisión |
|---|---|---|
| 1 | Scenario 02 decía `(grupo/new)` en el backlog — ¿ruta real? | **Cerrado por el código:** `app/(dashboard)/dashboard/page.tsx` redirige a `/onboarding` cuando no hay grupos. El backlog fue actualizado de `(grupo/new)` a `(/onboarding)` para sincronizar con el código. `/onboarding` ofrece crear grupo O unirse con link de invitación — mismo destino que US-01 para nuevos usuarios sin grupo. |

---

## 25. Resumen

US-02 define el comportamiento de retorno al producto para usuarios registrados. Es la US de login "puro" — sin creación de cuenta — con cuatro outcomes que dependen del estado del usuario en el momento del acceso.

**Complejidad:** Baja en UI, media en middleware y lógica de redirección.

**Distinción crítica con US-01:** US-01 cubre el primer acceso (registro + creación de perfil). US-02 cubre todos los accesos subsiguientes. Ambos usan el mismo botón y el mismo flujo OAuth — la diferencia está en el callback (creación de perfil ya no ocurre) y en el destino de redirección (determinado por membresía real, no por "primera vez").

**Riesgo principal:** Cookie `last_group_id` stale o parámetro `redirect` no validado. Ambos tienen mitigación definida en §15 y §17.

**Dependencia crítica:** El middleware es el punto central de US-02 — maneja sesión persistente (S03) y token expirado (S04). El Route Handler en `/auth/callback` y el smart redirect en `dashboard/page.tsx` manejan S01 y S02.

---

*PDD generado el 30 de Marzo de 2026 · Versión 1.0*
*Fuentes: `docs/product/backlog_us_mvp.md`, `docs/design/design-system.md`, `lib/texts.json`, `app/(dashboard)/dashboard/page.tsx`*
