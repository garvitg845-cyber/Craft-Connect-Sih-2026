import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { generateAIJson, getConfiguredProviders, json, parseDataUrl } from "../_shared_ai.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const schema = {
  type: "object",
  properties: {
    title: { type: "string" }, description: { type: "string" }, category_suggestion: { type: "string" }, material: { type: "string" },
    tags: { type: "array", items: { type: "string" } }, dimensions: { type: "string" }, estimated_production_time_days: { type: "integer" },
    keywords: { type: "array", items: { type: "string" } }, translation_en: { type: "string" }, translation_hi: { type: "string" },
  },
  required: ["title", "description", "category_suggestion", "material", "tags", "dimensions", "estimated_production_time_days", "keywords", "translation_en", "translation_hi"],
};
const systemPrompt = `You create accurate marketplace listing drafts for handmade crafts. Use only what the artisan says or what is clearly visible across the supplied photos. Never invent exact dimensions, origin, certifications, material, cultural claims, or maker identity. Unknown details must be empty. If several photos show the same product, combine evidence from all views. Keep descriptions useful and concise. Return only the requested JSON.`;

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    if (!getConfiguredProviders().length) return json({ error: "No AI provider is configured. Add GEMINI_API_KEY, OPENROUTER_API_KEY, or GROQ_API_KEY in Supabase Secrets." }, 501, CORS);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401, CORS);
    const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Not authenticated" }, 401, CORS);
    const artisanId = userData.user.id;
    const { data: artisan } = await supabase.from("artisans").select("id").eq("id", artisanId).single();
    if (!artisan) return json({ error: "Only artisans can use the Product Studio" }, 403, CORS);

    const body = await req.json();
    const textInput = String(body.text_input ?? "").trim();
    const language = String(body.language ?? "English");
    const imageUrls = Array.isArray(body.image_urls) ? body.image_urls.filter((x: unknown): x is string => typeof x === "string").slice(0, 6) : [];
    if (!textInput && imageUrls.length === 0) return json({ error: "Provide text_input and/or at least one image." }, 400, CORS);

    const parts: any[] = [];
    for (const imageUrl of imageUrls) {
      const { mimeType, data } = parseDataUrl(imageUrl);
      parts.push({ inline_data: { mime_type: mimeType, data } });
    }
    parts.push({ text: `Input language: ${language}\nArtisan input: ${textInput || "(image only)"}\nAnalyze all supplied product photo(s) and combine evidence across every available view. Fill unknown fields with empty strings or empty arrays. Return the requested JSON.` });

    const result = await generateAIJson({
      contents: [{ role: "user", parts }],
      schema,
      systemInstruction: systemPrompt,
      temperature: 0.1,
      timeoutMs: 90000,
    });
    await supabase.from("ai_generations").insert({ artisan_id: artisanId, feature: "product_studio", input_summary: textInput.slice(0, 500) || "(image only)", output: result.data });
    const analyzedImages = result.provider === "gemini" ? imageUrls.length : Math.min(imageUrls.length, 5);
    return json({ draft: result.data, model: result.model, provider: result.provider, analyzed_images: analyzedImages, skipped_images: Math.max(0, imageUrls.length - analyzedImages) }, 200, CORS);
  } catch (e) { return json({ error: e instanceof Error ? e.message : String(e) }, 500, CORS); }
});
