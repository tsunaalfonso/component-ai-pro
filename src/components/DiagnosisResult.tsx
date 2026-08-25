import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StatusPill, ConfidenceMeter } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { signedUrl, toDataUrl } from "@/lib/diagnosis-client";
import { buildReportPdf, type DiagnosisRow } from "@/lib/pdf";
import { supabase } from "@/integrations/supabase/client";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

export function DiagnosisResult({
  row,
  technician,
}: {
  row: DiagnosisRow;
  technician: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void signedUrl(row.image_path, row.source).then((u) => active && setUrl(u));
    return () => {
      active = false;
    };
  }, [row.image_path, row.source]);

  const download = async () => {
    setBusy(true);
    try {
      const dataUrl = url ? await toDataUrl(url) : null;
      const blob = await buildReportPdf(row, dataUrl, technician);
      const path = `${row.user_id}/${row.id}.pdf`;
      await supabase.storage.from("reports").upload(path, blob, {
        contentType: "application/pdf",
        upsert: true,
      });
      await supabase.from("reports").upsert(
        { diagnosis_id: row.id, user_id: row.user_id, pdf_path: path },
        { onConflict: "diagnosis_id" },
      );
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `diagnosis-${row.id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(href);
      toast.success("Report generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate the report.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
      <div className="panel overflow-hidden">
        {url ? (
          <img src={url} alt={`Component ${row.component_name ?? "under analysis"}`} className="w-full object-cover" />
        ) : (
          <div className="grid aspect-square place-items-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}
        <div className="space-y-3 border-t border-border p-4">
          <ConfidenceMeter value={row.confidence ?? 0} />
          <Button className="w-full" onClick={() => void download()} disabled={busy}>
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
            Download PDF report
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusPill status={row.status} />
            <span className="font-mono text-xs text-muted-foreground">
              {new Date(row.created_at).toLocaleString()}
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed">{row.summary ?? "No summary available."}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Field label="Component" value={row.component_name} />
            <Field label="Package" value={row.package_type} />
            <Field label="Manufacturer" value={row.manufacturer} />
            <Field label="Severity" value={row.severity} />
            <Field label="Repairability" value={row.repairability} />
            <Field label="Capture source" value={row.source === "camera" ? "Live camera" : "Upload"} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="panel p-5">
            <h3 className="text-sm font-semibold">Visible damage</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {(row.visible_damage?.length ? row.visible_damage : ["None detected"]).map((d) => (
                <li key={d} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {d}
                </li>
              ))}
            </ul>
            <h3 className="mt-5 text-sm font-semibold">Probable cause</h3>
            <p className="mt-2 text-sm text-muted-foreground">{row.possible_cause ?? "—"}</p>
          </div>

          <div className="panel p-5">
            <h3 className="text-sm font-semibold">Recommendations</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {(row.recommendations?.length ? row.recommendations : ["No specific action recorded."]).map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-success" />
                  {r}
                </li>
              ))}
            </ul>
            <h3 className="mt-5 text-sm font-semibold">Recommended action</h3>
            <p className="mt-2 text-sm text-muted-foreground">{row.recommended_action ?? "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
