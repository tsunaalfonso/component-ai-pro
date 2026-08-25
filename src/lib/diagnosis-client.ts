import { supabase } from "@/integrations/supabase/client";

export const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const MAX_BYTES = 20 * 1024 * 1024;

export function validateImage(file: File): string | null {
  if (!ACCEPTED.includes(file.type.toLowerCase())) return "Only JPG, PNG, JPEG and WEBP images are supported.";
  if (file.size > MAX_BYTES) return "Image exceeds the 20MB maximum size.";
  return null;
}

function extFor(type: string) {
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  return "jpg";
}

export async function uploadImage(
  userId: string,
  blob: Blob,
  source: "upload" | "camera",
): Promise<string> {
  const bucket = source === "camera" ? "camera-captures" : "component-images";
  const path = `${userId}/${crypto.randomUUID()}.${extFor(blob.type)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: blob.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function createDiagnosis(userId: string, imagePath: string, source: "upload" | "camera") {
  const { data, error } = await supabase
    .from("diagnoses")
    .insert({ user_id: userId, image_path: imagePath, source, status: "pending" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function signedUrl(path: string, source: string, bucketOverride?: string) {
  const bucket = bucketOverride ?? (source === "camera" ? "camera-captures" : "component-images");
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function statusLabel(status: string) {
  switch (status) {
    case "healthy":
      return "Component appears normal";
    case "possible_defect":
      return "Possible defect detected";
    case "severe_defect":
      return "Severe defect detected";
    case "undetermined":
      return "Cannot determine from image";
    default:
      return "Pending analysis";
  }
}

export function statusTone(status: string): "success" | "warning" | "destructive" | "muted" {
  if (status === "healthy") return "success";
  if (status === "possible_defect") return "warning";
  if (status === "severe_defect") return "destructive";
  return "muted";
}
