# Arquitectura del MVP

## E01 · Autenticación

El flujo de autenticación arranca en `/login`, dispara Google OAuth mediante Supabase, vuelve por `/auth/callback`, provisiona el perfil del usuario y finalmente redirige a `/dashboard` o a la ruta protegida preservada en el parámetro `redirect`.

## E02 · Panel de evento mensual

El módulo E02 vive en `app/(dashboard)/events/page.tsx` y cubre un panel de evento mensual único con dos roles principales:

- **Organizador:** crea el evento, lo edita, lo publica y comparte el resumen.
- **Miembro:** visualiza fecha/lugar/organizador y confirma asistencia en tiempo real.

### Flujo de navegación

```text
sin_evento --> crear_evento --> [guardar ok]   --> panel_organiz
                           --> [fecha vacia]   --> form_error (misma pantalla)
                           --> [ya existe]     --> evento_existente --> edit_evento

panel_organiz --> [notificar]      --> notificando --> notif_ok
              --> [editar]         --> edit_evento --> panel_organiz
              --> [cambiar lugar]  --> renotif     --> notif_ok

panel_miembro: actualizacion automatica via useEffect (stub de Realtime)
```

### ADR inline · separar `PanelOrganizador` y `PanelMiembro`

Se eligieron dos componentes distintos en lugar de un panel único con muchas condicionales porque las prioridades visuales y de interacción cambian por rol:

- el organizador necesita CTA de publicación, edición y resumen;
- el miembro necesita foco en confirmar asistencia rápidamente;
- separar responsabilidades reduce ramas condicionales y simplifica testing por escenario.

### Patrón de tiempo real

Hoy el archivo usa un `useEffect` con `setTimeout` para simular confirmaciones en desarrollo. En producción ese efecto debe reemplazarse por `supabase.channel('attendances-' + eventId)` con `postgres_changes` filtrado por `event_id`, para respetar RLS y evitar eventos cruzados entre grupos.
