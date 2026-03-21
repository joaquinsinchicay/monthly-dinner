// @ts-nocheck
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getAttendanceSummary, publishEvent, type AttendanceSummary } from "@/app/actions/events";
import { AttendanceChips } from "@/components/event/AttendanceChips";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types";

type EventStatus = Database["public"]["Tables"]["events"]["Row"]["status"];
type AttendanceStatus = Database["public"]["Tables"]["attendances"]["Row"]["status"];

type EventView = {
  id: string;
  event_date: string;
  location: string | null;
  description: string | null;
  organizer_id: string;
  status: EventStatus;
};

type OrganizerView = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type HistoryView = {
  restaurant_name: string;
  visited_at: string;
};

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long" }).format(new Date(`${date}T00:00:00`));
}

function initials(name: string | null): string {
  if (!name) {
    return "MD";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");
}

export function EventPanel({
  currentUserId,
  event,
  attendanceSummary,
  currentUserAttendance,
  organizer,
  latestHistory
}: {
  currentUserId: string;
  event: EventView | null;
  attendanceSummary: AttendanceSummary | null;
  currentUserAttendance: AttendanceStatus | null;
  organizer: OrganizerView | null;
  latestHistory: HistoryView | null;
}) {
  const [summary, setSummary] = useState<AttendanceSummary | null>(attendanceSummary);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(currentUserAttendance);
  const [realtimeStatus, setRealtimeStatus] = useState<string | null>(null);
  const [publishState, setPublishState] = useState<{ loading: boolean; message: string | null; error: string | null }>({
    loading: false,
    message: null,
    error: null
  });

  const isOrganizer = organizer?.user_id === currentUserId;
  const confirmationPercent = useMemo(() => {
    if (!summary || summary.total === 0) {
      return 0;
    }

    return Math.round((summary.va / summary.total) * 100);
  }, [summary]);

  useEffect(() => {
    setSummary(attendanceSummary);
  }, [attendanceSummary]);

  useEffect(() => {
    if (!event || event.status !== "published") {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`attendances-${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendances",
          filter: `event_id=eq.${event.id}`
        },
        () => {
          void (async () => {
            const result = await getAttendanceSummary(event.id);
            if (result.success) {
              setSummary(result.data);
            }
          })();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus(null);
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setRealtimeStatus("Reconectando...");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [event]);

  if (!event || (event.status === "draft" && !isOrganizer)) {
    return (
      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Estado del mes</p>
        <h2 className="mt-3 font-display text-3xl text-on-surface">La cena de este mes aun no fue convocada.</h2>
        <p className="mt-3 text-sm text-secondary">
          {organizer?.full_name ? `La organización actual está a cargo de ${organizer.full_name}.` : "Todavía no hay una persona organizadora asignada para este mes."}
        </p>
        {latestHistory ? (
          <div className="mt-6 rounded-2xl bg-surface-low p-4 text-sm text-secondary">
            Última salida registrada: <span className="font-semibold text-on-surface">{latestHistory.restaurant_name}</span> · {formatDate(latestHistory.visited_at)}
          </div>
        ) : null}
      </Card>
    );
  }

  if (event.status === "draft" && isOrganizer) {
    return (
      <Card className="overflow-hidden">
        <div className="bg-surface-low p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Es tu turno</p>
          <h2 className="mt-3 font-display text-3xl text-on-surface">Tu borrador ya está listo para convocar</h2>
          <p className="mt-3 text-sm text-secondary">Revisa la fecha y el lugar tentativo. Cuando todo esté listo, notifica al grupo para publicar la cena.</p>
        </div>
        <div className="space-y-4 p-6">
          <div className="rounded-2xl bg-surface-low p-4 text-sm text-on-surface">
            <div className="flex items-center gap-3"><span>{formatDate(event.event_date)}</span></div>
            <div className="mt-3 flex items-center gap-3"><span>{event.location ?? "Lugar por confirmar"}</span></div>
          </div>
          {publishState.error ? <p className="rounded-2xl bg-error-cont px-4 py-3 text-sm text-error">{publishState.error}</p> : null}
          {publishState.message ? <p className="rounded-2xl bg-surface-high px-4 py-3 text-sm text-on-surface">{publishState.message}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={publishState.loading}
              onClick={() => {
                setPublishState({ loading: true, message: null, error: null });
                void publishEvent(event.id).then((result) => {
                  if (!result.success) {
                    setPublishState({ loading: false, message: null, error: result.error.message });
                    return;
                  }

                  setPublishState({
                    loading: false,
                    message: `Grupo notificado. ${result.data.notifiedMembers} miembros recibieron la convocatoria.`,
                    error: null
                  });
                });
              }}
              className="gap-2"
            >
              {publishState.loading ? "Notificando..." : "Notificar al grupo"}
            </Button>
            <Link href={`/dashboard/events/${event.id}/edit`} className="inline-flex min-h-11 items-center justify-center rounded-full bg-surface-high px-5 py-3 text-sm font-semibold text-on-surface">
              Editar borrador
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="bg-surface-low p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Convocada</p>
        <h2 className="mt-3 font-display text-3xl text-on-surface">La cena del mes ya tiene fecha</h2>
        <p className="mt-3 text-sm text-secondary">Sigue el estado del evento en tiempo real y confirma tu asistencia cuando estés lista/o.</p>
      </div>
      <div className="space-y-5 p-6">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-surface-low p-4 text-sm text-on-surface">
            <div className="flex items-center gap-3"><span>{formatDate(event.event_date)}</span></div>
            <div className="mt-3 flex items-center gap-3"><span>{event.location ?? "Lugar por confirmar"}</span></div>
            {event.description ? <p className="mt-3 text-secondary">{event.description}</p> : null}
          </div>
          <div className="rounded-2xl bg-surface-low p-4 text-sm text-on-surface">
            <div className="flex items-center gap-3"><span>Organiza {organizer?.full_name ?? "el grupo"}</span></div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-high text-sm font-semibold text-on-surface">{initials(organizer?.full_name ?? null)}</div>
              <div>
                <p className="text-sm font-semibold text-on-surface">{organizer?.full_name ?? "Sin nombre disponible"}</p>
                <p className="text-xs text-secondary">Estado del evento: Convocada</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-low p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Tu respuesta</p>
          <div className="mt-3">
            <AttendanceChips currentStatus={attendanceStatus} eventId={event.id} onUpdated={(nextStatus) => setAttendanceStatus(nextStatus)} />
          </div>
        </div>

        <div className="rounded-2xl bg-surface-low p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Confirmaciones</p>
              <h3 className="mt-2 text-2xl font-display text-on-surface">{summary?.va ?? 0} personas van</h3>
            </div>
            {realtimeStatus ? <span className="rounded-full bg-surface-high px-3 py-2 text-xs font-semibold text-secondary">{realtimeStatus}</span> : null}
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-high">
            <div className="h-full rounded-full bg-primary-gradient" style={{ width: `${confirmationPercent}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-secondary md:grid-cols-4">
            <div className="rounded-2xl bg-surface-lowest p-3"><p className="text-xs uppercase tracking-[0.18em]">Voy</p><p className="mt-2 text-xl font-semibold text-on-surface">{summary?.va ?? 0}</p></div>
            <div className="rounded-2xl bg-surface-lowest p-3"><p className="text-xs uppercase tracking-[0.18em]">Tal vez</p><p className="mt-2 text-xl font-semibold text-on-surface">{summary?.tal_vez ?? 0}</p></div>
            <div className="rounded-2xl bg-surface-lowest p-3"><p className="text-xs uppercase tracking-[0.18em]">No voy</p><p className="mt-2 text-xl font-semibold text-on-surface">{summary?.no_va ?? 0}</p></div>
            <div className="rounded-2xl bg-surface-lowest p-3"><p className="text-xs uppercase tracking-[0.18em]">Sin respuesta</p><p className="mt-2 text-xl font-semibold text-on-surface">{summary?.sin_respuesta ?? 0}</p></div>
          </div>
        </div>
      </div>
    </Card>
  );
}
