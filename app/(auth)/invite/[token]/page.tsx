import Link from 'next/link';

import { InviteJoin } from '@/app/(auth)/invite/[token]/InviteJoin';
import { authCopy } from '@/lib/auth-copy';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { validateInviteToken } from '@/lib/invite';

function InviteExpired() {
  return (
    <section className="hero-card surface-card stack-gap auth-card">
      <p className="label">{authCopy.invite_expired.label}</p>
      <h1 className="headline">{authCopy.invite_expired.headline}</h1>
      <p className="body-md muted-copy">{authCopy.invite_expired.body}</p>
      <div className="soft-panel stack-gap-sm">
        <p className="label">{authCopy.invite_expired.advice_label}</p>
        <p className="body-sm">{authCopy.invite_expired.advice_body}</p>
      </div>
      <Link className="primary-link-button" href="/login">
        {authCopy.invite_expired.btn_back}
      </Link>
    </section>
  );
}

function AlreadyMember() {
  return (
    <section className="hero-card surface-card stack-gap auth-card">
      <p className="label">{authCopy.already_member.label}</p>
      <h1 className="headline">{authCopy.already_member.headline}</h1>
      <p className="body-md muted-copy">{authCopy.already_member.body}</p>
      <Link className="primary-link-button" href="/dashboard?status=already_member">
        {authCopy.already_member.btn_continue}
      </Link>
    </section>
  );
}

/** Server Component: validates the invite token and current membership before choosing expired, already-member, or join UI. */
export default async function InvitePage({ params }: { params: { token: string } }) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await validateInviteToken(supabase, params.token, user);

  return (
    <main className="login-page auth-shell">
      {result.status === 'expired' ? <InviteExpired /> : null}
      {result.status === 'valid' && result.alreadyMember ? <AlreadyMember /> : null}
      {result.status === 'valid' && !result.alreadyMember ? (
        <InviteJoin
          token={params.token}
          groupName={result.group.name}
          members={result.members.map((member) => member.full_name).filter((member): member is string => Boolean(member))}
        />
      ) : null}
    </main>
  );
}
