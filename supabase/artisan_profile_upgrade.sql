-- Craft Connect: artisan personal profile + shop verification upgrade
-- Run once in Supabase SQL Editor on an existing project.

alter table public.profiles add column if not exists contact_email text;
alter table public.artisans add column if not exists shop_photo_url text;

-- Backfill the contact email from Auth for existing users.
update public.profiles p
set contact_email = u.email
from auth.users u
where u.id = p.id and p.contact_email is null;

-- Keep future signups synced with their Auth email.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, contact_email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'customer'),
    new.email
  );

  if coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'customer') = 'artisan' then
    insert into public.artisans (id, business_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'New Artisan'));
  else
    insert into public.customers (id) values (new.id);
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Existing storage policies already make verification-docs private and readable by admins,
-- while avatars are public-readable and writable by their owner.
