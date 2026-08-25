import { createFileRoute, Link } from "@tanstack/react-router";
import { CircuitBoard, ScanSearch, Camera, ShieldCheck, Activity, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Multi-Tester — AI Diagnosis for ICs & Components" },
      {
        name: "description",
        content:
          "Laboratory-grade AI diagnostics for integrated circuits: capture or upload a component image and get damage detection, severity, confidence and repair recommendations.",
      },
      { property: "og:title", content: "Smart Multi-Tester — AI Diagnosis for ICs & Components" },
      {
        property: "og:description",
        content:
          "Laboratory-grade AI diagnostics for integrated circuits: damage detection, severity, confidence scoring and repair recommendations.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: ScanSearch, title: "AI Visual Diagnosis", body: "Burn marks, bent or missing pins, corrosion, cracks and heat damage identified from a single photograph." },
  { icon: Camera, title: "Live Bench Camera", body: "Capture directly from a workbench camera or phone, with zoom, retake and camera switching." },
  { icon: Activity, title: "Confidence Scoring", body: "Every verdict carries a calibrated confidence score, with a manual-inspection warning below 70%." },
  { icon: FileText, title: "Signed PDF Reports", body: "Export laboratory reports with the component image, findings, recommendations and a QR reference." },
  { icon: ShieldCheck, title: "Approved Access Only", body: "Administrator-approved accounts, role-based access control and private per-technician storage." },
  { icon: CircuitBoard, title: "Built to Extend", body: "Architected for ESP32 testers, multimeters, oscilloscopes and thermal imaging integrations." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
          <div className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary">
            <CircuitBoard className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Smart Multi-Tester</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              AI IC Diagnostics
            </p>
          </div>
          <div className="ml-auto">
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="grid-instrument border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            Diagnostic Instrument Software
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Smart Multi-Tester with Artificial Intelligence for Electronic Component Diagnosis
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            Capture or upload an image of an integrated circuit and receive a structured failure
            analysis: visible damage, severity, probable cause, repairability and technician-ready
            recommendations.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Open the console</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Request an account</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="panel p-5">
              <div className="grid size-9 place-items-center rounded-lg bg-primary/12 text-primary">
                <f.icon className="size-4.5" />
              </div>
              <h2 className="mt-4 text-base font-semibold">{f.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center font-mono text-xs text-muted-foreground">
        SMART MULTI-TESTER · AI COMPONENT DIAGNOSTICS
      </footer>
    </div>
  );
}
