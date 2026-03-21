# Bugs

## Limitaciones de entorno detectadas durante la implementación

- El registry npm respondió `403 Forbidden` al intentar instalar dependencias nuevas como Jest, Playwright y Tailwind. Por eso se dejaron configurados los scripts esperados y se añadieron runners de compatibilidad locales para validar las rutas críticas sin intervención manual.

## profiles.updated_at faltante en Supabase

- **Descripción:** el dashboard fallaba con el mensaje `column profiles.updated_at does not exist` al intentar leer el perfil autenticado.
- **Causa raíz:** el código ya esperaba la columna `updated_at` en `profiles`, pero la migración inicial de producción no la había creado.
- **Solución aplicada:** se documentó y versionó el `ALTER TABLE ... ADD COLUMN IF NOT EXISTS updated_at`, junto con la función `update_updated_at_column()` y el trigger `update_profiles_updated_at` para mantener el timestamp sincronizado.

## Hallazgo adicional durante E02

- El proyecto no incluía todavía una referencia local `e02-panel-evento.jsx`, así que la implementación visual se adaptó al design system documentado en `AGENTS.md` y a los primitives existentes de la app.

## Gap de onboarding detectado entre E01 y E02

- **Descripción:** el backlog MVP original no incluía la creación de grupo, por lo que usuarios nuevos autenticados quedaban sin camino para habilitar el dashboard y las historias de eventos.
- **Causa raíz:** se asumió que el grupo ya existía antes del primer login o que el usuario siempre entraría por invitación.
- **Solución aplicada:** se agregó US-21 entre E01 y E02 con onboarding explícito, pantalla de decisión y RPC atómica para crear `groups` y `members` sin estados inconsistentes.

