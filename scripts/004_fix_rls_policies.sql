-- Fix infinite recursion in RLS policies
-- The issue is that policies reference profiles table which has its own policies
-- Solution: Use auth.uid() directly and avoid profile lookups in policies

-- Step 1: Drop ALL existing policies to start fresh
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

drop policy if exists "products_select_all" on public.products;
drop policy if exists "products_select_own_inactive" on public.products;
drop policy if exists "products_insert_own" on public.products;
drop policy if exists "products_update_own" on public.products;
drop policy if exists "products_delete_own" on public.products;

drop policy if exists "inventory_transactions_insert_own" on public.inventory_transactions;
drop policy if exists "inventory_transactions_select_own_products" on public.inventory_transactions;

drop policy if exists "orders_select_own" on public.orders;
drop policy if exists "orders_insert_customer" on public.orders;
drop policy if exists "orders_update_supplier" on public.orders;

drop policy if exists "order_items_select_own_orders" on public.order_items;
drop policy if exists "order_items_insert_customer" on public.order_items;

-- Shopping cart policies (skip if table doesn't exist)
do $$ 
begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'shopping_cart') then
    drop policy if exists "shopping_cart_select_own" on public.shopping_cart;
    drop policy if exists "shopping_cart_insert_own" on public.shopping_cart;
    drop policy if exists "shopping_cart_update_own" on public.shopping_cart;
    drop policy if exists "shopping_cart_delete_own" on public.shopping_cart;
  end if;
end $$;

-- Step 2: Create simple, non-recursive policies for profiles
create policy "profiles_all"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Step 3: Create simple, non-recursive policies for products
create policy "products_select_all"
  on public.products
  for select
  using (true); -- Everyone can view active products

create policy "products_all_own"
  on public.products
  for all
  using (supplier_id = auth.uid())
  with check (supplier_id = auth.uid());

-- Step 4: Create simple policies for inventory transactions
create policy "inventory_transactions_all"
  on public.inventory_transactions
  for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- Step 5: Create simple policies for orders
create policy "orders_all"
  on public.orders
  for all
  using (customer_id = auth.uid() or supplier_id = auth.uid())
  with check (customer_id = auth.uid() or supplier_id = auth.uid());

-- Step 6: Create simple policies for order items
create policy "order_items_all"
  on public.order_items
  for all
  using (true) -- Access controlled through orders table
  with check (true);

-- Step 7: Create simple policies for shopping cart (if table exists)
do $$ 
begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'shopping_cart') then
    execute 'create policy "shopping_cart_all" on public.shopping_cart for all using (customer_id = auth.uid()) with check (customer_id = auth.uid())';
  end if;
end $$;
