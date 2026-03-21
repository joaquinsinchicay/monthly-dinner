import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import EventsPage from '@/app/(dashboard)/events/page';

const { View: EventsPageView, CrearEvento, EventoExistente, Renotif, SinEvento } = EventsPage as typeof EventsPage & {
  View: any;
  CrearEvento: any;
  EventoExistente: any;
  Renotif: any;
  SinEvento: any;
};

describe('E02 Panel de evento mensual', () => {
  it('muestra error cuando falta la fecha obligatoria', () => {
    render(<CrearEvento onCancel={() => undefined} onSave={() => undefined} showError />);

    expect(screen.getByLabelText(/Fecha/i)).toHaveClass('input-field error');
    expect(screen.getByText('La fecha es obligatoria para crear el evento')).toBeInTheDocument();
  });

  it('crea un evento con fecha, lugar y descripción', () => {
    vi.useFakeTimers();
    const onSave = vi.fn();
    render(<CrearEvento onCancel={() => undefined} onSave={onSave} showError />);

    fireEvent.change(screen.getByLabelText(/Fecha/i), { target: { value: '2026-03-26' } });
    fireEvent.change(screen.getByLabelText(/Lugar tentativo/i), { target: { value: 'Bistró Norte' } });
    fireEvent.change(screen.getByLabelText(/Descripción/i), { target: { value: 'Mesa junto a la ventana' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar evento' }));

    act(() => {
      vi.runAllTimers();
    });

    expect(onSave).toHaveBeenCalledWith({
      fecha: '2026-03-26',
      lugar: 'Bistró Norte',
      descripcion: 'Mesa junto a la ventana',
    });
    vi.useRealTimers();
  });

  it('actualiza el contador de Van en tiempo real', () => {
    vi.useFakeTimers();
    render(<EventsPageView initialScreen="panel_miembro" initialIsOrganizer={false} />);

    expect(screen.getAllByText('1')[0]).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(screen.getByText('2')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('renderiza el estado vacío sin evento activo', () => {
    render(<SinEvento isOrganizer organizerName="Sofi Bianchi" onCreate={() => undefined} />);

    expect(screen.getByText('La cena de este mes aun no fue convocada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear evento del mes' })).toBeEnabled();
  });

  it('maneja las acciones de re-notificación', () => {
    const onGuardar = vi.fn();
    const onCancelar = vi.fn();

    render(
      <Renotif
        event={{
          fecha: '2026-03-26',
          lugar: 'Cantina Norte',
          descripcion: 'Mesa reservada',
          organizer: 'Sofi Bianchi',
          status: 'publicado',
        }}
        onGuardar={onGuardar}
        onCancelar={onCancelar}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Guardar y notificar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Solo guardar' }));

    expect(onGuardar).toHaveBeenCalledWith(true);
    expect(onCancelar).toHaveBeenCalled();
  });

  it('oculta la ScenarioBar en producción y la muestra en desarrollo', async () => {
    const original = process.env.NODE_ENV;

    vi.stubEnv('NODE_ENV', 'production');
    const { container, unmount } = render(<EventsPageView initialScreen="sin_evento" />);
    expect(container.querySelector('.scenario-bar')).not.toBeInTheDocument();
    unmount();

    vi.stubEnv('NODE_ENV', 'development');
    const secondRender = render(<EventsPageView initialScreen="sin_evento" />);
    expect(secondRender.container.querySelector('.scenario-bar')).toBeInTheDocument();
    secondRender.unmount();

    vi.stubEnv('NODE_ENV', original ?? 'test');
  });

  it('renderiza el aviso de evento existente', () => {
    render(<EventoExistente onEdit={() => undefined} onView={() => undefined} />);

    expect(screen.getByText('Ya hay un evento activo este mes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver evento' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar evento' })).toBeInTheDocument();
  });
});
