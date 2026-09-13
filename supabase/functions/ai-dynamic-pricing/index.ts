import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { generateAIJson, getConfiguredProviders, json, parseDataUrl } from "../_shared_ai.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const schema = {
  type:"object",
  properties:{
    minimum_sustainable_price:{type:"number"}, recommended_price:{type:"number"}, premium_price:{type:"number"},
    estimated_margin_pct:{type:"number"}, confidence:{type:"number"}, rationale:{type:"string"},
    comparable_summary:{type:"array",items:{type:"string"}}, pricing_factors:{type:"array",items:{type:"string"}},
    market_trend:{type:"string"}, image_signal:{type:"string"}
  },
  required:["minimum_sustainable_price","recommended_price","premium_price","estimated_margin_pct","confidence","rationale","comparable_summary","pricing_factors","market_trend","image_signal"]
};

function safeNumber(v:number){ return Number.isFinite(v) ? v : 0 }
function clip(s:string,n=800){ return String(s||"").slice(0,n) }

async function loadExternalMarketFeed(){
  const url = Deno.env.get("MARKET_PRICE_FEED_URL") || "";
  if(!url) return { configured:false, items:[] as any[], note:"No external market feed configured." };
  try{
    const headers:Record<string,string> = { "Accept":"application/json" };
    const key = Deno.env.get("MARKET_PRICE_FEED_API_KEY") || "";
    if(key) headers.Authorization = `Bearer ${key}`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(12000) });
    if(!res.ok) throw new Error(`market feed HTTP ${res.status}`);
    const raw = await res.json();
    const items = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
    return { configured:true, items:items.slice(0,80), note:`Loaded ${Math.min(items.length,80)} external market observations.` };
  }catch(e){
    return { configured:true, items:[] as any[], note:`External market feed unavailable: ${clip(e instanceof Error?e.message:String(e),180)}` };
  }
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    if (!getConfiguredProviders().length) return json({ error:"No AI provider is configured." }, 501, CORS);
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error:"Please log in before using AI Pricing." }, 401, CORS);
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { global:{ headers:{ Authorization:auth } } });
    const { data:userData } = await supabase.auth.getUser();
    if (!userData?.user) return json({ error:"Not authenticated" }, 401, CORS);

    const body = await req.json();
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const material = String(body.material ?? "").trim();
    const dimensions = String(body.dimensions ?? "").trim();
    const productionDays = Number(body.production_time_days || 0);
    const currentPrice = Number(body.current_price || 0);
    const costs = body.costs || {};

    const { data: comparables, error } = await supabase
      .from("products")
      .select("id,title,price,material,dimensions,tags,category_id,artisans(craft_type,state)")
      .eq("status","approved").gt("stock_quantity",0).limit(160);
    if (error) throw error;

    const cutoff = new Date(Date.now() - 90*24*60*60*1000).toISOString();
    const { data: salesRows } = await supabase
      .from("order_items")
      .select("product_id,quantity,unit_price,created_at,orders(status,created_at)")
      .gte("created_at", cutoff)
      .limit(1500);
    const validStatuses = new Set(["placed","confirmed","packed","shipped","out_for_delivery","delivered"]);
    const salesByProduct = new Map<string,{units:number,revenue:number,orders:number}>();
    for(const row of (salesRows||[]) as any[]){
      if(row.orders && !validStatuses.has(row.orders.status)) continue;
      const id=String(row.product_id); const cur=salesByProduct.get(id)||{units:0,revenue:0,orders:0};
      cur.units += Number(row.quantity)||0; cur.revenue += (Number(row.quantity)||0)*(Number(row.unit_price)||0); cur.orders += 1; salesByProduct.set(id,cur);
    }

    const comparableText = (comparables ?? []).slice(0,100).map((p:any)=>({
      id:p.id,title:p.title,price:p.price,material:p.material,dimensions:p.dimensions,tags:p.tags,
      craft_type:p.artisans?.craft_type,state:p.artisans?.state,
      sales_90d:salesByProduct.get(p.id)||{units:0,revenue:0,orders:0}
    }));
    const topSales = comparableText.filter((x:any)=>x.sales_90d.units>0).sort((a:any,b:any)=>b.sales_90d.units-a.sales_90d.units).slice(0,30);
    const feed = await loadExternalMarketFeed();

    let imagePart:any = null;
    const imageUrl = String(body.image_url||"");
    const imageDataUrl = String(body.image_data_url||"");
    if(imageDataUrl){
      try { const parsed=parseDataUrl(imageDataUrl); imagePart={inline_data:{mime_type:parsed.mimeType,data:parsed.data}} } catch { /* optional */ }
    } else if(imageUrl && /^https:\/\//i.test(imageUrl)) {
      try{
        const r=await fetch(imageUrl,{signal:AbortSignal.timeout(10000)});
        if(r.ok){ const mime=(r.headers.get("content-type")||"image/jpeg").split(";")[0]; const bytes=new Uint8Array(await r.arrayBuffer()); let binary=""; for(let i=0;i<bytes.length;i+=0x8000) binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000)); imagePart={inline_data:{mime_type:mime,data:btoa(binary)}} }
      }catch{/* image analysis is optional */}
    }

    const system = `You are Craft Connect Dynamic Pricing Assistant for SIH 26090. Produce a transparent INR pricing estimate using three evidence layers: artisan costs, the live approved Craft Connect catalog, and (only when supplied) an external market-price feed. Also use 90-day Craft Connect sales velocity as a demand signal. Never invent external market prices or trends. If external feed data is absent, explicitly say so and lower confidence. If an image is supplied, use only visible quality/complexity/material clues and never invent hidden facts. minimum_sustainable_price must cover stated costs plus a modest sustainable margin. recommended_price should balance sustainability, observed comparable prices and demand. premium_price can reflect strong craftsmanship/story/complexity. confidence is 0-1. Return only JSON.`;
    const payload = {
      product:{title,description,material,dimensions,productionDays,currentPrice,costs},
      live_catalog_comparables:comparableText,
      top_90_day_sales_signals:topSales,
      external_market_feed:feed.items,
      market_feed_status:feed.note,
      image_available:Boolean(imagePart)
    };
    const contents:any[]=[{role:"user",parts:[] as any[]}];
    if(imagePart) contents[0].parts.push(imagePart);
    contents[0].parts.push({text:`PRICE INPUTS\n${JSON.stringify(payload)}`});
    const result = await generateAIJson({ contents, schema, systemInstruction:system, temperature:.2, timeoutMs:90000 });
    return json({ pricing:result.data, provider:result.provider, model:result.model, comparable_count:(comparables??[]).length, sales_observations:(salesRows??[]).length, external_market_feed_configured:feed.configured, external_market_feed_note:feed.note }, 200, CORS);
  } catch(e) { return json({ error:e instanceof Error?e.message:String(e) },500,CORS); }
});
