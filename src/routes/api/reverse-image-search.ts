import { createFileRoute } from "@tanstack/react-router";

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

        let payload: { image_url?: string };
        try {
          payload = await request.json();
        } catch {
          return json(400, { error: "Invalid JSON body" });
        }

        const imageUrl = payload.image_url;
        if (!imageUrl || typeof imageUrl !== "string" || !/^https?:\/\//.test(imageUrl)) {
          return json(400, { error: "Missing or invalid 'image_url'" });
        }

        const params = new URLSearchParams({
          engine: "google_lens",
          url: imageUrl,
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
