-- Remove the problematic foreign key constraint on orders.supplier_id
-- This allows orders to be created without strict supplier validation

-- Drop the foreign key constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_supplier;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_supplier_id_fkey;

-- Make supplier_id nullable (optional, but recommended)
ALTER TABLE orders ALTER COLUMN supplier_id DROP NOT NULL;

-- Verify the constraint is removed
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name
FROM pg_constraint
WHERE conrelid = 'orders'::regclass
  AND contype = 'f'
  AND conname LIKE '%supplier%';

-- This should return no rows if successful

RAISE NOTICE 'Foreign key constraint on supplier_id has been removed';
RAISE NOTICE 'Orders can now be created without supplier validation';
