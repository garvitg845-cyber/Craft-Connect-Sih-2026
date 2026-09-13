-- ============================================================
-- CRAFT CONNECT — SUPABASE SCHEMA
-- Run this in Supabase SQL Editor (or via `supabase db push`)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
create type user_role as enum ('customer', 'artisan', 'admin');
create type order_status as enum ('placed','confirmed','packed','shipped','out_for_delivery','delivered','cancelled');
create type verification_status as enum ('pending','approved','rejected');
create type product_status as enum ('draft','pending_review','approved','rejected');
create type return_status as enum ('requested','under_review','approved','rejected','refunded','replaced');
create type payment_status as enum ('pending','paid','failed','refunded');

-- ------------------------------------------------------------
-- PROFILES (1:1 with auth.users)
-- ------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'customer',
  phone text,
  contact_email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_role on profiles(role);

-- ------------------------------------------------------------
-- ARTISANS (extends profile when role = artisan)
-- ------------------------------------------------------------
create table artisans (
  id uuid primary key references profiles(id) on delete cascade,
  business_name text not null,
  craft_type text,
  story text,
  state text,
  district text,
  latitude numeric,
  longitude numeric,
  verification_status verification_status not null default 'pending',
  verification_notes text,
  shop_photo_url text,
  public_catalog_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_artisans_verification on artisans(verification_status);
create index idx_artisans_state on artisans(state);

create table artisan_verification (
  id uuid primary key default uuid_generate_v4(),
  artisan_id uuid not null references artisans(id) on delete cascade,
  document_url text,
  status verification_status not null default 'pending',
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index idx_verification_artisan on artisan_verification(artisan_id);

-- ------------------------------------------------------------
-- CUSTOMERS (extends profile when role = customer)
-- ------------------------------------------------------------
create table customers (
  id uuid primary key references profiles(id) on delete cascade,
  default_address jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CATEGORIES / CRAFT REGIONS
-- ------------------------------------------------------------
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table craft_regions (
  id uuid primary key default uuid_generate_v4(),
  state_name text not null,
  latitude numeric not null,
  longitude numeric not null,
  famous_crafts text[] not null default '{}',
  description text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_craft_regions_state on craft_regions(state_name);

-- ------------------------------------------------------------
-- PRODUCTS
-- ------------------------------------------------------------
create table products (
  id uuid primary key default uuid_generate_v4(),
  artisan_id uuid not null references artisans(id) on delete cascade,
  category_id uuid references categories(id),
  title text not null,
  description text,
  material text,
  dimensions text,
  production_time_days int,
  tags text[] default '{}',
  price numeric(10,2) not null check (price >= 0),
  cost_breakdown jsonb, -- {materials, labour, packaging, shipping, platform_fee, other, margin_pct}
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  status product_status not null default 'draft',
  moderation_notes text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_products_artisan on products(artisan_id);
create index idx_products_category on products(category_id);
create index idx_products_status on products(status);
create index idx_products_price on products(price);

create table product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_product_images_product on product_images(product_id);

create table inventory (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade unique,
  quantity_available int not null default 0,
  low_stock_threshold int not null default 3,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CART
-- ------------------------------------------------------------
create table carts (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade unique,
  created_at timestamptz not null default now()
);

create table cart_items (
  id uuid primary key default uuid_generate_v4(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique(cart_id, product_id)
);

-- ------------------------------------------------------------
-- WISHLIST
-- ------------------------------------------------------------
create table wishlists (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(customer_id, product_id)
);

-- ------------------------------------------------------------
-- ORDERS
-- ------------------------------------------------------------
create table orders (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id),
  status order_status not null default 'placed',
  total_amount numeric(10,2) not null,
  shipping_address jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_orders_customer on orders(customer_id);
create index idx_orders_status on orders(status);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  artisan_id uuid not null references artisans(id),
  quantity int not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index idx_order_items_order on order_items(order_id);
create index idx_order_items_artisan on order_items(artisan_id);

create table shipping (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade unique,
  courier_name text,
  tracking_number text,
  tracking_url text,
  current_status order_status not null default 'placed',
  status_history jsonb default '[]', -- append-only log of {status, timestamp}
  updated_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  amount numeric(10,2) not null,
  status payment_status not null default 'pending',
  provider text,
  provider_reference text,
  created_at timestamptz not null default now()
);
create index idx_payments_order on payments(order_id);

-- ------------------------------------------------------------
-- REVIEWS
-- ------------------------------------------------------------
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  order_id uuid references orders(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(product_id, customer_id, order_id)
);
create index idx_reviews_product on reviews(product_id);

-- ------------------------------------------------------------
-- RETURNS / DAMAGE
-- ------------------------------------------------------------
create table returns (
  id uuid primary key default uuid_generate_v4(),
  order_item_id uuid not null references order_items(id) on delete cascade,
  customer_id uuid not null references customers(id),
  reason text not null,
  evidence_urls text[] default '{}',
  status return_status not null default 'requested',
  admin_notes text,
  reviewed_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_returns_customer on returns(customer_id);
create index idx_returns_status on returns(status);

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on notifications(user_id, is_read);

-- ------------------------------------------------------------
-- AI GENERATIONS (audit of every AI call, per artisan)
-- ------------------------------------------------------------
create table ai_generations (
  id uuid primary key default uuid_generate_v4(),
  artisan_id uuid not null references artisans(id) on delete cascade,
  feature text not null, -- 'product_studio' | 'business_copilot' | 'semantic_search'
  input_summary text,
  output jsonb,
  created_at timestamptz not null default now()
);
create index idx_ai_generations_artisan on ai_generations(artisan_id);

-- ------------------------------------------------------------
-- AUDIT LOGS (admin/system actions)
-- ------------------------------------------------------------
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references profiles(id),
  action text not null,
  target_table text,
  target_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_logs_actor on audit_logs(actor_id);

-- ------------------------------------------------------------
-- updated_at trigger helper
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on profiles for each row execute function set_updated_at();
create trigger trg_artisans_updated before update on artisans for each row execute function set_updated_at();
create trigger trg_products_updated before update on products for each row execute function set_updated_at();
create trigger trg_orders_updated before update on orders for each row execute function set_updated_at();
create trigger trg_returns_updated before update on returns for each row execute function set_updated_at();
create trigger trg_craft_regions_updated before update on craft_regions for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- Auto-create profile row on signup (role comes from user_metadata)
-- ------------------------------------------------------------
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, contact_email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer'),
    new.email
  );

  if coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer') = 'artisan' then
    insert into public.artisans (id, business_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'New Artisan'));
  else
    insert into public.customers (id) values (new.id);
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

