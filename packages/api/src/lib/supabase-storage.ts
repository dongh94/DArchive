import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

export const WEDDING_PHOTO_BUCKET = "wedding-photos";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase Storage is not configured");
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return supabaseAdmin;
}

function extensionForMimeType(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

export function isAllowedPhotoMimeType(mimeType: string) {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function buildWeddingPhotoPath(mimeType: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `guest/${date}/${randomUUID()}.${extensionForMimeType(mimeType)}`;
}

export function getWeddingPhotoPublicUrl(storagePath: string) {
  const { data } = getSupabaseAdmin().storage.from(WEDDING_PHOTO_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function createWeddingPhotoUploadUrl(mimeType: string) {
  if (!isAllowedPhotoMimeType(mimeType)) {
    throw new Error("Unsupported image type");
  }

  const path = buildWeddingPhotoPath(mimeType);
  const { data, error } = await getSupabaseAdmin().storage
    .from(WEDDING_PHOTO_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create upload URL");
  }

  return {
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
    publicUrl: getWeddingPhotoPublicUrl(data.path),
  };
}

export async function deleteWeddingPhotoObject(storagePath: string) {
  const { error } = await getSupabaseAdmin().storage.from(WEDDING_PHOTO_BUCKET).remove([storagePath]);

  if (error) {
    throw new Error(error.message);
  }
}
