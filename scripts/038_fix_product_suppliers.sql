-- Fix products with invalid supplier_id references
-- This script updates products that have supplier_id pointing to non-existent users

-- First, get the admin user ID
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get the first admin user
  SELECT id INTO admin_user_id
  FROM profiles
  WHERE role = 'admin'
  LIMIT 1;

  -- If admin exists, update orphaned products
  IF admin_user_id IS NOT NULL THEN
    -- Update products where supplier_id doesn't exist in profiles
    UPDATE products
    SET supplier_id = admin_user_id
    WHERE supplier_id NOT IN (SELECT id FROM profiles);

    RAISE NOTICE 'Updated orphaned products to use admin as supplier: %', admin_user_id;
  ELSE
    RAISE NOTICE 'No admin user found. Please create an admin user first.';
  END IF;
END $$;

-- Verify the fix
SELECT 
  COUNT(*) as orphaned_products
FROM products
WHERE supplier_id NOT IN (SELECT id FROM profiles);

-- This should return 0 if all products are fixed
