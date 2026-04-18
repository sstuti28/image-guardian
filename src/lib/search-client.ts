export type Sighting = {
  source_url: string;
  source_name: string;
  thumbnail: string | null;
  title: string;
};

export async function reverseImageSearch(imageDataUrl: string): Promise<Sighting[]> {
  const res = await fetch("/api/reverse-image-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageDataUrl }),
  });
  const text = await res.text();
  let body: { results?: Sighting[]; error?: string } = {};
  try { body = JSON.parse(text); } catch { /* empty */ }
  if (!res.ok) {
    throw new Error(body.error || `Search failed (${res.status})`);
  }
  return body.results ?? [];
}
