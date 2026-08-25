import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2, RefreshCw, SwitchCamera, CircleDot } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { analyzeDiagnosis } from "@/lib/diagnosis.functions";
import { createDiagnosis, uploadImage } from "@/lib/diagnosis-client";

export const Route = createFileRoute("/_authenticated/camera")({
  head: () => ({
    meta: [
      { title: "Live camera capture — Smart Multi-Tester" },
      { name: "description", content: "Capture an integrated circuit with a bench or phone camera and run AI failure analysis instantly." },
      { property: "og:title", content: "Live camera capture — Smart Multi-Tester" },
      { property: "og:description", content: "Capture a component live and run AI failure analysis instantly." },
    ],
  }),
  component: CameraPage,
});

function CameraPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeDiagnosis);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shot, setShot] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setReady(false);
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setReady(true);
    } catch {
      setError("Camera access was denied or no camera is available. Allow camera permission or upload an image instead.");
    }
  }, [facing, stop]);

  useEffect(() => {
    if (!shot) void start();
    return stop;
  }, [start, stop, shot]);

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const side = Math.min(video.videoWidth, video.videoHeight) / zoom;
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      video,
      (video.videoWidth - side) / 2,
      (video.videoHeight - side) / 2,
      side,
      side,
      0,
      0,
      side,
      side,
    );
    canvas.toBlob((blob) => {
      if (!blob) return;
      setShot(blob);
      setPreview(URL.createObjectURL(blob));
      stop();
    }, "image/jpeg", 0.92);
  };

  const run = async () => {
    if (!shot || !user) return;
    setBusy(true);
    try {
      const path = await uploadImage(user.id, shot, "camera");
      const id = await createDiagnosis(user.id, path, "camera");
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
        title="Live camera capture"
        description="Center the component in frame, hold steady and capture in good lighting."
      />

      <div className="panel overflow-hidden">
        <div className="relative aspect-square bg-black">
          {preview ? (
            <img src={preview} alt="Captured component" className="size-full object-contain" />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="size-full object-cover"
                style={{ transform: `scale(${zoom})` }}
              />
              <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-primary/60" />
              {!ready && !error && (
                <div className="absolute inset-0 grid place-items-center text-primary-foreground">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              )}
              {error && (
                <div className="absolute inset-0 grid place-items-center p-8 text-center text-sm text-primary-foreground">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-4 border-t border-border p-4">
          {preview ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShot(null);
                  setPreview(null);
                }}
              >
                <RefreshCw className="mr-2 size-4" /> Retake
              </Button>
              <Button className="flex-1" onClick={() => void run()} disabled={busy}>
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                {busy ? "Analyzing component…" : "Run AI diagnosis"}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-[var(--primary)]"
                />
                <span className="font-mono text-xs">{zoom.toFixed(1)}×</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
                >
                  <SwitchCamera className="mr-2 size-4" /> Switch camera
                </Button>
                <Button className="flex-1" onClick={capture} disabled={!ready}>
                  <CircleDot className="mr-2 size-4" /> Capture
                </Button>
                <Button variant="outline" onClick={() => void start()}>
                  <Camera className="mr-2 size-4" /> Restart
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
