"use client";

import React, { useEffect, useMemo, useState } from 'react';

const t = {
  surface: '#f7f4ee',
  surfaceLow: '#efe7db',
  surfaceLowest: '#fffdf8',
  surfaceHigh: '#e6ded1',
  primary: '#6f4e37',
  primaryCont: '#c9975c',
  onSurface: '#241f18',
  secondary: '#6b7280',
  tertiary: '#266a4a',
  tertiaryFixed: '#c0ebd7',
  secondaryFixed: '#dbe7f6',
  error: '#ba1a1a',
  errorCont: '#ffdad6',
  outlineVar: '#8b8175',
  shadow: 'rgba(58, 45, 29, 0.12)',
  shadowMd: '0 18px 42px rgba(58, 45, 29, 0.16)',
  tertiaryContainer: '#d4f0e5',
  warningContainer: '#fff3cd',
  onSecondaryFixed: '#3d4663',
} as const;

const FONT = "'DM Serif Display', Georgia, serif";
const BODY = "'DM Sans', 'Helvetica Neue', sans-serif";

const css = `
:root {
  color-scheme: light;
}
body {
  margin: 0;
  font-family: ${BODY};
  background: linear-gradient(180deg, ${t.surfaceLowest} 0%, ${t.surface} 100%);
  color: ${t.onSurface};
}
.events-shell {
  min-height: 100vh;
  padding: 24px 16px 64px;
}
.events-wrap {
  width: min(100%, 420px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.events-card {
  border-radius: 20px;
  box-shadow: ${t.shadowMd};
  background: ${t.surfaceLowest};
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.scenario-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: ${t.surfaceLow};
  border-radius: 20px;
  box-shadow: ${t.shadowMd};
}
.scenario-chip {
  border: none;
  border-radius: 999px;
  padding: 8px 12px;
  background: ${t.surfaceHigh};
  color: ${t.onSurface};
  font-size: 12px;
  cursor: pointer;
}
.scenario-chip.active {
  background: ${t.secondaryFixed};
  color: ${t.onSecondaryFixed};
}
.header-row,
.row,
.stat-grid,
.cta-row,
.confirm-actions,
.confirm-row {
  display: flex;
  gap: 12px;
}
.header-row,
.confirm-row {
  align-items: center;
  justify-content: space-between;
}
.row {
  align-items: center;
}
.stack-sm { display: flex; flex-direction: column; gap: 8px; }
.stack-md { display: flex; flex-direction: column; gap: 12px; }
.stack-lg { display: flex; flex-direction: column; gap: 20px; }
.kicker {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  color: ${t.secondary};
}
.title {
  margin: 0;
  font-family: ${FONT};
  font-size: 30px;
  line-height: 1.05;
}
.subtitle, .body, .muted {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}
.muted { color: ${t.secondary}; }
.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
}
.pill.turno { background: ${t.secondaryFixed}; color: ${t.onSecondaryFixed}; }
.pill.publicado, .pill.va { background: ${t.tertiaryContainer}; color: ${t.tertiary}; }
.pill.no-va { background: ${t.errorCont}; color: ${t.error}; }
.pill.tal-vez { background: ${t.secondaryFixed}; color: ${t.secondary}; }
.pill.sin-respuesta { background: ${t.surfaceHigh}; color: ${t.outlineVar}; }
.pill.warning { background: ${t.warningContainer}; color: ${t.onSurface}; }
.btn-primary, .btn-secondary, .btn-ghost {
  border: none;
  border-radius: 999px;
  font: inherit;
  cursor: pointer;
}
.btn-primary {
  background: linear-gradient(135deg, ${t.primary} 0%, ${t.primaryCont} 100%);
  color: white;
  padding: 14px 18px;
  font-weight: 700;
}
.btn-secondary {
  background: ${t.surfaceHigh};
  color: ${t.onSurface};
  padding: 14px 18px;
  font-weight: 700;
}
.btn-ghost {
  background: transparent;
  color: ${t.secondary};
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.cta-row { flex-wrap: wrap; }
.field-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.input-field, .textarea-field {
  width: 100%;
  border: none;
  border-radius: 16px;
  background: ${t.surfaceLow};
  padding: 14px 16px;
  font: inherit;
  color: ${t.onSurface};
  box-sizing: border-box;
  outline: none;
  transition: box-shadow 0.2s ease;
}
.input-field:focus, .textarea-field:focus {
  box-shadow: 0 0 0 2px ${t.primaryCont};
}
.input-field.error, .textarea-field.error {
  box-shadow: 0 0 0 2px ${t.error};
}
.error-text {
  margin: 0;
  color: ${t.error};
  font-size: 12px;
  font-weight: 600;
}
.info-row {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 10px;
  align-items: start;
}
.info-icon {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: ${t.surfaceLow};
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.evento-card {
  border-radius: 20px;
  background: ${t.surface};
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.stat-grid {
  flex-wrap: wrap;
}
.stat-card {
  flex: 1 1 calc(50% - 6px);
  min-width: 120px;
  border-radius: 16px;
  background: ${t.surface};
  padding: 14px;
}
.stat-card strong {
  display: block;
  font-size: 24px;
  margin-top: 4px;
}
.confirm-bar-track {
  display: flex;
  overflow: hidden;
  height: 12px;
  border-radius: 999px;
  background: ${t.surfaceHigh};
}
.confirm-bar-segment {
  transition: width 0.35s ease;
}
.dot-live {
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: ${t.tertiary};
  flex: 0 0 8px;
}
.dot-live::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: ${t.tertiary};
  animation: ping 1.6s ease-out infinite;
}
@keyframes ping {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0.3; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.screen-enter { animation: slideUp 0.28s ease-out; }
.spinner {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 3px solid ${t.surfaceHigh};
  border-top-color: ${t.primary};
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
`; 

