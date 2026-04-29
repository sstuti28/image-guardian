import { createFileRoute } from "@tanstack/react-router";

type Sighting = {
  source_url: string;
  source_name: string;
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

export const Route = createFileRoute("/api/risk-score")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return json(500, { error: "LOVABLE_API_KEY not configured" });

        let payload: { sightings?: Sighting[] };
        try {
          payload = await request.json();
        } catch {
          return json(400, { error: "Invalid JSON body" });
        }

        const sightings = (payload.sightings ?? []).slice(0, 30);
        if (!sightings.length) return json(200, { scores: [] });

        const tools = [
          {
            type: "function",
            function: {
              name: "score_sightings",
              description: "Assign a privacy-risk score to each image sighting.",
              parameters: {
                type: "object",
                properties: {
                  scores: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        source_url: { type: "string" },
                        risk: { type: "string", enum: ["high", "medium", "low"] },
                        category: {
                          type: "string",
                          enum: [
                            "adult",
                            "social",
                            "news",
                            "blog",
                            "ecommerce",
                            "stock",
                            "forum",
                            "personal",
                            "unknown",
                          ],
                        },
                        reason: { type: "string" },
                      },
                      required: ["source_url", "risk", "category", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["scores"],
                additionalProperties: false,
              },
            },
          },
        ];

        const userPayload = sightings
          .map(
            (s, i) =>
              `${i + 1}. URL: ${s.source_url}\n   Source: ${s.source_name}\n   Title: ${s.title || "(none)"}`
          )
          .join("\n");

        try {
          const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content:
                    "You assess privacy risk for unauthorized photo sightings. HIGH = adult/explicit, deepfake, scam, impersonation, doxxing, or unknown personal blogs reusing portraits. MEDIUM = social media reposts, forums, ecommerce reuse. LOW = legitimate news, the subject's own site, or licensed stock. Return one entry per input URL.",
                },
                {
                  role: "user",
                  content: `Score these sightings:\n${userPayload}`,
                },
              ],
              tools,
              tool_choice: { type: "function", function: { name: "score_sightings" } },
            }),
          });

          if (!r.ok) {
            if (r.status === 429) return json(429, { error: "AI rate limit, try again soon" });
            if (r.status === 402) return json(402, { error: "AI credits exhausted" });
            return json(502, { error: `AI gateway error ${r.status}` });
          }

          const data = await r.json();
          const call = data.choices?.[0]?.message?.tool_calls?.[0];
          const args = call?.function?.arguments;
          if (!args) return json(502, { error: "AI returned no scores" });
          const parsed = JSON.parse(args);
          return json(200, { scores: parsed.scores ?? [] });
        } catch (e) {
          return json(502, {
            error: `Risk scoring failed: ${e instanceof Error ? e.message : "unknown"}`,
          });
        }
      },
    },
  },
});
