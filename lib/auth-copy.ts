import authMessages from '@/public/locales/auth.json';

export type AuthMessages = typeof authMessages;

export const authCopy = authMessages;

export type AuthStatus = 'oauth_cancelled' | 'oauth_error' | 'already_member';

/** Returns the localized auth status payload shown after redirects and OAuth recovery. */
export function getStatusCopy(status: AuthStatus) {
  switch (status) {
    case 'oauth_cancelled':
      return authCopy.oauth_cancelled;
    case 'oauth_error':
      return authCopy.oauth_error;
    case 'already_member':
      return authCopy.already_member;
  }
}
