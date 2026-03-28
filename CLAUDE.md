# CLAUDE.md
## monthly-dinner

Contexto completo para desarrollo con IA — Claude

| Producto | Stack | Deploy | Estado |
|---|---|---|---|
| monthly-dinner | Next.js 14 + Supabase | monthly-dinner.vercel.app | MVP — En desarrollo |

---

## 01 — Propósito de este archivo

Leer este archivo completo antes de generar, editar o refactorizar código.

### Regla de precedencia documental
Si existe conflicto entre documentos, respetar este orden:

1. `CLAUDE.md`
2. `/docs/architecture/*`
3. `/docs/design/*`
4. `/docs/backlog/*`

### Principio operativo
- No asumir comportamientos no documentados.
- No inventar arquitectura nueva si ya existe una definida.
- No crear caminos alternativos de implementación si el proyecto ya tiene una convención establecida.
- Toda User Story debe satisfacer sus Acceptance Criteria en Gherkin antes de considerarse cerrada.

---

## 02 — El producto

`monthly-dinner` es una app web mobile-first para grupos de amigos que se reúnen a cenar regularmente. Reemplaza la coordinación desordenada de WhatsApp por un sistema centralizado para gestionar:

- creación y seguimiento del evento del mes
- confirmaciones de asistencia
- rotación del organizador
- votación de restaurantes
- historial de cenas
- checklist operativo del mes

### Usuarios

- **Admin del grupo:** crea el grupo, genera links de invitación, gestiona roles, configuración y rotación.
- **Organizador del mes:** crea y gestiona el evento, abre votaciones, administra checklist y cierra el ciclo del mes.
- **Miembro:** confirma asistencia, vota restaurantes, consulta historial y seguimiento del grupo.
- **Guest:** miembro sin cuenta, agregado por admin para contemplar invitados o participantes externos.


### Problema que resuelve

- Confirmaciones de asistencia perdidas en el chat de WhatsApp.
- Turno rotativo sin registro formal — siempre organiza la misma persona.
- Sin historial de restaurantes visitados — el grupo repite lugares sin querer.
- El organizador carga solo con toda la coordinación, generando desgaste mensual.

---

## 03 — Stack tecnológico

> **Restricciones no negociables:** Sin DevOps · IA-first. Todo el stack fue elegido porque Claude lo conoce profundamente y lo genera bien.

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | Next.js 14 App Router | Framework principal. SSR, routing, layouts y estructura file-based. |
| UI / Design | shadcn/ui + Tailwind CSS | Sistema visual reusable, consistente y bien soportado por Claude y V0. |
| Base de datos | Supabase (Postgres) | Auth, Postgres, RLS y API sobre un stack simple de operar. |
| Auth | Google OAuth (Supabase) | Sin password flows complejos. |
| Deploy | Vercel + GitHub | Deploy automático, previews por push/PR. |
| IA código | Claude + Codex | Backend, reglas, SQL, refactors, documentación. |
| IA frontend | V0 | Componentes React/Next.js alineados a shadcn/ui. |

### Principios de stack
- No agregar frameworks alternativos salvo necesidad técnica real.
- No introducir Redux, Zustand u otras capas globales pesadas en MVP sin justificación clara.
- No agregar librerías de formularios, validación o fetching si la solución nativa existente ya cubre el caso correctamente.

---

## 04 — Arquitectura oficial del proyecto

La arquitectura oficial del proyecto se basa en separación por capas y modularidad por feature.

### Capas
- `app/` → rutas, layouts, carga de datos server-side y composición de pantallas
- `features/` → lógica de negocio por dominio
- `components/ui/` → design system reusable sin conocimiento del dominio
- `components/layout/` → navegación y estructura global
- `components/shared/` → piezas compartidas transversales
- `lib/` → infraestructura, clientes, utilidades, constantes y recursos globales
- `types/` → contratos TypeScript globales
- `tests/` → tests unitarios, integración y E2E

### Regla crítica
La lógica de dominio vive en `features/*`.  
`app/*` no debe concentrar reglas de negocio ni queries complejas.  
`components/ui/*` no debe conocer entidades del negocio.

---

## 05 — Estructura de carpetas oficial


