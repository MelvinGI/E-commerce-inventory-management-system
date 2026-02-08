-- Fix the foreign key constraint on products.supplier_id
-- Change it from referencing suppliers table to profiles table

-- Step 1: Drop the existing foreign key constraint
alter table public.products 
  drop constraint if exists products_supplier_id_fkey;

-- Step 2: Add new foreign key constraint to profiles table
alter table public.products 
  add constraint products_supplier_id_fkey 
  foreign key (supplier_id) 
  references public.profiles(id) 
  on delete set null;

-- Step 3: Verify the constraint
select
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name
from information_schema.table_constraints as tc
join information_schema.key_column_usage as kcu
  on tc.constraint_name = kcu.constraint_name
join information_schema.constraint_column_usage as ccu
  on ccu.constraint_name = tc.constraint_name
where tc.constraint_type = 'FOREIGN KEY' 
  and tc.table_name = 'products'
  and kcu.column_name = 'supplier_id';
