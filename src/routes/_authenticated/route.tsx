import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldAlert, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function Gate({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldAlert;
  title: string;
  body: string;
}) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="grid-instrument flex min-h-screen items-center justify-center px-6">
      <div className="panel max-w-md p-8 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-xl bg-warning/15 text-warning">
          <Icon className="size-6" />
        </div>
        <h1 className="mt-5 text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={async () => {
            await signOut();
            void navigate({ to: "/auth" });
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}

function AuthenticatedLayout() {
  const { loading, profile } = useAuth();

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (profile.disabled) {
    return (
      <Gate
        icon={Ban}
        title="Account disabled"
        body="This account has been disabled by an administrator. Contact your laboratory administrator to restore access."
      />
    );
  }

  if (!profile.approved) {
    return (
      <Gate
        icon={ShieldAlert}
        title="Awaiting approval"
        body="Your technician account is pending administrator approval. You'll gain access to the diagnostic console as soon as it is approved."
      />
    );
  }

  return <AppShell />;
}

