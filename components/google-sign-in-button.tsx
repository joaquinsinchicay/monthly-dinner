'use client';

import { useState } from 'react';

import { signInWithGoogle } from '@/lib/auth';
import { Button } from '@/components/ui';

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
    <div className="space-y-4">
      <Button onClick={handleClick} disabled={loading} className="w-full justify-center gap-3">
        <span className="material-symbols-outlined text-xl">login</span>
        {loading ? 'Conectando con Google…' : 'Ingresar con Google'}
      </Button>
      {message ? (
        <div className="space-y-3 rounded-xl border border-error/20 bg-red-50 p-4 text-sm text-error" role="alert">
          <p>{message}</p>
          <Button variant="secondary" onClick={handleClick} disabled={loading} className="w-full justify-center">
            Reintentar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
