'use client';

import React from 'react';
import { useState } from 'react';

import { authCopy } from '@/lib/auth-copy';
import { signInWithGoogle } from '@/lib/auth';

function formatMembersMore(count: number) {
  return authCopy.invite.members_more.replace('{count}', String(count));
}

export function InviteJoin({ token, groupName, members }: { token: string; groupName: string; members: string[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleJoin() {
    setLoading(true);
    setError(false);

    const result = await signInWithGoogle({
      origin: window.location.origin,
      nextPath: '/dashboard',
      inviteToken: token,
    });

    if (result.status === 'error') {
      setError(true);
      setLoading(false);
      return;
    }

    window.location.assign(result.url);
  }

  const visibleMembers = members.slice(0, 3);
  const remainingMembers = members.length - visibleMembers.length;

  return (
    <div className="hero-card surface-card stack-gap-lg auth-card">
      <div className="stack-gap-sm">
        <p className="label">{authCopy.invite.label}</p>
        <span className="status-pill status-pill--published auth-badge">{authCopy.invite.badge_valid}</span>
        <h1 className="display-title auth-title-sm">
          <span>{authCopy.invite.headline_prefix}</span>
          <span>{groupName}</span>
        </h1>
        <p className="body-sm muted-copy">{authCopy.invite.disclaimer}</p>
      </div>

      <div className="soft-panel stack-gap-sm">
        <p className="label">{authCopy.invite.members_label}</p>
        <div className="stack-gap-sm">
          {visibleMembers.map((member) => (
            <p key={member} className="body-sm">{member}</p>
          ))}
          {remainingMembers > 0 ? <p className="body-sm muted-copy">{formatMembersMore(remainingMembers)}</p> : null}
        </div>
      </div>

      <div className="stack-gap-sm">
        <button className="primary-button auth-primary-button" disabled={loading} onClick={handleJoin}>
          {loading ? authCopy.invite.btn_joining : authCopy.invite.btn_join}
        </button>
        {error ? (
          <div className="soft-panel stack-gap-sm" role="alert">
            <p className="label">{authCopy.oauth_error.label}</p>
            <p className="body-sm">{authCopy.oauth_error.body}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
