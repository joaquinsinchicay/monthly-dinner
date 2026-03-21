// @ts-nocheck
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: event } = await ((supabase.from("events") as unknown as { select(columns: string): { eq(column: string, value: string): { maybeSingle(): Promise<{ data: { id: string; event_date: string; location: string | null; description: string | null; status: "draft" | "published" | "closed" } | null }> } } }).select("id, event_date, location, description, status").eq("id", params.id).maybeSingle());
  if (!event) notFound();
  return (<Card className="overflow-hidden"><div className="bg-surface-low p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Detalle del evento</p><h2 className="mt-3 font-display text-3xl text-on-surface">{event.status === "draft" ? "Borrador listo para publicar" : "Cena convocada"}</h2><p className="mt-3 text-sm text-secondary">Consulta o edita los datos de la cena mensual desde este resumen.</p></div><div className="space-y-4 p-6 text-sm text-on-surface"><div>{event.event_date}</div><div>{event.location ?? "Lugar por confirmar"}</div>{event.description ? <p className="rounded-2xl bg-surface-low p-4 text-secondary">{event.description}</p> : null}<div className="flex flex-wrap gap-3"><Link href={`/dashboard/events/${event.id}/edit`} className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary-gradient px-5 py-3 text-sm font-semibold text-white shadow-card">Editar evento</Link><Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-full bg-surface-high px-5 py-3 text-sm font-semibold text-on-surface">Volver al panel</Link></div></div></Card>);
}
