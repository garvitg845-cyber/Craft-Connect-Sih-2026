# Craft Connect V31 — SIH 26090 Final Gap Build

This source package is based on the latest Craft Connect V30 B2B direct-request build and adds the remaining SIH implementation work:

- Built-in browser live camera + phone camera capture.
- Native Android/iOS camera through Capacitor.
- AI photo-studio flow remains provider-agnostic, with optional real background removal.
- Dynamic pricing now uses artisan costs + approved catalog comparables + 90-day Craft Connect sales velocity + optional external market feed + product-image signals.
- New Artisan Marketplace Hub with approved catalog JSON/CSV export.
- Secure Supabase Edge Function connector hook for an approved GeM/ONDC/partner endpoint.
- Existing direct B2B market linkage remains active: approved products can receive requests directly from buyers.
- PWA remains installable.

## Run web app

1. Copy `.env.example` to `.env`.
2. Add only:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Run:

```bash
npm install
npm run dev
```

## Supabase Edge Function secrets

Keep these server-side in Supabase:

- `GEMINI_API_KEY` / `OPENROUTER_API_KEY` / `GROQ_API_KEY`
- `REMOVE_BG_API_KEY` (optional)
- `MARKET_PRICE_FEED_URL` and `MARKET_PRICE_FEED_API_KEY` (optional)
- `MARKETPLACE_SYNC_URL` and `MARKETPLACE_SYNC_API_KEY` (optional)

## Mobile

See `MOBILE_BUILD.md`.

## Important government marketplace limitation

A genuine GeM/ONDC live connection requires platform-issued seller/network credentials and the endpoint/protocol supplied during onboarding. The source therefore provides a real connector interface and catalog export instead of claiming a live government API connection without credentials.
