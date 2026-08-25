import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CircuitBoard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdminAccount } from "@/lib/admin.functions";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Smart Multi-Tester" },
      {
        name: "description",
        content: "Sign in or request a technician account for the Smart Multi-Tester AI diagnostic console.",
      },
      { property: "og:title", content: "Sign in — Smart Multi-Tester" },
      {
        property: "og:description",
        content: "Access the AI-assisted IC diagnostics console for repair laboratories.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    void ensureAdminAccount().catch(() => undefined);
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setRecovery(true);
    }
  }, []);

  useEffect(() => {
    if (!loading && session && !recovery) void navigate({ to: "/dashboard" });
  }, [loading, session, recovery, navigate]);

  const signIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed in");
    void navigate({ to: "/dashboard" });
  };

  const register = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: { full_name: String(form.get("full_name") ?? "") },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. No email code needed — an administrator will approve your access.");
  };

  const forgot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(String(form.get("email")).trim(), {
      redirectTo: `${window.location.origin}/auth`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password reset link sent.");
  };

  const updatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: String(form.get("password")) });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated.");
    setRecovery(false);
    void navigate({ to: "/dashboard" });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="grid-instrument hidden flex-col justify-between border-r border-border p-12 lg:flex">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary">
            <CircuitBoard className="size-5" />
          </div>
          <span className="text-sm font-semibold">Smart Multi-Tester</span>
        </Link>
        <div>
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Laboratory-grade AI diagnosis for integrated circuits.
          </h2>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            New technician accounts require administrator approval before the diagnostic console
            becomes available.
          </p>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Secure diagnostic console
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          {recovery ? (
            <form onSubmit={updatePassword} className="panel space-y-4 p-6">
              <h1 className="text-lg font-semibold">Set a new password</h1>
              <div className="space-y-2">
                <Label htmlFor="np">New password</Label>
                <Input id="np" name="password" type="password" minLength={8} required />
              </div>
              <Button className="w-full" disabled={busy}>
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Update password
              </Button>
            </form>
          ) : (
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
                <TabsTrigger value="forgot">Reset</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={signIn} className="panel space-y-4 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="le">Email</Label>
                    <Input id="le" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lp">Password</Label>
                    <Input id="lp" name="password" type="password" required autoComplete="current-password" />
                  </div>
                  <Button className="w-full" disabled={busy}>
                    {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Sign in
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={register} className="panel space-y-4 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="rn">Full name</Label>
                    <Input id="rn" name="full_name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="re">Email</Label>
                    <Input id="re" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rp">Password</Label>
                    <Input id="rp" name="password" type="password" minLength={8} required autoComplete="new-password" />
                  </div>
                  <Button className="w-full" disabled={busy}>
                    {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Create account
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Accounts require administrator approval before access is granted.
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="forgot">
                <form onSubmit={forgot} className="panel space-y-4 p-6">
                  <div className="space-y-2">
                    <Label htmlFor="fe">Email</Label>
                    <Input id="fe" name="email" type="email" required />
                  </div>
                  <Button className="w-full" disabled={busy}>
                    {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Send reset link
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
