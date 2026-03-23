# WORKFLOW.md
## monthly-dinner — Flujo de trabajo por User Story

Instrucciones para Claude Code. Copiar y pegar al inicio de cada sesión.

---

## BLOQUE DE INICIO DE SESIÓN

Pegar esto cada vez que abrís Claude Code en una sesión nueva:

```
Antes de escribir cualquier código, leé en este orden toda la documentación del proyecto:

1. AGENTS.md — contexto completo, stack, convenciones y reglas
2. docs/architecture/schema.sql — schema validado de Supabase con todas las tablas
3. docs/architecture/domain-model.md — entidades, atributos y relaciones
4. docs/architecture/dependencies.md — dependencias entre US y orden de implementación
5. docs/architecture/roles-permissions.md — matriz de permisos por rol
6. docs/architecture/state-machine.md — estados y transiciones de cada entidad
7. docs/architecture/technical-decisions.md — decisiones técnicas del MVP
8. docs/design/design-system.md — tokens, tipografía, componentes y filosofía visual
9. docs/product/backlog_us_mvp.md — 19 User Stories con CA en Gherkin
10. types/index.ts — tipos TypeScript del schema
11. CHANGELOG.md — estado actual de implementación por US

Confirmá que leíste todos los archivos antes de continuar.
```

---

## BLOQUE DE ARRANQUE DE US

Pegar esto para iniciar el trabajo de una User Story nueva. Reemplazar XX y el nombre:

```
Vamos a implementar [US-XX — Nombre de la US].

1. Creá la branch feature/US-XX-nombre-us desde main
2. Leé los CA Gherkin de esta US en docs/product/backlog_us_mvp.md
3. Verificá las tablas de Supabase involucradas en docs/architecture/schema.sql
4. Confirmá que las políticas RLS cubren las operaciones necesarias
5. Implementá primero el backend: server action + query Supabase siguiendo api-contracts.md si existe el contrato
6. Después implementá el componente de frontend usando shadcn/ui + Tailwind siguiendo docs/design/design-system.md
7. Hacé commit por cada archivo completado con mensaje descriptivo
8. Al terminar, verificá que todos los escenarios Gherkin están cubiertos
9. Actualizá CHANGELOG.md con el estado de la US
```

---

## BLOQUE DE CIERRE DE US

Pegar esto antes de cerrar la sesión:

```
Antes de terminar:

1. Verificá que todos los CA Gherkin de la US están cubiertos
2. Actualizá CHANGELOG.md marcando la US como completa
3. Hacé commit final con mensaje: "feat(US-XX): implementación completa — todos los CA cubiertos"
4. Confirmame qué archivos fueron creados o modificados
5. Indicame si encontraste algo que no estaba documentado o que requiere atención
```

---

## ORDEN DE IMPLEMENTACIÓN MVP

| # | ID | User Story | Épica | Esfuerzo |
|---|---|---|---|---|
| 1 | US-00 | Crear grupo | E00 Creación de grupo | M |
| 2 | US-00b | Generar link de invitación | E00 Creación de grupo | S |
| 3 | US-01 | Registro con Google | E01 Autenticación | S |
| 4 | US-02 | Login con Google | E01 Autenticación | S |
| 5 | US-04 | Join por invitación | E01 Autenticación | M |
| 6 | US-03 | Cerrar sesión | E01 Autenticación | XS |
| 7 | US-11 | Ver organizador del mes | E03 Turno rotativo | S |
| 8 | US-05 | Crear evento del mes | E02 Panel de evento | S |
| 9 | US-06 | Notificar al grupo | E02 Panel de evento | M |
| 10 | US-07 | Ver estado del evento en tiempo real | E02 Panel de evento | S |
| 11 | US-08 | Recibir notificación de convocatoria | E04 Confirmación | M |
| 12 | US-09 | Confirmar asistencia | E04 Confirmación | S |
| 13 | US-10 | Ver resumen de confirmaciones | E04 Confirmación | S |
| 14 | US-17 | Abrir votación de restaurantes | E06 Votación | M |
| 15 | US-18 | Votar por un restaurante | E06 Votación | S |
| 16 | US-14 | Cargar restaurante al cerrar evento | E05 Historial | S |
| 17 | US-16 | Consultar historial de restaurantes | E05 Historial | S |
| 18 | US-13 | Próximo organizador tras el cierre | E03 Turno rotativo | M |
| 19 | US-20 | Acceder al checklist del mes | E07 Checklist | M |

---

## CONVENCIONES DE BRANCHES

```
feature/US-00-crear-grupo
feature/US-00b-link-invitacion
feature/US-01-registro-google
feature/US-02-login-google
feature/US-03-cerrar-sesion
feature/US-04-join-invitacion
feature/US-05-crear-evento
feature/US-06-notificar-grupo
feature/US-07-estado-evento
feature/US-08-notificacion-convocatoria
feature/US-09-confirmar-asistencia
feature/US-10-resumen-confirmaciones
feature/US-11-organizador-mes
feature/US-13-proximo-organizador
feature/US-14-cargar-restaurante
feature/US-16-historial-restaurantes
feature/US-17-abrir-votacion
feature/US-18-votar-restaurante
feature/US-20-checklist-organizador
```

---

## REGLAS QUE CLAUDE CODE NUNCA DEBE ROMPER

```
- No crear tablas o columnas sin actualizar schema.sql y domain-model.md
- No escribir queries que accedan a datos fuera del grupo del usuario autenticado
- No hardcodear IDs de grupos, usuarios ni eventos
- No usar bordes de 1px sólidos en componentes UI
- No usar select(*) de Supabase en componentes de producción
- No marcar una US como completa si algún escenario Gherkin no está cubierto
- Validar auth.uid() en cada server action antes de cualquier operación de escritura
- Los estados de attendances son exactamente: va / no_va / tal_vez
- El rol de members es exactamente: member / admin
- Toda tabla nueva debe tener RLS habilitado antes de ser usada
```

---

*monthly-dinner · WORKFLOW · MVP v1.0 · Marzo 2026*
