// @ts-nocheck
import { redirect } from "next/navigation";

import { CreateEventForm } from "@/components/event/CreateEventForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");
  const { data: event } = await ((supabase.from("events") as unknown as { select(columns: string): { eq(column: string, value: string): { maybeSingle(): Promise<{ data: { id: string; event_date: string; location: string | null; description: string | null; status: "draft" | "published" | "closed"; organizer_id: string } | null }> } } }).select("id, event_date, location, description, status, organizer_id").eq("id", params.id).maybeSingle());
  if (!event || event.organizer_id !== userData.user.id) redirect("/dashboard");
  return <CreateEventForm mode="edit" event={{ id: event.id, event_date: event.event_date, location: event.location, description: event.description, status: event.status }} />;
}
