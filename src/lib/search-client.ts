import { supabase } from "@/integrations/supabase/client";

export type Sighting = {
  source_url: string;
  source_name: string;
  thumbnail: string | null;
  title: string;
};

const BUCKET = "scan-uploads";

export async function reverseImageSearch(file: File): Promise<Sighting[]> {
  // 1. Upload to Supabase Storage with a random path
  const ext = (file.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase();
  const objectPath = `scans/${crypto.randomUUID()}.${ext || "jpg"}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, file, { contentType: file.type, upsert: false });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  const imageUrl = pub.publicUrl;

  try {
    const res = await fetch("/api/reverse-image-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl }),
    });
    const text = await res.text();
    let body: { results?: Sighting[]; error?: string } = {};
    try { body = JSON.parse(text); } catch { /* empty */ }
    if (!res.ok) throw new Error(body.error || `Search failed (${res.status})`);
    return body.results ?? [];
  } finally {
    // Best-effort cleanup — privacy first
    supabase.storage.from(BUCKET).remove([objectPath]).catch(() => {});
  }
}
