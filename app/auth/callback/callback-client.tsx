'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { completeOAuthSignIn } from '@/lib/auth';

/**
 * Handles the Supabase OAuth return URL, converts Google responses into UI
 * states, and only redirects after the profile trigger has been verified.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Validando tu acceso con Google…');
  const [retryVisible, setRetryVisible] = useState(false);

  useEffect(() => {
    let active = true;
    async function run() {
      const result = await completeOAuthSignIn(
        new URLSearchParams(searchParams.toString()),
        router
      );
      if (!active || result.status !== 'error') return;
      setMessage(result.message);
      setRetryVisible(true);
    }
    void run();
    return () => { active = false; };
  }, [router, searchParams]);

  return (
    <main>
      <section className="panel">
        <p className="small">Autenticación</p>
        <h1>Procesando callback OAuth</h1>
        <p>{message}</p>
        {retryVisible ? (
          <button className="secondary-button" onClick={() => router.replace('/')}>
            Reintentar
          </button>
        ) : null}
      </section>
    </main>
  );
}
