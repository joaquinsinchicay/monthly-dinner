import { describe, expect, it, vi, beforeEach } from 'vitest';

const exchangeCodeForSession = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession,
    },
  })),
}));

describe('GET /auth/callback', () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
  });

  it('redirige a /dashboard cuando el code es válido y se crea la sesión', async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });

    const { GET } = await import('@/app/auth/callback/route');
    const response = await GET(new Request('http://localhost:3000/auth/callback?code=valid_code') as never);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
    expect(exchangeCodeForSession).toHaveBeenCalledWith('valid_code');
  });

  it('redirige a /login cuando el usuario cancela y no llega code', async () => {
    const { GET } = await import('@/app/auth/callback/route');
    const response = await GET(new Request('http://localhost:3000/auth/callback') as never);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });
});
