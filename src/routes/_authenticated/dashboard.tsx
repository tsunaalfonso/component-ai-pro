import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, AlertTriangle, CheckCircle2, ScanSearch } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Smart Multi-Tester" },
      { name: "description", content: "Diagnostic activity overview, component health distribution and recent analyses." },
      { property: "og:title", content: "Dashboard — Smart Multi-Tester" },
      { property: "og:description", content: "Diagnostic activity overview and recent AI component analyses." },
    ],
  }),
  component: Dashboard,
});

const COLORS: Record<string, string> = {
  healthy: "oklch(0.72 0.16 155)",
  possible_defect: "oklch(0.78 0.16 78)",
  severe_defect: "oklch(0.62 0.22 26)",
  undetermined: "oklch(0.65 0.02 250)",
  pending: "oklch(0.65 0.02 250)",
};

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: number | string;
  tone: string;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className={`size-4 ${tone}`} />
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Dashboard() {
  const { user, profile } = useAuth();

  const { data: rows = [] } = useQuery({
    queryKey: ["diagnoses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnoses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const total = rows.length;
  const healthy = rows.filter((r) => r.status === "healthy").length;
  const defects = rows.filter((r) => r.status === "possible_defect" || r.status === "severe_defect").length;
  const avg = total ? Math.round(rows.reduce((s, r) => s + (r.confidence ?? 0), 0) / total) : 0;

  const byStatus = Object.entries(
    rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const damage = Object.entries(
    rows.reduce<Record<string, number>>((acc, r) => {
      (r.visible_damage ?? []).forEach((d: string) => {
        acc[d] = (acc[d] ?? 0) + 1;
      });
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    return {
      day: key.slice(5),
      scans: rows.filter((r) => r.created_at.slice(0, 10) === key).length,
    };
  });

  return (
    <div>
      <PageHeader
        title={`Welcome, ${profile?.full_name?.split(" ")[0] ?? "technician"}`}
        description="Diagnostic activity across your component analyses."
        action={
          <Button asChild>
            <Link to="/diagnosis">
              <ScanSearch className="mr-2 size-4" /> New diagnosis
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Activity} label="Total scans" value={total} tone="text-primary" />
        <Stat icon={CheckCircle2} label="Healthy" value={healthy} tone="text-success" />
        <Stat icon={AlertTriangle} label="Defective" value={defects} tone="text-destructive" />
        <Stat icon={ScanSearch} label="Avg. confidence" value={`${avg}%`} tone="text-primary" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">Scans — last 14 days</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={days}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Line type="monotone" dataKey="scans" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="text-sm font-semibold">Health distribution</h2>
          <div className="mt-4 h-64">
            {byStatus.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {byStatus.map((s) => (
                      <Cell key={s.name} fill={COLORS[s.name] ?? "var(--muted)"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--popover-foreground)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-16 text-center text-sm text-muted-foreground">No analyses recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-sm font-semibold">Most frequent damage types</h2>
          <div className="mt-4 h-64">
            {damage.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={damage} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis type="category" dataKey="name" width={130} stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-16 text-center text-sm text-muted-foreground">No damage data yet.</p>
            )}
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="text-sm font-semibold">Recent diagnoses</h2>
          <div className="mt-3 divide-y divide-border">
            {rows.slice(0, 6).map((r) => (
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
            {!rows.length && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No diagnoses yet. Start with a camera capture or an image upload.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