monthly-dinner/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   │   └── callback/
│   ├── (protected)/
│   │   ├── dashboard/
│   │   ├── groups/[groupId]/
│   │   │   ├── members/
│   │   │   ├── dinners/[dinnerId]/
│   │   │   ├── availability/
│   │   │   └── settings/
│   │   ├── invites/
│   │   ├── profile/
│   │   └── onboarding/
│   ├── api/
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
├── features/
│   ├── auth/
│   ├── profile/
│   ├── groups/
│   ├── members/
│   ├── invites/
│   ├── dinners/
│   ├── availability/
│   ├── notifications/
│   └── checklist/
├── lib/
│   ├── supabase/
│   ├── auth/
│   ├── utils/
│   ├── constants/
│   ├── validations/
│   └── texts.json
├── styles/
├── types/
├── tests/
├── middleware.ts
└── README.md

---

## 06 — Regla obligatoria de textos estáticos

### Fuente de verdad para textos UI

Todos los textos estáticos posibles deben centralizarse en:
lib/texts.json

Esto incluye:
- títulos de páginas
- subtítulos
- labels
- placeholders
- textos de botones
- empty states
- mensajes informativos no dinámicos
- mensajes de ayuda
- copys repetidos en distintas páginas o componentes

No hardcodear textos en:
- pages
- layouts
- feature components
- shared components
- components/ui

### Excepciones permitidas
Solo puede escribirse texto directo en el código cuando:
- el valor proviene del backend
- el mensaje depende de lógica transaccional o de dominio
- el texto se construye dinámicamente con variables
- el texto es estrictamente técnico y no reusable

### Regla de consumo
- importar desde lib/texts.json
- usar claves semánticas y estables
- no duplicar la misma frase bajo claves distintas
- si un texto se reutiliza en más de un lugar, debe vivir en texts.json

Ejemplo de convención:
{
  "common": {
    "save": "Guardar",
    "cancel": "Cancelar"
  },
  "dashboard": {
    "empty_title": "La cena de este mes aún no fue convocada",
    "empty_description": "Cuando el organizador publique el evento, lo verás acá."
  }
}

---

## 07 — Organización por feature

Cada módulo dentro de features/ debe mantener una estructura consistente.

### Estructura sugerida por feature
features/dinners/
├── components/
├── server/
├── client/
├── model/
└── index.ts

### Responsabilidad por subcarpeta
- components/ → UI del dominio
- server/ → server actions, loaders, queries, funciones protegidas
- client/ → hooks, handlers de interacción y comportamiento estrictamente cliente
- model/ → tipos, schemas, mappers, constants y DTOs del dominio
- index.ts → surface pública del módulo

### Regla

No exportar todo. Exponer solo lo necesario desde index.ts.

---

## 08 — Límites de importación

