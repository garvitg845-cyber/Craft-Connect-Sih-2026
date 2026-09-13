# Craft Connect v15 — Realistic AI Showcase

## Added / fixed
- AI-first Add Product flow: voice command + product photo -> OpenRouter Product Studio -> auto-filled listing.
- Camera capture supported on mobile; speech recognition supported by Chromium browsers.
- AI Business Copilot ReferenceError fixed (`products` is no longer referenced before initialization).
- Supplied India craft/textile map image added to Craft Map page alongside the interactive map.
- Demo showcase fallback: 40 product cards with photos, 10 artisan profiles, 18 customer profiles, categories and 10 craft regions.
- Demo data is clearly labeled and is read-only; real Supabase rows take priority.
- Existing Customer, Artisan and Admin routes/panels retained.

## Required after replacing your project
2. Your `OPENROUTER_API_KEY` stays in Supabase Edge Function Secrets, never in Vite `.env`.
3. Re-deploy changed AI functions:
   `npx supabase functions deploy ai-product-studio`
   `npx supabase functions deploy ai-business-copilot`
4. Run `npm install` then `npm run dev`.

## Note on AI image understanding
OpenRouter must route the request to a model that accepts image input. If `openrouter/free` selects a text-only model, set `OPENROUTER_MODEL` in Supabase Secrets to a vision-capable OpenRouter model available to your account.
