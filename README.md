# monthly-dinner

## Autenticación

La app usa Google OAuth mediante Supabase Auth. El botón **Ingresar con Google** invoca `supabase.auth.signInWithOAuth`, redirige al usuario a Google y vuelve a `/auth/callback` para validar la sesión en el navegador. El frontend no inserta filas en `public.profiles`; esa responsabilidad sigue en el trigger `on_auth_user_created` configurado en Supabase.

### Flujo de login

1. La pantalla de inicio recibe opcionalmente `?next=` cuando el usuario intentó abrir una ruta protegida.
2. El botón de Google envía ese destino al callback OAuth para restaurar el contexto después del intercambio.
3. En `/auth/callback`, la app confirma que Supabase dejó una sesión activa y que `public.profiles` ya existe para `auth.users.id`.
4. Si todo sale bien, el usuario entra al `/dashboard`. Para compatibilidad con US-01, los callbacks antiguos que no mandan `next` aún pueden resolver a `/groups`, que hoy redirige al dashboard.

### Persistencia de sesión y expiración

- Si la sesión de Supabase sigue vigente en el dispositivo, `middleware.ts` redirige automáticamente desde `/` al panel y evita pedir un nuevo login.
- Las rutas protegidas son `/dashboard` y el alias histórico `/groups`.
- Si el token expiró o ya no puede resolverse un usuario válido, `middleware.ts` redirige a `/?next=<ruta original>` para que el contexto de navegación previo no se pierda.
- Si el usuario cancela el consentimiento en Google, vuelve a `/` sin mostrar un error crítico ni crear una sesión nueva.

## Variables de entorno

Definí las siguientes variables en `.env.local` y sin valores reales en `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Desarrollo

```bash
npm install
npm run test
npm run build
```
