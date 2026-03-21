#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const middlewareTs = await readFile(new URL('../middleware.ts', import.meta.url), 'utf8');
const signOutTs = await readFile(new URL('../components/auth/SignOutButton.tsx', import.meta.url), 'utf8');
const dashboardLayoutTs = await readFile(new URL('../app/dashboard/layout.tsx', import.meta.url), 'utf8');

assert.match(middlewareTs, /loginUrl\.searchParams\.set\("next",/, 'middleware should preserve next redirect param');
assert.match(middlewareTs, /pathname === "\/dashboard" \|\| pathname\.startsWith\("\/dashboard\/"\)/, 'dashboard routes must be protected');
assert.match(signOutTs, /signOut\(\{ scope: "global" \}\)/, 'sign-out fallback should clear global session');
assert.match(signOutTs, /router\.push\("\/login"\)/, 'successful sign-out should return to login');
assert.match(dashboardLayoutTs, /<SignOutButton \/>/, 'dashboard layout should expose sign-out control');
console.log('Custom compatibility runner: all auth flow smoke assertions passed.');
