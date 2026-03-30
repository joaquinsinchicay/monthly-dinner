# PDD — US-01 · Registro con Google

---

## 1. Identificación

| Campo | Valor |
|---|---|
| **Epic** | E00 — Acceso & Autenticación |
| **User Story** | US-01 — Registro con Google |
| **Prioridad** | P0 — Bloqueante (sin esto ningún otro flujo es accesible) |
| **Objetivo de negocio** | Eliminar la fricción de registro. El sistema crea la cuenta automáticamente al primer login con Google, sin formularios de alta ni contraseñas. |

---

## 2. Problema a resolver

El usuario nuevo no tiene cuenta en el sistema. Debe poder ingresar por primera vez sin pasar por un formulario de registro tradicional. La cuenta debe crearse automáticamente si no existe, y no debe duplicarse si el email ya está registrado.

---

## 3. Objetivo funcional

Al completar el flujo OAuth con Google:
- Si el usuario no existe → crear perfil y redirigir a /onboarding.
- Si el usuario existe → iniciar sesión sin duplicar cuenta.
- Si el usuario cancela → retornar al login sin efectos secundarios.
- Si el usuario ya tiene sesión activa → redirigir directamente al dashboard sin re-autenticar.

---

## 4. Alcance

### Incluye

- Inicio del flujo OAuth con Google desde la pantalla de login.
- Creación automática de perfil en `profiles` si el usuario es nuevo.
- Redirección post-login a `/onboarding` si es primera vez (sin grupos).
- Redirección post-login a `/dashboard/[groupId]` si ya tiene sesión activa y grupo asignado.
- Retorno silencioso a `/` si el usuario cancela el flujo OAuth.
- Prevención de duplicación de cuenta para el mismo email.

### No incluye

- Registro con email/contraseña.
- Verificación de email manual.
- Selección de username o avatar durante el registro (se toma del perfil de Google).
- Onboarding de múltiples pasos post-registro.
- Notificaciones de bienvenida externas (email, push).

---

## 5. Actor principal

**Usuario nuevo** — persona sin cuenta en el sistema que accede a la pantalla de login por primera vez.

---

## 6. Precondiciones

- El usuario accede a la app sin sesión activa.
- La pantalla de login está disponible en `/` (ruta raíz, pública).
- El proveedor OAuth de Google está configurado en Supabase Auth.
- La tabla `profiles` existe con las columnas necesarias para almacenar datos del perfil de Google.
- El callback de autenticación está disponible en `/auth/callback`.

---

## 7. Postcondiciones

| Scenario | Estado esperado post-acción |
|---|---|
| Registro exitoso | Perfil creado en `profiles` con `id = auth.uid()`. Usuario autenticado. Sesión activa. Redirigido a `/onboarding`. |
| Email ya registrado | Sin cambios en `profiles`. Sesión iniciada en cuenta existente. Redirigido según grupo asignado. |
| Cancelación OAuth | Sin cuenta creada. Sin sesión. Usuario en `/`. Sin mensajes de error. |
| Ya autenticado | Sin cambios. Redirigido a `/dashboard/[groupId]` del grupo activo en la última sesión. |

---

## 8. Definiciones funcionales

**Perfil automático:** Al primer login con Google, Supabase crea el usuario en `auth.users` y el sistema crea automáticamente el registro en `profiles` con los datos del proveedor (id, email, nombre, avatar). Este proceso es atómico — no requiere acción del usuario.

**Email ya registrado:** OAuth con Google no permite dos cuentas con el mismo email en Supabase. Si el email existe, Supabase inicia sesión en la cuenta existente sin crear duplicado.

**Cancelación silenciosa:** Si el usuario cierra la ventana de Google o deniega permisos, el callback recibe un error de OAuth. El sistema redirige a `/` sin mostrar mensaje de error y sin exponer el error en la URL.

