import type { Database } from "@/types";

export type InvitationLinkRecord = Pick<
  Database["public"]["Tables"]["invitation_links"]["Row"],
  "id" | "group_id" | "expires_at" | "token"
>;

export function isInvitationExpired(expiresAt: string | null): boolean {
  if (!expiresAt) {
    return false;
  }

  return new Date(expiresAt).getTime() < Date.now();
}