type ScreenName =
  | 'sin_evento'
  | 'crear_evento'
  | 'form_error'
  | 'evento_existente'
  | 'panel_miembro'
  | 'panel_organiz'
  | 'notificando'
  | 'notif_ok'
  | 'renotif'
  | 'edit_evento';

type AttendanceStatus = 'va' | 'no_va' | 'tal_vez' | 'sin_respuesta';

type Member = {
  id: string;
  name: string;
  avatar: string;
  role: 'member' | 'admin';
};

type Confirmation = {
  memberId: string;
  name: string;
  status: AttendanceStatus;
};

type EventDraft = {
  fecha: string;
  lugar: string;
  descripcion: string;
  organizer: string;
  status: 'pendiente' | 'publicado' | 'cerrado';
};

/**
 * @stub Datos de prueba. Reemplazar con:
 * const { data } = await supabase
 *   .from('members')
 *   .select('profiles(full_name, avatar_url)')
 *   .eq('group_id', groupId)
 */
const MEMBERS: Member[] = [
  { id: 'm1', name: 'Sofi Bianchi', avatar: 'SB', role: 'admin' },
  { id: 'm2', name: 'Mauro Díaz', avatar: 'MD', role: 'member' },
  { id: 'm3', name: 'Juli Castro', avatar: 'JC', role: 'member' },
  { id: 'm4', name: 'Clara Neri', avatar: 'CN', role: 'member' },
];

/**
 * @stub Datos de prueba. Reemplazar con:
 * const { data } = await supabase
 *   .from('attendances')
 *   .select('member_id, status, profiles(full_name)')
 *   .eq('event_id', eventId)
 * Los valores validos de status son exactamente: 'va' | 'no_va' | 'tal_vez'
 */
const CONFIRMATIONS_INIT: Confirmation[] = [
  { memberId: 'm1', name: 'Sofi Bianchi', status: 'va' },
  { memberId: 'm2', name: 'Mauro Díaz', status: 'tal_vez' },
  { memberId: 'm3', name: 'Juli Castro', status: 'sin_respuesta' },
  { memberId: 'm4', name: 'Clara Neri', status: 'sin_respuesta' },
];

const INITIAL_EVENT: EventDraft = {
  fecha: '2026-03-26',
  lugar: 'Cantina Palermo',
  descripcion: 'Reserva tentativa para las 21 hs.',
  organizer: 'Sofi Bianchi',
  status: 'pendiente',
};

const SCENARIOS: ScreenName[] = [
  'sin_evento',
  'crear_evento',
  'form_error',
  'evento_existente',
  'panel_miembro',
  'panel_organiz',
  'notificando',
  'notif_ok',
  'renotif',
  'edit_evento',
];

/**
 * @description Página E02 del panel de evento mensual con estados de creación, notificación y seguimiento en tiempo real.
 * @param {Object} props
 * @param {ScreenName} [props.initialScreen] - Pantalla inicial opcional para QA y testing.
 * @param {boolean} [props.initialIsOrganizer] - Indica si el usuario actual es organizador.
 */
export default function EventsPage() {
  return <EventsPageView />;
}

