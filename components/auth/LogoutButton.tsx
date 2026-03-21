'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { authCopy } from '@/lib/auth-copy';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export function LogoutButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(authCopy.logout.error);
      setLoading(false);
      return;
    }

    window.sessionStorage.clear();
    window.localStorage.removeItem('supabase.auth.token');
    router.replace('/login');
    router.refresh();
  }

  return (
    <>
      <button className="secondary-button" onClick={() => setOpen(true)}>
        {authCopy.logout.trigger}
      </button>

      {open ? (
        <div className="logout-sheet-backdrop" role="presentation" onClick={() => !loading && setOpen(false)}>
          <div className="logout-sheet stack-gap-sm" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p className="label">{authCopy.logout.trigger}</p>
            <h2 className="headline">{authCopy.logout.sheet_headline}</h2>
            <p className="body-sm">{authCopy.logout.sheet_body}</p>
            {error ? (
              <div className="soft-panel" role="alert">
                <p className="body-sm">{error}</p>
              </div>
            ) : null}
            <div className="cta-row auth-actions">
              <button className="primary-button" disabled={loading} onClick={handleConfirm}>
                {loading ? authCopy.logout.loading : authCopy.logout.btn_confirm}
              </button>
              <button className="secondary-button" disabled={loading} onClick={() => setOpen(false)}>
                {authCopy.logout.btn_cancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
