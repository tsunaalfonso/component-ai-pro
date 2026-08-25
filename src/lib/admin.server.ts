export const ADMIN_EMAIL = "shernanjerk@gmail.com";

type MinimalClient = {
  from: (t: string) => {
    select: (c: string) => {
      eq: (a: string, b: string) => {
        eq: (a: string, b: string) => { maybeSingle: () => Promise<{ data: unknown }> };
      };
    };
  };
};

/** Throws unless the given user holds the admin role. */
export async function assertAdmin(supabase: MinimalClient, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Administrator access required.");
}
