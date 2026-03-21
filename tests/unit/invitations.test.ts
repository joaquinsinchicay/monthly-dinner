import { isInvitationExpired } from "@/lib/invitations";

describe("isInvitationExpired", () => {
  it("returns true for expired tokens", () => {
    expect(isInvitationExpired("2000-01-01T00:00:00.000Z")).toBe(true);
  });

  it("returns false for null expirations", () => {
    expect(isInvitationExpired(null)).toBe(false);
  });
});
