'use client';

import { useState } from 'react';

import { signInWithGoogle } from '@/lib/auth';

export function GoogleSignInButton({ nextPath }: { nextPath?: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    setMessage(null);

    const result = await signInWithGoogle(window.location.origin, nextPath);
    if (result.status === 'error') {
      setMessage(result.message);
      setLoading(false);
      return;
    }

    window.location.assign(result.url);
  }

  return (
    <div className="stack-gap-sm">
      <button className="primary-button" onClick={handleClick} disabled={loading}>
        {loading ? 'Conectando con Google…' : 'Ingresar con Google'}
      </button>
      {message ? (
        <div className="soft-panel" role="alert">
          <p className="body-sm">{message}</p>
          <button className="secondary-button" onClick={handleClick} disabled={loading}>
            Reintentar
          </button>
        </div>
      ) : null}
    </div>
  );
}
