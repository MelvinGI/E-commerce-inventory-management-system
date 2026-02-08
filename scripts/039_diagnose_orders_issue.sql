-- Diagnostic script to identify order creation issues

-- 1. Check if admin user exists
SELECT 
  'Admin Users' as check_type,
  COUNT(*) as count,
  array_agg(id) as user_ids
FROM profiles
WHERE role = 'admin';

-- 2. Check foreign key constraints on orders table
SELECT
  'Foreign Key Constraints' as check_type,
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table,
  a.attname as column_name,
  af.attname as referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.conrelid = 'orders'::regclass
  AND c.contype = 'f';

-- 3. Check products with invalid supplier_id
SELECT 
  'Products with Invalid Supplier' as check_type,
  COUNT(*) as count,
  array_agg(DISTINCT supplier_id) as invalid_supplier_ids
FROM products
WHERE supplier_id NOT IN (SELECT id FROM profiles);

-- 4. Check if orders table has the correct columns
SELECT 
  'Orders Table Columns' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('supplier_id', 'customer_id', 'order_status', 'customer_phone', 'customer_email')
ORDER BY ordinal_position;

-- 5. Sample valid profiles for reference
SELECT 
  'Valid Profile IDs' as check_type,
  id,
  email,
  role
FROM profiles
LIMIT 5;

-- 6. Check RLS policies on orders
SELECT
  'Orders RLS Policies' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'orders';
