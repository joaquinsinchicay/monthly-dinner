import { completeOAuthSignIn } from '@/lib/auth';
import * as supabaseModule from '@/lib/supabase';

const replace = vi.fn();
const exchangeCodeForSession = vi.fn();
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
    exchangeCodeForSession.mockReset();
    select.mockReset();
    eq.mockReset();
    maybeSingle.mockReset();
    signOut.mockReset();

    select.mockReturnValue({ eq });
    eq.mockReturnValue({ maybeSingle });

    vi.mocked(supabaseModule.getSupabaseBrowserClient).mockReturnValue({
      auth: {
        exchangeCodeForSession,
        signOut,
      },
      from: vi.fn(() => ({ select })),
    } as never);
  });

  it('redirects new OAuth users to /groups after confirming the profile exists', async () => {
    exchangeCodeForSession.mockResolvedValue({
      error: null,
      data: {
        session: { access_token: 'token' },
        user: { id: 'user-1' },
      },
    });
    maybeSingle.mockResolvedValue({ error: null, data: { id: 'user-1' } });

    const result = await completeOAuthSignIn(new URLSearchParams('code=abc'), { replace });

    expect(result).toEqual({ status: 'success', redirectTo: '/groups' });
    expect(replace).toHaveBeenCalledWith('/groups');
  });

  it('returns home without a critical error when the user cancels OAuth', async () => {
    const result = await completeOAuthSignIn(new URLSearchParams('error_code=access_denied'), { replace });

    expect(result).toEqual({ status: 'cancelled', redirectTo: '/' });
    expect(replace).toHaveBeenCalledWith('/');
  });

  it('surfaces a retryable error when the profile trigger did not create public.profiles', async () => {
    exchangeCodeForSession.mockResolvedValue({
      error: null,
      data: {
        session: { access_token: 'token' },
        user: { id: 'user-1' },
      },
    });
    maybeSingle.mockResolvedValue({ error: null, data: null });

    const result = await completeOAuthSignIn(new URLSearchParams('code=abc'), { replace });

    expect(result).toEqual({
      status: 'error',
      message: 'Tu cuenta se creó, pero no pudimos preparar tu perfil. Reintentá para continuar.',
    });
    expect(signOut).toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalledWith('/groups');
  });

  it('surfaces a retryable error when the OAuth code exchange times out or fails', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: new Error('timeout'), data: { session: null } });

    const result = await completeOAuthSignIn(new URLSearchParams('code=abc'), { replace });

    expect(result).toEqual({
      status: 'error',
      message: 'No pudimos conectarte, intentá de nuevo',
    });
  });
});