/**
 * @description Implementación cliente reutilizable del panel E02 para UI y testing.
 * @param {Object} props
 * @param {ScreenName} [props.initialScreen] - Pantalla inicial opcional para QA y testing.
 * @param {boolean} [props.initialIsOrganizer] - Indica si el usuario actual es organizador.
 */
function EventsPageView({
  initialScreen = 'sin_evento',
  initialIsOrganizer = true,
}: {
  initialScreen?: ScreenName;
  initialIsOrganizer?: boolean;
}) {
  // TODO: patron fragil — fuerza re-mount para disparar animaciones.
  // Reemplazar por cambio de clase CSS en mount sin desmontar el componente.
  const [key, setKey] = useState(0);
  const [screen, setScreen] = useState<ScreenName>(initialScreen);
  const [evento, setEvento] = useState<EventDraft>(INITIAL_EVENT);
  const [confirmations, setConfirmations] = useState<Confirmation[]>(CONFIRMATIONS_INIT);
  const [isOrganizer, setIsOrganizer] = useState(initialIsOrganizer);
  const [eventExists, setEventExists] = useState(false);

  useEffect(() => {
    setScreen(initialScreen);
  }, [initialScreen]);

  /**
   * @stub Simulacion de tiempo real para desarrollo.
   * Reemplazar con Supabase Realtime:
   * const channel = supabase
   *   .channel('attendances-' + eventId)
   *   .on('postgres_changes', {
   *     event: '*',
   *     schema: 'public',
   *     table: 'attendances',
   *     filter: 'event_id=eq.' + eventId
   *   }, (payload) => {
   *     setConfirmations(prev => actualizarConfirmaciones(prev, payload))
   *   })
   *   .subscribe()
   * return () => supabase.removeChannel(channel)
   * IMPORTANTE: el filter por event_id es obligatorio para respetar RLS
   * y no recibir cambios de otros grupos.
   */
  useEffect(() => {
    if (screen !== 'panel_miembro' && screen !== 'panel_organiz') return;

    const timer = window.setTimeout(() => {
      setConfirmations((prev) => {
        const candidate = prev.find((item) => item.status === 'sin_respuesta');
        if (!candidate) return prev;
        return prev.map((item) =>
          item.memberId === candidate.memberId ? { ...item, status: 'va' } : item,
        );
      });
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [screen, key]);

  const stats = useMemo(() => summarizeConfirmations(confirmations), [confirmations]);

  const goTo = (next: ScreenName) => {
    setScreen(next);
    setKey((value) => value + 1);
  };

  const handleCreateIntent = () => {
    if (eventExists) {
      goTo('evento_existente');
      return;
    }
    goTo('crear_evento');
  };

  const handleSaveEvent = (draft: Pick<EventDraft, 'fecha' | 'lugar' | 'descripcion'>) => {
    setEvento((prev) => ({ ...prev, ...draft, status: 'pendiente' }));
    setEventExists(true);
    goTo('panel_organiz');
  };

  const handleAttendance = (status: Exclude<AttendanceStatus, 'sin_respuesta'>) => {
    setConfirmations((prev) => prev.map((item, index) => (index === 1 ? { ...item, status } : item)));
  };

  return (
    <main className="events-shell">
      <style>{css}</style>
      <div className="events-wrap">
        {process.env.NODE_ENV === 'development' && (
          // Solo visible en desarrollo — herramienta de QA
          <div className="scenario-bar">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario}
                className={`scenario-chip ${screen === scenario ? 'active' : ''}`}
                onClick={() => goTo(scenario)}
                type="button"
              >
                {scenario}
              </button>
            ))}
            <button className="scenario-chip" onClick={() => setIsOrganizer((value) => !value)} type="button">
              rol: {isOrganizer ? 'organizador' : 'miembro'}
            </button>
          </div>
        )}

        {screen === 'sin_evento' && (
          <SinEvento
            key={key}
            isOrganizer={isOrganizer}
            organizerName={INITIAL_EVENT.organizer}
            onCreate={handleCreateIntent}
          />
        )}
        {screen === 'crear_evento' && <CrearEvento key={key} onCancel={() => goTo('sin_evento')} onSave={handleSaveEvent} />}
        {screen === 'form_error' && (
          <CrearEvento key={key} onCancel={() => goTo('sin_evento')} onSave={handleSaveEvent} showError />
        )}
        {screen === 'evento_existente' && (
          <EventoExistente key={key} onEdit={() => goTo('edit_evento')} onView={() => goTo('panel_organiz')} />
        )}
        {screen === 'panel_miembro' && (
          <PanelMiembro
            key={key}
            event={evento}
            confirmations={confirmations}
            stats={stats}
            onConfirm={handleAttendance}
          />
        )}
        {screen === 'panel_organiz' && (
          <PanelOrganizador
            key={key}
            event={evento}
            confirmations={confirmations}
            stats={stats}
            onEdit={() => goTo(evento.status === 'publicado' ? 'renotif' : 'edit_evento')}
            onNotify={() => {
              setEvento((prev) => ({ ...prev, status: 'publicado' }));
              goTo('notificando');
            }}
          />
        )}
        {screen === 'notificando' && <Notificando key={key} event={evento} onDone={() => goTo('notif_ok')} />}
        {screen === 'notif_ok' && <NotifOk key={key} onBack={() => goTo(isOrganizer ? 'panel_organiz' : 'panel_miembro')} />}
        {screen === 'renotif' && (
          <Renotif
            key={key}
            event={evento}
            onCancelar={() => goTo('notif_ok')}
            onGuardar={(notify) => {
              if (notify) {
                goTo('notificando');
                return;
              }
              goTo('notif_ok');
            }}
          />
        )}
        {screen === 'edit_evento' && (
          <EditEvento
            key={key}
            event={evento}
            onCancel={() => goTo('panel_organiz')}
            onSave={(draft) => {
              setEvento((prev) => ({ ...prev, ...draft }));
              goTo(evento.status === 'publicado' ? 'renotif' : 'panel_organiz');
            }}
          />
        )}
      </div>
    </main>
  );
}

