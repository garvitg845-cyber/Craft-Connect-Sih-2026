# Craft Connect AI Providers

This build supports **Gemini, OpenRouter, and Groq** from the same Edge Functions.

## Easiest setup

In Supabase Dashboard -> Edge Functions -> Secrets, add whichever keys you have:

```text
AI_PROVIDER=auto
GEMINI_API_KEY=...
OPENROUTER_API_KEY=...
GROQ_API_KEY=...
```

Models are optional because safe defaults are included:

```text
GEMINI_MODEL=gemini-3.6-flash
OPENROUTER_MODEL=openrouter/free
GROQ_MODEL=qwen/qwen3.6-27b
```

With `AI_PROVIDER=auto`, if only one key exists, that provider is used. If multiple exist, the function tries them in order and falls back if one fails.

To use only one provider:

```text
AI_PROVIDER=groq
```

or `gemini` / `openrouter`.

### Generic single-key mode

If you prefer only two secrets:

```text
AI_PROVIDER=groq
AI_API_KEY=your_key
```

`AI_MODEL` can override the provider model in this mode.

## Deploy Edge Functions

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy
```

## Security

Never put AI keys in `VITE_*` variables or frontend source files. Keep them in Supabase Edge Function Secrets.
