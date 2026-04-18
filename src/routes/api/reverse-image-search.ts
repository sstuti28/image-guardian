import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Sighting = {
  source_url: string;
  source_name: string;
  thumbnail: string | null;
  title: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export const Route = createFileRoute("/api/reverse-image-search")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        const apiKey = process.env.SERPAPI_KEY;
        if (!apiKey) return json(500, { error: "SERPAPI_KEY not configured" });

        let payload: { image?: string };
        try {
          payload = await request.json();
        } catch {
          return json(400, { error: "Invalid JSON body" });
        }

        const image = payload.image;
        if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
          return json(400, { error: "Missing or invalid 'image' (expected data URL)" });
        }
        if (image.length > 12 * 1024 * 1024) {
          return json(413, { error: "Image too large" });
        }

        // Decode base64 portion
        const commaIdx = image.indexOf(",");
        if (commaIdx === -1) return json(400, { error: "Malformed data URL" });
        const meta = image.substring(0, commaIdx);
        const b64 = image.substring(commaIdx + 1);
        const mimeMatch = /data:(image\/[a-zA-Z0-9+.-]+);base64/.exec(meta);
        const mime = mimeMatch?.[1] ?? "image/jpeg";

        // Step 1: upload image to Supabase Storage to get a public URL.
        // SerpApi Google Lens needs a fetchable URL. We use a random object name
        // and the bucket has no SELECT policy, so files cannot be listed —
        // only direct URL fetches (which the bucket being "public" enables) work.
        let publicUrl: string;
        let objectPath: string;
        try {
          const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
          const ext = mime.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "jpg";
          objectPath = `scans/${crypto.randomUUID()}.${ext}`;

          const { error: upErr } = await supabaseAdmin.storage
            .from("scan-uploads")
            .upload(objectPath, bin, {
              contentType: mime,
              upsert: false,
            });
          if (upErr) {
            return json(502, { error: `Upload failed: ${upErr.message}` });
          }
          const { data: pub } = supabaseAdmin.storage
            .from("scan-uploads")
            .getPublicUrl(objectPath);
          publicUrl = pub.publicUrl;
        } catch (e) {
          return json(502, {
            error: `Upload error: ${e instanceof Error ? e.message : "unknown"}`,
          });
        }

        // Step 2: query Google Lens
        const params = new URLSearchParams({
          engine: "google_lens",
          url: publicUrl,
          api_key: apiKey,
        });

        let lens: {
          visual_matches?: Array<{
            title?: string;
            link?: string;
            source?: string;
            thumbnail?: string;
          }>;
          error?: string;
        };
        try {
          const r = await fetch(`https://serpapi.com/search.json?${params}`);
          lens = await r.json();
          if (!r.ok || lens.error) {
            return json(502, { error: lens.error || `SerpApi error ${r.status}` });
          }
        } catch (e) {
          return json(502, {
            error: `Search error: ${e instanceof Error ? e.message : "unknown"}`,
          });
        }

        const results: Sighting[] = (lens.visual_matches ?? [])
          .filter((m) => !!m.link)
          .slice(0, 30)
          .map((m) => ({
            source_url: m.link!,
            source_name: m.source || hostnameOf(m.link!),
            thumbnail: m.thumbnail ?? null,
            title: m.title ?? "",
          }));

        return json(200, { results });
      },
    },
  },
});
