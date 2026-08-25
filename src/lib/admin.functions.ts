import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAIL = "shernanjerk@gmail.com";

async function assertAdmin(supabase: {
  from: (t: string) => {
    select: (c: string) => {
      eq: (a: string, b: string) => { eq: (a: string, b: string) => { maybeSingle: () => Promise<{ data: unknown }> } };
    };
  };
}, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Administrator access required.");
}

/** Idempotently provisions the default administrator account. */
export const ensureAdminAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", ADMIN_EMAIL)
    .maybeSingle();
  if (existing) return { created: false };

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: "Lindie@29",
    email_confirm: true,
    user_metadata: { full_name: "System Administrator" },
  });
  if (error && !/already/i.test(error.message)) throw new Error(error.message);
  return { created: !error };
});

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { data: profiles, error } = await context.supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const { data: roles } = await context.supabase.from("user_roles").select("user_id, role");
    return (profiles ?? []).map((p) => ({
      ...p,
      role: (roles ?? []).find((r) => r.user_id === p.id)?.role ?? "user",
    }));
  });

export const adminUpdateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        userId: z.string().uuid(),
        approved: z.boolean().optional(),
        disabled: z.boolean().optional(),
        role: z.enum(["admin", "user"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: { approved?: boolean; disabled?: boolean } = {};
    if (data.approved !== undefined) patch.approved = data.approved;
    if (data.disabled !== undefined) patch.disabled = data.disabled;
    if (Object.keys(patch).length) {
      const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.userId);
      if (error) throw new Error(error.message);
    }
    if (data.role) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (error) throw new Error(error.message);
    }
    if (data.disabled !== undefined) {
      await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        ban_duration: data.disabled ? "876000h" : "none",
      });
    }
    await supabaseAdmin.from("system_logs").insert({
      user_id: context.userId,
      user_email: context.claims?.email ?? null,
      action: "admin.user_updated",
      details: `${data.userId}: ${JSON.stringify(data)}`,
    });
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    if (data.userId === context.userId) throw new Error("You cannot delete your own account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("system_logs").insert({
      user_id: context.userId,
      user_email: context.claims?.email ?? null,
      action: "admin.user_deleted",
      details: data.userId,
    });
    return { ok: true };
  });

export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ email: z.string().email(), redirectTo: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(data.email, {
      redirectTo: data.redirectTo,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { data, error } = await context.supabase
      .from("system_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
