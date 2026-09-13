# Craft Connect — AI Provider Setup

Craft Connect supports three server-side AI providers without changing React code:

- Gemini
- OpenRouter
- Groq

## Supabase Edge Function Secrets

Recommended setup:

```text
AI_PROVIDER=auto

GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.6-flash

OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openrouter/free

GROQ_API_KEY=...
GROQ_MODEL=qwen/qwen3.6-27b
```

You may leave any provider key empty. With `AI_PROVIDER=auto`, the functions use the configured providers and fall back to the next one if a provider is unavailable, rate-limited, rejected, or otherwise fails.

To force one provider only, set `AI_PROVIDER` to `gemini`, `openrouter`, or `groq`.

You can also use a single generic secret when forcing one provider:

```text
AI_PROVIDER=groq
AI_API_KEY=your_groq_key
AI_MODEL=qwen/qwen3.6-27b
```

The provider-specific names are recommended because they make fallback easier.

After changing a secret in Supabase, no source-code change is needed. Redeploy the Edge Functions only if your deployment process requires it; Supabase secrets are exposed to the functions as environment variables.

## Deploy

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy
```

## Notes

- Never put provider API keys in `VITE_*` frontend variables.
- Craft Guide Google Search grounding is available when Gemini is the provider. OpenRouter/Groq fallback still provides craft answers, but does not inherit Gemini's Google Search grounding tool.
- Groq's default model is `qwen/qwen3.6-27b`, which supports text + image inputs and JSON mode.
- OpenRouter's `openrouter/free` router automatically selects an available free model that supports the request capabilities.