/**
 * @description Estado vacío del panel mensual cuando todavía no existe un evento para el mes actual.
 * @param {Object} props
 * @param {boolean} props.isOrganizer - Indica si el usuario autenticado organiza el mes.
 * @param {string} props.organizerName - Nombre de quien tiene el turno si no es el usuario actual.
 * @param {() => void} props.onCreate - Callback para abrir la creación del evento.
 */
function SinEvento({ isOrganizer, organizerName, onCreate }: { isOrganizer: boolean; organizerName: string; onCreate: () => void }) {
  return (
    <section className="events-card screen-enter">
      <OrgHeader isOrganizer={isOrganizer} organizerName={organizerName} />
      <div className="stack-md">
        <p className="kicker">sin_evento</p>
        <h1 className="title">La cena de este mes aun no fue convocada</h1>
        <p className="body">
          {isOrganizer
            ? 'Te toca coordinar la fecha, el lugar tentativo y avisarle al grupo.'
            : `${organizerName} tiene el turno de organizar la convocatoria de este mes.`}
        </p>
      </div>
      {isOrganizer ? (
        <button className="btn-primary" onClick={onCreate} type="button">
          Crear evento del mes
        </button>
      ) : (
        <span className="pill turno">Turno de {organizerName}</span>
      )}
    </section>
  );
}

/**
 * @description Formulario para crear el evento del mes con validación obligatoria de fecha.
 * @param {Object} props
 * @param {(draft: Pick<EventDraft, 'fecha' | 'lugar' | 'descripcion'>) => void} props.onSave - Callback al guardar.
 * @param {() => void} props.onCancel - Callback para volver atrás.
 * @param {boolean} [props.showError] - Fuerza estado de error para QA y tests.
 */
