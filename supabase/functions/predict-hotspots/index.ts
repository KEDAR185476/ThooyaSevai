import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all reports for pattern analysis
    const { data: reports, error } = await supabase
      .from("reports")
      .select("id, street_name, ward_id, waste_type, status, created_at, resolved_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw error;

    // Fetch wards for context
    const { data: wards } = await supabase
      .from("wards")
      .select("id, name, ward_number, total_reports, resolved_reports, cleanliness_score");

    // Build data summary for AI
    const wardMap: Record<string, any> = {};
    for (const w of wards || []) {
      wardMap[w.id] = w;
    }

    // Aggregate patterns per ward and street
    const streetStats: Record<string, { count: number; pending: number; recent7d: number; recent30d: number; ward_name: string; waste_types: Record<string, number> }> = {};
    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 86400000);
    const d30 = new Date(now.getTime() - 30 * 86400000);

    for (const r of reports || []) {
      const key = r.street_name || "Unknown";
      if (!streetStats[key]) {
        streetStats[key] = { count: 0, pending: 0, recent7d: 0, recent30d: 0, ward_name: wardMap[r.ward_id]?.name || "Unknown", waste_types: {} };
      }
      const s = streetStats[key];
      s.count++;
      if (r.status === "pending") s.pending++;
      const created = new Date(r.created_at);
      if (created >= d7) s.recent7d++;
      if (created >= d30) s.recent30d++;
      if (r.waste_type) s.waste_types[r.waste_type] = (s.waste_types[r.waste_type] || 0) + 1;
    }

    // Ward-level stats
    const wardStats = (wards || []).map(w => ({
      name: w.name,
      ward_number: w.ward_number,
      total_reports: w.total_reports,
      resolved: w.resolved_reports,
      pending: w.total_reports - w.resolved_reports,
      cleanliness_score: w.cleanliness_score,
      resolution_rate: w.total_reports > 0 ? Math.round((w.resolved_reports / w.total_reports) * 100) : 100,
    }));

    // Top problem streets
    const topStreets = Object.entries(streetStats)
      .sort((a, b) => b[1].recent7d - a[1].recent7d)
      .slice(0, 15)
      .map(([name, s]) => ({
        street: name,
        ward: s.ward_name,
        total_complaints: s.count,
        last_7_days: s.recent7d,
        last_30_days: s.recent30d,
        pending: s.pending,
        dominant_waste: Object.entries(s.waste_types).sort((a, b) => b[1] - a[1])[0]?.[0] || "mixed",
      }));

    const prompt = `You are a predictive analytics engine for urban garbage management in Madurai city.

Analyze the following data and predict garbage hotspots for the next 48 hours to 1 week.

## Ward Statistics:
${JSON.stringify(wardStats, null, 2)}

## Top Problem Streets (by recent complaints):
${JSON.stringify(topStreets, null, 2)}

## Today: ${now.toISOString().split("T")[0]} (${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][now.getDay()]})

Consider these factors:
1. **Complaint frequency** – Streets/wards with rising complaint counts
2. **Resolution backlog** – Areas with high pending complaints
3. **Temporal patterns** – Weekday vs weekend, market days (typically Tuesdays and Fridays in Madurai)
4. **Waste type patterns** – Organic waste areas need more frequent pickup
5. **Seasonal factors** – Current month's typical humidity and waste generation patterns
6. **Cleanliness score trends** – Low-scoring wards are higher risk

Generate exactly 5-8 predictions. For each prediction include:
- The ward name and/or street name
- Risk level (critical/high/medium)
- Predicted timeframe (e.g., "next 24 hours", "within 48 hours", "3-5 days")
- Confidence percentage (60-95%)
- Key contributing factors (2-3 bullet points)
- Recommended preventive action

Be specific with ward numbers and street names from the data provided.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a predictive AI for urban waste management. Return analysis in a structured format." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_predictions",
              description: "Return garbage hotspot predictions",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "Brief overall risk assessment (2-3 sentences)",
                  },
                  predictions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        location: { type: "string", description: "Ward name and/or street name" },
                        risk_level: { type: "string", enum: ["critical", "high", "medium"] },
                        timeframe: { type: "string", description: "When the issue is predicted" },
                        confidence: { type: "number", description: "Confidence percentage 60-95" },
                        factors: {
                          type: "array",
                          items: { type: "string" },
                          description: "2-3 contributing factors",
                        },
                        action: { type: "string", description: "Recommended preventive action" },
                        waste_type: { type: "string", description: "Expected waste type" },
                      },
                      required: ["location", "risk_level", "timeframe", "confidence", "factors", "action"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["summary", "predictions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_predictions" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiRes.text();
      console.error("AI error:", aiRes.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let result;
    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    } else {
      result = { summary: "Unable to generate predictions at this time.", predictions: [] };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("predict-hotspots error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
