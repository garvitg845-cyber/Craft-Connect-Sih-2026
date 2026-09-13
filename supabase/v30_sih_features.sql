-- CRAFT CONNECT V30 — SIH 26090 MARKET LINKAGE + AI PRICING
-- B2B rules: minimum 40 pieces, minimum delivery window 6 days.
-- Any approved product can receive a B2B request. b2b_ready is optional product metadata and is NOT a customer-request gate.
-- Run once in Supabase SQL Editor after the existing schema/policies.

alter table public.products add column if not exists b2b_ready boolean not null default false;
alter table public.products add column if not exists bulk_min_quantity integer not null default 40;
update public.products set bulk_min_quantity = 40 where bulk_min_quantity is null or bulk_min_quantity < 40;
alter table public.products drop constraint if exists products_bulk_min_quantity_check;
alter table public.products add constraint products_bulk_min_quantity_check check (bulk_min_quantity >= 40);
alter table public.products add column if not exists bulk_price numeric(10,2);

create table if not exists public.market_inquiries (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete set null,
  artisan_id uuid not null references public.artisans(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  buyer_name text,
  buyer_company text,
  buyer_email text,
  buyer_phone text,
  quantity integer not null default 40 check (quantity >= 40),
  target_price numeric(10,2),
  delivery_date date not null,
  message text,
  status text not null default 'new' check (status in ('new','viewed','quoted','accepted','rejected','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Make the migration safe for an already-used table.
update public.market_inquiries set quantity = 40 where quantity is null or quantity < 40;
update public.market_inquiries set delivery_date = (current_date + 6) where delivery_date is null or delivery_date < (current_date + 6);
alter table public.market_inquiries alter column quantity set default 40;
alter table public.market_inquiries alter column quantity set not null;
alter table public.market_inquiries alter column delivery_date set not null;
alter table public.market_inquiries drop constraint if exists market_inquiries_quantity_check;
alter table public.market_inquiries add constraint market_inquiries_quantity_check check (quantity >= 40);

-- PostgreSQL CHECK constraints cannot use current_date because it changes with time.
-- A trigger enforces the 6-day delivery rule at insert/update time instead.
create or replace function public.validate_b2b_inquiry_rules()
returns trigger
language plpgsql
as $$
begin
  if new.quantity < 40 then
    raise exception 'Minimum B2B order quantity is 40 pieces';
  end if;
  if new.delivery_date < (current_date + 6) then
    raise exception 'B2B delivery date must be at least 6 days from today';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_b2b_inquiry_rules on public.market_inquiries;
create trigger trg_validate_b2b_inquiry_rules
before insert or update on public.market_inquiries
for each row execute function public.validate_b2b_inquiry_rules();

create index if not exists idx_market_inquiries_artisan on public.market_inquiries(artisan_id, created_at desc);
create index if not exists idx_market_inquiries_buyer on public.market_inquiries(buyer_id, created_at desc);
create index if not exists idx_products_b2b on public.products(status, created_at desc);

alter table public.market_inquiries enable row level security;

drop policy if exists "market_inquiries_buyer_insert" on public.market_inquiries;
create policy "market_inquiries_buyer_insert" on public.market_inquiries for insert
  with check (buyer_id = auth.uid());

drop policy if exists "market_inquiries_buyer_select" on public.market_inquiries;
create policy "market_inquiries_buyer_select" on public.market_inquiries for select
  using (buyer_id = auth.uid());

drop policy if exists "market_inquiries_artisan_select" on public.market_inquiries;
create policy "market_inquiries_artisan_select" on public.market_inquiries for select
  using (artisan_id = auth.uid());

drop policy if exists "market_inquiries_artisan_update" on public.market_inquiries;
create policy "market_inquiries_artisan_update" on public.market_inquiries for update
  using (artisan_id = auth.uid()) with check (artisan_id = auth.uid());

-- Admin can review B2B requests but cannot accept/reject them.
drop policy if exists "market_inquiries_admin_all" on public.market_inquiries;
drop policy if exists "market_inquiries_admin_select" on public.market_inquiries;
create policy "market_inquiries_admin_select" on public.market_inquiries for select
  using (is_admin());

-- Optional updated_at trigger reuse from the base schema.
drop trigger if exists trg_market_inquiries_updated on public.market_inquiries;
create trigger trg_market_inquiries_updated before update on public.market_inquiries
for each row execute function set_updated_at();
