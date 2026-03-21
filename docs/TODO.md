# Mejoras pendientes

- **Soporte i18n completo** — Impacto: alto · Esfuerzo: M. `auth.json` ya sirve como base, pero falta resolver locale negotiation y carga por idioma.
- **Refresh automático de `invite_tokens` expirados** — Impacto: medio · Esfuerzo: S. Permitirá renovar invitaciones sin salir del flujo.
- **Rate limiting en la validación de tokens** — Impacto: alto · Esfuerzo: M. Reduce abuso por enumeración de invites y protege el endpoint/callback.
