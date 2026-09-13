# Craft Connect v16 fixes

- AI Product Studio now requests structured JSON from OpenRouter and has robust JSON extraction/retry handling.
- `openrouter/free` can route image + structured-output requests to compatible free models.
- Product Studio accepts voice transcript + product photo and fills the draft fields.
- India craft map image is bundled at `public/assets/india-craft-map.webp`.
- Demo mode is enabled by default in the included `.env`/`.env.example`; replace the empty Supabase publishable key with your own key if you want real Supabase login/data.

## Deploy updated AI functions

```powershell
npx supabase functions deploy ai-product-studio
npx supabase functions deploy ai-business-copilot
```

Keep `OPENROUTER_API_KEY` in Supabase Edge Function Secrets. Never put it in `VITE_*` variables.
