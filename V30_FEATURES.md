# Craft Connect V30 — SIH 26090 Feature Upgrade

## Added
- AI Dynamic Pricing using real approved Craft Connect catalog comparables + artisan cost inputs.
- B2B Market Linkage: bulk-ready products, buyer bulk inquiries, artisan inquiry management.
- Marketplace-ready CSV export for approved artisan catalog data (for downstream buyer / marketplace onboarding; not a live GeM/ONDC API integration).
- AI E-commerce Photo Studio: AI photo analysis/edit plan + local browser enhancement.
- Optional automatic background removal through remove.bg when `REMOVE_BG_API_KEY` is configured as a Supabase Edge Function secret.
- PWA installability for mobile/desktop with a lightweight service worker.
- Voice-first complete product listing remains available through the existing Add Product / AI Product Studio flow.

## Supabase migration
Run `supabase/v30_sih_features.sql` once in Supabase SQL Editor.

## Edge Functions
Deploy the new functions:
- `ai-dynamic-pricing`
- `ai-photo-studio`

From the project root after `supabase link`:
```bash
npx supabase functions deploy ai-dynamic-pricing
npx supabase functions deploy ai-photo-studio
```

## Optional background removal
In Supabase Edge Function Secrets add:
`REMOVE_BG_API_KEY=<your remove.bg key>`

AI provider secrets remain server-side. Do not put private AI or service-role keys in the Vite `.env` or Netlify.
