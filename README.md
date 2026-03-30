# monthly-dinner

App web mobile-first para grupos de amigos que se reúnen a cenar regularmente. Reemplaza la coordinación por WhatsApp con un panel centralizado que gestiona eventos mensuales, confirmaciones de asistencia, turno rotativo, votación de restaurantes e historial de cenas.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 App Router |
| UI | shadcn/ui + Tailwind CSS |
| Base de datos + Auth | Supabase (Postgres + Google OAuth) |
| Deploy | Vercel |
| Repo | GitHub |
| IA | Claude |

---

## Cómo arrancar

```bash
# 1. Clonar el repo
git clone https://github.com/monthly-dinner/monthly-dinner.git
cd monthly-dinner

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Completar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
# desde el panel de Supabase → Settings → API

# 4. Ejecutar el schema en Supabase
# Abrir Supabase → SQL Editor → pegar y ejecutar docs/domain/schema.sql

# 5. Correr en desarrollo
npm run dev