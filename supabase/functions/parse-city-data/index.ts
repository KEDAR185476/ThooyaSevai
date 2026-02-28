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
    const { rawText, action } = await req.json();
    if (!rawText) throw new Error("No data provided");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a city data parser for a garbage management system in Madurai. 
You receive raw text data (spreadsheet paste, notes, lists, etc.) and extract structured information.

Extract ALL of these categories from the input:

1. **Wards**: name, ward_number (integer), cleanliness_score (0-100), total_reports (integer), resolved_reports (integer)
2. **Reports**: street_name, ward_number (to link to ward), status (pending/assigned/resolved), waste_type (plastic/organic/construction/mixed)
3. **Insights**: key observations, patterns, or summary statistics from the data

Rules:
- If ward_number is missing, infer from context or assign sequentially
- If cleanliness_score is missing, calculate from resolved/total ratio or default to 50
- If a field is ambiguous, make a reasonable assumption
- Extract as many records as possible from the input
- For reports without explicit street names, use the area/locality mentioned`;

    const userPrompt = `Parse this raw city data and extract structured records:\n\n${rawText}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parsed_city_data",
              description: "Return structured city data extracted from raw text",
              parameters: {
                type: "object",
                properties: {
                  wards: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        ward_number: { type: "integer" },
                        cleanliness_score: { type: "number" },
                        total_reports: { type: "integer" },
                        resolved_reports: { type: "integer" },
                      },
                      required: ["name", "ward_number"],
                      additionalProperties: false,
                    },
                  },
                  reports: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        street_name: { type: "string" },
                        ward_number: { type: "integer" },
                        status: { type: "string", enum: ["pending", "assigned", "resolved"] },
                        waste_type: { type: "string", enum: ["plastic", "organic", "construction", "mixed"] },
                      },
                      required: ["street_name", "ward_number", "status"],
                      additionalProperties: false,
                    },
                  },
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        severity: { type: "string", enum: ["info", "warning", "critical"] },
                      },
                      required: ["title", "description", "severity"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["wards", "reports", "insights"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "parsed_city_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI parsing failed");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured data");

    const parsed = JSON.parse(toolCall.function.arguments);

    // If action is "confirm", actually insert into database
    if (action === "confirm") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const results = { wardsAdded: 0, reportsAdded: 0, errors: [] as string[] };

      // Insert wards
      for (const ward of parsed.wards) {
        const { error } = await supabase.from("wards").upsert(
          {
            name: ward.name,
            ward_number: ward.ward_number,
            cleanliness_score: ward.cleanliness_score ?? 50,
            total_reports: ward.total_reports ?? 0,
            resolved_reports: ward.resolved_reports ?? 0,
          },
          { onConflict: "ward_number", ignoreDuplicates: false }
        );
        if (error) {
          // Try insert if upsert fails (no unique constraint on ward_number)
          const { error: insertErr } = await supabase.from("wards").insert({
            name: ward.name,
            ward_number: ward.ward_number,
            cleanliness_score: ward.cleanliness_score ?? 50,
            total_reports: ward.total_reports ?? 0,
            resolved_reports: ward.resolved_reports ?? 0,
          });
          if (insertErr) {
            results.errors.push(`Ward ${ward.ward_number}: ${insertErr.message}`);
          } else {
            results.wardsAdded++;
          }
        } else {
          results.wardsAdded++;
        }
      }

      // Get ward id mapping for reports
      const { data: allWards } = await supabase.from("wards").select("id, ward_number");
      const wardMap = new Map(allWards?.map((w) => [w.ward_number, w.id]) ?? []);

      // We need a user_id for reports - use the auth header to get it
      const authHeader = req.headers.get("Authorization");
      let userId: string | null = null;
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: { user } } = await userClient.auth.getUser(token);
        userId = user?.id ?? null;
      }

      // Insert reports
      for (const report of parsed.reports) {
        const wardId = wardMap.get(report.ward_number);
        if (!wardId) {
          results.errors.push(`Report on ${report.street_name}: Ward ${report.ward_number} not found`);
          continue;
        }
        if (!userId) {
          results.errors.push(`Report on ${report.street_name}: No authenticated user`);
          continue;
        }
        const { error } = await supabase.from("reports").insert({
          street_name: report.street_name,
          ward_id: wardId,
          status: report.status ?? "pending",
          waste_type: report.waste_type ?? "mixed",
          user_id: userId,
          image_url: "auto-imported",
          latitude: 9.9252 + Math.random() * 0.05,
          longitude: 78.1198 + Math.random() * 0.05,
        });
        if (error) {
          results.errors.push(`Report ${report.street_name}: ${error.message}`);
        } else {
          results.reportsAdded++;
        }
      }

      return new Response(JSON.stringify({ parsed, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Preview mode — just return parsed data
    return new Response(JSON.stringify({ parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-city-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
