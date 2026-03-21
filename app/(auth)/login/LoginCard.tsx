'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';

import { authCopy, getStatusCopy, type AuthStatus } from '@/lib/auth-copy';
import { signInWithGoogle } from '@/lib/auth';

/**
 * Visual design tokens for the production login screen.
 * These values are the visual source of truth for this component and should not be hardcoded elsewhere in the file.
 */
const t = {
  surface: '#fcf9f8',
  surfaceLow: '#f6f3f2',
  surfaceLowest: '#ffffff',
  surfaceHigh: '#ede9e8',
  primary: '#004ac6',
  primaryCont: '#2563eb',
  onSurface: '#1c1b1b',
  secondary: '#585f6c',
  tertiary: '#006242',
  tertiaryFixed: '#6ffbbe',
  error: '#ba1a1a',
  errorCont: '#ffdad6',
  outlineVar: '#c3c6d7',
  shadow: '0px 10px 30px -5px rgba(28,27,27,0.07)',
  shadowMd: '0px 20px 50px -10px rgba(28,27,27,0.13)',
  orbBlue: '#dce2f3',
  quoteBg: '#3d2b1f',
  quoteText: '#f5e6d3',
  quoteAuthor: '#a8896a',
  buttonShadow: '0 4px 16px rgba(0,74,198,0.25)',
} as const;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

  .screen-wrapper {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    padding: 24px 20px 80px;
    background: ${t.surface};
    color: ${t.onSurface};
    font-family: 'DM Sans', sans-serif;
    display: grid;
    place-items: center;
    isolation: isolate;
  }

  .login-shell {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 720px;
    display: grid;
    justify-items: stretch;
  }

  .card {
    position: relative;
    z-index: 1;
    width: 100%;
    border-radius: 20px;
    background: ${t.surfaceLowest};
    box-shadow: ${t.shadowMd};
    padding: 28px 24px;
    display: grid;
    gap: 22px;
  }

  .fade-up,
  .fade-up-1,
  .fade-up-2,
  .fade-up-3,
  .fade-up-4 {
    opacity: 0;
    transform: translateY(18px);
    animation: fadeUp 0.55s cubic-bezier(.22,.68,0,1.2) forwards;
  }

  .fade-up-1 { animation-delay: 0.08s; }
  .fade-up-2 { animation-delay: 0.18s; }
  .fade-up-3 { animation-delay: 0.28s; }
  .fade-up-4 { animation-delay: 0.38s; }

  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(18px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .eyebrow,
  .quote-author,
  .panel-label,
  .support-copy,
  .micro-copy {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .eyebrow,
  .support-copy,
  .micro-copy,
  .panel-copy,
  .panel-label {
    color: ${t.secondary};
  }

  .eyebrow {
    margin: 0 0 8px;
  }

  .headline {
    margin: 0;
    display: grid;
    gap: 4px;
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: clamp(2.25rem, 8vw, 4rem);
    line-height: 0.98;
    letter-spacing: -0.02em;
    font-weight: 400;
  }

  .subtitle,
  .micro-copy,
  .panel-copy,
  .quote-copy {
    margin: 0;
    line-height: 1.6;
  }

  .subtitle {
    color: ${t.secondary};
    max-width: 32rem;
    font-size: 1rem;
  }

  .action-group,
  .status-panel,
  .quote-card,
  .stack-sm {
    display: grid;
    gap: 12px;
  }

  .primary-button {
    appearance: none;
    border: none;
    border-radius: 9999px;
    background: linear-gradient(45deg, ${t.primary}, ${t.primaryCont});
    box-shadow: ${t.buttonShadow};
    color: ${t.surfaceLowest};
    min-height: 56px;
    width: 100%;
    padding: 14px 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: pointer;
    transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
  }

  .primary-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0,74,198,0.3);
  }

  .primary-button:active:not(:disabled) {
    transform: translateY(0);
    opacity: 0.88;
  }

  .primary-button:disabled {
    cursor: wait;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    border: 2px solid rgba(255,255,255,0.45);
    border-top-color: ${t.surfaceLowest};
    animation: spin 0.8s linear infinite;
    flex: 0 0 auto;
  }

  .status-panel {
    border-radius: 18px;
    padding: 18px;
    background: ${t.surfaceLow};
  }

  .status-title {
    margin: 0;
    font-size: 1.25rem;
    color: ${t.onSurface};
  }

  .divider {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
    color: ${t.secondary};
  }

  .divider::before,
  .divider::after {
    content: '';
    height: 1px;
    background: linear-gradient(90deg, transparent, ${t.outlineVar}, transparent);
  }

  .invite-link {
    color: ${t.primary};
    text-underline-offset: 3px;
    text-decoration-thickness: 1px;
  }

  .quote-card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 400px;
    margin-top: 20px;
    padding: 20px 24px;
    border-radius: 16px;
    background: ${t.quoteBg};
  }

  .quote-copy {
    color: ${t.quoteText};
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 15px;
    font-style: italic;
    margin: 0 0 10px;
  }

  .quote-author {
    color: ${t.quoteAuthor};
    margin: 0;
  }

  .bg-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(70px);
    opacity: 0.35;
    pointer-events: none;
  }

  .bg-orb--blue {
    z-index: 0;
    width: 320px;
    height: 320px;
    top: -80px;
    right: -80px;
    background: ${t.orbBlue};
  }

  .bg-orb--green {
    width: 200px;
    height: 200px;
    left: -60px;
    bottom: 60px;
    background: ${t.tertiaryFixed};
  }

  .google-icon {
    flex: 0 0 auto;
  }

  @media (max-width: 480px) {
    .screen-wrapper {
      padding: 20px;
    }

    .card {
      padding: 24px 20px;
    }
  }
