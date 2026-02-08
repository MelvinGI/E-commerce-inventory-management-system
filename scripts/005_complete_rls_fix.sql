-- Complete RLS fix for infinite recursion
-- This handles the actual schema with suppliers, categories, etc.

-- Step 1: Temporarily disable RLS on all tables to break recursion
alter table if exists public.profiles disable row level security;
alter table if exists public.suppliers disable row level security;
alter table if exists public.categories disable row level security;
alter table if exists public.products disable row level security;
alter table if exists public.inventory_transactions disable row level security;
alter table if exists public.orders disable row level security;
alter table if exists public.order_items disable row level security;

-- Step 2: Drop all existing policies
do $$ 
declare
  r record;
begin
  for r in (select schemaname, tablename, policyname 
            from pg_policies 
            where schemaname = 'public') 
  loop
    execute format('drop policy if exists %I on %I.%I', 
                   r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- Step 3: Re-enable RLS
alter table if exists public.profiles enable row level security;
alter table if exists public.suppliers enable row level security;
alter table if exists public.categories enable row level security;
alter table if exists public.products enable row level security;
alter table if exists public.inventory_transactions enable row level security;
alter table if exists public.orders enable row level security;
alter table if exists public.order_items enable row level security;

-- Step 4: Create simple policies without recursion

-- Profiles: Users can only see/edit their own profile
create policy "profiles_policy"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Suppliers: Allow all authenticated users to view, but only own to edit
create policy "suppliers_select"
  on public.suppliers
  for select
  using (auth.uid() is not null);

create policy "suppliers_modify"
  on public.suppliers
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Categories: Allow all authenticated users to view
create policy "categories_select"
  on public.categories
  for select
  using (auth.uid() is not null);

create policy "categories_modify"
  on public.categories
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Products: Allow all to view, only supplier to modify
create policy "products_select"
  on public.products
  for select
  using (true);

create policy "products_modify"
  on public.products
  for all
  using (
    supplier_id in (
      select id from suppliers where user_id = auth.uid()
    )
  )
  with check (
    supplier_id in (
      select id from suppliers where user_id = auth.uid()
    )
  );

-- Inventory transactions
create policy "inventory_transactions_policy"
  on public.inventory_transactions
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Orders
create policy "orders_policy"
  on public.orders
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Order items
create policy "order_items_policy"
  on public.order_items
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
