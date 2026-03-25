# AGENTS.md
## monthly-dinner

Contexto completo para desarrollo con IA — Claude · Cursor · Codex · V0

| Producto | Stack | Deploy | Estado |
|---|---|---|---|
| monthly-dinner | Next.js 14 + Supabase | monthly-dinner.vercel.app | MVP — En desarrollo |

---

## 01 — Propósito de este archivo

Este archivo es el contexto de referencia que debe leer cualquier agente de IA (Claude, Cursor, Codex, V0) antes de escribir código para el proyecto monthly-dinner. Contiene el problema que resuelve el producto, el stack técnico, el esquema de base de datos validado, las reglas de seguridad RLS, el design system, el backlog priorizado y las convenciones de desarrollo.

> **Regla de uso:** Leer este archivo completo antes de generar cualquier código. No asumir comportamientos no documentados aquí. Ante duda, preguntar antes de implementar. Cada US tiene Acceptance Criteria en Gherkin — el código debe satisfacer esos escenarios.

---

## 02 — El producto

monthly-dinner es una app web mobile-first para grupos de amigos que se reúnen a cenar regularmente. Reemplaza la coordinación desestructurada por WhatsApp con un panel centralizado que gestiona eventos mensuales, confirmaciones de asistencia, turno rotativo de organización, votación de restaurantes e historial de cenas.

### Usuarios

- **Admin del grupo:** crea el grupo, genera links de invitación, gestiona la rotación.
- **Organizador del mes:** el miembro con turno activo. Crea el evento, abre votaciones, gestiona el checklist y cierra el evento.
- **Miembro:** confirma asistencia, vota restaurantes, consulta el historial.

### Problema que resuelve

- Confirmaciones de asistencia perdidas en el chat de WhatsApp.
- Turno rotativo sin registro formal — siempre organiza la misma persona.
- Sin historial de restaurantes visitados — el grupo repite lugares sin querer.
- El organizador carga solo con toda la coordinación, generando desgaste mensual.

---

## 03 — Stack tecnológico

> **Restricciones no negociables:** Sin DevOps · Sin diseño UX · IA-first. Todo el stack fue elegido porque Claude y V0 lo conocen profundamente y lo generan bien.

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | Next.js 14 App Router | Framework nativo de Vercel. File-based routing. Claude y V0 lo generan de forma nativa. |
| UI / Design | shadcn/ui + Tailwind CSS | V0 los genera nativamente. Buena apariencia por defecto sin diseñador UX. |
| Base de datos | Supabase (Postgres) | Auth Google OAuth integrado. RLS para aislamiento de grupos. API REST auto-generada. |
| Auth | Google OAuth (Supabase) | Sin contraseñas. Una cuenta Google = acceso inmediato. Configurado en el panel de Supabase. |
| Deploy | Vercel + GitHub | Deploy automático en cada push a main. Preview por PR. Plan gratuito suficiente para MVP. |
| IA código | Claude + Codex | Generación de lógica de negocio, queries SQL, server actions y documentación. |
| IA frontend | V0 (Vercel) | Generación de componentes React/Next.js con shadcn a partir de prompts en lenguaje natural. |

### Flujo de desarrollo por US

1. PM define la US con CA Gherkin (product-prioritization skill).
2. Claude genera el prompt estructurado para V0 con la US y los CA como contexto.
3. V0 construye el componente React/Next.js que satisface los escenarios Gherkin.
4. Claude genera la lógica de backend: queries Supabase, RLS, server actions.
5. Export del componente al repo GitHub → push a main.
6. Vercel hace deploy automático → URL de preview disponible en segundos.
7. Verificar que los CA se cumplan en la preview → merge a producción.

---

## 04 — Base de datos — Supabase

> **RLS activo en todas las tablas.** Cada tabla tiene políticas específicas por operación. Aislamiento garantizado: un miembro del grupo A nunca puede ver datos del grupo B.

### Schema validado — 13 tablas

