# Changelog

## 2026-03-21

- [Added] `app/(dashboard)/events/page.tsx` — Panel de evento mensual (E02).
- [Added] Pantallas E02: `sin_evento`, `crear_evento`, `panel_organiz`, `panel_miembro`, `notificando`, `notif_ok`, `renotif`, `edit_evento`, `form_error`, `evento_existente`.
- [Added] Tokens de color `tertiaryContainer`, `warningContainer`, `onSecondaryFixed`.
- [Added] Stubs documentados para integración con Supabase en E02.
- [Changed] Refactor flujo E01 de prototipo React a Next.js 14 App Router con Supabase OAuth.
- [Added] `public/locales/auth.json` con todos los textos estáticos del flujo de autenticación.
- [Added] `middleware.ts` para protección de rutas y manejo de sesión persistente.
- [Fixed] Alinear referencias de schema E01 al schema real de Supabase.
