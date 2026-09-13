# Craft Connect V26 updates

- Added public `/contact` page with Garvit contact details.
- Added Contact Us, phone and email shortcuts in the global footer.
- Added mandatory artisan verification profile after artisan login.
- Artisan profile now collects full name, contact email, phone, profile photo, shop/business name, craft type, craft story, state, district/city/place and optional coordinates.
- Added private shop/workplace photo upload for admin verification.
- Preserved optional ID proof/craft certificate upload through the existing private verification-docs flow.
- Admin Artisan Verification now shows profile photo, contact email, phone, location, shop photo and latest verification document with signed URLs.
- Incomplete artisan profiles are automatically redirected to the verification profile before accessing artisan features.
- Added `supabase/artisan_profile_upgrade.sql` for existing databases.
- Gemini key remains server-side in Supabase Secrets. The model defaults to `gemini-3.6-flash`.
- Changing `GEMINI_API_KEY` no longer requires changing React/source code; update the Supabase secret instead.
- Existing product, AI, map, search, image compression, storage, order, admin and other features are retained.
