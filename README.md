# Craft Connect

An AI-powered marketplace connecting Indian artisans with customers. Built with **React + Vite + Tailwind CSS**
on the frontend and **Supabase** (Postgres, Auth, Row Level Security, Storage, Edge Functions) on the backend.

**Zero dummy data.** Every screen reads from and writes to real Supabase tables. New installs start completely
empty and show proper "No products yet" / "No orders yet" empty states until real users create real data.

---

## 1. Project Structure

```
craft-connect/
├── src/
│   ├── pages/customer/     # Customer-facing screens
│   ├── pages/artisan/      # Artisan dashboard & tools
│   ├── pages/admin/        # Admin panel
│   ├── components/         # Shared UI (Navbar, EmptyState, ProtectedRoute, etc.)
│   ├── context/AuthContext.jsx
│   ├── lib/supabaseClient.js
│   └── App.jsx             # All routes
├── supabase/
│   ├── schema.sql           # All tables, enums, indexes, triggers
│   ├── rls_policies.sql     # Row Level Security policies (the real security boundary)
│   ├── storage_policies.sql # Storage buckets + policies
│   └── functions/           # Edge Functions (AI calls happen ONLY here, server-side)
│       ├── ai-product-studio/
│       ├── ai-business-copilot/
│       └── ai-semantic-search/
├── .env.example
└── README.md (this file)
```

---

## 2. Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) project
- An Gemini API key (the Edge Functions are configured for Gemini
  `/v1/messages` API, but you can adapt them to any provider)
