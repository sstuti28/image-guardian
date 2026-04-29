import { createFileRoute } from "@tanstack/react-router";

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

type Body = {
  source_url?: string;
  source_name?: string;
  title?: string;
  full_name?: string;
  email?: string;
  risk?: "high" | "medium" | "low";
  category?: string;
};

export const Route = createFileRoute("/api/draft-takedown")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return json(500, { error: "LOVABLE_API_KEY not configured" });

        let body: Body;
        try {
          body = await request.json();
        } catch {
          return json(400, { error: "Invalid JSON body" });
        }

        const {
          source_url,
          source_name,
          title,
          full_name,
          email,
          risk = "medium",
          category = "unknown",
        } = body;

        if (!source_url || !source_name || !email) {
          return json(400, { error: "Missing required fields" });
        }

        const today = new Date().toISOString().split("T")[0];

        const sys = `You are a legal-letter drafter specializing in Indian IT Act takedown notices and DMCA. Produce a formal, polite, firm notice citing:
- Section 79 of the IT Act, 2000
- Rule 3(2) and Rule 3(1)(b) of the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021
- Article 21 of the Constitution of India (right to privacy)
- For HIGH risk (adult/explicit/deepfake), additionally cite Section 66E (privacy violation) and Section 67/67A of IT Act, and reference the Indian Cyber Crime Coordination Centre (I4C / cybercrime.gov.in).
Return ONLY the letter body — no preamble, no markdown.`;

        const user = `Draft a takedown letter with these facts:
- Date: ${today}
- Recipient: Grievance Officer, ${source_name}
- Infringing URL: ${source_url}
- Page title/context: ${title || "N/A"}
- Risk level: ${risk.toUpperCase()}
- Content category: ${category}
- Complainant name: ${full_name || "[Your Full Name]"}
- Complainant email: ${email}
- Demand removal within 36 hours per Rule 3(2)(a).
- Mention CC to cybercrime.gov.in / NCRP if risk is high.`;

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
                { role: "system", content: sys },
                { role: "user", content: user },
              ],
            }),
          });

          if (!r.ok) {
            if (r.status === 429) return json(429, { error: "AI rate limit, try again soon" });
            if (r.status === 402) return json(402, { error: "AI credits exhausted" });
            return json(502, { error: `AI gateway error ${r.status}` });
          }

          const data = await r.json();
          const letter = data.choices?.[0]?.message?.content;
          if (!letter) return json(502, { error: "AI returned empty letter" });
          return json(200, { letter });
        } catch (e) {
          return json(502, {
            error: `Draft failed: ${e instanceof Error ? e.message : "unknown"}`,
          });
        }
      },
    },
  },
});
