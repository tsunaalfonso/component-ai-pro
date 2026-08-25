import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Camera, Upload, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/diagnosis/")({
  head: () => ({
    meta: [
      { title: "AI Diagnosis — Smart Multi-Tester" },
      { name: "description", content: "Start a new AI diagnosis of an integrated circuit from a live capture or an uploaded image." },
      { property: "og:title", content: "AI Diagnosis — Smart Multi-Tester" },
      { property: "og:description", content: "Start a new AI diagnosis from a live capture or uploaded component image." },
    ],
  }),
  component: DiagnosisHome,
});

function DiagnosisHome() {
  const { user } = useAuth();
  const { data: recent = [] } = useQuery({
    queryKey: ["recent-diagnoses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnoses")
        .select("id, created_at, component_name, status")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="AI Diagnosis"
        description="Choose a capture method. The analysis evaluates burn marks, pin condition, corrosion, cracks and heat damage."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/camera" className="panel group p-6 transition-colors hover:border-primary/60">
          <div className="grid size-10 place-items-center rounded-lg bg-primary/12 text-primary">
            <Camera className="size-5" />
          </div>
          <h2 className="mt-4 flex items-center gap-2 text-base font-semibold">
            Live camera capture <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Capture the component directly from a bench or phone camera, then analyze instantly.
          </p>
        </Link>

        <Link to="/upload" className="panel group p-6 transition-colors hover:border-primary/60">
          <div className="grid size-10 place-items-center rounded-lg bg-primary/12 text-primary">
            <Upload className="size-5" />
          </div>
          <h2 className="mt-4 flex items-center gap-2 text-base font-semibold">
            Upload an image <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Use an existing photograph — JPG, PNG or WEBP up to 20MB.
          </p>
        </Link>
      </div>

      <div className="panel mt-4 p-5">
        <h2 className="text-sm font-semibold">Latest analyses</h2>
        <div className="mt-3 divide-y divide-border">
          {recent.map((r) => (
            <Link
              key={r.id}
              to="/diagnosis/$id"
              params={{ id: r.id }}
              className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-primary"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.component_name ?? "Unidentified component"}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
              <StatusPill status={r.status} />
            </Link>
          ))}
          {!recent.length && (
            <p className="py-8 text-center text-sm text-muted-foreground">No analyses recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
