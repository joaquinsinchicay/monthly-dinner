'use client';

import { useState } from 'react';

import { signInWithGoogle } from '@/lib/auth';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.26c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9.002 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.712A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.33z"
        fill="#FBBC05"
      />
      <path
        d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9.002 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

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
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        style={{ backgroundColor: '#2563EB' }}
      >
        <GoogleIcon />
        {loading ? 'Connecting...' : 'Continue with Google'}
      </button>
      {message ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600" role="alert">
          <p>{message}</p>
          <button
            onClick={handleClick}
            disabled={loading}
            className="mt-3 w-full rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
          >
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}
