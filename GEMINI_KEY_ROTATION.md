# Gemini key rotation — no code changes required

Craft Connect keeps the Gemini API key server-side in **Supabase Edge Function Secrets**.
The frontend never needs the Gemini key.

## Get a new key
Open Google AI Studio API Keys:
https://aistudio.google.com/app/apikey

Create a new key for the Google Cloud project you want to use. If an old key was exposed publicly, revoke/delete it and create a replacement.

## Put the new key into Supabase
From the project folder:

```bash
npx supabase secrets set GEMINI_API_KEY="YOUR_NEW_GEMINI_KEY"
npx supabase secrets set GEMINI_MODEL="gemini-3.6-flash"
```

If the Edge Functions are already deployed, only the secret value needs to change. **Do not edit React source code when the key changes.**

If you change the model, update `GEMINI_MODEL` only. The shared Gemini helper reads both values from server-side secrets.

## Deploy/update Edge Functions

```bash
npx supabase functions deploy ai-product-studio
npx supabase functions deploy ai-business-copilot
npx supabase functions deploy ai-semantic-search
npx supabase functions deploy ai-craft-guide
```

Do not put `GEMINI_API_KEY` in a `VITE_*` frontend variable or commit it to GitHub/Netlify.