**Sesión activa:** Si el usuario tiene un token válido en el cliente (cookie de sesión de Supabase), el middleware protege las rutas y redirige al dashboard sin pasar por el flujo OAuth nuevamente.

**Grupo activo:** El smart redirect en `/dashboard` opera en dos pasos:
1. Lee la cookie `last_group_id` (seteada por el middleware cada vez que el usuario visita `/dashboard/[groupId]`). Si existe y el usuario sigue siendo miembro de ese grupo, redirige allí.
2. Fallback: consulta `members` ordenado por `joined_at DESC` y toma el grupo más recientemente unido.
3. Sin grupos → redirige a `/onboarding`.

La cookie `last_group_id` es `httpOnly`, `sameSite: lax`, `maxAge: 30 días`, y se actualiza en cada visita a cualquier ruta bajo `/dashboard/[groupId]`.

---

## 9. Reglas de negocio

1. **Un email = una cuenta.** No se permite crear dos perfiles con el mismo email, independientemente del proveedor.
2. **El perfil se crea automáticamente.** El usuario no puede elegir no tener perfil si completó el flujo OAuth.
3. **La cancelación no es un error.** Si el usuario cancela el flujo OAuth, el sistema no muestra mensajes de error — retorna al estado inicial.
4. **La sesión persiste.** Una sesión activa no expira por inactividad del browser en el MVP (Supabase maneja refresh automático).
5. **El registro y el login son el mismo flujo.** No hay distinción de rutas entre registro y login — ambos pasan por el mismo botón y el mismo callback.
6. **El perfil hereda los datos de Google.** Nombre completo y avatar URL provienen del proveedor — el usuario no los ingresa manualmente en este flujo.

---

## 10. Flujo principal

**Registro exitoso (Scenario 01)**

```
1. Usuario accede a / (ruta raíz, pública).
2. Usuario activa el botón de ingreso con Google.
3. Sistema inicia el flujo OAuth: llama a Supabase signInWithOAuth({ provider: 'google' }).
4. Sistema redirige al usuario a la pantalla de autorización de Google.
5. Usuario autoriza el acceso.
6. Google redirige al callback: /auth/callback?code=...
7. El route handler en /auth/callback intercambia el code por sesión.
8. Supabase crea el usuario en auth.users.
9. Trigger on_auth_user_created crea el registro en profiles con id = auth.uid() (ON CONFLICT DO NOTHING si ya existe).
10. Callback redirige a /dashboard.
11. /dashboard lee cookie last_group_id.
12. Si cookie válida y usuario es miembro → redirige a /dashboard/[groupId] del último grupo visitado.
13. Sin cookie o membresía inválida → consulta members (joined_at DESC) → redirige al grupo más recientemente unido.
14. Sin grupos → redirige a /onboarding (pantalla con opción de crear grupo o usar link de invitación).
```

---

## 11. Flujos alternativos

### FA-01 — Email ya registrado (Scenario 02)

```
1–6. Igual al flujo principal.
7. Supabase detecta el email y no crea duplicado — inicia sesión en cuenta existente.
8. Perfil en profiles no se modifica.
9. Sistema verifica grupos → redirige según corresponda.
```

### FA-02 — Cancelación del flujo OAuth (Scenario 03)

```
1. Usuario accede a /.
2. Usuario activa el botón de ingreso con Google.
3. Sistema inicia flujo OAuth.
4. Usuario cancela la autorización en Google.
5. Google redirige al callback con error o sin code.
6. El route handler detecta ausencia de code o presencia de error.
7. Sistema redirige a / (URL limpia, sin query params de error).
8. No se crea cuenta. No se muestra mensaje de error.
```

### FA-03 — Usuario ya autenticado (Scenario 04)

```
1. Usuario accede a / con sesión activa.
2. Middleware detecta sesión válida.
3. Sistema redirige directamente a /dashboard/[groupId] del grupo activo en la última sesión.
4. El flujo OAuth no se inicia.
```

