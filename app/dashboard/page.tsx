// @ts-nocheck
import { EventPanel } from "@/components/event/EventPanel";
import { Card } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types";

import { getAttendanceSummary } from "../actions/events";

type Membership = Pick<Database["public"]["Tables"]["members"]["Row"], "group_id">;
type Rotation = Pick<Database["public"]["Tables"]["rotation"]["Row"], "user_id">;
type Profile = Pick<Database["public"]["Tables"]["profiles"]["Row"], "full_name" | "avatar_url">;
type Event = Pick<Database["public"]["Tables"]["events"]["Row"], "id" | "event_date" | "location" | "description" | "status" | "organizer_id">;
type Attendance = Pick<Database["public"]["Tables"]["attendances"]["Row"], "status">;
type History = Pick<Database["public"]["Tables"]["restaurant_history"]["Row"], "restaurant_name" | "visited_at">;

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const membership = (await (supabase.from("members") as unknown as { select(columns: string): { eq(column: string, value: string): { order(column: string, options: { ascending: boolean }): { limit(count: number): { maybeSingle(): Promise<{ data: Membership | null }> } } } } }).select("group_id").eq("user_id", userData.user.id).order("joined_at", { ascending: true }).limit(1).maybeSingle()).data;
  if (!membership) return <main className="space-y-6"><Card className="p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Bienvenida</p><h2 className="mt-3 font-display text-3xl text-on-surface">Todavía no formas parte de un grupo</h2><p className="mt-3 text-sm text-secondary">Acepta una invitación o crea un grupo para empezar a coordinar la próxima cena mensual.</p></Card></main>;
  const rotation = (await (supabase.from("rotation") as unknown as { select(columns: string): { eq(column: string, value: string | boolean): { eq(column: string, value: string | boolean): { maybeSingle(): Promise<{ data: Rotation | null }> } } } }).select("user_id").eq("group_id", membership.group_id).eq("is_current", true).maybeSingle()).data;
  const organizerProfile = rotation ? (await (supabase.from("profiles") as unknown as { select(columns: string): { eq(column: string, value: string): { maybeSingle(): Promise<{ data: Profile | null }> } } }).select("full_name, avatar_url").eq("id", rotation.user_id).maybeSingle()).data : null;
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString().slice(0, 10);
  const nextMonthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
  const event = (await (supabase.from("events") as unknown as { select(columns: string): { eq(column: string, value: string): { in(column: string, values: string[]): { gte(column: string, value: string): { lt(column: string, value: string): { order(column: string, options: { ascending: boolean }): { limit(count: number): { maybeSingle(): Promise<{ data: Event | null }> } } } } } } } }).select("id, event_date, location, description, status, organizer_id").eq("group_id", membership.group_id).in("status", ["draft", "published"]).gte("event_date", monthStart).lt("event_date", nextMonthStart).order("event_date", { ascending: true }).limit(1).maybeSingle()).data;
  const currentAttendance = event && event.status === "published" ? (await (supabase.from("attendances") as unknown as { select(columns: string): { eq(column: string, value: string): { eq(column: string, value: string): { maybeSingle(): Promise<{ data: Attendance | null }> } } } }).select("status").eq("event_id", event.id).eq("member_id", userData.user.id).maybeSingle()).data : null;
  const attendanceSummaryResult = event?.status === "published" ? await getAttendanceSummary(event.id) : null;
  const latestHistory = (await (supabase.from("restaurant_history") as unknown as { select(columns: string): { eq(column: string, value: string): { order(column: string, options: { ascending: boolean }): { limit(count: number): { maybeSingle(): Promise<{ data: History | null }> } } } } }).select("restaurant_name, visited_at").eq("group_id", membership.group_id).order("visited_at", { ascending: false }).limit(1).maybeSingle()).data;
  return <main className="space-y-6"><EventPanel currentUserId={userData.user.id} event={event} attendanceSummary={attendanceSummaryResult?.success ? attendanceSummaryResult.data : null} currentUserAttendance={currentAttendance?.status ?? null} organizer={rotation ? { user_id: rotation.user_id, full_name: organizerProfile?.full_name ?? null, avatar_url: organizerProfile?.avatar_url ?? null } : null} latestHistory={latestHistory} /></main>;
}
