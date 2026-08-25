import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { signedUrl, toDataUrl } from "@/lib/diagnosis-client";
import { buildReportPdf, type DiagnosisRow } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Smart Multi-Tester" },
      { name: "description", content: "Generate and download signed PDF diagnosis reports with QR verification codes." },
      { property: "og:title", content: "Reports — Smart Multi-Tester" },
      { property: "og:description", content: "Generate and download PDF diagnosis reports with QR verification." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { user, profile } = useAuth();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["report-rows", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnoses")
        .select("*")
        .neq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as DiagnosisRow[];
    },
  });

  const download = async (row: DiagnosisRow) => {
    setBusyId(row.id);
    try {
      const url = await signedUrl(row.image_path, row.source);
      const dataUrl = url ? await toDataUrl(url) : null;
      const blob = await buildReportPdf(row, dataUrl, profile?.full_name || profile?.email || "Technician");
      const path = `${row.user_id}/${row.id}.pdf`;
      await supabase.storage
        .from("reports")
        .upload(path, blob, { contentType: "application/pdf", upsert: true });
      await supabase
        .from("reports")
        .upsert({ diagnosis_id: row.id, user_id: row.user_id, pdf_path: path }, { onConflict: "diagnosis_id" });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `diagnosis-${row.id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(href);
      toast.success("Report downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate the report.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Export laboratory-grade PDF reports including the component image, findings and a QR reference code."
      />

      {isLoading ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : rows.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((r) => (
            <div key={r.id} className="panel flex items-center gap-4 p-4">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <Link to="/diagnosis/$id" params={{ id: r.id }} className="truncate font-medium hover:text-primary">
                  {r.component_name ?? "Unidentified component"}
                </Link>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </p>
                <div className="mt-2">
                  <StatusPill status={r.status} />
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => void download(r)} disabled={busyId === r.id}>
                {busyId === r.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="panel p-10 text-center text-sm text-muted-foreground">
          No completed analyses available for export yet.
        </p>
      )}
    </div>
  );
}
