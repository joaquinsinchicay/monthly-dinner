# CHANGELOG
## monthly-dinner

Registro de implementación del MVP — ordenado por fecha de merge a `main`.

> **Para agentes de IA:** leer este archivo antes de implementar cualquier US.
> Indica qué está implementado, qué está en progreso y qué está pendiente.
> No regenerar ni sobreescribir código de US marcadas como `✅ Done`.

---

## Estado actual del MVP

| Total US | Done | In Progress | Pendiente |
|---|---|---|---|
| 19 | 1 | 0 | 18 |

---

## [0.1.0] — 2026-03-23

### Added
- **US-00** Crear grupo — `app/(auth)/crear-grupo/page.tsx`, `components/group/CreateGroupForm.tsx`, `lib/actions/groups.ts`

  Todos los escenarios Gherkin cubiertos:
  - ✅ Creación exitosa → INSERT a `groups`, trigger asigna admin en `members`, redirect a `/dashboard`
  - ✅ Nombre obligatorio → validación server-side, error inline, formulario no se limpia
  - ✅ Nombre duplicado mismo usuario → query `ilike` + mensaje con sugerencia
  - ✅ Visibilidad → RLS `groups: select members` garantiza aislamiento por grupo

---

## [Unreleased] — En desarrollo

### Pendiente de implementación

| # | ID | User Story | Épica | Esfuerzo | Estado |
|---|---|---|---|---|---|
| 1 | US-00 | Crear grupo | E00 Creación de grupo | M (3-4d) | ✅ Done |
| 2 | US-00b | Generar link de invitación al crear el grupo | E00 Creación de grupo | S (1-2d) | ⬜ Pendiente |
| 2 | US-00b | Generar link de invitación al crear el grupo | E00 Creación de grupo | S (1-2d) | ⬜ Pendiente |
| 3 | US-01 | Registro con Google | E01 Acceso & Autenticación | S (1-2d) | ⬜ Pendiente |
| 4 | US-02 | Login con Google | E01 Acceso & Autenticación | S (1-2d) | ⬜ Pendiente |
| 5 | US-04 | Join por invitación | E01 Acceso & Autenticación | M (3-4d) | ⬜ Pendiente |
| 6 | US-03 | Cerrar sesión | E01 Acceso & Autenticación | XS (<1d) | ⬜ Pendiente |
| 7 | US-11 | Ver organizador del mes | E03 Turno rotativo | S (1-2d) | ⬜ Pendiente |
| 8 | US-05 | Crear evento del mes | E02 Panel de evento | S (1-2d) | ⬜ Pendiente |
| 9 | US-06 | Notificar al grupo | E02 Panel de evento | M (3-4d) | ⬜ Pendiente |
| 10 | US-07 | Ver estado del evento en tiempo real | E02 Panel de evento | S (1-2d) | ⬜ Pendiente |
| 11 | US-08 | Recibir notificación de convocatoria | E04 Confirmación | M (3-4d) | ⬜ Pendiente |
| 12 | US-09 | Confirmar asistencia | E04 Confirmación | S (1-2d) | ⬜ Pendiente |
| 13 | US-10 | Ver resumen de confirmaciones | E04 Confirmación | S (1-2d) | ⬜ Pendiente |
| 14 | US-17 | Abrir votación de restaurantes | E06 Votación | M (3-4d) | ⬜ Pendiente |
| 15 | US-18 | Votar por un restaurante | E06 Votación | S (1-2d) | ⬜ Pendiente |
| 16 | US-14 | Cargar restaurante al cerrar evento | E05 Historial | S (1-2d) | ⬜ Pendiente |
| 17 | US-16 | Consultar historial de restaurantes | E05 Historial | S (1-2d) | ⬜ Pendiente |
| 18 | US-13 | Próximo organizador tras el cierre | E03 Turno rotativo | M (3-4d) | ⬜ Pendiente |
| 19 | US-20 | Acceder al checklist del mes | E07 Checklist | M (3-4d) | ⬜ Pendiente |

---

## Cómo actualizar este archivo

Al completar una US, moverla al bloque de la versión correspondiente con el formato:

```markdown
## [0.1.0] — YYYY-MM-DD

### Added
- **US-00** Crear grupo — `app/(auth)/create-group/`, `lib/supabase/groups.ts`
- **US-00b** Generar link de invitación — `app/(auth)/create-group/`, `lib/supabase/invitation-links.ts`
```

### Estados válidos

| Emoji | Estado | Significado |
|---|---|---|
| ⬜ | Pendiente | No iniciada |
| 🔄 | In Progress | En desarrollo en rama activa |
| ✅ | Done | Mergeada a `main`, todos los CA Gherkin cubiertos |
| 🚫 | Blocked | Se intentó implementar fuera de orden — su dependencia directa no está `✅ Done` |

### Reglas para agentes de IA

- Implementar siempre siguiendo el orden numérico de la tabla — no saltar US.
- La próxima US a implementar es siempre la primera `⬜ Pendiente` de la tabla, en orden.
- Una US es `✅ Done` **solo si todos sus escenarios Gherkin están cubiertos** — no solo el happy path.
- Al iniciar una US, cambiar su estado a `🔄 In Progress` en este archivo.
- Al completar una US, moverla al bloque de versión con fecha y archivos modificados.
- Marcar una US como `🚫 Blocked` solo si se detecta que su dependencia directa no está `✅ Done` y no es posible continuar — no como estado preventivo.

---

## Formato de versiones

El proyecto sigue [Semantic Versioning](https://semver.org/):

- `0.x.0` — iteraciones del MVP (cada épica completa sube el minor)
- `0.0.x` — fixes y ajustes dentro de una épica
- `1.0.0` — MVP completo con las 19 US en producción

---

*monthly-dinner · MVP v1.0 · Marzo 2026*