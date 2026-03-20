import { buildOAuthRedirectUrl, completeOAuthSignIn, normalizeRedirectPath } from '@/lib/auth';
import { buildLoginRedirect, isProtectedPath } from '@/middleware';
import * as supabaseModule from '@/lib/supabase';
import type { NextRequest } from 'next/server';

const replace = vi.fn();
const getSession = vi.fn();
const select = vi.fn();
const eq = vi.fn();
const maybeSingle = vi.fn();
const signOut = vi.fn();

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

    select.mockReturnValue({ eq });
    eq.mockReturnValue({ maybeSingle });

    vi.mocked(supabaseModule.getSupabaseBrowserClient).mockReturnValue({
      auth: {
        getSession,
        signOut,
      },
      from: vi.fn(() => ({ select })),
    } as never);
  });

  it('redirects legacy OAuth callbacks to /groups after confirming the profile exists', async () => {
    getSession.mockResolvedValue({
      error: null,
      data: {
        session: { access_token: 'token', user: { id: 'user-1' } },
      },
    });
    maybeSingle.mockResolvedValue({ error: null, data: { id: 'user-1' } });

    const result = await completeOAuthSignIn(new URLSearchParams('code=abc'), { replace });

    expect(result).toEqual({ status: 'success', redirectTo: '/groups' });
    expect(replace).toHaveBeenCalledWith('/groups');
  });

  it('redirects authenticated users to /dashboard when the callback carries the target route', async () => {
    getSession.mockResolvedValue({
      error: null,
      data: {
        session: { access_token: 'token', user: { id: 'user-1' } },
      },
    });
    maybeSingle.mockResolvedValue({ error: null, data: { id: 'user-1' } });

    const result = await completeOAuthSignIn(new URLSearchParams('code=abc&next=%2Fdashboard'), { replace });

    expect(result).toEqual({ status: 'success', redirectTo: '/dashboard' });
    expect(replace).toHaveBeenCalledWith('/dashboard');
  });

  it('returns home without a critical error when the user cancels OAuth', async () => {
    const result = await completeOAuthSignIn(new URLSearchParams('error_code=access_denied'), { replace });

    expect(result).toEqual({ status: 'cancelled', redirectTo: '/' });
    expect(replace).toHaveBeenCalledWith('/');
  });

  it('surfaces a retryable error when the profile trigger did not create public.profiles', async () => {
    getSession.mockResolvedValue({
      error: null,
      data: {
        session: { access_token: 'token', user: { id: 'user-1' } },
      },
    });
    maybeSingle.mockResolvedValue({ error: null, data: null });

    const result = await completeOAuthSignIn(new URLSearchParams('code=abc&next=%2Fdashboard'), { replace });

    expect(result).toEqual({
      status: 'error',
      message: 'Tu cuenta se creó, pero no pudimos preparar tu perfil. Reintentá para continuar.',
    });
    expect(signOut).toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalledWith('/dashboard');
  });

  it('surfaces a retryable error when the OAuth session cannot be recovered', async () => {
    getSession.mockResolvedValue({ error: new Error('timeout'), data: { session: null } });

    const result = await completeOAuthSignIn(new URLSearchParams('code=abc&next=%2Fdashboard'), { replace });

    expect(result).toEqual({
      status: 'error',
      message: 'No pudimos conectarte, intentá de nuevo',
    });
  });
});

describe('auth redirect helpers', () => {
  it('normalizes unsafe redirect paths and keeps safe in-app destinations', () => {
    expect(normalizeRedirectPath('/dashboard?tab=members')).toBe('/dashboard?tab=members');
    expect(normalizeRedirectPath('https://google.com')).toBe('/dashboard');
    expect(normalizeRedirectPath('/auth/callback?code=123')).toBe('/dashboard');
  });

  it('builds an OAuth callback URL that preserves navigation context', () => {
    expect(buildOAuthRedirectUrl('https://monthly-dinner.app', '/dashboard?tab=settings')).toBe(
      'https://monthly-dinner.app/auth/callback?next=%2Fdashboard%3Ftab%3Dsettings',
    );
  });

  it('marks the expected routes as protected', () => {
    expect(isProtectedPath('/dashboard')).toBe(true);
    expect(isProtectedPath('/groups/invitations')).toBe(true);
    expect(isProtectedPath('/auth/callback')).toBe(false);
  });

  it('redirects expired sessions to login without losing the intended route', () => {
    const request = {
      url: 'https://monthly-dinner.app/dashboard?tab=settings',
      nextUrl: {
        pathname: '/dashboard',
        search: '?tab=settings',
      },
    } as NextRequest;

    expect(buildLoginRedirect(request).toString()).toBe(
      'https://monthly-dinner.app/?next=%2Fdashboard%3Ftab%3Dsettings',
    );
  });
});
