# Checkout Error Fix Guide

## Error Message
```
Failed to place order: Failed to create order: insert or update on table "orders" violates foreign key constraint "fk_orders_supplier"
```

## Root Cause
The `supplier_id` being used in the order doesn't exist in the `profiles` table, violating the foreign key constraint.

## Solution Steps

### Step 1: Run Diagnostic Script
First, let's identify the issue:

```sql
-- Execute in Supabase SQL Editor
-- File: scripts/039_diagnose_orders_issue.sql
```

This will show you:
- If admin users exist
- Foreign key constraints
- Products with invalid supplier_id
- Orders table structure

### Step 2: Fix Products with Invalid Suppliers
```sql
-- Execute in Supabase SQL Editor
-- File: scripts/038_fix_product_suppliers.sql
```

This updates all products to use a valid admin user as supplier.

### Step 3: Verify Admin User Exists
Make sure you have at least one admin user:

```sql
-- Check for admin users
SELECT id, email, role FROM profiles WHERE role = 'admin';
```

If no admin exists, create one:
```sql
-- Update an existing user to admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

### Step 4: Test Checkout Again
1. Clear your browser cache
2. Refresh the page
3. Try checkout again

## Updated Code

The checkout form now:
- ✅ Always uses admin as the supplier (simplified)
- ✅ Validates admin exists before creating order
- ✅ Better error logging
- ✅ Single order creation (no grouping by supplier)

## Alternative: Remove Foreign Key Constraint (Not Recommended)

If you want orders to work without supplier validation:

```sql
-- Remove the foreign key constraint (use with caution)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_supplier;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_supplier_id_fkey;

-- Make supplier_id nullable
ALTER TABLE orders ALTER COLUMN supplier_id DROP NOT NULL;
```

**Note:** This is not recommended as it breaks data integrity.

## Recommended: Ensure Admin User

The best solution is to ensure you have a valid admin user:

```sql
-- Create or update admin user
INSERT INTO profiles (id, email, role, full_name)
VALUES (
  'your-user-id-here',  -- Use actual user ID from auth.users
  'admin@example.com',
  'admin',
  'Admin User'
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
```

## Quick Fix Script

Run this all-in-one fix:

```sql
-- All-in-one fix script
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Get or create admin user
  SELECT id INTO admin_id FROM profiles WHERE role = 'admin' LIMIT 1;
  
  IF admin_id IS NULL THEN
    -- Get first user and make them admin
    SELECT id INTO admin_id FROM profiles LIMIT 1;
    
    IF admin_id IS NOT NULL THEN
      UPDATE profiles SET role = 'admin' WHERE id = admin_id;
      RAISE NOTICE 'Made user % an admin', admin_id;
    ELSE
      RAISE EXCEPTION 'No users found in profiles table';
    END IF;
  END IF;
  
  -- Fix products
  UPDATE products SET supplier_id = admin_id WHERE supplier_id NOT IN (SELECT id FROM profiles);
  
  RAISE NOTICE 'Fixed products to use admin: %', admin_id;
END $$;
```

## Verification

After running the fixes, verify:

```sql
-- Should return 0
SELECT COUNT(*) FROM products 
WHERE supplier_id NOT IN (SELECT id FROM profiles);

-- Should return at least 1
SELECT COUNT(*) FROM profiles WHERE role = 'admin';
```

## Still Having Issues?

If the error persists:

1. **Check browser console** - Look for detailed error logs
2. **Check Supabase logs** - Go to Supabase Dashboard → Logs
3. **Verify RLS policies** - Ensure they allow order creation
4. **Check auth state** - Make sure you're logged in

## Contact Information

If you need help:
1. Run the diagnostic script
2. Share the output
3. Check Supabase logs for detailed errors
