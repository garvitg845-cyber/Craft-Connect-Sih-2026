# Craft Connect V29

## Added
- AI Home Decor budget-aware planning.
- AI Home Decor "Add Complete Look" to customer cart.
- Digital Craft Passport for verified artisans at `/customer/artisans/:id/passport`.
- Craft Passport button on public artisan profiles.
- Settings page at `/settings`.
- Language selector with English, Hindi, Punjabi, Gujarati, Marathi, Bengali, Tamil and Telugu.
- Language preference is saved in localStorage and applied across the SPA using Google Translate.
- Basic settings: dark mode, notifications preference, compact view, reset settings.

## Deployment
- Keep Gemini/OpenRouter/Groq API keys in Supabase Edge Function Secrets.
- Frontend Netlify variables remain `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Deploy the updated Home Decor function with `npx supabase functions deploy ai-home-decor`.
- Deploy all functions with `npx supabase functions deploy`.
