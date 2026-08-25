import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Smart Multi-Tester" },
      { name: "description", content: "Manage your technician profile details and account password." },
      { property: "og:title", content: "Profile — Smart Multi-Tester" },
      { property: "og:description", content: "Manage technician profile details and account password." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, role, refresh } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? "");
  const [busy, setBusy] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);

  const save = async () => {
    if (!profile) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", profile.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    toast.success("Profile updated");
  };

  const changePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password: String(form.get("password")) });
    setPwBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    e.currentTarget.reset();
    toast.success("Password updated");
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Profile" description="Your technician identity used on exported reports." />

      <div className="panel space-y-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={profile?.email ?? ""} disabled />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Role</p>
            <p className="mt-1 text-sm font-medium capitalize">{role ?? "user"}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Status</p>
            <p className="mt-1 text-sm font-medium">
              {profile?.disabled ? "Disabled" : profile?.approved ? "Approved" : "Pending approval"}
            </p>
          </div>
        </div>
        <Button onClick={() => void save()} disabled={busy}>
          {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Save changes
        </Button>
      </div>

      <form onSubmit={changePassword} className="panel mt-4 space-y-4 p-6">
        <h2 className="text-sm font-semibold">Change password</h2>
        <div className="space-y-2">
          <Label htmlFor="pw">New password</Label>
          <Input id="pw" name="password" type="password" minLength={8} required autoComplete="new-password" />
        </div>
        <Button variant="outline" disabled={pwBusy}>
          {pwBusy && <Loader2 className="mr-2 size-4 animate-spin" />} Update password
        </Button>
      </form>
    </div>
  );
}
