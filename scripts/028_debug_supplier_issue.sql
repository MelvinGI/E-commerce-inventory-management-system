-- Debug the supplier issue for customer 667fcb94-df33-47f9-81e3-58c64ea8ad41

-- Check the customer's cart
SELECT 
  'CART ITEMS' as check_type,
  sc.id as cart_id,
  sc.customer_id,
  sc.product_id,
  pr.name as product_name,
  pr.supplier_id,
  p.id as profile_exists,
  p.email as supplier_email,
  p.role as supplier_role
FROM public.shopping_cart sc
JOIN public.products pr ON pr.id = sc.product_id
LEFT JOIN public.profiles p ON p.id = pr.supplier_id
WHERE sc.customer_id = '667fcb94-df33-47f9-81e3-58c64ea8ad41';

-- Check all products and their suppliers
SELECT 
  'ALL PRODUCTS' as check_type,
  pr.id as product_id,
  pr.name as product_name,
  pr.supplier_id,
  p.id as profile_exists,
  p.email as supplier_email,
  CASE 
    WHEN p.id IS NULL THEN 'MISSING SUPPLIER PROFILE'
    ELSE 'OK'
  END as status
FROM public.products pr
LEFT JOIN public.profiles p ON p.id = pr.supplier_id;

-- Check all profiles
SELECT 
  'ALL PROFILES' as check_type,
  id,
  email,
  role,
  full_name
FROM public.profiles
ORDER BY created_at;

-- Check all auth users
SELECT 
  'ALL AUTH USERS' as check_type,
  id,
  email,
  raw_user_meta_data->>'role' as metadata_role
FROM auth.users
ORDER BY created_at;
