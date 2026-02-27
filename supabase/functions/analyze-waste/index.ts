import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) throw new Error("No image provided");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert waste management and environmental awareness AI assistant for the city of Madurai. Analyze the waste image and respond with a JSON object using this exact structure (no markdown, just raw JSON):

{
  "waste_type": "plastic|organic|metal|glass|e-waste|paper|mixed|construction|hazardous",
  "confidence": 0.0 to 1.0,
  "description": "Brief description of what you see in the image",
  "reuse_suggestions": [
    "Suggestion 1 for reusing this waste creatively",
    "Suggestion 2",
    "Suggestion 3"
  ],
  "disposal_method": "Correct way to dispose of this waste type",
  "benefits_of_proper_disposal": [
    "Benefit 1 of disposing this properly",
    "Benefit 2",
    "Benefit 3"
  ],
  "harms_of_improper_disposal": [
    "Harm 1 if not disposed properly",
    "Harm 2",
    "Harm 3"
  ],
  "fun_fact": "An interesting environmental fact related to this waste type",
  "environmental_impact_score": 1 to 10
}

Be specific, educational, and locally relevant to India/Tamil Nadu where possible. Make reuse suggestions practical and creative.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this waste image and provide disposal guidance, reuse ideas, and environmental awareness information." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI service is busy. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON from the response, handling potential markdown wrapping
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Could not parse AI analysis");
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-waste error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
