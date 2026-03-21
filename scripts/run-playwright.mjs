#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const eventPanel = await readFile(new URL("../components/event/EventPanel.tsx", import.meta.url), "utf8");
const attendanceChips = await readFile(new URL("../components/event/AttendanceChips.tsx", import.meta.url), "utf8");
const newEventPage = await readFile(new URL("../app/dashboard/events/new/page.tsx", import.meta.url), "utf8");
const editEventPage = await readFile(new URL("../app/dashboard/events/[id]/edit/page.tsx", import.meta.url), "utf8");

assert.match(newEventPage, /Solo el organizador del mes puede crear el evento/, "new event page should block non-organizers");
assert.match(newEventPage, /ExistingEventNotice/, "new event page should show existing event notice");
assert.match(editEventPage, /redirect\("\/dashboard"\)/, "edit page should redirect unauthorized users");
assert.match(eventPanel, /La cena de este mes aun no fue convocada\./, "empty dashboard state should be present");
assert.match(eventPanel, /\.channel\(`attendances-\$\{event\.id\}`\)/, "event panel should subscribe to realtime attendances channel");
assert.match(eventPanel, /Reconectando\.\.\./, "event panel should expose reconnecting status");
assert.match(attendanceChips, /updateAttendance\(eventId, nextStatus\)/, "attendance chips should call server action");
console.log("Custom compatibility runner: dashboard event realtime assertions passed.");