function CrearEvento({
  onSave,
  onCancel,
  showError = false,
}: {
  onSave: (draft: Pick<EventDraft, 'fecha' | 'lugar' | 'descripcion'>) => void;
  onCancel: () => void;
  showError?: boolean;
}) {
  const [fecha, setFecha] = useState(showError ? '' : INITIAL_EVENT.fecha);
  const [lugar, setLugar] = useState(INITIAL_EVENT.lugar);
  const [descripcion, setDescripcion] = useState(INITIAL_EVENT.descripcion);
  const [hasError, setHasError] = useState(showError);

  const handleSave = () => {
    if (!fecha) {
      setHasError(true);
      return;
    }

    /**
     * @stub Reemplazar setTimeout con:
     * const { error } = await supabase.from('events').insert({
     *   group_id: groupId,
     *   organizer_id: user.id,
     *   fecha: fecha,
     *   lugar: lugar || 'Por confirmar',
     *   descripcion: desc,
     *   status: 'pendiente'
     * })
     */
    window.setTimeout(() => {
      onSave({ fecha, lugar, descripcion });
    }, 200);
  };

  return (
    <section className="events-card screen-enter">
      <div className="stack-md">
        <p className="kicker">crear_evento</p>
        <h1 className="title">Crear evento del mes</h1>
        <p className="body">Definí la fecha obligatoria y sumá lugar tentativo o detalles útiles para el grupo.</p>
      </div>
      <div className="stack-md">
        <label className="field-wrap">
          <span className="field-label">Fecha</span>
          <input
            className={`input-field ${hasError ? 'error' : ''}`}
            type="date"
            value={fecha}
            onChange={(event) => {
              setFecha(event.target.value);
              setHasError(false);
            }}
          />
        </label>
        {hasError ? <p className="error-text">La fecha es obligatoria para crear el evento</p> : null}
        <label className="field-wrap">
          <span className="field-label">Lugar tentativo</span>
          <input className="input-field" type="text" value={lugar} onChange={(event) => setLugar(event.target.value)} />
        </label>
        <label className="field-wrap">
          <span className="field-label">Descripción</span>
          <textarea className="textarea-field" rows={4} value={descripcion} onChange={(event) => setDescripcion(event.target.value)} />
        </label>
      </div>
      <div className="cta-row">
        <button className="btn-primary" onClick={handleSave} type="button">Guardar evento</button>
        <button className="btn-secondary" onClick={onCancel} type="button">Cancelar</button>
      </div>
    </section>
  );
}

/**
 * @description Estado que informa que ya existe un evento activo para el mes en curso.
 * @param {Object} props
 * @param {() => void} props.onView - Callback para abrir el evento existente.
 * @param {() => void} props.onEdit - Callback para editar el evento existente.
 */
function EventoExistente({ onView, onEdit }: { onView: () => void; onEdit: () => void }) {
  return (
    <section className="events-card screen-enter">
      <span className="pill warning">Advertencia</span>
      <div className="stack-md">
        <p className="kicker">evento_existente</p>
        <h1 className="title">Ya hay un evento activo este mes</h1>
        <p className="body">Para mantener un solo evento por mes podés revisar el existente o editarlo.</p>
      </div>
      <div className="cta-row">
        <button className="btn-secondary" onClick={onView} type="button">Ver evento</button>
        <button className="btn-primary" onClick={onEdit} type="button">Editar evento</button>
      </div>
    </section>
  );
}

/**
 * @description Vista de organizador con resumen completo, confirmaciones en tiempo real y acciones de publicación.
 * @param {Object} props
 * @param {EventDraft} props.event - Datos del evento.
 * @param {Confirmation[]} props.confirmations - Confirmaciones actuales.
 * @param {ReturnType<typeof summarizeConfirmations>} props.stats - Resumen agregado de asistencias.
 * @param {() => void} props.onNotify - Callback para iniciar publicación/notificación.
 * @param {() => void} props.onEdit - Callback para editar el evento.
 */
function PanelOrganizador({
  event,
  confirmations,
  stats,
  onNotify,
  onEdit,
}: {
  event: EventDraft;
  confirmations: Confirmation[];
  stats: ReturnType<typeof summarizeConfirmations>;
  onNotify: () => void;
  onEdit: () => void;
}) {
  return (
    <section className="events-card screen-enter">
      <OrgHeader isOrganizer organizerName={event.organizer} />
      <div className="header-row">
        <div className="stack-sm">
          <p className="kicker">panel_organiz</p>
          <h1 className="title">Panel del organizador</h1>
        </div>
        <span className={`pill ${event.status === 'publicado' ? 'publicado' : 'warning'}`}>{event.status}</span>
      </div>
      <EventoCard event={event} />
      <div className="stack-sm">
        <div className="row">
          <span className="dot-live" aria-hidden="true" />
          <p className="muted">Confirmaciones en tiempo real</p>
        </div>
        <ConfirmBar stats={stats} />
        <div className="stat-grid">
          <Stat label="Van" value={stats.va.length} tone="va" />
          <Stat label="No van" value={stats.no_va.length} tone="no-va" />
          <Stat label="Tal vez" value={stats.tal_vez.length} tone="tal-vez" />
          <Stat label="Sin responder" value={stats.sin_respuesta.length} tone="sin-respuesta" />
        </div>
      </div>
      <div className="stack-sm">
        {confirmations.map((confirmation) => (
          <ConfirmRow key={confirmation.memberId} confirmation={confirmation} />
        ))}
      </div>
      <div className="cta-row">
        <button className="btn-primary" onClick={onNotify} type="button">Notificar al grupo</button>
        <button className="btn-secondary" onClick={onEdit} type="button">Editar evento</button>
        <button
          className="btn-ghost"
          onClick={() => {
            // @stub Reemplazar con funcionalidad real:
            // const texto = confirmations
            //   .filter(c => c.status === 'va')
            //   .map(c => c.name)
            //   .join(', ')
            // const mensaje = `Van a la cena: ${texto}`
            // if (navigator.share) navigator.share({ text: mensaje })
            // else navigator.clipboard.writeText(mensaje)
            console.log('Compartir resumen — stub pendiente de implementar');
          }}
          type="button"
        >
          Compartir resumen
        </button>
      </div>
    </section>
  );
}