### Reglas de dependencia
- app/* puede importar desde features/*, components/*, lib/*, types/*
- features/* puede importar desde components/ui/*, components/shared/*, lib/*, types/*
- components/layout/* puede importar desde components/ui/*, components/shared/*, lib/*, types/*
- components/ui/* no puede importar desde features/*
- lib/* no puede depender de app/*
- types/* no puede depender de app/*, features/* ni components/*

### Regla crítica

No mezclar dominio con infraestructura visual.

---

## 09 — Base de datos — Supabase

> **RLS activo en todas las tablas.** Cada tabla tiene políticas específicas por operación. Aislamiento garantizado: un miembro del grupo A nunca puede ver datos del grupo B.

### Schema validado — 13 tablas

| Tabla               | US principal                          | Descripción                                              |
| ------------------- | ------------------------------------- | -------------------------------------------------------- |
| profiles            | US-01, US-02                          | Perfil del usuario autenticado. `id = auth.uid()`.       |
| groups              | US-00, US-00c                         | Grupos de cena. Incluye frecuencia y configuración base. |
| members             | US-00, US-01, US-04, US-21, US-NAV-01 | Membresía del grupo. Soporta guests.                     |
| invitation_links    | US-00b, US-04                         | Links de invitación administrados por admins.            |
| events              | US-05, US-06, US-07, US-07b           | Evento mensual del grupo.                                |
| attendances         | US-09, US-10, US-21                   | Confirmaciones de asistencia.                            |
| rotation            | US-11, US-13                          | Turno rotativo del grupo.                                |
| polls               | US-17, US-18                          | Votaciones del evento.                                   |
| poll_options        | US-17                                 | Opciones de votación.                                    |
| poll_votes          | US-18                                 | Votos emitidos por miembros.                             |
| restaurant_history  | US-14, US-16                          | Historial de restaurantes visitados.                     |
| checklist_items     | US-20                                 | Tareas del checklist del mes.                            |
| checklist_templates | US-20                                 | Templates reutilizables de checklist.                    |

### Valores de dominio que no pueden cambiar

- attendances.status = va | no_va | tal_vez
- members.role = member | admin

### Reglas globales de dominio

- Un usuario no puede ver datos de grupos de los que no forma parte.
- Solo admins pueden gestionar configuración estructural del grupo.
- Solo el organizador puede crear o editar el evento activo.
- Un miembro puede tener un solo voto activo por votación.
- Un evento cerrado no debe seguir aceptando mutaciones funcionales que contradigan el estado final.
- Las acciones permitidas por UI deben estar respaldadas por RLS y validación server-side.

## 10 - Políticas RLS - resumen

## Principios

- Nunca confiar solo en la UI.
- Toda acción sensible debe validarse server-side.
- Toda escritura debe verificar identidad y permisos antes de ejecutar mutaciones.
- No asumir que “si el botón no se ve” el acceso está resuelto.

### Política operativa

Antes de implementar una mutación:
- identificar tabla afectada
- revisar RLS existente
- confirmar que la policy cubre el caso
- validar auth.uid() en servidor
- ejecutar la mutación con el cliente correcto

### Casos mínimos a contemplar

- usuario válido del grupo
- usuario externo al grupo
- admin del grupo
- guest cuando aplique
- organizador cuando aplique

---

## 11 — Convenciones de acceso a datos
### Regla general

No hacer queries directas a Supabase desde componentes de UI.

### Dónde vive el acceso a datos
- lectura y escritura del dominio en features/*/server/*
- helpers compartidos de infraestructura en lib/supabase/*

### Patrones
- usar .select() con campos explícitos
- no usar select(*) en producción
- no duplicar queries similares entre features
- no hacer lógica de mapping en páginas si puede vivir en model/

### Auth
- usar getUser() del servidor
- no basar seguridad en getSession() del cliente

### Cliente correcto
- server → cliente server
- client → cliente browser solo cuando sea estrictamente necesario
- mutaciones sensibles → server actions o capa protegida del server

---

## 12 — Server Actions y Route Handlers

### Convención oficial
- Server Actions: opción por defecto para mutaciones del producto
- Route Handlers: solo cuando exista una necesidad real de interfaz HTTP explícita

### Usar Route Handlers solo para
- webhooks
- callbacks externos
- integraciones
- endpoints públicos o machine-to-machine
- casos donde una action no sea el fit correcto

### Regla

No duplicar lógica entre Server Actions y Route Handlers.

---

## 13 — Convenciones de código

### TypeScript
- estricto en todo el proyecto
- no introducir any salvo caso excepcional y justificado
- preferir tipos y DTOs claros por dominio

### React / Next
- Server Components por defecto
- "use client" solo cuando haga falta por interacción, estado local o APIs del navegador
- no convertir páginas enteras a client components si el problema se resuelve con composición

### Naming
- tablas y columnas: snake_case
- archivos utilitarios: kebab-case o snake_case según convención existente
- componentes React: PascalCase
- hooks: useSomething
- server actions: verbNounAction
- funciones de lectura: get*, list*, find*
- mappers: map*To*

### Formularios
- no limpiar inputs si hay error
- mostrar error inline
- usar loading state claro
- deshabilitar acción repetida mientras la mutación está en curso

## 14 — UI y Design System

El diseño debe seguir el sistema visual definido en /docs/design/*.

### Principios obligatorios
- mobile-first
- soft minimalism
- tonal layering
- jerarquía por color de superficie, espaciado y profundidad
- evitar rigidez visual tipo panel administrativo genérico

### Regla crítica de UI
No usar bordes sólidos de 1px para separar contenido.

### En su lugar usar
- cambios de fondo
- espacio negativo
- sombras suaves
- jerarquía tipográfica
- agrupación por superficie

### Reutilización
- todo componente visual genérico debe vivir en components/ui
- layout global en components/layout
- piezas compartidas cross-feature en components/shared

---

## 15 — Estados de interfaz obligatorios

Toda superficie importante debe contemplar:
- loading
- empty
- success
- error
- disabled cuando aplique
- submitting en formularios o mutaciones

### Reglas
- nunca dejar pantalla en blanco
- nunca depender solo de spinners
- preferir skeletons y empty states explícitos
- el copy de estos estados debe salir de lib/texts.json cuando sea estático

---

## 16 — Manejo de errores

### Errores técnicos
- loggear en servidor
- mostrar feedback útil en UI
- no exponer detalles sensibles al usuario final

### Errores de dominio

Deben resolverse en backend y reflejarse claramente en UI.

Ejemplos:
- no sos el organizador del mes
- ya existe una votación activa
- la votación ya cerró
- no pertenecés a este grupo
- el invitado ya fue agregado
- el evento ya fue cerrado

### Regla

No inferir permisos o reglas solo en el cliente.

---

## 17 — Testing
### Regla mínima

Toda US terminada debe dejar evidencia de validación.

### Prioridades de testing
1) lógica de dominio crítica
2) permisos y acceso
3) flujos principales del usuario
4) escenarios de aceptación Gherkin

### Niveles
- unit → funciones puras, mappers, validaciones
- integration → server actions, queries, flujos de dominio
- E2E → journeys principales del producto

### Casos que merecen E2E sí o sí
- login con Google
- join por invitación
- creación de grupo
- creación de evento
- confirmación de asistencia
- votación
- cierre de ciclo / siguiente organizador
- checklist del organizador
- navegación entre grupos

---

## 18 — Flujo de trabajo por User Story

Para cada US:
1) leer la US y sus Acceptance Criteria completos
2) revisar tablas y reglas afectadas
3) confirmar permisos y RLS
4) implementar backend primero
5) implementar UI conectada a la lógica real
6) conectar textos estáticos desde lib/texts.json
7) validar escenarios Gherkin
8) documentar cualquier cambio estructural necesario

### Regla

No cerrar una US si algún Scenario Gherkin no está cubierto.

---

## 19 — Lo que Claude debe hacer siempre
### Antes de codificar
- leer CLAUDE.md
- revisar /docs/architecture/*
- revisar backlog y design docs pertinentes
- identificar si el cambio afecta arquitectura, datos, diseño o textos

### Durante la implementación
- respetar la estructura por capas
- mantener la lógica en features/*
- centralizar textos estáticos en lib/texts.json
- no romper naming ni convenciones existentes
- no introducir deuda técnica evitable

### Después de implementar
- verificar que compile
- revisar que no haya imports rotos
- revisar que no haya texto hardcodeado innecesario
- revisar que no haya queries desde UI
- revisar que la UX contemple loading, empty y error states

---

## 20 — Lo que Claude nunca debe hacer
- no crear tablas o columnas sin documentarlo
- no inventar una arquitectura paralela
- no poner lógica de negocio pesada en app/*
- no hardcodear textos estáticos en pages o components si pueden vivir en lib/texts.json
- no usar select(*) en producción
- no exponer datos de un grupo a usuarios de otro
- no confiar solo en restricciones visuales para seguridad
- no mezclar componentes de dominio dentro de components/ui
- no agregar librerías nuevas sin justificación real
- no marcar una tarea como completa si falta cubrir parte del CA
- no cambiar naming de entidades ya existentes sin actualizar contratos y documentación
- no resolver rápido rompiendo la arquitectura

---

## 21 — Roadmap por fases

| 🟢 Fase 1 — MVP | 🟡 Fase 2 — Consolidación | 🔵 Fase 3 — Evolución |
|---|---|---|
| Creación de grupo e invitación | Registro automático de turno al cierre | Perfil con estadísticas de asistencia |
| Panel de evento mensual | Cierre automático de votación | Racha activa y comparativa grupal |
| Confirmación de asistencia | Checklist interactivo integrado | Puntuación de restaurantes |
| Turno rotativo | Notificaciones automáticas | Onboarding avanzado |
| Historial de restaurantes | Mejoras de automatización | Insights grupales |
| Votación de restaurantes | Hardening de UX y flujos | |
| Checklist del organizador | | |

---

## 22 — Mantenimiento de este archivo

Actualizar este documento cuando ocurra cualquiera de estos eventos:
- cambia la arquitectura
- cambia el schema o una policy RLS
- se agrega una nueva convención
- se modifica la estructura de carpetas
- se incorpora una nueva regla de texts/static copy
- se redefine el flujo de trabajo por US
- se agrega una nueva restricción de diseño o testing

### Regla final

Este archivo no es decorativo.
Es una guía operativa de implementación.
Si el código y este documento divergen, debe corregirse uno de los dos inmediatamente.

Versión: Marzo 2026

---