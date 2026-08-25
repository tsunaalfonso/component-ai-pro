import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Upload as UploadIcon, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { analyzeDiagnosis } from "@/lib/diagnosis.functions";
import { createDiagnosis, uploadImage, validateImage } from "@/lib/diagnosis-client";

export const Route = createFileRoute("/_authenticated/upload")({
  head: () => ({
    meta: [
      { title: "Upload component image — Smart Multi-Tester" },
      { name: "description", content: "Upload a JPG, PNG or WEBP image of an IC for AI failure analysis." },
      { property: "og:title", content: "Upload component image — Smart Multi-Tester" },
      { property: "og:description", content: "Upload an IC photograph and run AI failure analysis." },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeDiagnosis);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const pick = (f: File | undefined | null) => {
    if (!f) return;
    const err = validateImage(f);
    if (err) {
      toast.error(err);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const run = async () => {
    if (!file || !user) return;
    setBusy(true);
    try {
      const path = await uploadImage(user.id, file, "upload");
      const id = await createDiagnosis(user.id, path, "upload");
      await analyze({ data: { diagnosisId: id } });
      toast.success("Analysis complete");
      void navigate({ to: "/diagnosis/$id", params: { id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Upload component image"
        description="JPG, PNG or WEBP up to 20MB. Use a sharp, well-lit, top-down photograph of the component."
      />

      <div className="panel p-6">
        {preview ? (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-xl border border-border">
              <img src={preview} alt="Selected component" className="max-h-[420px] w-full object-contain bg-muted" />
              <Button
                size="icon"
                variant="secondary"
                className="absolute right-3 top-3"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
            <Button className="w-full" size="lg" onClick={() => void run()} disabled={busy}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              {busy ? "Analyzing component…" : "Run AI diagnosis"}
            </Button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              pick(e.dataTransfer.files?.[0]);
            }}
            className={`grid cursor-pointer place-items-center rounded-xl border-2 border-dashed px-6 py-20 text-center transition-colors ${
              drag ? "border-primary bg-primary/5" : "border-border"
            }`}
            onClick={() => inputRef.current?.click()}
          >
            <UploadIcon className="size-8 text-muted-foreground" />
            <p className="mt-4 text-sm font-medium">Drop an image here, or click to browse</p>
            <p className="mt-1 text-xs text-muted-foreground">JPG · PNG · WEBP · max 20MB</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </div>
        )}
      </div>
    </div>
  );
}
