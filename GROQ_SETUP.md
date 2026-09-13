# Craft Connect v23 — Gemini setup

## 1. Install

```powershell
npm install
```

## 2. Set the Gemini secret in Supabase

```powershell
npx supabase secrets set GEMINI_API_KEY="PASTE_YOUR_GEMINI_KEY_HERE"
```

Optional model override:

```powershell
npx supabase secrets set GEMINI_MODEL="gemini-3.6-flash"
```

Do **not** put the Gemini API key in a `VITE_*` frontend variable. It belongs in Supabase Edge Function Secrets.

## 3. Link and deploy

```powershell
npx supabase link --project-ref zororfodwlzaehhlysgg
npx supabase functions deploy ai-product-studio
npx supabase functions deploy ai-business-copilot
npx supabase functions deploy ai-semantic-search
npx supabase functions deploy ai-craft-guide
```

## 4. Run

```powershell
npm run dev
```

## Image handling

The browser creates a separate AI-only JPEG copy, normally <= about 420 KB and <= 1024px on the longest side. Product uploads are separately compressed to about <= 1.2 MB and <= 1800px. The original local file is never sent to the AI endpoint.

Qwen 3.6 supports up to 5 images per request. Craft Connect sends the first 5 photos, then sends a sixth photo in a refinement request with the first draft so all six supplied photos can contribute.


## v24 JSON fix
The Qwen 3.6 vision workflow uses JSON Object Mode rather than strict JSON Schema mode for compatibility.
