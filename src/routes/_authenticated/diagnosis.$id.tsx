import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { DiagnosisResult } from "@/components/DiagnosisResult";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import type { DiagnosisRow } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/diagnosis/$id")({
  head: () => ({
    meta: [
      { title: "Diagnosis report — Smart Multi-Tester" },
      { name: "description", content: "Detailed AI failure analysis of an electronic component, with recommendations and a downloadable PDF report." },
      { property: "og:title", content: "Diagnosis report — Smart Multi-Tester" },
      { property: "og:description", content: "Detailed AI failure analysis with recommendations and PDF export." },
    ],
  }),
  component: DiagnosisDetail,
});

function DiagnosisDetail() {
  const { id } = Route.useParams();
  const { profile } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["diagnosis", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("diagnoses").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data as DiagnosisRow | null;
    },
  });

  return (
    <div>
      <PageHeader
        title="Diagnosis report"
        description="AI failure analysis with technician recommendations."
        action={
          <Button asChild variant="outline">
            <Link to="/history">
              <ArrowLeft className="mr-2 size-4" /> Back to history
            </Link>
          </Button>
        }
      />
      {isLoading ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : data ? (
        <DiagnosisResult row={data} technician={profile?.full_name || profile?.email || "Technician"} />
      ) : (
        <p className="panel p-8 text-center text-sm text-muted-foreground">
          This diagnosis record was not found.
        </p>
      )}
    </div>
  );
}
