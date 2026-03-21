# Arquitectura del flujo de autenticación

## Descripción general

El flujo de autenticación arranca en la landing `/login`, dispara Google OAuth mediante Supabase, vuelve por `/auth/callback`, provisiona el perfil del usuario y finalmente redirige a `/dashboard` o a la ruta protegida preservada en el parámetro `redirect`.

## Diagrama en texto plano

```text
/login
  └─ LoginCard (client)
      └─ supabase.auth.signInWithOAuth(provider=google, redirectTo=/auth/callback?redirect=...&invite=...)
          └─ Google OAuth popup / redirect
              └─ /auth/callback
                  ├─ exchangeCodeForSession(code)
                  ├─ upsert profiles
                  ├─ if invite token => validate invite_tokens + upsert group_members
                  └─ redirect /dashboard or original ?redirect=

/invite/[token]
  ├─ validate invite_tokens on server
  ├─ expired => InviteExpired
  ├─ already member => AlreadyMember
  └─ valid => InviteJoin (client) => Google OAuth

Any /dashboard or /group route
  └─ middleware.ts
      ├─ valid session => continue
      └─ missing/expired session => /login?redirect=<original>

Any authenticated screen
  └─ LogoutButton
      ├─ open bottom sheet
      ├─ confirm => supabase.auth.signOut()
      ├─ clear session/local storage
      └─ redirect /login
```

## Decisión: textos en JSON

Se centralizan los textos en `public/locales/auth.json` para desacoplar copy y lógica. Esto reduce riesgo en cambios de producto, facilita QA de contenido, prepara la base para i18n y evita que el equipo tenga que tocar JSX para cambios editoriales.

## Decisión: middleware para proteger rutas

`middleware.ts` concentra la validación de sesión en el borde de la aplicación. Eso evita duplicar checks en cada página protegida, garantiza consistencia para expiración de token y permite preservar automáticamente el contexto de navegación con `?redirect=`.

## Integración Supabase Auth

El `redirect_url` de OAuth se arma en `buildOAuthRedirectUrl()`. Siempre apunta a `/auth/callback` y agrega:

- `redirect`: destino seguro interno luego del login.
- `invite`: token opcional para completar el join al grupo dentro del callback.

En Supabase debe registrarse el callback de la app, por ejemplo:

```text
https://tu-dominio.com/auth/callback
http://localhost:3000/auth/callback
```
