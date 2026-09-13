# V28.1 AI Decor Product Image Fix

- AI Home Decor now receives the public URL of each approved/in-stock product's primary image from Supabase.
- The decor preview uses the real product image instead of a blank placeholder.
- Recommended products are shown as highlighted overlays at AI-selected positions with an orange highlight ring and numbered marker.
- The shopping list continues to link to the real Craft Connect product page.
- Save Preview also includes the actual product image overlays.

Deploy the updated Edge Function after replacing the ZIP:

```bash
npx supabase functions deploy ai-home-decor
```

Then refresh the frontend.
