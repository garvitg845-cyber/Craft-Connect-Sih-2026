# AI Home Decor — V28 feature

## What it does
- Customer uploads a room, shop, office, balcony, bedroom, living room or other space photo.
- After the photo is selected, the UI asks what the decoration is for (Diwali, Holi, Wedding, Eid, Christmas, Puja, Housewarming, Everyday, Shop/Store Display).
- Customer can choose a style and add a special request.
- The `ai-home-decor` Supabase Edge Function loads only approved, in-stock Craft Connect products from Supabase.
- AI analyzes the space and selects product IDs only from that live catalog.
- The frontend creates a visual mockup by overlaying the selected product photos at AI-suggested positions.
- Each suggested product links directly to its Craft Connect product page.
- A JPEG mockup can be saved from the browser.

## Deploy
After extracting the project:

```bash
npx supabase functions deploy ai-home-decor
```

Or deploy all functions:

```bash
npx supabase functions deploy
```

No new API key is required. It uses the existing provider abstraction and whichever of Gemini, OpenRouter, or Groq is configured in Supabase Edge Function Secrets.

## Important
The preview is a placement mockup, not a photorealistic image-to-image edit. It deliberately uses real product images from the Craft Connect catalog so recommendations are purchasable from the site.