/**
 * @description Vista de miembro con información del evento y acciones para confirmar asistencia.
 * @param {Object} props
 * @param {EventDraft} props.event - Datos actuales del evento.
 * @param {Confirmation[]} props.confirmations - Confirmaciones actuales.
 * @param {ReturnType<typeof summarizeConfirmations>} props.stats - Resumen agregado.
 * @param {(status: Exclude<AttendanceStatus, 'sin_respuesta'>) => void} props.onConfirm - Callback para cambiar la asistencia.
 */
function PanelMiembro({
  event,
  confirmations,
  stats,
  onConfirm,
}: {
  event: EventDraft;
  confirmations: Confirmation[];
  stats: ReturnType<typeof summarizeConfirmations>;
  onConfirm: (status: Exclude<AttendanceStatus, 'sin_respuesta'>) => void;
}) {
  return (
    <section className="events-card screen-enter">
      <OrgHeader isOrganizer={false} organizerName={event.organizer} />
      <div className="stack-md">
        <p className="kicker">panel_miembro</p>
        <h1 className="title">Cena de este mes</h1>
      </div>
      <EventoCard event={event} />
      <ConfirmBar stats={stats} />
      <div className="stat-grid">
        <Stat label="Van" value={stats.va.length} tone="va" />
        <Stat label="No van" value={stats.no_va.length} tone="no-va" />
        <Stat label="Tal vez" value={stats.tal_vez.length} tone="tal-vez" />
        <Stat label="Sin responder" value={stats.sin_respuesta.length} tone="sin-respuesta" />
      </div>
      <div className="confirm-actions">
        <button className="btn-primary" onClick={() => onConfirm('va')} type="button">Voy</button>
        <button className="btn-secondary" onClick={() => onConfirm('no_va')} type="button">No voy</button>
        <button className="btn-secondary" onClick={() => onConfirm('tal_vez')} type="button">Tal vez</button>
      </div>
      <div className="stack-sm">
        {confirmations.map((confirmation) => (
          <ConfirmRow key={confirmation.memberId} confirmation={confirmation} />
        ))}
      </div>
    </section>
  );
}

/**
 * @description Estado intermedio mientras se dispara la notificación al grupo.
 * @param {Object} props
 * @param {EventDraft} props.event - Evento a publicar.
 * @param {() => void} props.onDone - Callback al terminar el envío simulado.
 */
