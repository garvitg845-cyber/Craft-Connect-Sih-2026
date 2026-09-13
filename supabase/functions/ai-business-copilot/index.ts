import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { generateAIText, getConfiguredProviders, json } from "../_shared_ai.ts";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL"); const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    if (!getConfiguredProviders().length) return json({ error: "No AI provider is configured. Add GEMINI_API_KEY, OPENROUTER_API_KEY, or GROQ_API_KEY in Supabase Secrets." }, 501, CORS);
    const auth = req.headers.get("Authorization"); if (!auth) return json({ error: "Missing Authorization header" }, 401, CORS);
    const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, { global: { headers: { Authorization: auth } } });
    const { data: userData } = await supabase.auth.getUser(); if (!userData?.user) return json({ error: "Not authenticated" }, 401, CORS);
    const artisanId = userData.user.id; const { data: artisan } = await supabase.from("artisans").select("id").eq("id", artisanId).single();
    if (!artisan) return json({ error: "Only artisans can use the Business Copilot" }, 403, CORS);
    const { question } = await req.json(); if (!question) return json({ error: "Provide a question" }, 400, CORS);
    const [{ data: products }, { data: orderItems }] = await Promise.all([
      supabase.from("products").select("id,title,price,stock_quantity,status,created_at").eq("artisan_id", artisanId),
      supabase.from("order_items").select("id,product_id,quantity,unit_price,created_at,orders(status,created_at)").eq("artisan_id", artisanId),
    ]);
    const productIds = (products ?? []).map((p: any) => p.id);
    const { data: reviews } = productIds.length ? await supabase.from("reviews").select("rating,comment,product_id").in("product_id", productIds) : { data: [] as any[] };
    const dataSummary = { total_products: (products ?? []).length, products: products ?? [], total_order_items: (orderItems ?? []).length, order_items: orderItems ?? [], total_reviews: (reviews ?? []).length, reviews: reviews ?? [] };
    const result = await generateAIText({ contents: [{ role: "user", parts: [{ text: String(question) }] }], systemInstruction: `You are a practical business copilot for one Indian artisan on Craft Connect. Use ONLY this real Supabase data. Never invent sales, revenue, customers, ratings, trends or forecasts. Show calculations when possible. REAL DATA:\n${JSON.stringify(dataSummary)}`, temperature: 0.2, timeoutMs: 30000 });
    const answer = result.text; await supabase.from("ai_generations").insert({ artisan_id: artisanId, feature: "business_copilot", input_summary: String(question).slice(0, 500), output: { answer } });
    return json({ answer, model: result.model }, 200, CORS);
  } catch (e) { return json({ error: e instanceof Error ? e.message : String(e) }, 500, CORS); }
});
