-- Fix the products table to work with profiles instead of suppliers
-- This aligns your database schema with your application code

-- Step 1: Check if suppliers table exists and if products references it
do $$ 
begin
  -- If products.supplier_id references suppliers table, change it to reference profiles
  if exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'products_supplier_id_fkey' 
    and table_name = 'products'
  ) then
    -- Drop the foreign key to suppliers
    alter table public.products drop constraint products_supplier_id_fkey;
    
    -- Add foreign key to profiles instead
    alter table public.products 
      add constraint products_supplier_id_fkey 
      foreign key (supplier_id) 
      references public.profiles(id) 
      on delete set null;
  end if;
end $$;

-- Step 2: Drop all policies on products
drop policy if exists "products_select_all" on public.products;
drop policy if exists "products_select_own_inactive" on public.products;
drop policy if exists "products_insert_own" on public.products;
drop policy if exists "products_update_own" on public.products;
drop policy if exists "products_delete_own" on public.products;
drop policy if exists "products_all_own" on public.products;
drop policy if exists "products_select" on public.products;
drop policy if exists "products_modify" on public.products;

-- Step 3: Enable RLS
alter table public.products enable row level security;

-- Step 4: Create simple, non-recursive policies
-- Everyone can view all products
create policy "products_select_all"
  on public.products
  for select
  using (true);

-- Only the supplier (profile owner) can insert their own products
create policy "products_insert_own"
  on public.products
  for insert
  with check (supplier_id = auth.uid());

-- Only the supplier can update their own products
create policy "products_update_own"
  on public.products
  for update
  using (supplier_id = auth.uid());

-- Only the supplier can delete their own products
create policy "products_delete_own"
  on public.products
  for delete
  using (supplier_id = auth.uid());

-- Step 5: Fix profiles policies to be simple
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_all" on public.profiles;
drop policy if exists "profiles_policy" on public.profiles;

alter table public.profiles enable row level security;

-- Simple policy: users can only access their own profile
create policy "profiles_own_only"
  on public.profiles
  for all
  using (id = auth.uid())
  with check (id = auth.uid());
