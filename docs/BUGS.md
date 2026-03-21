# Bugs

## Limitaciones de entorno detectadas durante la implementación

- El registry npm respondió `403 Forbidden` al intentar instalar dependencias nuevas como Jest, Playwright y Tailwind. Por eso se dejaron configurados los scripts esperados y se añadieron runners de compatibilidad locales para validar las rutas críticas sin intervención manual.