| Tabla | US principal | Descripción |
|---|---|---|
| profiles | US-01, US-02 | Perfil del usuario autenticado. `id = auth.uid()` |
| groups | US-00, US-00c | Grupos de cena. El admin crea. Incluye `frequency` ('mensual' / 'quincenal' / 'semanal') y `meeting_day_of_week` o `meeting_day_of_month` según frecuencia. Solo SELECT para miembros. |
| members | US-00, US-01, US-04 | Membresía usuario-grupo. Roles: `member` / `admin`. |
| invitation_links | US-00b, US-04 | Links de invitación. Solo admins crean, editan y revocan. |
| events | US-05, US-06, US-07 | Evento mensual. Solo el organizador inserta y edita. |
| attendances | US-09, US-10 | Confirmaciones de asistencia. Estados: `va` / `no_va` / `tal_vez`. |
| rotation | US-11, US-13 | Turno rotativo. Solo admins gestionan. Todos pueden ver. |
| polls | US-17, US-18 | Votaciones de restaurante. El organizador crea y gestiona. |
| poll_options | US-17 | Opciones de votación. Mínimo 2 por poll. |
| poll_votes | US-18 | Votos emitidos. Cada miembro puede gestionar su propio voto. |
| restaurant_history | US-14, US-16 | Historial de cenas. INSERT solo para el organizador del evento. |
| checklist_items | US-20 | Tareas del checklist. Solo el organizador puede gestionar. |
| checklist_templates | US-20 | Templates de checklist. Admins gestionan, todos ven. |

### Políticas RLS — resumen

| Tabla | Operaciones | Restricción clave |
|---|---|---|
| profiles | INSERT / SELECT / UPDATE | `auth.uid() = id` — solo el propio usuario |
| groups | INSERT / SELECT | INSERT: `auth.uid()` queda como admin / SELECT: solo miembros del grupo |
| members | INSERT / SELECT / UPDATE | INSERT: `user_id = auth.uid()` / SELECT: mismo grupo / UPDATE: propio perfil |
| invitation_links | INSERT / SELECT / UPDATE / DELETE | INSERT, UPDATE, DELETE: solo admin del grupo / SELECT: miembros del grupo |
| events | INSERT / SELECT / UPDATE | INSERT y UPDATE: `organizer_id = auth.uid()` / SELECT: miembros del grupo |
| attendances | ALL / SELECT | ALL: `member_id = auth.uid()` / SELECT: miembros del grupo via events |
| restaurant_history | INSERT / SELECT | INSERT: `group_id` del evento donde `organizer_id = auth.uid()` |
| rotation | ALL / SELECT | ALL: admin del grupo / SELECT: miembros del grupo |
| polls / options / votes | ALL / SELECT | ALL: organizer o dueño del voto / SELECT: miembros del grupo via events |
| checklist_items | ALL | Solo el organizador del evento puede gestionar |
| checklist_templates | ALL / SELECT | ALL: admin del grupo / SELECT: miembros del grupo o templates globales |

---

## 05 — Design System

### Filosofía — Soft Minimalism

El diseño se apoya en "Tonal Layering" y espacio negativo, no en bordes duros. La interfaz debe sentirse como una invitación, no como un formulario.

> **Regla clave:** no usar bordes de 1px sólidos para separar contenido — usar cambios de fondo y espacio negativo.

### Superficies — jerarquía de capas

| Token | Valor hex | Uso |
|---|---|---|
| `surface` (base) | `#fcf9f8` | El "mantel" — fondo base de la app |
| `surface_container_low` | `#f6f3f2` | Áreas de agrupación de contenido |
| `surface_container_lowest` | `#ffffff` | Cards accionables — los "platos". Mayor contraste. |
| `primary_container` | `#2563eb` | CTAs de alta prioridad. Usar con moderación. |
| `primary` | `#004ac6` | Dirección — solo para elementos de navegación activa |
| `on_surface` | `#1c1b1b` | Texto principal de alta legibilidad |
| `secondary` | `#585f6c` | Texto secundario, detalles, metadatos |
| `outline_variant` | `#c3c6d7` @ 20% | Ghost Border — solo si accesibilidad lo requiere |

### Tipografía — DM Serif Display + DM Sans

- **Display** (`display-lg` a `display-sm`): títulos de cena o tema mensual. `letter-spacing: -0.02em`.
- **Headlines / Titles:** color `on_surface` (`#1c1b1b`). Alto contraste.
- **Body:** `body-md` para información general. `body-sm` + `secondary` (`#585f6c`) para detalles secundarios.
- **Labels:** siempre `uppercase` + `tracking +0.05em` para diferenciarse del body.

### Componentes clave

**Cards**
- Sin bordes. Usar `rounded-lg` (1rem).
- Hover: transición de `surface_container_lowest` a `surface_container_high`.
- Separar secciones internas con `spacing-6` de espacio blanco. Nunca usar `<hr>`.

**Buttons**
- Primary: gradiente de `primary` a `primary_container`. `rounded-full`.
- Secondary: `surface_container_high` de fondo + `on_secondary_container` de texto. Sin borde.
- Tertiary: texto puro con color `primary`. Sin caja.

