import { buildOAuthRedirectUrl, completeOAuthSignIn, normalizeRedirectPath, signInWithGoogle } from '@/lib/auth';
import { buildLoginRedirect, isProtectedPath } from '@/middleware';
import * as supabaseModule from '@/lib/supabase';
import type { NextRequest } from 'next/server';

const replace = vi.fn();
const getSession = vi.fn();
const select = vi.fn();
const eq = vi.fn();
const maybeSingle = vi.fn();
const signOut = vi.fn();
const signInWithOAuth = vi.fn();

vi.mock('@/lib/supabase', () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

describe('completeOAuthSignIn', () => {
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

    vi.mocked(supabaseModule.getSupabaseBrowserClient).mockReturnValue({
      auth: { getSession, signOut, signInWithOAuth },
      from: vi.fn(() => ({ select })),
    } as never);
  });

  it('redirige el callback a la ruta protegida del grupo cuando el perfil existe', async () => {
    getSession.mockResolvedValue({ error: null, data: { session: { access_token: 'token', user: { id: 'user-1' } } } });
    maybeSingle.mockResolvedValue({ error: null, data: { id: 'user-1' } });

    const result = await completeOAuthSignIn(new URLSearchParams('code=abc'), { replace });

    expect(result).toEqual({ status: 'success', redirectTo: '/group/group-curated-table' });
    expect(replace).toHaveBeenCalledWith('/group/group-curated-table');
  });

  it('preserva la ruta protegida cuando viene en next', async () => {
    getSession.mockResolvedValue({ error: null, data: { session: { access_token: 'token', user: { id: 'user-1' } } } });
    maybeSingle.mockResolvedValue({ error: null, data: { id: 'user-1' } });

    const result = await completeOAuthSignIn(new URLSearchParams('code=abc&next=%2Fgroup%2Fgroup-curated-table%2Fhistory'), { replace });

    expect(result).toEqual({ status: 'success', redirectTo: '/group/group-curated-table/history' });
    expect(replace).toHaveBeenCalledWith('/group/group-curated-table/history');
  });

  it('vuelve al login cuando el usuario cancela OAuth', async () => {
    const result = await completeOAuthSignIn(new URLSearchParams('error_code=access_denied'), { replace });

    expect(result).toEqual({ status: 'cancelled', redirectTo: '/login' });
    expect(replace).toHaveBeenCalledWith('/login');
  });

  it('inválida la sesión si el perfil no existe', async () => {
    getSession.mockResolvedValue({ error: null, data: { session: { access_token: 'token', user: { id: 'user-1' } } } });
    maybeSingle.mockResolvedValue({ error: null, data: null });

    const result = await completeOAuthSignIn(new URLSearchParams('code=abc'), { replace });

    expect(result).toEqual({ status: 'error', message: 'Tu cuenta se creó, pero no pudimos preparar tu perfil. Reintentá para continuar.' });
    expect(signOut).toHaveBeenCalled();
  });
});

describe('signInWithGoogle', () => {
  it('envía a Supabase el callback exacto con next', async () => {
    signInWithOAuth.mockResolvedValue({ data: { url: 'https://supabase.example.com/oauth' }, error: null });

    const result = await signInWithGoogle('https://monthly-dinner.app', '/group/group-curated-table/checklist');

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://monthly-dinner.app/auth/callback?next=%2Fgroup%2Fgroup-curated-table%2Fchecklist',
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      },
    });
    expect(result).toEqual({ status: 'redirect', url: 'https://supabase.example.com/oauth' });
  });
});

describe('auth redirect helpers', () => {
  it('normaliza destinos seguros y rechaza externos', () => {
    expect(normalizeRedirectPath('/group/group-curated-table?tab=members')).toBe('/group/group-curated-table?tab=members');
    expect(normalizeRedirectPath('https://google.com')).toBe('/group/group-curated-table');
    expect(normalizeRedirectPath('/auth/callback?code=123')).toBe('/group/group-curated-table');
  });

  it('builds the callback url preserving navigation context', () => {
    expect(buildOAuthRedirectUrl('https://monthly-dinner.app', '/group/group-curated-table/history')).toBe(
      'https://monthly-dinner.app/auth/callback?next=%2Fgroup%2Fgroup-curated-table%2Fhistory',
    );
  });

  it('marks protected routes including the new group tree', () => {
    expect(isProtectedPath('/group/group-curated-table')).toBe(true);
    expect(isProtectedPath('/group/group-curated-table/history')).toBe(true);
    expect(isProtectedPath('/auth/callback')).toBe(false);
  });

  it('redirects expired tokens to login without losing context', () => {
    const request = {
      url: 'https://monthly-dinner.app/group/group-curated-table/history?q=ajo',
      nextUrl: { pathname: '/group/group-curated-table/history', search: '?q=ajo' },
    } as NextRequest;

    expect(buildLoginRedirect(request).toString()).toBe(
      'https://monthly-dinner.app/login?next=%2Fgroup%2Fgroup-curated-table%2Fhistory%3Fq%3Dajo',
    );
  });
});
