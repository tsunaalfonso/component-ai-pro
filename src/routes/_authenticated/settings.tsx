import { createFileRoute } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Smart Multi-Tester" },
      { name: "description", content: "Console appearance settings and diagnostic system information." },
      { property: "og:title", content: "Settings — Smart Multi-Tester" },
      { property: "og:description", content: "Console appearance settings and system information." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggle } = useTheme();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" description="Console preferences and system information." />

      <div className="panel flex items-center justify-between p-6">
        <div>
          <h2 className="text-sm font-semibold">Appearance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Dark mode is recommended for bench work under low light.
          </p>
        </div>
        <Button variant="outline" onClick={toggle}>
          {theme === "dark" ? <Sun className="mr-2 size-4" /> : <Moon className="mr-2 size-4" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </Button>
      </div>

      <div className="panel mt-4 space-y-3 p-6">
        <h2 className="text-sm font-semibold">Diagnostic engine</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {[
            ["Analysis type", "AI vision · visual inspection"],
            ["Accepted formats", "JPG · PNG · WEBP"],
            ["Maximum image size", "20 MB"],
            ["Confidence threshold", "70% manual-review warning"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{k}</dt>
              <dd className="mt-1 text-sm font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="pt-2 text-xs text-muted-foreground">
          Visual analysis cannot replace electrical testing. Results are advisory and should be
          confirmed with bench instruments before a component is discarded.
        </p>
      </div>
    </div>
  );
}
