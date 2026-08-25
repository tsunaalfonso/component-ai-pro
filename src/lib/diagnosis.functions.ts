import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export const analyzeDiagnosis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ diagnosisId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { analyzeImage } = await import("./ai.server");
    const { buildRecommendations, HEALTHY_RECS } = await import("./recommendations");

    const { data: row, error } = await context.supabase
      .from("diagnoses")
      .select("id, user_id, image_path, source")
      .eq("id", data.diagnosisId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Diagnosis record not found.");
    if (row.user_id !== context.userId) throw new Error("Not allowed.");

    const bucket = row.source === "camera" ? "camera-captures" : "component-images";
    const file = await context.supabase.storage.from(bucket).download(row.image_path);
    if (file.error || !file.data) throw new Error("Could not read the uploaded image.");

    const buf = Buffer.from(await file.data.arrayBuffer());
    if (buf.byteLength > 20 * 1024 * 1024) throw new Error("Image exceeds the 20MB limit.");
    const ext = row.image_path.split(".").pop()?.toLowerCase() ?? "jpg";
    const mime = MIME[ext];
    if (!mime) throw new Error("Unsupported image format. Use JPG, PNG or WEBP.");

    const analysis = await analyzeImage(`data:${mime};base64,${buf.toString("base64")}`);

    const ruleRecs = buildRecommendations(analysis.visible_damage ?? [], analysis.severity);
    const merged = Array.from(
      new Set([
        ...(analysis.recommendations ?? []),
        ...(ruleRecs.length ? ruleRecs : analysis.status === "healthy" ? HEALTHY_RECS : []),
      ]),
    ).filter(Boolean);

    const confidence = Math.max(0, Math.min(100, Number(analysis.confidence) || 0));

    const { data: updated, error: upErr } = await context.supabase
      .from("diagnoses")
      .update({
        component_name: analysis.component_name,
        package_type: analysis.package_type,
        manufacturer: analysis.manufacturer,
        visible_damage: analysis.visible_damage ?? [],
        severity: analysis.severity,
        possible_cause: analysis.possible_cause,
        summary: analysis.summary,
        recommended_action: analysis.recommended_action,
        repairability: analysis.repairability,
        recommendations: merged,
        confidence,
        status: analysis.status,
        analysis: JSON.parse(JSON.stringify(analysis)),
      })
      .eq("id", row.id)
      .select("*")
      .single();
    if (upErr) throw new Error(upErr.message);

    await context.supabase.from("system_logs").insert({
      user_id: context.userId,
      user_email: context.claims?.email ?? null,
      action: "diagnosis.analyzed",
      details: `Diagnosis ${row.id} → ${analysis.status} (${confidence}%)`,
    });

    return updated;
  });
