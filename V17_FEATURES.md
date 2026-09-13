# Craft Connect v17 — Global AI + Media Upgrade

## What changed
- Added Global Craft AI page for worldwide craft knowledge, voice questions and photo-based craft identification.
- Added `ai-craft-guide` Supabase Edge Function using OpenRouter with structured JSON + retry parsing.
- Artisan Add Product now accepts up to 6 photos.
- Added Product Photo Lab with local brightness, contrast, sharpening and zoom controls.
- Product details now expose multi-photo gallery, zoom viewer and enhanced viewing mode.
- Added Global Craft AI navigation entry and CTA.

## Required deployment
Deploy the new function after updating the project:

`npx supabase functions deploy ai-craft-guide`

The existing OpenRouter secret can be reused. Keep it server-side.
