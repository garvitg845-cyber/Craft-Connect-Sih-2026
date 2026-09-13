# SIH 26090 final-gap implementation

This version closes the four implementation gaps as far as credentials/platform contracts allow without fabricating a live government integration.

## 1. Built-in camera + AI photo studio
- Browser/PWA: live `getUserMedia` camera + phone camera input.
- Android/iOS Capacitor: native `@capacitor/camera`.
- Up to 6 images.
- Local brightness/contrast/sharpness correction.
- AI studio edit plan.
- Optional real background removal with `REMOVE_BG_API_KEY`.

## 2. Dynamic pricing with real market signals
`ai-dynamic-pricing` now combines:
- artisan-entered raw-material/labour/packaging/shipping/other costs;
- approved Craft Connect catalog comparables;
- last-90-day Craft Connect order velocity;
- optional external market-price feed (`MARKET_PRICE_FEED_URL`);
- primary product image analysis when a product is selected.

If the external feed is not configured, the UI explicitly says the estimate is internal and the AI lowers confidence rather than inventing market data.

### External feed contract
The URL must return either:
```json
[{"title":"...","category":"...","material":"...","price":1234,"date":"2026-09-10","source":"..."}]
```
or:
```json
{"items":[...]}
```

## 3. B2B + government/e-commerce linkage
- Direct B2B requests are already implemented: any approved product can be requested, minimum 40 pieces and delivery at least 6 days ahead.
- New `/artisan/marketplaces` page exports the approved in-stock artisan catalog as JSON/CSV.
- New `marketplace-sync` Edge Function validates ownership/status and POSTs to a configured integration endpoint.
- Set `MARKETPLACE_SYNC_URL` and optional `MARKETPLACE_SYNC_API_KEY` in Supabase secrets when an approved GeM/ONDC/other partner connector endpoint is available.

The app does not pretend to be connected to GeM/ONDC without the platform-issued seller/network credentials and endpoint contract.

## 4. Cross-platform mobile app
- Capacitor 8.5.x configuration included.
- Native camera plugin included.
- `MOBILE_BUILD.md` has Android/iOS commands.
- PWA remains installable from the browser.

## Security
Keep all AI, marketplace and background-removal secrets in Supabase Edge Function Secrets. Netlify only needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
