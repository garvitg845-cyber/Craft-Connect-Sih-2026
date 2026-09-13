# Craft Connect v15 — AI + Showcase upgrade

## Added/fixed
- Fixed AI Business Copilot `Cannot access 'products' before initialization` bug.
- Add Product redesigned around **photo + voice** first. Browser speech recognition captures Hindi/English; `ai-product-studio` analyses the transcript and uploaded photo and fills title, description, material, tags, dimensions and production time for review.
- The supplied India craft-map image is bundled locally at `public/assets/india-craft-map.webp`, next to an interactive OpenStreetMap explorer.
- 36 local showcase product images/listings, 12 showcase user profiles, artisan names and craft-region fallbacks are bundled so an empty database does not make the presentation look blank.
- Showcase records are labelled/handled as demo content and are not silently inserted as real sales/orders.

## After replacing your old project
Your OpenRouter secret remains in Supabase. Re-deploy the changed functions:

```powershell
npx supabase functions deploy ai-product-studio
npx supabase functions deploy ai-business-copilot
npx supabase functions deploy ai-semantic-search
```

For image analysis, `OPENROUTER_MODEL=openrouter/free` works only when the routed free model accepts image input. If OpenRouter reports that image input is unsupported, select an image-capable model available to your OpenRouter account and set it as `OPENROUTER_MODEL` in Supabase Edge Function Secrets.

Voice recognition uses the browser Web Speech API and works best in Chrome/Edge. Price and stock remain manual so AI does not invent commercial facts.
