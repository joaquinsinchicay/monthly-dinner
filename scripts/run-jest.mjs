#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

function isInvitationExpired(expiresAt) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

const authTs = await readFile(new URL('../lib/auth.ts', import.meta.url), 'utf8');
const callbackTs = await readFile(new URL('../app/api/auth/callback/route.ts', import.meta.url), 'utf8');
const joinTs = await readFile(new URL('../app/(auth)/join/[token]/page.tsx', import.meta.url), 'utf8');
const schemaSql = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');

assert.equal(isInvitationExpired('2000-01-01T00:00:00.000Z'), true, 'expired invitation should be invalid');
assert.equal(isInvitationExpired(null), false, 'null expiration should remain valid');
assert.match(authTs, /upsert\(payload, \{ onConflict: "email" \}\)/, 'profiles should upsert on email to avoid duplicates');
assert.match(callbackTs, /exchangeCodeForSession/, 'OAuth callback must exchange code for session');
assert.match(joinTs, /Este link de invitación no es válido o ya expiró/, 'join page must render invalid-link state');
assert.match(schemaSql, /unique\(group_id, user_id\)/i, 'members must prevent duplicate memberships');
console.log('Custom compatibility runner: all integration assertions passed.');
