# Craft Connect v18

- Removed demo/fake products, artisans, customers, categories and demo analytics from the running app.
- Customer catalog, artisan profiles, admin lists and craft map now read live Supabase records only.
- Removed showcase/demo banner and demo-mode environment flag.
- Product Studio now compresses the first phone photo locally before sending it to AI.
- Product Studio and Global Craft AI use a known free multimodal model (`google/gemma-3-27b-it:free`) when `OPENROUTER_MODEL` is unset or `openrouter/free`, avoiding random model selection for the vision workflow.
- Added provider timeouts and clearer AI error details.
- Product Studio keeps the 1–6 photo gallery and browser-side enhancement/zoom tools.

## Redeploy AI functions

```powershell
npx supabase link --project-ref zororfodwlzaehhlysgg
npx supabase functions deploy ai-product-studio
npx supabase functions deploy ai-craft-guide
npx supabase functions deploy ai-business-copilot
npx supabase functions deploy ai-semantic-search
```

The OpenRouter key remains a Supabase secret. Do not put it in the Vite `.env` file.
