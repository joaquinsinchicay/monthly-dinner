# Structure

```text
app/
  (auth)/
    join/
      [token]/page.tsx      # resolución de invitaciones por token
      page.tsx              # estado vacío para enlaces incompletos
    login/
      actions.ts            # server action para iniciar OAuth con Google
      page.tsx              # pantalla de acceso
    register/page.tsx       # variante de acceso para registro
  dashboard/
    checklist/page.tsx      # placeholder del checklist
    events/page.tsx         # placeholder de eventos
    history/page.tsx        # placeholder de historial
    layout.tsx              # shell autenticada + sign out + bottom nav
    page.tsx                # panel principal
    poll/page.tsx           # placeholder de votación
  api/auth/callback/route.ts# callback OAuth de Supabase
  globals.css               # tokens CSS + Tailwind base
  layout.tsx                # layout raíz
  page.tsx                  # redirección inicial según sesión
components/
  auth/                     # login card, CTA OAuth y cierre de sesión
  checklist/                # placeholders de checklist
  event/                    # placeholders de evento
  history/                  # placeholders de historial
  poll/                     # placeholders de votación
  shared/                   # bottom navigation glassmorphism
  ui/                       # primitives estilo shadcn
lib/
  invitations.ts            # helpers de expiración de invitaciones
  auth.ts                   # ensureProfile, OAuth, cookie temporal de invitación
  supabase/                 # clientes server/browser/middleware
  utils/index.ts            # utilidades comunes
types/
  database.ts               # contrato TypeScript del schema Supabase
  index.ts                  # re-export de tipos
 db/schema.sql              # DDL completo, índices y políticas RLS
 docs/                      # arquitectura, estructura, bugs, pendientes
 tests/
  e2e/auth.spec.ts          # smoke test Playwright
  unit/invitations.test.ts  # test de helper de invitaciones
```
