import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Diagnosis history — Smart Multi-Tester" },
      { name: "description", content: "Browse, search and filter every recorded AI component diagnosis." },
      { property: "og:title", content: "Diagnosis history — Smart Multi-Tester" },
      { property: "og:description", content: "Browse, search and filter recorded AI component diagnoses." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnoses")
        .select("id, created_at, component_name, package_type, status, confidence, source, severity")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const filtered = rows.filter((r) => {
    const matchesQ =
      !q ||
      (r.component_name ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (r.package_type ?? "").toLowerCase().includes(q.toLowerCase());
    const matchesStatus = status === "all" || r.status === status;
    return matchesQ && matchesStatus;
  });

  return (
    <div>
      <PageHeader title="Diagnosis history" description="Every analysis recorded under your account." />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search component or package"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="possible_defect">Possible defect</SelectItem>
            <SelectItem value="severe_defect">Severe defect</SelectItem>
            <SelectItem value="undetermined">Undetermined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Component</th>
              <th className="px-4 py-3">Package</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin text-primary" />
                </td>
              </tr>
            )}
            {!isLoading &&
              filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link to="/diagnosis/$id" params={{ id: r.id }} className="font-medium hover:text-primary">
                      {r.component_name ?? "Unidentified component"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.package_type ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.source === "camera" ? "Live camera" : "Upload"}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums">{Math.round(r.confidence ?? 0)}%</td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status} />
                  </td>
                </tr>
              ))}
            {!isLoading && !filtered.length && (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                  No diagnoses match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
