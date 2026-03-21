# Estructura del proyecto

## Ruta creada para E02

- `app/(dashboard)/events/page.tsx`: panel mensual E02 creado desde el prototipo `e02-panel-evento.jsx` e integrado al App Router.
- `app/(dashboard)/layout.tsx`: protección básica SSR para las rutas del route group `(dashboard)` que todavía no cubre el matcher del middleware.
- `tests/e02-events.test.tsx`: suite específica del panel E02.

## Componentes de `app/(dashboard)/events/page.tsx`

- `EventsPage`: componente raíz; maneja navegación entre pantallas y estado local del prototipo.
- `SinEvento`: estado vacío cuando todavía no hay convocatoria.
- `CrearEvento`: formulario con validación obligatoria de fecha.
- `EventoExistente`: aviso de duplicado mensual con CTA para ver o editar.
- `PanelOrganizador`: vista completa del organizador con resumen, notificación y compartir.
- `PanelMiembro`: vista del miembro con confirmación de asistencia.
- `Notificando`: estado de carga durante el envío de convocatoria.
- `NotifOk`: confirmación final del flujo de publicación/guardado.
- `Renotif`: decisión de guardar o guardar y notificar tras cambios.
- `EditEvento`: edición posterior del evento.

## Componentes compartidos del archivo

- `OrgHeader`: contexto del grupo y rol.
- `InfoRow`: fila icono + label + valor.
- `EventoCard`: resumen principal del evento.
- `ConfirmBar`: barra de progreso de confirmaciones.
- `Stat`: contador por categoría.
- `ConfirmRow`: fila individual de asistencia.