---

## 12. UI / UX

### Fuente de verdad

- `docs/design/design-system.md`

### Comportamientos requeridos

- El botón de ingreso con Google debe estar disponible en el estado inicial de la pantalla de login.
- Mientras el flujo OAuth está en progreso (entre el clic y la redirección a Google), el botón debe mostrar un estado de carga que impida múltiples clics.
- Durante la redirección post-callback, mostrar indicador de carga hasta completar la verificación de grupos y ejecutar el redirect final.
- Si el flujo falla antes de iniciar el popup de Google (error de configuración del proveedor), mostrar mensaje de error inline.
- Si el usuario ya está autenticado y accede a `/`, la redirección es inmediata — sin renderizar la pantalla de login.
- La pantalla de login no debe mostrar ningún elemento propio de la app detrás del estado de carga durante la redirección.

---

## 13. Mensajes y textos

### Fuente de verdad

- `lib/texts.json`

### Tipos de mensajes requeridos

| Tipo | Clave en texts.json | Contexto de uso |
|---|---|---|
| Label del botón principal | `auth.continueWithGoogle` | Estado inicial del botón |
| Estado de carga del botón | `auth.redirecting` | Durante el proceso de inicio de OAuth |
| Nota informativa bajo el botón | `auth.autoAccountCreation` | Explica que se crea cuenta automáticamente |
| Error de inicio de flujo | `auth.errors.authFlowFailed` | Si falla el inicio del proceso OAuth (antes de ir a Google) |

> No se muestra ningún mensaje en el caso de cancelación (FA-02). El retorno a `/` es silencioso y sin query params de error en la URL.

---

## 14. Persistencia

### Tabla afectada: `profiles`

| Acción | Operación | Condición |
|---|---|---|
| Registro exitoso | `INSERT` vía trigger `on_auth_user_created` (`ON CONFLICT DO NOTHING`) | Solo cuando Supabase crea un nuevo usuario en `auth.users` |
| Re-login (email ya registrado) | Sin operación | El trigger no se activa — no hay INSERT en `auth.users` |
| Cancelación | Sin operación | No se escribe nada |
| Ya autenticado | Sin operación | No se escribe nada |

### Campos escritos en `profiles` en registro exitoso

| Campo | Origen |
|---|---|
| `id` | `auth.uid()` del usuario recién creado |
| `full_name` | Datos del proveedor Google (`raw_user_meta_data`) |
| `avatar_url` | Datos del proveedor Google (`raw_user_meta_data`) |
| `created_at` | Timestamp del servidor |

### Sesión

- Supabase maneja la sesión mediante cookies HttpOnly.
- El refresh automático del token es responsabilidad del cliente de Supabase.
- No se escribe estado de sesión en ninguna tabla de la aplicación.

---

## 15. Seguridad

| Aspecto | Implementación requerida |
|---|---|
| **PKCE** | El flujo OAuth debe usar PKCE (Proof Key for Code Exchange). Supabase lo implementa por defecto. No usar flujo implícito. |
| **State parameter** | El parámetro `state` debe validarse en el callback para prevenir CSRF. Supabase lo gestiona internamente. |
| **Code exchange server-side** | El `code` del callback debe intercambiarse en el servidor (Route Handler), nunca en el cliente. |
| **Rutas protegidas** | El middleware debe verificar sesión en todas las rutas dentro de `(protected)` antes de permitir acceso. |
| **getUser() obligatorio** | Para verificar identidad en el servidor, usar `supabase.auth.getUser()`, nunca `getSession()` — getSession() puede ser manipulado desde el cliente. |
| **Perfil server-side** | La creación del perfil en `profiles` debe ejecutarse en el servidor (Route Handler o trigger de DB), nunca en el cliente. |
| **RLS** | La tabla `profiles` debe tener RLS activo. El INSERT de creación de perfil debe estar permitido solo para el `auth.uid()` correspondiente. |

