# Gemini 3.6 Flash setup

Craft Connect uses the stable `gemini-3.6-flash` model for Product Studio, Craft Guide, Semantic Search and Business Copilot.

Set the key as a Supabase Edge Function secret (do not expose it as a VITE_ frontend variable):

```powershell
npx supabase secrets set GEMINI_API_KEY="YOUR_GEMINI_KEY"
npx supabase secrets set GEMINI_MODEL="gemini-3.6-flash"
```

Deploy:

```powershell
npx supabase functions deploy ai-product-studio
npx supabase functions deploy ai-business-copilot
npx supabase functions deploy ai-semantic-search
npx supabase functions deploy ai-craft-guide
```

The browser-side image compressor remains enabled. Product Studio sends up to 6 compressed images to Gemini 3.6 Flash in one request.
