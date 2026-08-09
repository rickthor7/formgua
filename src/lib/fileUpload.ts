import { supabase } from "@/integrations/supabase/client";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];

export function isImageUrl(url: string): boolean {
  const cleaned = url.split("?")[0].toLowerCase();
  return IMAGE_EXT.some((ext) => cleaned.endsWith(`.${ext}`));
}

/**
 * Parses stored answer value of a file field.
 * Format: "<publicUrl>|<originalFilename>" or legacy plain filename.
 */
export function parseFileAnswer(value: string): { url: string | null; name: string } {
  if (!value) return { url: null, name: "" };
  const idx = value.indexOf("|");
  if (idx === -1) {
    // legacy: only filename stored
    return { url: null, name: value };
  }
  return { url: value.slice(0, idx), name: value.slice(idx + 1) };
}

export function encodeFileAnswer(url: string, name: string): string {
  return `${url}|${name}`;
}

export async function uploadFormFile(formId: string, file: File): Promise<string> {
  if (file.size > MAX_SIZE) {
    throw new Error("Ukuran file maksimal 10MB");
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${formId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
  const { error } = await supabase.storage.from("form-uploads").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("form-uploads").getPublicUrl(path);
  return encodeFileAnswer(data.publicUrl, file.name);
}
