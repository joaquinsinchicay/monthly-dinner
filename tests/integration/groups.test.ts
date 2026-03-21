const redirectMock = jest.fn();
const revalidatePathMock = jest.fn();
const createSupabaseServerClientMock = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args)
}));

jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args)
}));

jest.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: (...args: unknown[]) => createSupabaseServerClientMock(...args)
}));

import { GET as authCallbackRoute } from "@/app/api/auth/callback/route";
import { createGroup } from "@/app/actions/groups";
import NewGroupPage from "@/app/(auth)/onboarding/new-group/page";

describe("group onboarding integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates the group with direct inserts and redirects to dashboard", async () => {
    const membersTable = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) })
        })
      }),
      insert: jest.fn().mockResolvedValue({ error: null })
    };
    const groupsTable = {
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: "group-1" }, error: null })
        })
      })
    };
    const supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) },
      from: jest.fn((table: string) => (table === "groups" ? groupsTable : membersTable))
    };
    createSupabaseServerClientMock.mockReturnValue(supabase);

    const formData = new FormData();
    formData.set("name", "Cena mensual");

    await createGroup(formData);

    expect(groupsTable.insert).toHaveBeenCalledWith({ name: "Cena mensual", created_by: "user-1" });
    expect(membersTable.insert).toHaveBeenCalledWith({ group_id: "group-1", user_id: "user-1", role: "admin" });
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("returns an error when the member insert fails", async () => {
    const membersTable = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) })
        })
      }),
      insert: jest.fn().mockResolvedValue({ error: { message: "insert member failed" } })
    };
    const groupsTable = {
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: "group-1" }, error: null })
        })
      })
    };
    const supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) },
      from: jest.fn((table: string) => (table === "groups" ? groupsTable : membersTable))
    };
    createSupabaseServerClientMock.mockReturnValue(supabase);

    const formData = new FormData();
    formData.set("name", "Cena mensual");

    await expect(createGroup(formData)).resolves.toEqual({ error: "No se pudo crear la membresía administradora. Intentalo de nuevo." });
  });

  it("redirects members away from /onboarding/new-group", async () => {
    const supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({ data: { id: "member-1" } }) })
          })
        })
      })
    };
    createSupabaseServerClientMock.mockReturnValue(supabase);

    await NewGroupPage();

    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("sends new OAuth users without memberships to /onboarding", async () => {
    const supabase = {
      auth: {
        exchangeCodeForSession: jest.fn().mockResolvedValue({ error: null }),
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "user@example.com", user_metadata: {} } }, error: null })
      },
      from: jest.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({ data: { id: "user-1", email: "user@example.com", full_name: null, avatar_url: null, display_name: null, created_at: "", updated_at: "" }, error: null }) })
            })
          };
        }

        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) })
            })
          })
        };
      })
    };
    createSupabaseServerClientMock.mockReturnValue(supabase);

    const response = await authCallbackRoute(new Request("http://localhost/api/auth/callback?code=abc"));

    expect(response.headers.get("location")).toBe("http://localhost/onboarding");
  });
});
