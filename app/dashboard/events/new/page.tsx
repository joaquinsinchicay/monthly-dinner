// @ts-nocheck
import { CreateEventForm, ExistingEventNotice } from "@/components/event/CreateEventForm";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewEventPage() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return null;
  }

  const { data: rotation } = await ((supabase.from("rotation") as unknown as { select(columns: string): { eq(column: string, value: string | boolean): { eq(column: string, value: string | boolean): { maybeSingle(): Promise<{ data: { group_id: string; user_id: string } | null }> } } } }).select("group_id, user_id").eq("user_id", userData.user.id).eq("is_current", true).maybeSingle());

  if (!rotation) {
    return (
      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Evento del mes</p>
        <h2 className="mt-3 font-display text-3xl text-on-surface">Solo el organizador del mes puede crear el evento</h2>
        <p className="mt-3 text-sm text-secondary">Cuando te toque organizar, aquí verás el formulario para preparar la convocatoria.</p>
      </Card>
    );
  }

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const { data: existingEvent } = await ((supabase.from("events") as unknown as { select(columns: string): { eq(column: string, value: string): { neq(column: string, value: string): { gte(column: string, value: string): { lt(column: string, value: string): { order(column: string, options: { ascending: boolean }): { maybeSingle(): Promise<{ data: { id: string } | null }> } } } } } } }).select("id, event_date, location, description, status").eq("group_id", rotation.group_id).neq("status", "closed").gte("event_date", monthStart.toISOString().slice(0, 10)).lt("event_date", nextMonthStart.toISOString().slice(0, 10)).order("event_date", { ascending: true }).maybeSingle());

  if (existingEvent) {
    return <ExistingEventNotice eventId={existingEvent.id} />;
  }

  return <CreateEventForm mode="create" />;
}