**Status indicators**
- Confirmed: `tertiary` (`#006242`) sobre `tertiary_fixed` (`#6ffbbe`). Forma pill.
- Pending: `on_secondary_fixed_variant` sobre `secondary_fixed` (`#dce2f3`). Forma pill.
- Declined: `error` (`#ba1a1a`) sobre `error_container` (`#ffdad6`). Forma pill.

**Input fields**
- Fondo: `surface_container_low`. Sin borde en reposo.
- Focus: `2px solid primary`.
- Labels: `label-md`, 8px por encima del campo. Nunca como placeholder.

**Glassmorphism — nav flotante**
- `surface_container_lowest` al 80% de opacidad + `backdrop-blur: 12px`.
- Aplicar a: bottom navigation, sticky headers.

### Do's y Don'ts

| ✅ DO | ❌ DON'T |
|---|---|
| Usar asimetría — título `display-md` a la izquierda, fecha `label-md` a la derecha | Usar divisores (`<hr>`) — usar cambios tonales de fondo |
| Agregar 25% más de espacio del que parece suficiente | Bordes de alto contraste (negro / gris oscuro) |
| Mobile-first con sheets que suben desde abajo (glassmorphism), no modales centrados | Usar el azul `primary` para headers estáticos o elementos decorativos |

---

## 06 — Backlog MVP — Orden de desarrollo

21 User Stories ordenadas por dependencia técnica y journey del usuario. El código de cada US debe satisfacer todos los Acceptance Criteria Gherkin definidos en el backlog.

| # | ID | User Story | Épica | Esfuerzo | Estado |
|---|---|---|---|---|---|
| 1 | US-00 | Crear grupo | E00 Creación de grupo | M (3-4d) | ✅ Completada |
| 2 | US-00b | Generar link de invitación al crear el grupo | E00 Creación de grupo | S (1-2d) | ✅ Completada |
| 3 | US-00c | Configurar frecuencia y día al crear el grupo | E00 Creación de grupo | S (1-2d) | ✅ Completada |
| 4 | US-00d | Pantalla de confirmación post-creación de grupo | E00 Creación de grupo | S (1-2d) | ✅ Completada |
| 5 | US-01 | Registro con Google | E01 Acceso & Autenticación | S (1-2d) | ✅ Completada |
| 6 | US-02 | Login con Google | E01 Acceso & Autenticación | S (1-2d) | ✅ Completada |
| 7 | US-04 | Join por invitación | E01 Acceso & Autenticación | M (3-4d) | ✅ Completada |
| 8 | US-03 | Cerrar sesión | E01 Acceso & Autenticación | XS (<1d) | ✅ Completada |
| 9 | US-11 | Ver organizador del mes | E03 Turno rotativo | S (1-2d) | ✅ Completada |
| 10 | US-05 | Crear evento del mes | E02 Panel de evento | S (1-2d) | ✅ Completada |
| 11 | US-06 | Notificar al grupo | E02 Panel de evento | M (3-4d) | ✅ Completada |
| 12 | US-07 | Ver estado del evento en tiempo real | E02 Panel de evento | S (1-2d) | ✅ Completada |
| 13 | US-08 | Recibir notificación de convocatoria | E04 Confirmación | M (3-4d) | ✅ Completada |
| 14 | US-09 | Confirmar asistencia | E04 Confirmación | S (1-2d) | ✅ Completada |
| 15 | US-10 | Ver resumen de confirmaciones | E04 Confirmación | S (1-2d) | ✅ Completada |
| 16 | US-17 | Abrir votación de restaurantes | E06 Votación | M (3-4d) | ✅ Completada |
| 17 | US-18 | Votar por un restaurante | E06 Votación | S (1-2d) | ✅ Completada |
| 18 | US-14 | Cargar restaurante al cerrar evento | E05 Historial | S (1-2d) | ✅ Completada |
| 19 | US-16 | Consultar historial de restaurantes | E05 Historial | S (1-2d) | ✅ Completada |
| 20 | US-13 | Próximo organizador tras el cierre | E03 Turno rotativo | M (3-4d) | ✅ Completada |
| 21 | US-20 | Acceder al checklist del mes | E07 Checklist | M (3-4d) | ✅ Completada |

---

## 07 — Convenciones de desarrollo

### Estructura de archivos — Next.js 14 App Router

