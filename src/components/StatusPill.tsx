import { cn } from "@/lib/utils";
import { statusLabel, statusTone } from "@/lib/diagnosis-client";

const TONES: Record<string, string> = {
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  destructive: "bg-destructive/15 text-destructive border-destructive/30",
  muted: "bg-muted text-muted-foreground border-border",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const tone = statusTone(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  );
}

export function ConfidenceMeter({ value }: { value: number }) {
  const v = Math.round(value ?? 0);
  const tone = v >= 85 ? "bg-success" : v >= 70 ? "bg-warning" : "bg-destructive";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">AI Confidence</span>
        <span className="font-mono font-semibold">{v}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${v}%` }} />
      </div>
      {v < 70 && (
        <p className="text-xs font-medium text-destructive">Manual inspection recommended.</p>
      )}
    </div>
  );
}
