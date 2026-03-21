import React from 'react';
import { render, screen } from '@testing-library/react';

import authJson from '@/public/locales/auth.json';
import { LoginCard } from '@/app/(auth)/login/LoginCard';
import { InviteJoin } from '@/app/(auth)/invite/[token]/InviteJoin';
import { buildOAuthRedirectUrl, normalizeRedirectPath, signInWithGoogle } from '@/lib/auth';
import { validateInviteToken } from '@/lib/invite';
import { buildLoginRedirect, isProtectedPath } from '@/middleware';
import * as supabaseModule from '@/lib/supabase';
import type { NextRequest } from 'next/server';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock('@/lib/supabase', () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

const signInWithOAuth = vi.fn();

describe('US-01 / US-02 OAuth helpers', () => {
  beforeEach(() => {
    signInWithOAuth.mockReset();
    vi.mocked(supabaseModule.getSupabaseBrowserClient).mockReturnValue({
      auth: { signInWithOAuth },
    } as never);
  });

  it('arma el callback OAuth con redirect e invite token', async () => {
    signInWithOAuth.mockResolvedValue({ data: { url: 'https://supabase.example.com/oauth' }, error: null });

    const result = await signInWithGoogle({
      origin: 'https://monthly-dinner.app',
      nextPath: '/dashboard',
      inviteToken: 'demo-token',
    });

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'https://monthly-dinner.app/auth/callback?redirect=%2Fdashboard&invite=demo-token',
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      },
    });
    expect(result).toEqual({ status: 'redirect', url: 'https://supabase.example.com/oauth' });
  });

  it('rechaza destinos inseguros y preserva rutas internas', () => {
    expect(normalizeRedirectPath('/dashboard?tab=members')).toBe('/dashboard?tab=members');
    expect(normalizeRedirectPath('https://google.com')).toBe('/dashboard');
    expect(buildOAuthRedirectUrl('https://monthly-dinner.app', '/group/group-curated-table/history')).toBe(
      'https://monthly-dinner.app/auth/callback?redirect=%2Fgroup%2Fgroup-curated-table%2Fhistory',
    );
  });
});

describe('US-02 middleware', () => {
  it('marca rutas protegidas y preserva el redirect al login', () => {
    expect(isProtectedPath('/dashboard')).toBe(true);
    expect(isProtectedPath('/group/group-curated-table/history')).toBe(true);
    expect(isProtectedPath('/invite/demo-token')).toBe(false);

    const request = {
      url: 'https://monthly-dinner.app/dashboard?q=ajo',
      nextUrl: { pathname: '/dashboard', search: '?q=ajo' },
    } as NextRequest;

    expect(buildLoginRedirect(request).toString()).toBe(
      'https://monthly-dinner.app/login?redirect=%2Fdashboard%3Fq%3Dajo',
    );
  });
});

describe('US-04 invite token validation', () => {
  it('devuelve expired cuando el token no existe o expiró', async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              gt: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ error: null, data: null }) })),
            })),
          })),
        })),
      })),
    } as never;

    await expect(validateInviteToken(supabase, 'expired-token', null)).resolves.toEqual({ status: 'expired' });
  });

  it('devuelve valid cuando el token es vigente, no revocado y el usuario no es miembro', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      error: null,
      data: {
        id: 'invite-1',
        token: 'demo-token',
        group_id: 'group-1',
        created_by: 'user-1',
        expires_at: '2099-01-01T00:00:00Z',
        revoked: false,
        created_at: '2026-03-21T00:00:00Z',
        groups: { id: 'group-1', name: 'Cenas del Jueves', created_at: '2026-03-21T00:00:00Z' },
      },
    });
    const membersLimit = vi.fn().mockResolvedValue({
      data: [{ profiles: { id: 'user-2', full_name: 'Guido', avatar_url: null } }],
    });
    const memberMaybeSingle = vi.fn().mockResolvedValue({ data: null });

    const from = vi.fn((table: string) => {
      if (table === 'invitation_links') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gt: vi.fn(() => ({ maybeSingle })),
              })),
            })),
          })),
        };
      }
      if (table === 'members') {
        return {
          select: vi.fn((selection: string) => {
            if (selection.includes('profiles')) {
              return { eq: vi.fn(() => ({ limit: membersLimit })) };
            }
            return { eq: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: memberMaybeSingle })) })) };
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const result = await validateInviteToken({ from } as never, 'demo-token', { id: 'user-3' } as never);

    expect(result).toMatchObject({
      status: 'valid',
      group: { name: 'Cenas del Jueves' },
      alreadyMember: false,
    });
  });
});

describe('US-07 textos desde JSON', () => {
  it('renderiza LoginCard e InviteJoin sin textos undefined', () => {
    render(<LoginCard redirectTo="/dashboard" status={null} />);
    render(<InviteJoin token="demo-token" groupName="Cenas del Jueves" members={['Ana', 'Beto', 'Caro', 'Dani']} />);

    expect(screen.getAllByText(authJson.landing.btn_google)[0]).toBeInTheDocument();
    expect(screen.getByText(authJson.invite.btn_join)).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('undefined');
  });

  it('expone todas las claves obligatorias del flujo auth', () => {
    expect(authJson.landing.btn_google).toBeTruthy();
    expect(authJson.oauth_progress.headline).toBeTruthy();
    expect(authJson.oauth_cancelled.body).toBeTruthy();
    expect(authJson.invite.btn_join).toBeTruthy();
    expect(authJson.invite_expired.btn_back).toBeTruthy();
    expect(authJson.already_member.btn_continue).toBeTruthy();
    expect(authJson.logout.btn_confirm).toBeTruthy();
  });
});
