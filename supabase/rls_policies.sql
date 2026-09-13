-- ============================================================
-- CRAFT CONNECT — ROW LEVEL SECURITY POLICIES
-- Run AFTER schema.sql
-- ============================================================

-- Helper: current user's role
create or replace function auth_role() returns user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function is_admin() returns boolean as $$
  select auth_role() = 'admin';
$$ language sql stable security definer;

-- Enable RLS everywhere
alter table profiles enable row level security;
alter table artisans enable row level security;
alter table artisan_verification enable row level security;
alter table customers enable row level security;
alter table categories enable row level security;
alter table craft_regions enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table inventory enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table wishlists enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table shipping enable row level security;
alter table payments enable row level security;
alter table reviews enable row level security;
alter table returns enable row level security;
alter table notifications enable row level security;
alter table ai_generations enable row level security;
alter table audit_logs enable row level security;

-- ---------------- PROFILES ----------------
create policy "profiles_select_own_or_admin" on profiles for select
  using (id = auth.uid() or is_admin());
create policy "profiles_update_own" on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_all" on profiles for all
  using (is_admin()) with check (is_admin());

-- ---------------- ARTISANS ----------------
create policy "artisans_public_read_approved" on artisans for select
  using (verification_status = 'approved' or id = auth.uid() or is_admin());
create policy "artisans_update_own" on artisans for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy "artisans_admin_all" on artisans for all
  using (is_admin()) with check (is_admin());

-- ---------------- ARTISAN VERIFICATION ----------------
create policy "verification_own_or_admin_select" on artisan_verification for select
  using (artisan_id = auth.uid() or is_admin());
create policy "verification_own_insert" on artisan_verification for insert
  with check (artisan_id = auth.uid());
create policy "verification_admin_update" on artisan_verification for update
  using (is_admin()) with check (is_admin());

-- ---------------- CUSTOMERS ----------------
create policy "customers_own_or_admin" on customers for select
  using (id = auth.uid() or is_admin());
create policy "customers_update_own" on customers for update
  using (id = auth.uid()) with check (id = auth.uid());

-- ---------------- CATEGORIES (public read, admin write) ----------------
create policy "categories_public_read" on categories for select using (true);
create policy "categories_admin_write" on categories for insert with check (is_admin());
create policy "categories_admin_update" on categories for update using (is_admin());
create policy "categories_admin_delete" on categories for delete using (is_admin());

-- ---------------- CRAFT REGIONS (public read, admin write) ----------------
create policy "craft_regions_public_read" on craft_regions for select using (true);
create policy "craft_regions_admin_insert" on craft_regions for insert with check (is_admin());
create policy "craft_regions_admin_update" on craft_regions for update using (is_admin());
create policy "craft_regions_admin_delete" on craft_regions for delete using (is_admin());

-- ---------------- PRODUCTS ----------------
create policy "products_public_read_approved" on products for select
  using (status = 'approved' or artisan_id = auth.uid() or is_admin());
create policy "products_artisan_insert" on products for insert
  with check (artisan_id = auth.uid());
create policy "products_artisan_update_own" on products for update
  using (artisan_id = auth.uid() or is_admin());
create policy "products_artisan_delete_own" on products for delete
  using (artisan_id = auth.uid() or is_admin());

-- ---------------- PRODUCT IMAGES ----------------
create policy "product_images_read" on product_images for select
  using (
    exists (select 1 from products p where p.id = product_id and (p.status = 'approved' or p.artisan_id = auth.uid() or is_admin()))
  );
create policy "product_images_owner_write" on product_images for insert
  with check (exists (select 1 from products p where p.id = product_id and p.artisan_id = auth.uid()));
create policy "product_images_owner_delete" on product_images for delete
  using (exists (select 1 from products p where p.id = product_id and (p.artisan_id = auth.uid() or is_admin())));

-- ---------------- INVENTORY ----------------
create policy "inventory_owner_or_admin_select" on inventory for select
  using (exists (select 1 from products p where p.id = product_id and (p.artisan_id = auth.uid() or is_admin())));
create policy "inventory_owner_write" on inventory for all
  using (exists (select 1 from products p where p.id = product_id and p.artisan_id = auth.uid()))
  with check (exists (select 1 from products p where p.id = product_id and p.artisan_id = auth.uid()));

-- ---------------- CARTS / CART ITEMS ----------------
create policy "carts_own" on carts for all
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy "cart_items_own" on cart_items for all
  using (exists (select 1 from carts c where c.id = cart_id and c.customer_id = auth.uid()))
  with check (exists (select 1 from carts c where c.id = cart_id and c.customer_id = auth.uid()));

-- ---------------- WISHLISTS ----------------
create policy "wishlists_own" on wishlists for all
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());

-- ---------------- ORDERS ----------------
create policy "orders_customer_own" on orders for select
  using (customer_id = auth.uid() or is_admin()
    or exists (select 1 from order_items oi where oi.order_id = id and oi.artisan_id = auth.uid()));
create policy "orders_customer_insert" on orders for insert
  with check (customer_id = auth.uid());
create policy "orders_admin_update" on orders for update
  using (is_admin());

-- ---------------- ORDER ITEMS ----------------
create policy "order_items_visible" on order_items for select
  using (
    artisan_id = auth.uid() or is_admin()
    or exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
  );
create policy "order_items_customer_insert" on order_items for insert
  with check (exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()));

-- ---------------- SHIPPING ----------------
create policy "shipping_visible" on shipping for select
  using (
    is_admin()
    or exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
    or exists (select 1 from order_items oi where oi.order_id = shipping.order_id and oi.artisan_id = auth.uid())
  );
create policy "shipping_admin_write" on shipping for all
  using (is_admin()) with check (is_admin());

-- ---------------- PAYMENTS ----------------
create policy "payments_visible" on payments for select
  using (
    is_admin() or exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
  );
create policy "payments_admin_write" on payments for all
  using (is_admin()) with check (is_admin());

-- ---------------- REVIEWS ----------------
create policy "reviews_public_read" on reviews for select using (true);
create policy "reviews_customer_insert" on reviews for insert
  with check (customer_id = auth.uid());
create policy "reviews_customer_update_own" on reviews for update
  using (customer_id = auth.uid());
create policy "reviews_customer_delete_own" on reviews for delete
  using (customer_id = auth.uid() or is_admin());

-- ---------------- RETURNS ----------------
create policy "returns_visible" on returns for select
  using (
    customer_id = auth.uid() or is_admin()
    or exists (select 1 from order_items oi where oi.id = order_item_id and oi.artisan_id = auth.uid())
  );
create policy "returns_customer_insert" on returns for insert
  with check (customer_id = auth.uid());
create policy "returns_admin_update" on returns for update
  using (is_admin());

-- ---------------- NOTIFICATIONS ----------------
create policy "notifications_own" on notifications for select
  using (user_id = auth.uid());
create policy "notifications_own_update" on notifications for update
  using (user_id = auth.uid());
create policy "notifications_system_insert" on notifications for insert
  with check (true); -- inserted via edge functions / triggers with service role in practice

-- ---------------- AI GENERATIONS ----------------
create policy "ai_generations_own" on ai_generations for select
  using (artisan_id = auth.uid() or is_admin());
create policy "ai_generations_own_insert" on ai_generations for insert
  with check (artisan_id = auth.uid());

-- ---------------- AUDIT LOGS ----------------
create policy "audit_logs_admin_only" on audit_logs for select using (is_admin());
create policy "audit_logs_insert_any_authenticated" on audit_logs for insert
  with check (auth.uid() is not null);

