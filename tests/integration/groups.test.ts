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

  it("creates the group via RPC and redirects to dashboard", async () => {
    const supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) })
          })
        })
      }),
      rpc: jest.fn().mockResolvedValue({ data: { group_id: "group-1", name: "Cena mensual" }, error: null })
    };
    createSupabaseServerClientMock.mockReturnValue(supabase);

    const formData = new FormData();
    formData.set("name", "Cena mensual");

    await createGroup(formData);

    expect(supabase.rpc).toHaveBeenCalledWith("create_group_with_admin", { group_name: "Cena mensual" });
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("returns an error when the RPC fails so the UI can preserve the typed value", async () => {
    const supabase = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) })
          })
        })
      }),
      rpc: jest.fn().mockResolvedValue({ data: null, error: { message: "second insert failed" } })
    };
    createSupabaseServerClientMock.mockReturnValue(supabase);

    const formData = new FormData();
    formData.set("name", "Cena mensual");

    await expect(createGroup(formData)).resolves.toEqual({ error: "No se pudo crear el grupo. Intentalo de nuevo." });
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
              eq: jest.fn().mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({ data: { id: "user-1", email: "user@example.com", full_name: null, avatar_url: null, created_at: "", updated_at: "" }, error: null }) })
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
