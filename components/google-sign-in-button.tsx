'use client';

import { useState } from 'react';

import { Button } from '@/components/ui';
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
    <div className="auth-card">
      <Button onClick={handleClick} disabled={loading}>
        {loading ? 'Conectando…' : 'Ingresar con Google'}
      </Button>
      {message ? (
        <div className="error-panel" role="alert">
          <p>{message}</p>
          <Button variant="secondary" onClick={handleClick} disabled={loading}>
            Reintentar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