---

## 16. Dependencias

| Dependencia | Tipo | Detalle |
|---|---|---|
| Supabase Auth | Externa | Google OAuth configurado como proveedor activo |
| `profiles` table | Interna — DB | Debe existir con schema correcto |
| `/auth/callback` route handler | Interna — código | Debe manejar el exchange de code y la creación de perfil |
| `middleware.ts` | Interna — código | Debe redirigir usuarios autenticados que acceden a `/login` |
| `members` table | Interna — DB | Query post-login para determinar si el usuario tiene grupos |
| US-03 (Crear grupo) | Interna — US | El destino post-registro exitoso es `/onboarding`, que ofrece crear grupo (US-03) o usar link de invitación |

---

## 17. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Perfil no creado tras OAuth exitoso | Baja | Alta | Usar trigger de DB (`on_auth_user_created`) para garantizar atomicidad — no depender de código de aplicación |
| Race condition entre creación de sesión y query a members | Baja | Media | Crear perfil en callback antes de hacer query a members |
| Loop de redirección si middleware y callback divergen | Media | Alta | Testear explícitamente el caso "ya autenticado accede a /login" |
| Cancelación de OAuth tratada como error | Media | Baja | Distinguir ausencia de `code` de error real en el callback |
| Token de sesión inválido pero cookie presente | Baja | Media | Usar `getUser()` server-side para validar — nunca confiar en presencia de cookie |

---

## 18. Casos borde

| Caso | Comportamiento esperado |
|---|---|
| Usuario cancela a mitad del flujo OAuth en Google | Retorno silencioso a `/` sin error y sin query params en la URL |
| Usuario completa el flujo pero cierra la pestaña antes del callback | No se crea cuenta. Al volver a `/`, inicia el flujo desde cero |
| El callback recibe `error` en la URL (OAuth error param) | Redirigir a `/`. No mostrar el error técnico al usuario |
| La query de membresía falla después de crear perfil | El callback redirige a `/dashboard`, que a su vez redirige a `/onboarding` como fallback seguro |
| Usuario tiene múltiples grupos | Redirigir al grupo más recientemente unido (`joined_at DESC`). No se persiste el último grupo visitado |
| El perfil ya existe pero `full_name` o `avatar_url` cambiaron en Google | El trigger usa `ON CONFLICT DO NOTHING` — si el perfil ya existe, no se modifica. Los datos de Google se capturan solo en la creación del perfil |
| Red interrumpida durante el callback | El callback falla. Supabase no crea sesión. Usuario en estado sin sesión. El sistema redirige a `/` |

---

## 19. Criterios de aceptación desarrollados

### Scenario 01 — Registro exitoso

**Dado** que soy un usuario nuevo sin cuenta

**Cuando** selecciono el botón de ingreso con Google y autorizo el acceso en la pantalla de Google

**Entonces:**
- Se crea un registro en `auth.users` con el email de Google
- Se crea un registro en `profiles` con `id = auth.uid()`, `full_name` y `avatar_url` del proveedor
- El sistema verifica que el usuario no tiene membresías en `members`
- El sistema redirige a `/onboarding`
- La sesión queda activa (cookie de Supabase válida)

---

### Scenario 02 — Email ya registrado

**Dado** que ya existe una cuenta con ese email en el sistema

**Cuando** intento completar el flujo OAuth con el mismo Google account

**Entonces:**
- No se crea un duplicado en `auth.users` ni en `profiles`
- La sesión se inicia en la cuenta existente
- El comportamiento post-login sigue las mismas reglas que US-02 Login

---

### Scenario 03 — Cancelación del flujo OAuth

**Dado** que estoy en la pantalla de autorización de Google

**Cuando** cierro la ventana o cancelo el permiso

