-- Ensure all auth users have corresponding profiles

-- Create profiles for any users that don't have one
INSERT INTO public.profiles (id, email, role, full_name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'customer'),
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, '')
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verify all users now have profiles
SELECT 
  au.id,
  au.email,
  p.id as profile_id,
  p.role,
  CASE WHEN p.id IS NULL THEN 'MISSING PROFILE' ELSE 'OK' END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at;

-- Check if there are any products with supplier_id that don't have profiles
SELECT 
  pr.id as product_id,
  pr.name as product_name,
  pr.supplier_id,
  p.id as profile_id,
  CASE WHEN p.id IS NULL THEN 'ORPHANED PRODUCT' ELSE 'OK' END as status
FROM public.products pr
LEFT JOIN public.profiles p ON p.id = pr.supplier_id
WHERE p.id IS NULL;
