-- Temporary fix: Disable RLS to stop infinite recursion
-- This allows you to work while we figure out the proper schema

-- Disable RLS on all tables
alter table if exists public.profiles disable row level security;
alter table if exists public.suppliers disable row level security;
alter table if exists public.categories disable row level security;
alter table if exists public.products disable row level security;
alter table if exists public.inventory_transactions disable row level security;
alter table if exists public.orders disable row level security;
alter table if exists public.order_items disable row level security;
alter table if exists public.shopping_cart disable row level security;

-- Note: This is NOT secure for production!
-- You should re-enable RLS with proper policies once the schema is clear.
