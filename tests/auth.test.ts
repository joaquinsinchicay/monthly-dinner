import { readFileSync } from 'node:fs';

import { buildOAuthRedirectUrl, completeOAuthSignIn, normalizeRedirectPath, signInWithGoogle } from '@/lib/auth';
import { buildLoginRedirect, isProtectedPath } from '@/middleware';
import * as clientModule from '@/lib/supabase/client';
import type { NextRequest } from 'next/server';

const replace = vi.fn();
const getSession = vi.fn();
const select = vi.fn();
const eq = vi.fn();
const maybeSingle = vi.fn();
const signOut = vi.fn();
const signInWithOAuth = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

describe('Test 1 y 2 · completeOAuthSignIn', () => {
  beforeEach(() => {
    replace.mockReset();
    getSession.mockReset();
    select.mockReset();
    eq.mockReset();
    maybeSingle.mockReset();
    signOut.mockReset();
    signInWithOAuth.mockReset();

    select.mockReturnValue({ eq });
    eq.mockReturnValue({ maybeSingle });

    vi.mocked(clientModule.getSupabaseBrowserClient).mockReturnValue({
      auth: {
        getSession,
        signOut,
        signInWithOAuth,
      },
      from: vi.fn(() => ({ select })),
    } as never);
  });

  it('crea sesión y redirige al dashboard para un registro OAuth nuevo con profile existente', async () => {
    getSession.mockResolvedValue({
      error: null,
      data: { session: { access_token: 'token', user: { id: 'user-1' } } },
    });
    maybeSingle.mockResolvedValue({ error: null, data: { id: 'user-1' } });

    const result = await completeOAuthSignIn(new URLSearchParams('code=abc&next=%2Fdashboard'), { replace });

    expect(result).toEqual({ status: 'success', redirectTo: '/dashboard' });
    expect(replace).toHaveBeenCalledWith('/dashboard');
  });

  it('no duplica perfiles cuando el email ya existía y el callback resuelve al dashboard', async () => {
    getSession.mockResolvedValue({
      error: null,
      data: { session: { access_token: 'token', user: { id: 'user-1' } } },
    });
    maybeSingle.mockResolvedValue({ error: null, data: { id: 'user-1' } });

    const result = await completeOAuthSignIn(new URLSearchParams('code=abc'), { replace });

    expect(result).toEqual({ status: 'success', redirectTo: '/dashboard' });
    expect(replace).toHaveBeenCalledWith('/dashboard');
  });

  it('muestra error recuperable cuando falla la creación del profile por trigger', async () => {
    getSession.mockResolvedValue({
      error: null,
      data: { session: { access_token: 'token', user: { id: 'user-1' } } },
    });
    maybeSingle.mockResolvedValue({ error: null, data: null });

    const result = await completeOAuthSignIn(new URLSearchParams('code=abc&next=%2Fdashboard'), { replace });

    expect(result).toEqual({
      status: 'error',
      message: 'Tu cuenta se autenticó, pero no pudimos preparar tu perfil. Reintentá para continuar.',
    });
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});

describe('Test 3 y 4 · cancelación y fallo técnico', () => {
  beforeEach(() => {
    replace.mockReset();
    signInWithOAuth.mockReset();
  });

  it('vuelve a /login con mensaje suave cuando el usuario cancela Google OAuth', async () => {
    const result = await completeOAuthSignIn(new URLSearchParams('error_code=access_denied'), { replace });

    expect(result).toEqual({ status: 'cancelled', redirectTo: '/login' });
    expect(replace).toHaveBeenCalledWith('/login?message=cancelled');
  });

  it('muestra error recuperable cuando el provider devuelve un fallo técnico', async () => {
    signInWithOAuth.mockResolvedValue({ data: { url: null }, error: new Error('oauth failed') });

    const result = await signInWithGoogle('https://monthly-dinner.app', '/dashboard');

    expect(result).toEqual({
      status: 'error',
      message: 'Hubo un problema al conectar con Google. Reintentá para continuar.',
    });
  });
});

describe('helpers de navegación protegida', () => {
  it('normaliza redirects inseguros y preserva rutas internas válidas', () => {
    expect(normalizeRedirectPath('/dashboard?tab=members')).toBe('/dashboard?tab=members');
    expect(normalizeRedirectPath('https://google.com')).toBe('/dashboard');
    expect(normalizeRedirectPath('/auth/callback?code=123')).toBe('/dashboard');
  });

  it('construye la URL de callback OAuth con el target original', () => {
    expect(buildOAuthRedirectUrl('https://monthly-dinner.app', '/dashboard?tab=settings')).toBe(
      'https://monthly-dinner.app/auth/callback?next=%2Fdashboard%3Ftab%3Dsettings',
    );
  });

  it('protege dashboard y preserva la ruta al redirigir a login', () => {
    expect(isProtectedPath('/dashboard')).toBe(true);
    expect(isProtectedPath('/login')).toBe(false);

    const request = {
      url: 'https://monthly-dinner.app/dashboard?tab=settings',
      nextUrl: { pathname: '/dashboard', search: '?tab=settings' },
    } as NextRequest;

    expect(buildLoginRedirect(request).toString()).toBe('https://monthly-dinner.app/login?next=%2Fdashboard%3Ftab%3Dsettings');
  });
});

describe('Test 5 · schema SQL base', () => {
  const migration = readFileSync('supabase/migrations/001_initial_schema.sql', 'utf8');

  it('define las cuatro tablas, constraints y el trigger de profile automático', () => {
    expect(migration).toContain('CREATE TABLE public.profiles');
    expect(migration).toContain('CREATE TABLE public.groups');
    expect(migration).toContain('CREATE TABLE public.group_members');
    expect(migration).toContain('CREATE TABLE public.events');
    expect(migration).toContain('UNIQUE (group_id, user_id)');
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.handle_new_user()');
    expect(migration).toContain('CREATE TRIGGER on_auth_user_created');
    expect(migration).toContain('ON CONFLICT (id) DO NOTHING');
  });

  it('habilita RLS en todas las tablas públicas y define las políticas pedidas', () => {
    expect(migration.match(/ENABLE ROW LEVEL SECURITY/g)).toHaveLength(4);
    expect(migration).toContain('CREATE POLICY "profiles_self"');
    expect(migration).toContain('CREATE POLICY "groups_members_only"');
    expect(migration).toContain('CREATE POLICY "group_members_same_group"');
  });
});