**Entonces:**
- El callback no recibe un `code` válido
- No se crea ningún registro en `auth.users` ni en `profiles`
- No se inicia ninguna sesión
- El sistema redirige a `/` (URL limpia, sin query params de error)
- No se muestra ningún mensaje de error al usuario

---

### Scenario 04 — Usuario ya autenticado

**Dado** que ya tengo una sesión activa (cookie válida)

**Cuando** accedo a `/login`

**Entonces:**
- El middleware detecta la sesión antes de renderizar la pantalla de login
- El flujo OAuth no se inicia
- El sistema redirige directamente a `/dashboard/[groupId]` del grupo activo en la última sesión
- No se muestran pasos adicionales ni pantallas intermedias

---

## 20. Checklist diseño

- [x] El botón de ingreso respeta el componente de botón definido en `docs/design/design-system.md` — gradiente `primary`/`primary_container`, `rounded-full`, `font-medium`
- [x] El estado de carga del botón usa el patrón de loading state del design system (no spinner genérico) — muestra texto `auth.redirecting`, sin spinner
- [x] La pantalla de login no usa bordes sólidos de 1px para separar secciones — card con shadow + `rounded-2xl`, sin borders
- [x] La jerarquía visual usa tonal layering (cambios de superficie) en lugar de líneas divisorias — `bg-[#fcf9f8]` base → `bg-white` card flotante
- [x] Los textos de la pantalla de login provienen de `lib/texts.json` (`auth.login.*`) — `eyebrow`, `heading`, `body` correctamente consumidos
- [x] El botón usa la tipografía `DM Sans` con peso correcto según el design system — `font-medium` (500), alineado con spec de botones
- [x] Los colores de error usan el token `error` (`#ba1a1a`) del design system — `text-[#ba1a1a]` en error inline de `GoogleSignInButton`

---

## 21. Checklist desarrollo

- [x] `signInWithOAuth` usa `provider: 'google'` con `redirectTo` apuntando a `/auth/callback` — `lib/actions/auth.ts:25-28`
- [x] El flujo OAuth usa PKCE (no flujo implícito) — confirmado por uso de `exchangeCodeForSession` en Route Handler
- [x] El Route Handler en `/auth/callback` intercambia el `code` por sesión server-side — `app/auth/callback/route.ts:15`
- [x] La creación del perfil en `profiles` ocurre en el servidor (trigger de DB o Route Handler), nunca en el cliente — trigger `on_auth_user_created` en `supabase/migrations/`
- [x] El Route Handler distingue correctamente entre `error` en URL y ausencia de `code` — `route.ts:10`: `if (error || !code)`
- [x] Cancelación → redirect a `/` sin parámetros de error en la URL — `route.ts:11`: `NextResponse.redirect(\`${origin}/\`)`
- [x] El middleware redirige usuarios autenticados que acceden a `/` hacia `/dashboard` — `middleware.ts:46-49`
- [x] La verificación de sesión en el servidor usa `getUser()`, no `getSession()` — `middleware.ts:29`, `app/page.tsx:12`, `dashboard/page.tsx:9`
- [x] La query de membresía post-login usa campos explícitos (no `select(*)`) — `.select('group_id')` en `dashboard/page.tsx`
- [x] RLS en `profiles` permite INSERT solo al `auth.uid()` correspondiente — policy `profiles: insert own` en schema
- [x] El botón de Google muestra estado de carga durante el redirect y está deshabilitado para evitar doble clic — `disabled={isPending}` + `useTransition` en `GoogleSignInButton.tsx:27`
- [x] Los textos del botón y mensajes se importan desde `lib/texts.json` — `t('auth.continueWithGoogle')`, `t('auth.redirecting')`, `t('auth.autoAccountCreation')`

---

## 22. Checklist QA

