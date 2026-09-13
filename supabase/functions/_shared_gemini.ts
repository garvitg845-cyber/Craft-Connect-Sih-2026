const DEFAULT_MODEL = "gemini-3.6-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export function getGeminiKey() {
  return Deno.env.get("GEMINI_API_KEY")?.trim() || "";
}

export function getGeminiModel() {
  return Deno.env.get("GEMINI_MODEL")?.trim() || DEFAULT_MODEL;
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

function extractText(payload: any) {
  return (payload?.candidates?.[0]?.content?.parts ?? [])
    .map((p: any) => p?.text ?? "")
    .join("\n")
    .trim();
}

function cleanJsonText(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return (fenced ? fenced[1] : text).trim();
}

async function callGemini(body: any, timeoutMs: number) {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured in Supabase Secrets.");
  const model = getGeminiModel();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const raw = await response.text();
    let payload: any = {};
    try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = { raw }; }
    if (!response.ok) {
      const detail = payload?.error?.message || raw || "Unknown Gemini error";
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Gemini API key was rejected (${response.status}). Check that GEMINI_API_KEY belongs to an enabled Gemini API project.`);
      }
      if (response.status === 429) {
        throw new Error(`Gemini quota/rate limit is exhausted for the Google Cloud project linked to this key. Create/use a project with available Gemini quota or enable billing. Changing keys inside the same project does not reset project quota.`);
      }
      throw new Error(`Gemini rejected the request (${response.status}). ${detail.slice(0, 900)}`);
    }
    return { payload, model };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(`Gemini ${getGeminiModel()} timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateGeminiJson({ contents, schema, systemInstruction, temperature = 0.1, timeoutMs = 60000, tools = [] }: any) {
  const { payload, model } = await callGemini({
    contents,
    ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
    ...(tools.length ? { tools } : {}),
    generationConfig: {
      temperature,
      response_mime_type: "application/json",
      response_json_schema: schema,
    },
  }, timeoutMs);
  const text = extractText(payload);
  if (!text) throw new Error("Gemini returned an empty response.");
  let data: any;
  try { data = JSON.parse(cleanJsonText(text)); }
  catch { throw new Error(`Gemini returned invalid JSON. Raw response: ${text.slice(0, 700)}`); }
  return { data, model };
}

export async function generateGeminiText({ contents, systemInstruction, temperature = 0.2, timeoutMs = 45000 }: any) {
  const { payload, model } = await callGemini({
    contents,
    ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
    generationConfig: { temperature },
  }, timeoutMs);
  const text = extractText(payload);
  if (!text) throw new Error("Gemini returned an empty response.");
  return { text, model };
}
