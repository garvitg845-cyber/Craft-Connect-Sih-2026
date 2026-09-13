import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { generateAIJson, getConfiguredProviders, json } from "../_shared_ai.ts";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL"); const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const schema = { type: "object", properties: { keywords: { type: "array", items: { type: "string" } }, max_price: { type: "number", nullable: true }, min_price: { type: "number", nullable: true }, material: { type: "string", nullable: true }, category: { type: "string", nullable: true } }, required: ["keywords", "max_price", "min_price", "material", "category"], additionalProperties: false };
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    if (!getConfiguredProviders().length) return json({ error: "No AI provider is configured. Add GEMINI_API_KEY, OPENROUTER_API_KEY, or GROQ_API_KEY in Supabase Secrets." }, 501, CORS);
    const { query } = await req.json(); if (!query) return json({ error: "Provide a query" }, 400, CORS);
    const result = await generateAIJson({ contents: [{ role: "user", parts: [{ text: String(query) }] }], systemInstruction: "Convert the shopper's natural-language search into strict JSON filters. Use keywords for important searchable concepts, numeric rupee bounds when stated, and null when not specified. Do not invent filters.", schema, temperature: 0, timeoutMs: 20000 });
    const filters = result.data as any; const supabase = createClient(SUPABASE_URL!, ANON_KEY); let q = supabase.from("products").select("*, artisans(business_name)").eq("status", "approved");
    if (typeof filters.max_price === "number") q = q.lte("price", filters.max_price); if (typeof filters.min_price === "number") q = q.gte("price", filters.min_price); if (filters.material) q = q.ilike("material", `%${filters.material}%`); if (filters.category) q = q.ilike("title", `%${filters.category}%`);
    if (Array.isArray(filters.keywords) && filters.keywords.length) { const terms = filters.keywords.slice(0, 5).map((x: string) => `title.ilike.%${x}%,description.ilike.%${x}%,tags.cs.{${x}}`).join(","); q = q.or(terms); }
    const { data: products, error } = await q.limit(30); if (error) return json({ error: error.message }, 500, CORS);
    return json({ filters, products: products ?? [], model: result.model }, 200, CORS);
  } catch (e) { return json({ error: e instanceof Error ? e.message : String(e) }, 500, CORS); }
});
