import type { User } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

export type InviteValidationResult =
  | { status: 'expired' }
  | {
      status: 'valid';
      invite: Database['public']['Tables']['invite_tokens']['Row'];
      group: Database['public']['Tables']['groups']['Row'];
      members: Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'display_name' | 'avatar_url'>[];
      alreadyMember: boolean;
    };

/**
 * Validates an invitation token and resolves the group context needed by the invite route.
 * @param supabase Supabase server or route client with access to auth cookies.
 * @param token Invitation token from `/invite/[token]`.
 * @param user Current authenticated Supabase user, when present.
 * @returns A normalized result indicating whether the token is valid and whether the user is already a member.
 */
export async function validateInviteToken(
  supabase: any,
  token: string,
  user: User | null,
): Promise<InviteValidationResult> {
  const inviteQuery = await (supabase
    .from('invite_tokens')
    .select('id, token, group_id, created_by, expires_at, used_at, created_at, groups ( id, name, created_at )')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle());

  if (inviteQuery.error || !inviteQuery.data || !inviteQuery.data.groups) {
    return { status: 'expired' };
  }

  const group = Array.isArray(inviteQuery.data.groups) ? inviteQuery.data.groups[0] : inviteQuery.data.groups;

  const membersQuery = await (supabase
    .from('group_members')
    .select('profile_id, profiles ( id, display_name, avatar_url )')
    .eq('group_id', inviteQuery.data.group_id)
    .limit(5));

  const members = (membersQuery.data ?? [])
    .flatMap((member: { profiles?: { id: string; display_name?: string | null; avatar_url: string | null } | null }) => (member.profiles && !Array.isArray(member.profiles) ? [member.profiles] : []));

  let alreadyMember = false;
  if (user) {
    const memberQuery = await (supabase
      .from('group_members')
      .select('id')
      .eq('group_id', inviteQuery.data.group_id)
      .eq('profile_id', user.id)
      .maybeSingle());

    alreadyMember = Boolean(memberQuery.data);
  }

  return {
    status: 'valid',
    invite: inviteQuery.data,
    group,
    members,
    alreadyMember,
  };
}
