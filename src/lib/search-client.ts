import { supabase } from "@/integrations/supabase/client";

export type Sighting = {
  source_url: string;
  source_name: string;
  thumbnail: string | null;
  title: string;
  risk?: "high" | "medium" | "low";
  category?: string;
  reason?: string;
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

export async function scoreSightings(sightings: Sighting[]): Promise<Sighting[]> {
  if (!sightings.length) return sightings;
  try {
    const res = await fetch("/api/risk-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sightings: sightings.map((s) => ({
          source_url: s.source_url,
          source_name: s.source_name,
          title: s.title,
        })),
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Score failed (${res.status})`);
    const scoreMap = new Map<string, { risk: string; category: string; reason: string }>();
    for (const s of body.scores ?? []) scoreMap.set(s.source_url, s);
    return sightings.map((s) => {
      const m = scoreMap.get(s.source_url);
      return m ? { ...s, risk: m.risk as Sighting["risk"], category: m.category, reason: m.reason } : s;
    });
  } catch {
    return sightings;
  }
}

export async function draftAITakedown(input: {
  source_url: string;
  source_name: string;
  title: string;
  full_name: string;
  email: string;
  risk?: "high" | "medium" | "low";
  category?: string;
}): Promise<string> {
  const res = await fetch("/api/draft-takedown", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Draft failed (${res.status})`);
  return body.letter as string;
}
