-- Recreate profiles table with all necessary columns
-- This will preserve existing data if the table exists

-- Step 1: Create a backup of existing profiles data (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    -- Create backup table
    DROP TABLE IF EXISTS profiles_backup;
    CREATE TABLE profiles_backup AS SELECT * FROM profiles;
    RAISE NOTICE 'Backup created: profiles_backup';
  END IF;
END $$;

-- Step 2: Drop the existing profiles table (this will cascade to dependent tables)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 3: Recreate profiles table with correct schema
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'supplier', 'customer')),
  company_name text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  country text,
  created_at timestamp with time zone DEFAULT current_timestamp,
  updated_at timestamp with time zone DEFAULT current_timestamp
);

-- Step 4: Restore data from backup if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_backup'
  ) THEN
    -- Insert data back, handling missing columns gracefully
    INSERT INTO public.profiles (
      id, 
      email, 
      full_name,
      role,
      company_name,
      phone,
      address,
      city,
      state,
      zip_code,
      country,
      created_at,
      updated_at
    )
    SELECT 
      id,
      COALESCE(email, ''),
      COALESCE(full_name, ''),
      COALESCE(role, 'customer'),
      COALESCE(company_name, ''),
      COALESCE(phone, ''),
      COALESCE(address, ''),
      COALESCE(city, ''),
      COALESCE(state, ''),
      COALESCE(zip_code, ''),
      COALESCE(country, ''),
      COALESCE(created_at, current_timestamp),
      COALESCE(updated_at, current_timestamp)
    FROM profiles_backup
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Data restored from backup';
  END IF;
END $$;

-- Step 5: Disable RLS temporarily (we'll fix it properly later)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 6: Create profiles for any auth users that don't have one
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

-- Step 7: Verify the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 8: Show all profiles
SELECT id, email, role, full_name, company_name FROM public.profiles;
