-- Fix the orders table foreign key to reference profiles instead of suppliers

-- Step 1: Check current foreign key constraints on orders table
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'orders'
  AND tc.constraint_type = 'FOREIGN KEY';

-- Step 2: Drop the incorrect foreign key constraint
ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS orders_supplier_id_fkey;

ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;

-- Step 3: Add correct foreign key constraints pointing to profiles table
ALTER TABLE public.orders 
  ADD CONSTRAINT orders_supplier_id_fkey 
  FOREIGN KEY (supplier_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.orders 
  ADD CONSTRAINT orders_customer_id_fkey 
  FOREIGN KEY (customer_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Step 4: Verify the new constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'orders'
  AND tc.constraint_type = 'FOREIGN KEY';

-- Step 5: Ensure the supplier exists in profiles
INSERT INTO public.profiles (id, email, role, full_name)
VALUES (
  '71daed88-f7de-4594-8f27-5add78bf0d82',
  'supplier@example.com',
  'supplier',
  'Supplier'
)
ON CONFLICT (id) DO NOTHING;

-- Step 6: Verify
SELECT 
  'Supplier exists in profiles' as check_type,
  id, 
  email, 
  role 
FROM public.profiles 
WHERE id = '71daed88-f7de-4594-8f27-5add78bf0d82';
