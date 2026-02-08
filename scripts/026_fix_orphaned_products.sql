-- Fix products that have invalid supplier_id references

-- Option 1: Find orphaned products
SELECT 
  pr.id,
  pr.name,
  pr.supplier_id,
  'ORPHANED - supplier does not exist' as issue
FROM public.products pr
LEFT JOIN public.profiles p ON p.id = pr.supplier_id
WHERE p.id IS NULL;

-- Option 2: Get the first admin user to reassign orphaned products to
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the first admin user
  SELECT id INTO admin_user_id
  FROM public.profiles
  WHERE role = 'admin'
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    -- Update orphaned products to belong to this admin
    UPDATE public.products pr
    SET supplier_id = admin_user_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = pr.supplier_id
    );
    
    RAISE NOTICE 'Reassigned orphaned products to admin user: %', admin_user_id;
  ELSE
    RAISE NOTICE 'No admin user found. Please create an admin user first.';
  END IF;
END $$;

-- Verify all products now have valid supplier_id
SELECT 
  pr.id,
  pr.name,
  pr.supplier_id,
  p.email as supplier_email,
  p.role as supplier_role
FROM public.products pr
JOIN public.profiles p ON p.id = pr.supplier_id
ORDER BY pr.created_at DESC;
