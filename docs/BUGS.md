# Bugs detectados

## US-01 · Registro con Google

- No fue posible verificar desde este entorno el trigger `on_auth_user_created`, la configuración del provider de Google ni las URLs de callback en Supabase/Google Cloud porque requieren acceso al panel externo del proyecto.
- El repositorio no traía scaffold de Next.js ni configuración de pruebas previa, por lo que se creó una base mínima de aplicación para materializar la primera US.
- Las pruebas automatizadas cubren redirecciones y comportamiento del callback/middleware con mocks. La validación extremo a extremo contra Supabase queda pendiente para la preview de Vercel.
