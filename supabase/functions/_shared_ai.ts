const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const GROQ_BASE = "https://api.groq.com/openai/v1";

const DEFAULTS = {
  gemini: "gemini-3.6-flash",
  openrouter: "openrouter/free",
  groq: "qwen/qwen3.6-27b",
};

type Provider = "gemini" | "openrouter" | "groq";

export function getProviderSetting() {
  const value = (Deno.env.get("AI_PROVIDER") || "auto").trim().toLowerCase();
  return ["gemini", "openrouter", "groq", "auto"].includes(value) ? value : "auto";
}

export function getProviderModel(provider: Provider) {
  const selected = getProviderSetting();
  const generic = selected === provider ? Deno.env.get("AI_MODEL") : "";
  return (Deno.env.get(`${provider.toUpperCase()}_MODEL`) || generic || DEFAULTS[provider]).trim();
}

export function getProviderKey(provider: Provider) {
  const selected = getProviderSetting();
  const generic = selected === provider ? Deno.env.get("AI_API_KEY") : "";
  return (Deno.env.get(`${provider.toUpperCase()}_API_KEY`) || generic || "").trim();
}

export function getConfiguredProviders(): Provider[] {
  const selected = getProviderSetting();
  const all: Provider[] = ["gemini", "openrouter", "groq"];
  if (selected !== "auto") return getProviderKey(selected as Provider) ? [selected as Provider] : [];
  return all.filter((provider) => Boolean(getProviderKey(provider)));
}

export function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}

export function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) throw new Error("Invalid image data URL.");
  return { mimeType: match[1], data: match[2] };
}

function extractGeminiText(payload: any) {
  return (payload?.candidates?.[0]?.content?.parts ?? [])
    .map((p: any) => p?.text ?? "")
    .join("\n")
    .trim();
}

function extractOpenAIText(payload: any) {
  const message = payload?.choices?.[0]?.message;
  if (typeof message?.content === "string") return message.content.trim();
  if (Array.isArray(message?.content)) {
    return message.content.map((part: any) => part?.text ?? part?.content ?? "").join("\n").trim();
  }
  return "";
}

function cleanJsonText(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  let value = (fenced ? fenced[1] : text).trim();
  if (value.startsWith("{") || value.startsWith("[")) return value;
  const objectStart = value.indexOf("{");
  const objectEnd = value.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) return value.slice(objectStart, objectEnd + 1);
  const arrayStart = value.indexOf("[");
  const arrayEnd = value.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) return value.slice(arrayStart, arrayEnd + 1);
  return value;
}

function schemaInstruction(schema: any) {
  return `Return ONLY one valid JSON object matching this schema. Do not use markdown fences. Do not add commentary. JSON schema:\n${JSON.stringify(schema)}`;
}

function toOpenAIContent(parts: any[]) {
  return parts.map((part: any) => {
    if (part?.text !== undefined) return { type: "text", text: String(part.text) };
    if (part?.inline_data?.data) {
      const mime = part.inline_data.mime_type || "image/jpeg";
      return { type: "image_url", image_url: { url: `data:${mime};base64,${part.inline_data.data}` } };
    }
    return null;
  }).filter(Boolean);
}

async function callGemini(body: any, timeoutMs: number) {
  const key = getProviderKey("gemini");
  if (!key) throw new Error("GEMINI_API_KEY is not configured in Supabase Secrets.");
  const model = getProviderModel("gemini");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const raw = await response.text();
    let payload: any = {};
    try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = { raw }; }
    if (!response.ok) {
      const detail = payload?.error?.message || raw || "Unknown Gemini error";
      throw new Error(`Gemini ${response.status}: ${detail.slice(0, 900)}`);
    }
    return { payload, model };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") throw new Error(`Gemini ${model} timed out.`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAICompatible(provider: "openrouter" | "groq", body: any, timeoutMs: number) {
  const key = getProviderKey(provider);
  if (!key) throw new Error(`${provider.toUpperCase()}_API_KEY is not configured in Supabase Secrets.`);
  const model = getProviderModel(provider);
  const base = provider === "openrouter" ? OPENROUTER_BASE : GROQ_BASE;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${key}`,
  };
  if (provider === "openrouter") {
    headers["HTTP-Referer"] = "https://craft-connect.local";
    headers["X-Title"] = "Craft Connect";
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...body, model }),
      signal: controller.signal,
    });
    const raw = await response.text();
    let payload: any = {};
    try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = { raw }; }
    if (!response.ok) {
      const detail = payload?.error?.message || raw || "Unknown provider error";
      throw new Error(`${provider} ${response.status}: ${detail.slice(0, 900)}`);
    }
    return { payload, model };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") throw new Error(`${provider} ${model} timed out.`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function providerOrder() {
  const configured = getConfiguredProviders();
  if (configured.length) return configured;
  return [];
}

async function generateWithProvider(provider: Provider, args: any, mode: "json" | "text") {
  const { contents, schema, systemInstruction, temperature, timeoutMs, tools } = args;
  if (provider === "gemini") {
    const body: any = {
      contents,
      ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
      ...(tools?.length ? { tools } : {}),
      generationConfig: {
        temperature,
        ...(mode === "json" ? { response_mime_type: "application/json", response_json_schema: schema } : {}),
      },
    };
    const { payload, model } = await callGemini(body, timeoutMs);
    const text = extractGeminiText(payload);
    if (!text) throw new Error("Gemini returned an empty response.");
    if (mode === "text") return { text, model, provider };
    let data: any;
    try { data = JSON.parse(cleanJsonText(text)); }
    catch { throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 700)}`); }
    return { data, model, provider };
  }

  const messages: any[] = [];
  if (systemInstruction) messages.push({ role: "system", content: systemInstruction + (mode === "json" ? `\n\n${schemaInstruction(schema)}` : "") });
  for (const item of contents ?? []) {
    const role = item?.role === "assistant" ? "assistant" : "user";
    let sourceParts = item?.parts ?? [];
    const imageParts = sourceParts.filter((p: any) => Boolean(p?.inline_data?.data));
    if (imageParts.length > 5) {
      sourceParts = sourceParts.filter((p: any) => !p?.inline_data?.data).concat(imageParts.slice(0, 5));
    }
    const content = toOpenAIContent(sourceParts);
    messages.push({ role, content: content.length === 1 && content[0]?.type === "text" ? content[0].text : content });
  }
  const body: any = {
    messages,
    temperature,
    ...(mode === "json" ? { response_format: { type: "json_object" } } : {}),
  };
  const { payload, model } = await callOpenAICompatible(provider, body, timeoutMs);
  const text = extractOpenAIText(payload);
  if (!text) throw new Error(`${provider} returned an empty response.`);
  if (mode === "text") return { text, model, provider };
  let data: any;
  try { data = JSON.parse(cleanJsonText(text)); }
  catch { throw new Error(`${provider} returned invalid JSON: ${text.slice(0, 700)}`); }
  return { data, model, provider };
}

async function runWithFallback(args: any, mode: "json" | "text") {
  const providers = providerOrder();
  if (!providers.length) {
    throw new Error("No AI provider is configured. Add at least one of GEMINI_API_KEY, OPENROUTER_API_KEY, or GROQ_API_KEY in Supabase Edge Function Secrets.");
  }
  const errors: string[] = [];
  for (const provider of providers) {
    try {
      return await generateWithProvider(provider, args, mode);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  throw new Error(`All configured AI providers failed. ${errors.join(" | ")}`);
}

export async function generateAIJson(args: any) {
  return runWithFallback(args, "json");
}

export async function generateAIText(args: any) {
  return runWithFallback(args, "text");
}
