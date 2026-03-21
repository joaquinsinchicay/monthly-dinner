'use client';

import React from 'react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { authCopy, getStatusCopy, type AuthStatus } from '@/lib/auth-copy';
import { signInWithGoogle } from '@/lib/auth';

function StatusPanel({ status }: { status: AuthStatus | null }) {
  const copy = status ? getStatusCopy(status) : null;

  if (!copy) {
    return null;
  }

  return (
    <div className="soft-panel stack-gap-sm" role="status">
      <p className="label">{copy.label}</p>
      <h2 className="headline">{copy.headline}</h2>
      <p className="body-sm">{copy.body}</p>
    </div>
  );
}

export function LoginCard({ redirectTo, status }: { redirectTo: string; status: AuthStatus | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const actionText = useMemo(
    () => (loading ? authCopy.oauth_progress.headline : authCopy.landing.btn_google),
    [loading],
  );

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
    <main className="login-page auth-shell">
      <section className="hero-card surface-card stack-gap-lg auth-card">
        <div className="stack-gap-sm">
          <p className="label">{authCopy.landing.eyebrow}</p>
          <h1 className="display-title auth-title">
            <span>{authCopy.landing.headline_line1}</span>
            <span>{authCopy.landing.headline_line2}</span>
          </h1>
          <p className="body-md muted-copy auth-subtitle">{authCopy.landing.subtitle}</p>
        </div>

        <div className="stack-gap-sm">
          <button className="primary-button auth-primary-button" disabled={loading} onClick={handleGoogleSignIn}>
            {actionText}
          </button>
          <p className="body-sm muted-copy">{authCopy.landing.google_disclaimer}</p>
        </div>

        {loading ? (
          <div className="soft-panel stack-gap-sm" role="status">
            <h2 className="headline">{authCopy.oauth_progress.headline}</h2>
            <p className="body-sm">{authCopy.oauth_progress.body}</p>
          </div>
        ) : null}

        <StatusPanel status={status} />
        {error ? <StatusPanel status="oauth_error" /> : null}

        <div className="auth-divider" aria-hidden="true">
          <span>{authCopy.landing.divider_label}</span>
        </div>

        <p className="body-sm muted-copy">
          {authCopy.landing.invite_prompt} <Link href="/invite/demo-token">{authCopy.landing.invite_cta}</Link>
        </p>

        <blockquote className="soft-panel stack-gap-sm auth-quote">
          <p className="body-sm">{authCopy.landing.quote_text}</p>
          <footer className="label">{authCopy.landing.quote_author}</footer>
        </blockquote>
      </section>
    </main>
  );
}
