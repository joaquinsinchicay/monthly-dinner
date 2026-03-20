# monthly-dinner

Base del MVP de **Monthly Dinner (Cenas del Jueves)** construida con Next.js 14 App Router, Supabase Auth y Postgres. Esta primera entrega implementa el registro/login con Google OAuth y deja preparado el modelo de datos para grupos, membresías e eventos.

## Variables de entorno

Crear `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Setup local

```bash
npm install
npm run test
npm run dev
```

## Migraciones de Supabase

Aplicar el DDL de `supabase/migrations/001_initial_schema.sql` en tu proyecto Supabase. Si usás Supabase CLI, podés ejecutar el flujo habitual de migraciones apuntando a tu entorno local o remoto.

## Configurar Google OAuth en Supabase

1. Ir a **Authentication → Providers → Google**.
2. Habilitar el proveedor.
3. Cargar **Client ID** y **Client Secret** de Google Cloud.
4. Registrar la URL de callback de Supabase indicada en ese panel.
5. Verificar que la app use la URL pública correcta para redirigir a `/auth/callback`.

## Desarrollo

```bash
npm run dev
```
