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
| IA | Claude + V0 |

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
# Abrir Supabase → SQL Editor → pegar y ejecutar docs/architecture/schema.sql

# 5. Correr en desarrollo
npm run dev
```

La app queda disponible en `http://localhost:3000`.

---

## Estructura del repo

```
docs/
├── architecture/
│   ├── schema.sql              → Schema SQL completo con RLS — ejecutar en Supabase
│   ├── domain-model.md         → Entidades, atributos y relaciones
│   ├── dependencies.md         → Dependencias entre US y orden de implementación
│   ├── roles-permissions.md    → Matriz de permisos por rol
│   ├── state-machine.md        → Estados y transiciones de cada entidad
│   └── technical-decisions.md  → Decisiones técnicas del MVP
├── design/
│   └── design-system.md        → Tokens, tipografía, componentes y filosofía visual
└── product/
    ├── backlog_us_mvp.md        → 19 User Stories con CA en Gherkin
    └── casestudy_monthly_dinner.md → Contexto, hipótesis, journey y roadmap
AGENTS.md                       → Contexto completo para agentes de IA — leer primero
CHANGELOG.md                    → Estado de implementación por US
README.md                       → Este archivo
```

> **Para agentes de IA:** leer `AGENTS.md` antes de generar cualquier código. Contiene el schema, RLS, design system, backlog y convenciones en un solo archivo.

---

## Estado del MVP

19 User Stories · 7 épicas · 0 mergeadas a `main`.

Ver estado detallado por US → [`CHANGELOG.md`](./CHANGELOG.md)

---

*monthly-dinner · MVP v1.0 · Marzo 2026*