`;

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
    <div className="status-panel fade-up-4" role="status">
      <p className="panel-label">{copy.label}</p>
      <h2 className="status-title">{copy.headline}</h2>
      <p className="panel-copy">{copy.body}</p>
    </div>
  );
}

/**
 * Renders the official Google logomark used inside the sign-in CTA.
 * This SVG matches the official multi-color Google mark and should not be visually altered.
 *
 * @returns Inline Google SVG sized for the primary login button.
 */
function GoogleIcon() {
  return (
    <svg className="google-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

/**
 * Renders the animated label shown inside the Google CTA while OAuth is starting.
 *
 * @param props - Component props.
 * @param props.loading - Whether the OAuth redirect has been initiated.
 * @param props.text - Visible button copy.
 * @returns The button content with the Google icon or a loading spinner.
 */
function GoogleButtonLabel({ loading, text }: { loading: boolean; text: string }) {
  return (
    <>
      {loading ? <span className="spinner" aria-hidden="true" /> : <GoogleIcon />}
      <span>{text}</span>
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
    <main className="screen-wrapper">
      <style>{css}</style>
      {/* Decorative orb: adds the cool blue highlight from the prototype and must never intercept pointer input. */}
      <div className="bg-orb bg-orb--blue" aria-hidden="true" />
      {/* Decorative orb: adds the warm green balance from the prototype and must never intercept pointer input. */}
      <div className="bg-orb bg-orb--green" aria-hidden="true" />

      <section className="login-shell">
        <div className="card" style={{ boxShadow: t.shadowMd }}>
          <div className="stack-sm">
            <p className="eyebrow fade-up">{authCopy.landing.eyebrow}</p>
            <h1 className="headline fade-up-1">
              <span>{authCopy.landing.headline_line1}</span>
              <span>{authCopy.landing.headline_line2}</span>
            </h1>
            <p className="subtitle fade-up-2">{authCopy.landing.subtitle}</p>
          </div>

          <div className="action-group fade-up-3">
            <button className="primary-button" disabled={loading} onClick={handleGoogleSignIn}>
              <GoogleButtonLabel loading={loading} text={actionText} />
            </button>
            <p className="micro-copy">{authCopy.landing.google_disclaimer}</p>
          </div>

          {loading ? (
            <div className="status-panel fade-up-4" role="status">
              <p className="panel-label">Google OAuth</p>
              <h2 className="status-title">{authCopy.oauth_progress.headline}</h2>
              <p className="panel-copy">{authCopy.oauth_progress.body}</p>
            </div>
          ) : null}

          <StatusPanel status={status} />
          {error ? <StatusPanel status="oauth_error" /> : null}

          <div className="divider fade-up-4" aria-hidden="true">
            <span className="support-copy">{authCopy.landing.divider_label}</span>
          </div>

          <p className="subtitle fade-up-4">
            {authCopy.landing.invite_prompt} <Link className="invite-link" href="/invite/demo-token">{authCopy.landing.invite_cta}</Link>
          </p>

        </div>

        <blockquote className="quote-card fade-up-4">
          <p className="quote-copy">{authCopy.landing.quote_text}</p>
          <footer className="quote-author">{authCopy.landing.quote_author}</footer>
        </blockquote>
      </section>
    </main>
  );
}
