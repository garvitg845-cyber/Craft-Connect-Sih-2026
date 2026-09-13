import { generateAIJson, getConfiguredProviders, json, parseDataUrl } from "../_shared_ai.ts";
const CORS = { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type" };
const schema = { type:"object", properties:{ brightness:{type:"number"}, contrast:{type:"number"}, sharpness:{type:"number"}, background_action:{type:"string"}, crop_hint:{type:"string"}, detected_issues:{type:"array",items:{type:"string"}}, studio_notes:{type:"array",items:{type:"string"}} }, required:["brightness","contrast","sharpness","background_action","crop_hint","detected_issues","studio_notes"] };
Deno.serve(async req=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:CORS});
  try{
    if(!getConfiguredProviders().length) return json({error:"No AI provider is configured."},501,CORS);
    const body=await req.json(); const image=String(body.image_data_url||""); if(!image) return json({error:"Upload a product photo first."},400,CORS);
    const {mimeType,data}=parseDataUrl(image);
    const system=`You are Craft Connect AI E-commerce Photo Studio. Inspect a product photo and recommend conservative e-commerce corrections. Do not invent product facts. brightness and contrast should normally be 90-120; sharpness 0-1.2. background_action must be one of keep, clean_white, clean_neutral. Return only JSON.`;
    const result=await generateAIJson({contents:[{role:"user",parts:[{inline_data:{mime_type:mimeType,data}},{text:"Create a studio edit plan for this product image. Prioritize clean catalog presentation, accurate color, centered product and distraction reduction."}]}],schema,systemInstruction:system,temperature:.1,timeoutMs:90000});
    let cleaned_image_data_url = null;
    if (body.remove_background === true) {
      const removeKey = Deno.env.get("REMOVE_BG_API_KEY") || "";
      if (removeKey) {
        const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
        const form = new FormData();
        form.append("image_file", new Blob([bytes], { type: mimeType }), "product-image");
        form.append("size", "auto");
        const rb = await fetch("https://api.remove.bg/v1.0/removebg", { method:"POST", headers:{"X-Api-Key":removeKey}, body:form });
        if (rb.ok) {
          const out = new Uint8Array(await rb.arrayBuffer());
          let binary = ""; for (let i=0;i<out.length;i+=0x8000) binary += String.fromCharCode(...out.subarray(i,i+0x8000));
          cleaned_image_data_url = `data:image/png;base64,${btoa(binary)}`;
        } else {
          const detail = await rb.text();
          throw new Error(`Background removal provider failed: ${detail.slice(0,400)}`);
        }
      }
    }
    return json({plan:result.data,provider:result.provider,model:result.model,cleaned_image_data_url,background_removal_configured:Boolean(Deno.env.get("REMOVE_BG_API_KEY"))},200,CORS);
  }catch(e){return json({error:e instanceof Error?e.message:String(e)},500,CORS)}
});