- (Optional) A [Mapbox](https://mapbox.com) token if you want branded map tiles instead of the default
  OpenStreetMap tiles (which require no key at all)

---

## 3. Set up Supabase

1. Create a new project at https://supabase.com/dashboard.
2. Go to **SQL Editor** and run, **in this exact order**:
   1. `supabase/schema.sql`
   2. `supabase/rls_policies.sql`
   3. `supabase/storage_policies.sql`
3. Go to **Settings → API** and copy your **Project URL** and **anon public key**.
4. Go to **Settings → API → Service Role** and copy the **service_role key** — you'll need this ONLY for
   Edge Functions (step 5), never for the frontend.

### Creating an admin account
There's no public "admin" signup — by design. After a normal user signs up (as customer or artisan), promote
them manually in the SQL Editor:
```sql
update profiles set role = 'admin' where id = '<their auth.users id>';
```

---

## 4. Configure environment variables

```bash
cp .env.example .env
```
Fill in:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — from Supabase Settings → API
- `VITE_MAPBOX_TOKEN` — optional, only if you want Mapbox tiles instead of free OpenStreetMap tiles
- `GEMINI_API_KEY`, optional `GEMINI_MODEL`, optional `GEMINI_MODEL` — **do not put these in `.env` for the frontend build.** They are used only
  by Supabase Edge Functions (see below). `.env` here is just documentation of what's needed.

**Never commit real keys.** `.env` is already git-ignored.

---

## 5. Deploy the AI Edge Functions

The AI Product Studio, Business Copilot, and Semantic Search all run as Supabase Edge Functions so the AI
provider key is never exposed to the browser.

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>

# Set secrets (server-side only — never shipped to the client bundle)
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY
supabase secrets set GEMINI_MODEL=gemini-3.6-flash

# Deploy each function
supabase functions deploy ai-product-studio
supabase functions deploy ai-business-copilot
supabase functions deploy ai-semantic-search
```

Until you complete this step, the AI Product Studio / Copilot / Semantic Search buttons will surface a clear
message ("GEMINI_API_KEY is not configured on the server") instead of silently failing or fabricating output.

---

## 6. Run locally

```bash
npm install
npm run dev
```
Visit http://localhost:5173.

---

## 7. Map setup (India Craft Map)

The Craft Map works out of the box using free OpenStreetMap tiles via Leaflet — no key required. If you'd
prefer Mapbox's styled tiles, set `VITE_MAPBOX_TOKEN` in `.env`; `CraftMap.jsx` automatically switches tile
providers when that variable is present.

Craft region markers are **not hard-coded** — they come from the `craft_regions` table, which is empty on a
fresh install. Log in as an admin and go to **Admin → Categories/Crafts → Craft Map Regions** to add real
states with accurate latitude/longitude and their documented traditional crafts.

---

## 8. What's fully functional vs. what needs your configuration

| Feature | Status |
|---|---|
| Auth, role-based redirect, RLS | ✅ Fully functional out of the box |
| Product CRUD, cart, checkout, order lifecycle | ✅ Fully functional out of the box |
| Image uploads (products, verification docs, return evidence) | ✅ Fully functional out of the box |
| QR Digital Catalog | ✅ Fully functional out of the box (uses your deployed URL) |
| Smart Pricing Calculator | ✅ Fully functional, pure client-side math |
| Admin verification / moderation / audit log | ✅ Fully functional out of the box |
| India Craft Map | ✅ Functional with OSM tiles; add real regions via Admin panel |
| AI Product Studio / Business Copilot / Semantic Search | ⚙️ Requires `GEMINI_API_KEY` secret + deployed Edge Functions (step 5) |
| Payment gateway | ⚙️ Not wired to a provider — `payments` table and UI are ready for you to connect Razorpay/Stripe |
| Real courier tracking | ⚙️ `shipping` table/UI structured for a real courier API; currently updated manually by the artisan/admin |

No screen fabricates data to "look populated" — every number, chart, and list is a live query against your
Supabase database, and every unconfigured integration says so explicitly instead of pretending to work.

---

## 9. Deployment

**Frontend:** Deploy the Vite build (`npm run build` → `dist/`) to Vercel, Netlify, or Cloudflare Pages. Set
the same `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` / `VITE_MAPBOX_TOKEN` as environment variables in
your hosting provider's dashboard — never in the repo.

**Backend:** Supabase is already hosted. Just make sure your Edge Function secrets (`GEMINI_API_KEY`, etc.) are
set via `supabase secrets set`, not committed anywhere.

---

## 10. Security notes

- All authorization is enforced by **Postgres Row Level Security**, not just frontend route guards — see
  `supabase/rls_policies.sql`. A modified or bypassed frontend still cannot read/write data it shouldn't.
- The AI provider's secret key lives **only** as a Supabase Edge Function secret; it is never bundled into
  the Vite/React client code.
- Storage buckets for verification documents and return evidence are private; only the owner and admins can
  read them (see `supabase/storage_policies.sql`).
- Every admin action (approve/reject artisan, approve/reject product, return decision) is written to
  `audit_logs`.

## New AI + media features

- **Global Craft AI** (`/customer/craft-guide`): asks about craft traditions from any country/region and can inspect an uploaded craft photo. It uses the server-side `GEMINI_API_KEY` and Gemini model secrets through the `ai-craft-guide` Supabase Edge Function.
- **6-photo artisan gallery**: Add Product accepts up to 6 images. The first is the primary image; all images are stored in the existing `product-images` Supabase Storage bucket and linked through `product_images`.
- **Product Photo Lab**: browser-side brightness, contrast, sharpening, zoom and multi-photo enhancement. This does not require an AI API key.
- **Product viewer**: customer product pages support multi-photo galleries, zoom, and an enhanced viewing mode.

### Deploy the new Edge Function

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy ai-craft-guide
```

The function uses the same server-side Gemini secrets already used by the other AI functions:

```bash
npx supabase secrets set GEMINI_API_KEY=YOUR_KEY
npx supabase secrets set GEMINI_MODEL=gemini-3.6-flash
```

Do not put the Gemini key in the frontend `.env` or commit it to Git.

## V18 real-data mode

This release removes demo products, demo artisans, demo customers and demo analytics from the running application. The UI reads live Supabase records only. Product Studio compresses phone photos locally and uses a Gemini multimodal vision with structured JSON output for reliable autofill.


## Gemini key rotation

The Gemini key is read only from Supabase Edge Function Secrets, so changing the key never requires editing the React source code.

1. Create/revoke keys in Google AI Studio: https://aistudio.google.com/app/apikey
2. Update the server secret:

```bash
npx supabase secrets set GEMINI_API_KEY="YOUR_NEW_GEMINI_KEY"
npx supabase secrets set GEMINI_MODEL="gemini-3.6-flash"
```

3. Redeploy the Edge Functions if your deployment workflow requires it. The application code does not need to change just because the API key changes.

Never put `GEMINI_API_KEY` in a `VITE_*` variable, GitHub repository, or frontend bundle.

## Artisan verification profile

After an artisan logs in, Craft Connect requires a completed verification profile before allowing access to the artisan dashboard/features. The artisan provides full name, contact email, phone, profile photo, shop/business name, craft type, state, district/city, optional coordinates, and a private shop/workplace photo. Admins can review these details and the private shop photo in the Artisan Verification screen before approving or rejecting the artisan.

For an existing Supabase project, run `supabase/artisan_profile_upgrade.sql` once in the Supabase SQL Editor.
