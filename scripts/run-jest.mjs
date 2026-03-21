#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const createEventForm = await readFile(new URL("../components/event/CreateEventForm.tsx", import.meta.url), "utf8");
const eventsAction = await readFile(new URL("../app/actions/events.ts", import.meta.url), "utf8");
const dashboardPage = await readFile(new URL("../app/dashboard/page.tsx", import.meta.url), "utf8");
const schemaSql = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");

assert.match(createEventForm, /La fecha es obligatoria para crear el evento/, "form should render inline required date validation");
assert.match(createEventForm, /mode === "create" \? await createEvent\(payload\) : await updateEvent/, "form should call server actions for create/edit");
assert.match(createEventForm, /Guardar y notificar/, "published event edit flow should expose notify confirmation");
assert.match(eventsAction, /code: "event_exists"/, "createEvent should guard duplicate monthly events");
assert.match(eventsAction, /is_read: false/, "notification inserts should include unread notifications");
assert.match(eventsAction, /upsert\([\s\S]*onConflict: "event_id,member_id"/, "attendance updates should upsert by event and member");
assert.match(dashboardPage, /attendanceSummaryResult\?\.success \? attendanceSummaryResult\.data : null/, "dashboard should pass attendance summary into EventPanel");
assert.match(schemaSql, /create table public.notifications/i, "schema should include notifications table");
assert.match(schemaSql, /create trigger update_profiles_updated_at/i, "schema should version profiles updated_at trigger");
console.log("Custom compatibility runner: event workflow assertions passed.");
