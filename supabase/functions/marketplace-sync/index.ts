import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { json } from "../_shared_ai.ts";
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CORS={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
Deno.serve(async req=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:CORS});
  try{
    const auth=req.headers.get('Authorization'); if(!auth) return json({error:'Please log in.'},401,CORS);
    const supabase=createClient(SUPABASE_URL,SERVICE_ROLE_KEY,{global:{headers:{Authorization:auth}}});
    const {data:{user}}=await supabase.auth.getUser(); if(!user)return json({error:'Not authenticated'},401,CORS);
    const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle();
    if(profile?.role!=='artisan') return json({error:'Only artisans can sync a marketplace catalog.'},403,CORS);
    const body=await req.json(); const incoming=Array.isArray(body.products)?body.products:[];
    if(!incoming.length)return json({error:'No products supplied.'},400,CORS);
    const {data:owned}=await supabase.from('products').select('id').eq('artisan_id',user.id).eq('status','approved').gt('stock_quantity',0);
    const allowed=new Set((owned||[]).map((x:any)=>x.id)); const products=incoming.filter((x:any)=>allowed.has(x.id));
    if(!products.length)return json({error:'No supplied products are approved, in stock and owned by this artisan.'},403,CORS);
    const endpoint=Deno.env.get('MARKETPLACE_SYNC_URL')||'';
    if(!endpoint) return json({synced:false,message:'Catalog validated and ready. Configure MARKETPLACE_SYNC_URL and MARKETPLACE_SYNC_API_KEY for live connector delivery.',product_count:products.length},200,CORS);
    const apiKey=Deno.env.get('MARKETPLACE_SYNC_API_KEY')||'';
    const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(apiKey?{Authorization:`Bearer ${apiKey}`}:{})},body:JSON.stringify({source:'craft-connect',format_version:'1.0',artisan_id:user.id,generated_at:new Date().toISOString(),products}),signal:AbortSignal.timeout(30000)});
    const raw=await res.text(); if(!res.ok)return json({error:`Marketplace endpoint returned HTTP ${res.status}`,detail:raw.slice(0,500)},502,CORS);
    return json({synced:true,message:'Marketplace connector accepted the catalog.',product_count:products.length,endpoint,connector_response:raw.slice(0,1200)},200,CORS);
  }catch(e){return json({error:e instanceof Error?e.message:String(e)},500,CORS)}
});
