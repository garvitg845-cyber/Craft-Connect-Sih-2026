-- ============================================================
-- CRAFT CONNECT — STORAGE BUCKETS & POLICIES
-- Run in Supabase SQL editor after creating buckets in Dashboard,
-- OR create buckets here directly.
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('verification-docs', 'verification-docs', false),
  ('return-evidence', 'return-evidence', false),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ---- product-images: public read, artisan-owner write ----
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product_images_owner_insert"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "product_images_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---- verification-docs: private, owner + admin only ----
create policy "verification_docs_owner_rw"
  on storage.objects for select
  using (bucket_id = 'verification-docs' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  ));

create policy "verification_docs_owner_insert"
  on storage.objects for insert
  with check (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---- return-evidence: private, owner + admin only ----
create policy "return_evidence_owner_rw"
  on storage.objects for select
  using (bucket_id = 'return-evidence' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  ));

create policy "return_evidence_owner_insert"
  on storage.objects for insert
  with check (bucket_id = 'return-evidence' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---- avatars: public read, owner write ----
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_owner_write"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- NOTE: Upload paths must be structured as: {user_id}/{filename}
-- e.g. supabase.storage.from('product-images').upload(`${user.id}/${Date.now()}_${file.name}`, file)
