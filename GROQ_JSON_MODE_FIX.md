# v24 Gemini JSON-mode fix

The previous v23 used Gemini strict `json_schema` output with `gemini-2.5-flash`. Gemini currently documents Qwen 3.6 as supporting JSON Object Mode and vision, while strict Structured Outputs are limited to selected models. This could produce HTTP 400 `failed_generation` responses.

v24 switches the shared Gemini helper to `response_format: { type: "json_object" }`, explicitly embeds the expected JSON shape in the system prompt, disables reasoning for predictable JSON, and keeps the existing image compression + 5-image vision workflow.

Deploy the updated Edge Functions after installing the ZIP.