- [ ] **Registro nuevo:** Completar flujo OAuth con cuenta nueva → perfil creado en `profiles` → redirección a `/onboarding`
- [ ] **Email duplicado:** Intentar registrarse con email ya existente → no hay duplicado → sesión iniciada en cuenta existente
- [ ] **Cancelación:** Cancelar en pantalla de Google → retorno a `/` → URL limpia sin query params → sin cuenta creada → sin sesión
- [ ] **Ya autenticado:** Acceder a `/` con sesión activa → redirección inmediata a dashboard → sin pasar por OAuth
- [ ] **Perfil verificado en DB:** Confirmar en Supabase que `profiles.id = auth.uid()` con datos correctos de Google
- [ ] **Sin grupos:** Registro exitoso con cuenta nueva → sin membresías → redirección a `/onboarding` (no a dashboard directo)
- [ ] **Con grupos:** Login con cuenta existente y grupos → redirección a `/dashboard/[groupId]`
- [ ] **Red cortada en callback:** Simular fallo de red durante el callback → no crash → usuario sin sesión → redirigido a `/`
- [ ] **Doble clic en botón:** Dos clics rápidos en el botón → solo se inicia un flujo OAuth → no hay duplicación de requests
- [ ] **URL de callback con error param:** Acceder a `/auth/callback?error=access_denied` → redirect silencioso a `/`

---

## 23. Trazabilidad

| Scenario Gherkin | Covered by | Sección PDD |
|---|---|---|
| Scenario 01: Registro exitoso | Flujo principal §10 + CA §19 + Persistencia §14 | §10, §14, §19 |
| Scenario 02: Email ya registrado | FA-01 §11 + CA §19 | §11, §19 |
| Scenario 03: Cancelación del flujo OAuth | FA-02 §11 + CA §19 + Mensajes §13 | §11, §13, §19 |
| Scenario 04: Usuario ya autenticado | FA-03 §11 + CA §19 | §11, §19 |

---

## 24. Definiciones abiertas

Todas las definiciones abiertas están cerradas. Ver decisiones tomadas:

| # | Ambigüedad original | Decisión tomada |
|---|---|---|
| 1 | "Grupo activo en la última sesión" — cómo se persiste el groupId | ✅ **Cerrado e implementado:** Cookie `last_group_id` (httpOnly, 30 días) seteada por `middleware.ts` en cada visita a `/dashboard/[groupId]`. Smart redirect en `app/(dashboard)/dashboard/page.tsx` la lee y verifica membresía activa antes de redirigir. Fallback: `joined_at DESC`. |
| 2 | "Perfil creado automáticamente" — trigger DB vs código de aplicación | ✅ **Cerrado:** Trigger de DB `on_auth_user_created` con `ON CONFLICT DO NOTHING`. Implementado en `supabase/migrations/`. |
| 3 | "Sin mostrar error" en cancelación — ¿aplica también a la URL? | ✅ **Cerrado:** El redirect es a `/` limpio, sin query params de error. Verificado en `app/auth/callback/route.ts`. |

---

## 25. Resumen

US-01 es el punto de entrada de toda la aplicación. Es una US de **una sola interacción** (botón → Google → callback → redirect) con **cuatro outcomes distintos** según el estado del usuario. Su correcta implementación es bloqueante para el resto del producto.

**Complejidad:** Baja en UI, media en backend (callback, trigger, middleware).

**Riesgo principal:** Creación de perfil no atómica — mitigar con trigger de DB.

**Dependencia crítica:** El Route Handler en `/auth/callback` es el punto central — debe manejar todos los scenarios sin excepciones no controladas.

**Estado al momento de esta auditoría:** Implementada, auditada y cerrada. Todos los scenarios cubiertos. ISSUE-04 (persistencia de grupo activo) implementado con cookie `last_group_id` en middleware. Documentación sincronizada con el código real.

---

*PDD generado el 30 de Marzo de 2026 · Versión 1.2 — ISSUE-04 implementado*
*Fuentes: `docs/product/backlog_us_mvp.md`, `docs/design/design-system.md`, `lib/texts.json`, código fuente del repositorio*
