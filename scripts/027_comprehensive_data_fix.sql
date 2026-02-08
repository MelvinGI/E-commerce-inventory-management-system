-- Comprehensive fix for all data integrity issues

-- Step 1: Create profiles for ALL auth users
INSERT INTO public.profiles (id, email, role, full_name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'customer'),
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, '')
FROM auth.users au
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

-- Step 2: Find products with invalid supplier_id
SELECT 
  'ORPHANED PRODUCTS' as issue_type,
  pr.id,
  pr.name,
  pr.supplier_id,
  'Supplier does not exist in profiles' as issue
FROM public.products pr
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = pr.supplier_id
);

-- Step 3: Get or create an admin user to own orphaned products
DO $$
DECLARE
  admin_user_id uuid;
  first_user_id uuid;
BEGIN
  -- Try to find an admin user
  SELECT id INTO admin_user_id
  FROM public.profiles
  WHERE role = 'admin'
  LIMIT 1;

  -- If no admin, get the first user and make them admin
  IF admin_user_id IS NULL THEN
    SELECT id INTO first_user_id
    FROM public.profiles
    LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
      UPDATE public.profiles
      SET role = 'admin'
      WHERE id = first_user_id;
      
      admin_user_id := first_user_id;
      RAISE NOTICE 'Made user % an admin', admin_user_id;
    END IF;
  END IF;

  -- Update orphaned products
  IF admin_user_id IS NOT NULL THEN
    UPDATE public.products pr
    SET supplier_id = admin_user_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = pr.supplier_id
    );
    
    RAISE NOTICE 'Reassigned orphaned products to admin: %', admin_user_id;
  ELSE
    RAISE NOTICE 'No users found in profiles table!';
  END IF;
END $$;

-- Step 4: Verify all products now have valid suppliers
SELECT 
  'PRODUCT VALIDATION' as check_type,
  pr.id as product_id,
  pr.name as product_name,
  pr.supplier_id,
  p.email as supplier_email,
  p.role as supplier_role,
  'OK' as status
FROM public.products pr
JOIN public.profiles p ON p.id = pr.supplier_id
ORDER BY pr.created_at DESC;

-- Step 5: Check for any cart items with invalid products
SELECT 
  'CART VALIDATION' as check_type,
  sc.id as cart_item_id,
  sc.customer_id,
  sc.product_id,
  CASE 
    WHEN pr.id IS NULL THEN 'INVALID PRODUCT'
    WHEN p.id IS NULL THEN 'INVALID SUPPLIER'
    ELSE 'OK'
  END as status
FROM public.shopping_cart sc
LEFT JOIN public.products pr ON pr.id = sc.product_id
LEFT JOIN public.profiles p ON p.id = pr.supplier_id;

-- Step 6: Summary
SELECT 
  'SUMMARY' as report,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM public.products) as total_products,
  (SELECT COUNT(*) FROM public.products pr WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = pr.supplier_id)) as orphaned_products,
  (SELECT COUNT(*) FROM public.shopping_cart) as cart_items;
