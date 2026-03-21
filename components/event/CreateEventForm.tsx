// @ts-nocheck
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { createEvent, notifyGroupOfUpdate, publishEvent, updateEvent } from "@/app/actions/events";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/types";

type EventStatus = Database["public"]["Tables"]["events"]["Row"]["status"];

type ExistingEvent = {
  id: string;
  event_date: string;
  location: string | null;
  description: string | null;
  status: EventStatus;
};

type CreateEventFormProps = {
  mode: "create" | "edit";
  event?: ExistingEvent;
};

export function ExistingEventNotice({ eventId }: { eventId: string }) {
  return (
    <Card className="p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Evento activo</p>
      <h2 className="mt-3 font-display text-3xl text-on-surface">Ya hay un evento activo este mes</h2>
      <p className="mt-3 text-sm text-secondary">Puedes abrirlo y editarlo en lugar de crear un duplicado.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/dashboard/events/${eventId}`} className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary-gradient px-5 py-3 text-sm font-semibold text-white shadow-card">
          Ver evento actual
        </Link>
        <Link href={`/dashboard/events/${eventId}/edit`} className="inline-flex min-h-11 items-center justify-center rounded-full bg-surface-high px-5 py-3 text-sm font-semibold text-on-surface">
          Editar evento existente
        </Link>
      </div>
    </Card>
  );
}

export function CreateEventForm({ mode, event }: CreateEventFormProps) {
  const router = useRouter();
  const [date, setDate] = useState(event?.event_date ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [confirmNotifyOpen, setConfirmNotifyOpen] = useState(false);

  const publishedEvent = mode === "edit" && event?.status === "published";
  const descriptionCount = useMemo(() => description.length, [description]);

  async function submitForm(shouldNotify: boolean): Promise<void> {
    if (!date.trim()) {
      setError("La fecha es obligatoria para crear el evento");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    const payload = { date, location, description };
    const result = mode === "create" ? await createEvent(payload) : await updateEvent(event!.id, payload);

    setIsSaving(false);

    if (!result.success) {
      setError(result.error.message);
      if (result.error.code === "event_exists" && mode === "create") {
        router.refresh();
      }
      return;
    }

    if (mode === "create") {
      router.push(`/dashboard/events/${result.data.id}`);
      router.refresh();
      return;
    }

    if (shouldNotify && event) {
      const notifyResult = await notifyGroupOfUpdate(event.id);
      if (notifyResult.success) {
        setSuccessMessage(`Cambios guardados y grupo notificado. ${notifyResult.data.notifiedMembers} miembros recibieron la actualización.`);
      } else {
        setSuccessMessage("Los cambios se guardaron, pero no pudimos reenviar la actualización al grupo.");
      }
    } else {
      setSuccessMessage("Cambios guardados correctamente.");
    }

    router.refresh();
  }

  async function handlePublish(): Promise<void> {
    if (!event) {
      return;
    }

    setIsPublishing(true);
    setError(null);
    setSuccessMessage(null);

    const result = await publishEvent(event.id);
    setIsPublishing(false);

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    setSuccessMessage(`Grupo notificado. ${result.data.notifiedMembers} miembros recibieron la convocatoria.`);
    router.refresh();
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="bg-surface-low p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{mode === "create" ? "Evento del mes" : "Editar evento"}</p>
          <h2 className="mt-3 font-display text-3xl text-on-surface">{mode === "create" ? "Crea la convocatoria del mes" : "Actualiza los datos del evento"}</h2>
          <p className="mt-3 text-sm text-secondary">
            Centraliza la fecha, el lugar tentativo y cualquier detalle relevante para el grupo antes de publicarlo.
          </p>
        </div>
        <div className="space-y-4 p-6">
          <div className="space-y-3">
            <Label htmlFor="event-date">Fecha *</Label>
            <Input id="event-date" type="date" value={date} onChange={(eventValue) => setDate(eventValue.target.value)} required />
          </div>

          <div className="space-y-3">
            <Label htmlFor="event-location">Lugar tentativo</Label>
            <Input id="event-location" type="text" placeholder="Ej. Casa de Ana o restaurante por definir" value={location} onChange={(eventValue) => setLocation(eventValue.target.value)} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="event-description">Descripción (opcional)</Label>
              <span className="text-xs text-secondary">{descriptionCount}/500</span>
            </div>
            <Textarea
              id="event-description"
              maxLength={500}
              placeholder="Comparte contexto, ideas o necesidades de coordinación para la cena."
              value={description}
              onChange={(eventValue) => setDescription(eventValue.target.value)}
            />
          </div>

          {error ? <p className="rounded-2xl bg-error-cont px-4 py-3 text-sm text-error">{error}</p> : null}
          {successMessage ? <p className="rounded-2xl bg-surface-high px-4 py-3 text-sm text-on-surface">{successMessage}</p> : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              type="button"
              onClick={() => {
                if (publishedEvent) {
                  setConfirmNotifyOpen(true);
                  return;
                }

                void submitForm(false);
              }}
              disabled={isSaving || isPublishing}
              className="gap-2"
            >
              {isSaving ? "Guardando..." : mode === "create" ? "Guardar evento" : "Guardar cambios"}
            </Button>

            {mode === "edit" && event?.status === "draft" ? (
              <Button type="button" variant="secondary" onClick={() => void handlePublish()} disabled={isSaving || isPublishing} className="gap-2">
                {isPublishing ? "Notificando..." : "Notificar al grupo"}
              </Button>
            ) : null}

            {mode === "edit" && event ? (
              <Link href={`/dashboard/events/${event.id}`} className="inline-flex min-h-11 items-center justify-center rounded-full bg-surface-high px-5 py-3 text-sm font-semibold text-on-surface">
                Volver al evento
              </Link>
            ) : null}
          </div>

          <div className="rounded-2xl bg-surface-low p-4 text-sm text-secondary">
            <div className="flex items-start gap-3">
                            <p>
                Guarda primero el borrador y publícalo cuando quieras convocar al grupo. Si ya estaba publicado, podrás elegir si notificas el cambio antes de guardar.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <AlertDialog
        open={confirmNotifyOpen}
        title="¿Notificar al grupo sobre el cambio?"
        description="Puedes guardar la actualización sin avisar o reenviar una notificación para que todas las personas vean el cambio de lugar o fecha."
        cancelLabel="Solo guardar"
        confirmLabel="Guardar y notificar"
        onCancel={() => {
          setConfirmNotifyOpen(false);
          void submitForm(false);
        }}
        onConfirm={() => {
          setConfirmNotifyOpen(false);
          void submitForm(true);
        }}
      />
    </>
  );
}