function Notificando({ event, onDone }: { event: EventDraft; onDone: () => void }) {
  useEffect(() => {
    /**
     * @stub Reemplazar setTimeout con server action:
     * await notificarGrupo({ eventId, groupId })
     * La server action dispara notificaciones push a todos los members del grupo
     */
    const timer = window.setTimeout(() => {
      onDone();
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <section className="events-card screen-enter">
      <div className="row">
        <div className="spinner" aria-hidden="true" />
        <div className="stack-sm">
          <p className="kicker">notificando</p>
          <h1 className="title">Enviando convocatoria</h1>
          <p className="body">Estamos avisando al grupo sobre la cena del {event.fecha} en {event.lugar}.</p>
        </div>
      </div>
    </section>
  );
}

/**
 * @description Confirmación final de notificación enviada o guardado exitoso.
 * @param {Object} props
 * @param {() => void} props.onBack - Callback para volver al panel.
 */
function NotifOk({ onBack }: { onBack: () => void }) {
  return (
    <section className="events-card screen-enter">
      <span className="pill publicado">notif_ok</span>
      <div className="stack-md">
        <h1 className="title">Convocatoria lista</h1>
        <p className="body">Los miembros ya pueden ver la convocatoria en el panel y la información quedó actualizada.</p>
      </div>
      <button className="btn-primary" onClick={onBack} type="button">Volver al panel</button>
    </section>
  );
}

/**
 * @description Flujo de re-notificación luego de editar un evento ya publicado.
 * @param {Object} props
 * @param {EventDraft} props.event - Evento editado.
 * @param {(notify: boolean) => void} props.onGuardar - Callback al guardar con o sin aviso adicional.
 * @param {() => void} props.onCancelar - Callback para salir guardando sin re-notificar.
 */
function Renotif({
  event,
  onGuardar,
  onCancelar,
}: {
  event: EventDraft;
  onGuardar: (notify: boolean) => void;
  onCancelar: () => void;
}) {
  return (
    <section className="events-card screen-enter">
      <span className="pill warning">renotif</span>
      <div className="stack-md">
        <h1 className="title">Cambios detectados en el evento</h1>
        <p className="body">Actualizaste el lugar a {event.lugar}. Elegí si querés avisarle nuevamente al grupo.</p>
      </div>
      <div className="cta-row">
        <button className="btn-primary" onClick={() => onGuardar(true)} type="button">Guardar y notificar</button>
        <button className="btn-secondary" onClick={onCancelar} type="button">Solo guardar</button>
      </div>
    </section>
  );
}

/**
 * @description Formulario de edición posterior del evento mensual.
 * @param {Object} props
 * @param {EventDraft} props.event - Datos iniciales del evento.
 * @param {(draft: Pick<EventDraft, 'fecha' | 'lugar' | 'descripcion'>) => void} props.onSave - Callback al persistir.
 * @param {() => void} props.onCancel - Callback para cancelar edición.
 */
function EditEvento({
  event,
  onSave,
  onCancel,
}: {
  event: EventDraft;
  onSave: (draft: Pick<EventDraft, 'fecha' | 'lugar' | 'descripcion'>) => void;
  onCancel: () => void;
}) {
  const [fecha, setFecha] = useState(event.fecha);
  const [lugar, setLugar] = useState(event.lugar);
  const [descripcion, setDescripcion] = useState(event.descripcion);

  const handleSave = () => {
    /**
     * @stub Reemplazar setTimeout con:
     * const { error } = await supabase.from('events')
     *   .update({ lugar: lugar })
     *   .eq('id', eventoId)
     *   .eq('organizer_id', user.id)
     */
    window.setTimeout(() => {
      onSave({ fecha, lugar, descripcion });
    }, 200);
  };

  return (
    <section className="events-card screen-enter">
      <div className="stack-md">
        <p className="kicker">edit_evento</p>
        <h1 className="title">Editar evento</h1>
      </div>
      <div className="stack-md">
        <label className="field-wrap">
          <span className="field-label">Fecha</span>
          <input className="input-field" type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
        </label>
        <label className="field-wrap">
          <span className="field-label">Lugar</span>
          <input className="input-field" type="text" value={lugar} onChange={(event) => setLugar(event.target.value)} />
        </label>
        <label className="field-wrap">
          <span className="field-label">Descripción</span>
          <textarea className="textarea-field" rows={4} value={descripcion} onChange={(event) => setDescripcion(event.target.value)} />
        </label>
      </div>
      <div className="cta-row">
        <button className="btn-primary" onClick={handleSave} type="button">Guardar cambios</button>
        <button className="btn-secondary" onClick={onCancel} type="button">Cancelar</button>
      </div>
    </section>
  );
}

/**
 * @description Encabezado contextual con el rol del usuario y la persona organizadora del mes.
 * @param {Object} props
 * @param {boolean} props.isOrganizer - Indica si el usuario es organizador.
 * @param {string} props.organizerName - Nombre de quien organiza el mes.
 */
function OrgHeader({ isOrganizer, organizerName }: { isOrganizer: boolean; organizerName: string }) {
  return (
    <div className="header-row">
      <div className="stack-sm">
        <p className="kicker">Grupo Monthly Dinner</p>
        <p className="muted">Organiza {organizerName}</p>
      </div>
      <span className="pill turno">{isOrganizer ? 'Tu turno' : 'Miembro'}</span>
    </div>
  );
}

/**
 * @description Fila simple de icono, label y valor para los datos del evento.
 * @param {Object} props
 * @param {string} props.icon - Icono textual.
 * @param {string} props.label - Etiqueta del dato.
 * @param {string} props.value - Valor visible.
 */
function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="info-row">
      <span className="info-icon" aria-hidden="true">{icon}</span>
      <div className="stack-sm">
        <p className="kicker">{label}</p>
        <p className="body">{value}</p>
      </div>
    </div>
  );
}

/**
 * @description Card resumen del evento con fecha, lugar, organizador y estado.
 * @param {Object} props
 * @param {EventDraft} props.event - Datos visibles del evento.
 */
function EventoCard({ event }: { event: EventDraft }) {
  return (
    <section className="evento-card">
      <div className="header-row">
        <div>
          <p className="kicker">Evento mensual</p>
          <h2 className="title" style={{ fontSize: 24 }}>{event.lugar || 'Por confirmar'}</h2>
        </div>
        <span className={`pill ${event.status === 'publicado' ? 'publicado' : 'warning'}`}>{event.status}</span>
      </div>
      <InfoRow icon="📅" label="Fecha" value={event.fecha} />
      <InfoRow icon="📍" label="Lugar" value={event.lugar || 'Por confirmar'} />
      <InfoRow icon="👤" label="Organiza" value={event.organizer} />
      <InfoRow icon="📝" label="Detalle" value={event.descripcion || 'Sin descripción'} />
    </section>
  );
}

/**
 * @description Barra de progreso animada con el reparto de estados de asistencia.
 * @param {Object} props
 * @param {ReturnType<typeof summarizeConfirmations>} props.stats - Resumen agregado a visualizar.
 */
function ConfirmBar({ stats }: { stats: ReturnType<typeof summarizeConfirmations> }) {
  const total = stats.total || 1;
  const segments = [
    { key: 'va', width: (stats.va.length / total) * 100, color: t.tertiaryContainer },
    { key: 'no_va', width: (stats.no_va.length / total) * 100, color: t.errorCont },
    { key: 'tal_vez', width: (stats.tal_vez.length / total) * 100, color: t.secondaryFixed },
    { key: 'sin_respuesta', width: (stats.sin_respuesta.length / total) * 100, color: t.surfaceHigh },
  ];

  return (
    <div className="stack-sm">
      <div className="confirm-bar-track" aria-label="Barra de confirmaciones">
        {segments.map((segment) => (
          <span key={segment.key} className="confirm-bar-segment" style={{ width: `${segment.width}%`, background: segment.color }} />
        ))}
      </div>
    </div>
  );
}

/**
 * @description Tarjeta numérica para una categoría de confirmación.
 * @param {Object} props
 * @param {string} props.label - Nombre de la categoría.
 * @param {number} props.value - Conteo de miembros.
 * @param {'va' | 'no-va' | 'tal-vez' | 'sin-respuesta'} props.tone - Estilo visual.
 */
function Stat({ label, value, tone }: { label: string; value: number; tone: 'va' | 'no-va' | 'tal-vez' | 'sin-respuesta' }) {
  return (
    <article className="stat-card">
      <span className={`pill ${tone}`}>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

/**
 * @description Fila individual con nombre del miembro y su estado de asistencia.
 * @param {Object} props
 * @param {Confirmation} props.confirmation - Confirmación a renderizar.
 */
function ConfirmRow({ confirmation }: { confirmation: Confirmation }) {
  const toneByStatus: Record<AttendanceStatus, 'va' | 'no-va' | 'tal-vez' | 'sin-respuesta'> = {
    va: 'va',
    no_va: 'no-va',
    tal_vez: 'tal-vez',
    sin_respuesta: 'sin-respuesta',
  };
  const labelByStatus: Record<AttendanceStatus, string> = {
    va: 'Va',
    no_va: 'No va',
    tal_vez: 'Tal vez',
    sin_respuesta: 'Sin responder',
  };

  return (
    <div className="confirm-row">
      <div className="stack-sm">
        <p className="body">{confirmation.name}</p>
      </div>
      <span className={`pill ${toneByStatus[confirmation.status]}`}>{labelByStatus[confirmation.status]}</span>
    </div>
  );
}

/**
 * @description Resume las confirmaciones por categoría para los contadores y barras.
 * @param {Confirmation[]} confirmations - Confirmaciones actuales del evento.
 */
function summarizeConfirmations(confirmations: Confirmation[]) {
  return {
    va: confirmations.filter((item) => item.status === 'va'),
    no_va: confirmations.filter((item) => item.status === 'no_va'),
    tal_vez: confirmations.filter((item) => item.status === 'tal_vez'),
    sin_respuesta: confirmations.filter((item) => item.status === 'sin_respuesta'),
    total: confirmations.length,
  };
}


Object.assign(EventsPage, {
  View: EventsPageView,
  SinEvento,
  CrearEvento,
  EventoExistente,
  PanelOrganizador,
  PanelMiembro,
  Notificando,
  NotifOk,
  Renotif,
  EditEvento,
  OrgHeader,
  InfoRow,
  EventoCard,
  ConfirmBar,
  Stat,
  ConfirmRow,
});