```
monthly-dinner/
├── app/
│   ├── (auth)/          → login, register, join, confirmación post-creación
│   │   └── grupo-creado/ → confirmación post-creación de grupo (US-00d)
│   ├── (dashboard)/     → panel principal autenticado
│   │   ├── events/      → panel de evento mensual
│   │   ├── poll/        → votación de restaurantes
│   │   ├── history/     → historial de cenas
│   │   └── checklist/   → checklist del organizador
│   ├── api/             → route handlers (server actions)
│   └── layout.tsx       → root layout
├── components/
│   ├── ui/              → shadcn components
│   └── [feature]/       → componentes por feature
├── lib/
│   ├── supabase/        → client, server, middleware
│   └── utils/           → helpers compartidos
└── types/               → tipos TypeScript del schema
```

### Reglas de código

- TypeScript estricto en todo el proyecto.
- Server Components por defecto. `"use client"` solo cuando sea estrictamente necesario.
- Queries a Supabase siempre desde Server Components o Server Actions — nunca desde el cliente.
- Validar `auth.uid()` en cada server action antes de cualquier operación de escritura.
- Usar el cliente de Supabase correcto: `createServerClient` en server, `createBrowserClient` en client.
- Los estados de `attendances` son exactamente: `va` / `no_va` / `tal_vez` — no usar otros valores.
- El rol de `members` es exactamente: `member` / `admin` — no usar otros valores.
- Toda tabla nueva debe tener RLS habilitado antes de ser usada en producción.

### Patrones de queries Supabase

```ts
// ✅ Siempre usar .select() con campos explícitos — nunca select(*) en producción
const { data } = await supabase.from('events').select('id, event_date, place, organizer_id')

// ✅ Tiempo real: usar supabase.channel() con filter por event_id o group_id
supabase.channel('confirmations').on('postgres_changes', { filter: `event_id=eq.${id}` }, handler)

// ✅ Auth: verificar sesión con getUser() del servidor, no getSession() del cliente
const { data: { user } } = await supabase.auth.getUser()
```

### Manejo de errores

- Mostrar estados de error inline dentro del componente, no en alerts del navegador.
- Estados vacíos siempre con mensaje descriptivo — ver US-07 (`"La cena de este mes aún no fue convocada"`).
- Los formularios no se limpian ante un error — el usuario no pierde su input.

---

## 08 — Instrucciones para el agente de IA

> **Leer este archivo completo antes de generar cualquier código.** Cada US tiene Acceptance Criteria en Gherkin en el backlog — el código debe satisfacer todos los escenarios. Ante cualquier duda sobre comportamiento esperado, consultar el CA del backlog antes de inferir.

### Al implementar una US

1. Identificar la US por su ID (ej: `US-09`) y leer sus CA completos en el backlog.
2. Verificar las tablas de Supabase involucradas en la sección 04 de este documento.
3. Confirmar que las políticas RLS cubren las operaciones que vas a realizar.
4. Usar componentes de `shadcn/ui` + Tailwind CSS siguiendo el design system de la sección 05.
5. Generar primero la lógica de backend (server action + query Supabase), luego el componente.
6. Verificar que todos los escenarios Gherkin del CA quedan cubiertos antes de cerrar la tarea.

### Lo que nunca hay que hacer

- No crear tablas o columnas sin actualizar la documentación de base de datos.
- No escribir queries que accedan a datos fuera del grupo del usuario autenticado.
- No hardcodear IDs de grupos, usuarios ni eventos.
- No usar bordes de 1px sólidos en componentes UI — ver Design System sección 05.
- No usar `select(*)` de Supabase en componentes de producción.
- No marcar una US como completa si algún escenario Gherkin no está cubierto.

---

## Roadmap — contexto de fases

| 🟢 Fase 1 — MVP | 🟡 Fase 2 — Consolidación | 🔵 Fase 3 — Evolución |
|---|---|---|
| Creación de grupo e invitación | Registro automático de turno al cierre | Perfil con estadísticas de asistencia |
| Panel de evento mensual | Cierre automático de votación | Racha activa y comparativa grupal |
| Confirmación de asistencia | Checklist interactivo integrado | Puntuación de restaurantes |
| Turno rotativo (visualización) | Notificaciones automáticas | Onboarding de nuevos miembros |
| Historial de restaurantes | Auth con Google OAuth | |
| Votación de restaurantes | | |
| Checklist del organizador | | |

---

*Este documento se actualiza cada vez que se completa una US, se agrega una tabla a Supabase o cambia el diseño de una sección. Versión: Marzo 2026.*