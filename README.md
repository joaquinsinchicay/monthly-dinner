# monthly-dinner

## Autenticación

La app usa Google OAuth mediante Supabase Auth. El botón **Ingresar con Google** invoca `supabase.auth.signInWithOAuth`, redirige al usuario a Google y vuelve a `\/auth\/callback` para intercambiar el código por una sesión. El frontend no inserta filas en `public.profiles`; esa responsabilidad sigue en el trigger `on_auth_user_created` configurado en Supabase.

Durante el callback, la app valida que el trigger haya creado la fila en `public.profiles`. Si el perfil existe, redirige al usuario a `\/groups`. Si el usuario cancela el consentimiento en Google, vuelve a la pantalla inicial sin mostrar un error crítico. Si el intercambio OAuth falla o el perfil no aparece, la UI muestra un mensaje claro y un botón para reintentar.

## Variables de entorno

Definí las siguientes variables en `.env.local` y sin valores reales en `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 

## Desarrollo

```bash
npm install
npm run test
npm run build
```
