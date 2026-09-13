import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { generateAIJson, getConfiguredProviders, json, parseDataUrl } from "../_shared_ai.ts";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL"); const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const schema = { type: "object", properties: {
  name:{type:"string"}, location:{type:"string"}, confidence:{type:"string"}, summary:{type:"string"}, crafts:{type:"array",items:{type:"string"}}, activities:{type:"array",items:{type:"string"}}, foods:{type:"array",items:{type:"string"}}, places_to_visit:{type:"array",items:{type:"string"}}, festivals:{type:"array",items:{type:"string"}}, best_time:{type:"string"}, if_no_famous_craft:{type:"string"}, origin_history:{type:"string"}, materials:{type:"string"}, technique:{type:"string"}, cultural_context:{type:"string"}, motifs_and_meaning:{type:"string"}, care_and_preservation:{type:"string"}, related_crafts:{type:"array",items:{type:"string"}}, sources_note:{type:"string"}
}, required:["name","location","confidence","summary","crafts","activities","foods","places_to_visit","festivals","best_time","if_no_famous_craft","origin_history","materials","technique","cultural_context","motifs_and_meaning","care_and_preservation","related_crafts","sources_note"], additionalProperties:false };
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    if (!getConfiguredProviders().length) return json({ error: "No AI provider is configured. Add GEMINI_API_KEY, OPENROUTER_API_KEY, or GROQ_API_KEY in Supabase Secrets." }, 501, CORS);
    const auth = req.headers.get("Authorization"); if (!auth) return json({ error: "Please log in before using AI Craft Guide." }, 401, CORS);
    const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, { global: { headers: { Authorization: auth } } }); const { data:userData } = await supabase.auth.getUser(); if (!userData?.user) return json({error:"Not authenticated"},401,CORS);
    const body = await req.json(); const query=String(body.query??"").trim(); const place=String(body.place??"").trim(); const language=String(body.language??"English"); const image=typeof body.image_data_url==="string"?body.image_data_url:null;
    if (!query && !place && !image) return json({error:"Provide a craft question, place, or image."},400,CORS);
    const system = `You are Craft Connect's GLOBAL CRAFT HERITAGE GUIDE. Explain traditional and contemporary crafts from any country or region. Answer in the requested language. Use web grounding when a web-search tool is available and current or place-specific facts are useful; if no web-search tool is available, do not claim that live web grounding was used. If an image is provided, identify the most likely craft/object but state uncertainty and alternatives. Never claim authenticity, provenance, maker identity, or exact origin from an image alone. Never invent an artisan. For place queries populate crafts, activities, foods, places_to_visit, festivals, best_time and if_no_famous_craft. If a place is not especially famous for a craft, say so instead of forcing one. In sources_note, briefly mention that the answer used web grounding when it did.`;
    const parts:any[]=[]; if(image){const {mimeType,data}=parseDataUrl(image); parts.push({inline_data:{mime_type:mimeType,data}});} parts.push({text:`Requested language: ${language}\nPlace/country: ${place||"not specified"}\nQuestion/craft: ${query||"Identify the craft shown in the image."}`});
    const result=await generateAIJson({contents:[{role:"user",parts}],schema,systemInstruction:system,temperature:0.15,timeoutMs:60000,tools:[{google_search:{}}]});
    return json({answer:result.data,model:result.model,sources:[]},200,CORS);
  } catch(e){return json({error:e instanceof Error?e.message:String(e)},500,CORS);}
});
