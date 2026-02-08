-- Safely add missing columns to profiles table without dropping it
-- This preserves all existing data and relationships

-- Add full_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name text;
    RAISE NOTICE 'Added full_name column';
  ELSE
    RAISE NOTICE 'full_name column already exists';
  END IF;
END $$;

-- Add company_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'company_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN company_name text;
    RAISE NOTICE 'Added company_name column';
  ELSE
    RAISE NOTICE 'company_name column already exists';
  END IF;
END $$;

-- Add phone column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone text;
    RAISE NOTICE 'Added phone column';
  ELSE
    RAISE NOTICE 'phone column already exists';
  END IF;
END $$;

-- Add address column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'address'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN address text;
    RAISE NOTICE 'Added address column';
  ELSE
    RAISE NOTICE 'address column already exists';
  END IF;
END $$;

-- Add city column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'city'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN city text;
    RAISE NOTICE 'Added city column';
  ELSE
    RAISE NOTICE 'city column already exists';
  END IF;
END $$;

-- Add state column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'state'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN state text;
    RAISE NOTICE 'Added state column';
  ELSE
    RAISE NOTICE 'state column already exists';
  END IF;
END $$;

-- Add zip_code column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'zip_code'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN zip_code text;
    RAISE NOTICE 'Added zip_code column';
  ELSE
    RAISE NOTICE 'zip_code column already exists';
  END IF;
END $$;

-- Add country column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'country'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN country text;
    RAISE NOTICE 'Added country column';
  ELSE
    RAISE NOTICE 'country column already exists';
  END IF;
END $$;

-- Verify all columns now exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;
