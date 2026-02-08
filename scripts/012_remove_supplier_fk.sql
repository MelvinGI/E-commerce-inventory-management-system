-- Temporarily remove the supplier_id foreign key constraint
-- This allows you to insert products without the constraint check

alter table public.products 
  drop constraint if exists products_supplier_id_fkey;

-- Make supplier_id nullable if it isn't already
alter table public.products 
  alter column supplier_id drop not null;

-- Verify the constraint is gone
select
  tc.constraint_name,
  tc.table_name,
  kcu.column_name
from information_schema.table_constraints as tc
join information_schema.key_column_usage as kcu
  on tc.constraint_name = kcu.constraint_name
where tc.constraint_type = 'FOREIGN KEY' 
  and tc.table_name = 'products';
