'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';

import { authCopy, getStatusCopy, type AuthStatus } from '@/lib/auth-copy';
import { signInWithGoogle } from '@/lib/auth';

const LOGIN_CARD_CLASSES = {
  page: 'login-page auth-shell',
  card: 'hero-card surface-card stack-gap-lg auth-card',
  intro: 'stack-gap-sm',
  subtitle: 'body-md muted-copy auth-subtitle',
  actionGroup: 'stack-gap-sm',
  button: 'primary-button auth-primary-button',
  secondaryPanel: 'soft-panel stack-gap-sm',
  divider: 'auth-divider',
  quote: 'soft-panel stack-gap-sm auth-quote',
} as const;

/**
 * Renders the feedback panel used for OAuth redirect states and recoverable auth messages.
 *
 * @param props - Component props.
 * @param props.status - Auth redirect status to resolve into localized copy.
 * @returns The status panel markup or null when there is no matching status.
 */
function StatusPanel({ status }: { status: AuthStatus | null }) {
  const copy = status ? getStatusCopy(status) : null;

  if (!copy) {
    return null;
  }

  return (
    <div className={LOGIN_CARD_CLASSES.secondaryPanel} role="status">
      <p className="label">{copy.label}</p>
      <h2 className="headline">{copy.headline}</h2>
      <p className="body-sm">{copy.body}</p>
    </div>
  );
}

/**
 * Renders the animated label shown inside the Google CTA while OAuth is starting.
 *
 * @param props - Component props.
 * @param props.loading - Whether the OAuth redirect has been initiated.
 * @param props.text - Visible button copy.
 * @returns The button content with an optional spinner.
 */
function GoogleButtonLabel({ loading, text }: { loading: boolean; text: string }) {
  return (
    <>
      {loading ? (
        <span
          aria-hidden="true"
          style={{
            width: 18,
            height: 18,
            borderRadius: '999px',
            border: '2px solid rgba(255,255,255,0.45)',
            borderTopColor: 'white',
            animation: 'spin 0.8s linear infinite',
            display: 'inline-block',
            marginRight: 10,
          }}
        />
      ) : null}
      <span>{text}</span>
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}

/**
 * Renders the login landing card and starts the Google OAuth flow.
 *
 * @param props - Component props.
 * @param props.redirectTo - Safe internal path to restore after authentication succeeds.
 * @param props.status - Optional redirect status to render recovery messaging.
 * @returns The login landing UI for `/login`.
 */
export function LoginCard({ redirectTo, status }: { redirectTo: string; status: AuthStatus | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const actionText = useMemo(
    () => (loading ? authCopy.oauth_progress.headline : authCopy.landing.btn_google),
    [loading],
  );

  /**
   * Starts the Google OAuth redirect with the preserved destination.
   *
   * @returns A promise that resolves once the redirect URL has been requested.
   */
  async function handleGoogleSignIn() {
    setLoading(true);
    setError(false);

    const result = await signInWithGoogle({
      origin: window.location.origin,
      nextPath: redirectTo,
    });

    if (result.status === 'error') {
      setError(true);
      setLoading(false);
      return;
    }

    window.location.assign(result.url);
  }

  return (
    <main className={LOGIN_CARD_CLASSES.page}>
      <section className={LOGIN_CARD_CLASSES.card}>
        <div className={LOGIN_CARD_CLASSES.intro}>
          <p className="label">{authCopy.landing.eyebrow}</p>
          <h1 className="display-title auth-title">
            <span>{authCopy.landing.headline_line1}</span>
            <span>{authCopy.landing.headline_line2}</span>
          </h1>
          <p className={LOGIN_CARD_CLASSES.subtitle}>{authCopy.landing.subtitle}</p>
        </div>

        <div className={LOGIN_CARD_CLASSES.actionGroup}>
          <button className={LOGIN_CARD_CLASSES.button} disabled={loading} onClick={handleGoogleSignIn}>
            <GoogleButtonLabel loading={loading} text={actionText} />
          </button>
          <p className="body-sm muted-copy">{authCopy.landing.google_disclaimer}</p>
        </div>

        {loading ? (
          <div className={LOGIN_CARD_CLASSES.secondaryPanel} role="status">
            <h2 className="headline">{authCopy.oauth_progress.headline}</h2>
            <p className="body-sm">{authCopy.oauth_progress.body}</p>
          </div>
        ) : null}

        <StatusPanel status={status} />
        {error ? <StatusPanel status="oauth_error" /> : null}

        <div className={LOGIN_CARD_CLASSES.divider} aria-hidden="true">
          <span>{authCopy.landing.divider_label}</span>
        </div>

        <p className="body-sm muted-copy">
          {authCopy.landing.invite_prompt} <Link href="/invite/demo-token">{authCopy.landing.invite_cta}</Link>
        </p>

        <blockquote className={LOGIN_CARD_CLASSES.quote}>
          <p className="body-sm">{authCopy.landing.quote_text}</p>
          <footer className="label">{authCopy.landing.quote_author}</footer>
        </blockquote>
      </section>
    </main>
  );
}
