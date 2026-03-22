import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const getUser = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser,
    },
  })),
}));

describe('middleware auth protection', () => {
  beforeEach(() => {
    getUser.mockReset();
  });

  it('permite rutas públicas sin consultar sesión', async () => {
    const { middleware } = await import('@/middleware');
    const response = await middleware(new NextRequest('http://localhost:3000/login'));

    expect(response.status).toBe(200);
    expect(getUser).not.toHaveBeenCalled();
  });

  it('redirige a /login cuando no hay sesión en /dashboard', async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const { middleware } = await import('@/middleware');
    const response = await middleware(new NextRequest('http://localhost:3000/dashboard'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login');
  });
});
