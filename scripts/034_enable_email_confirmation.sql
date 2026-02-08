-- This script provides instructions to RE-ENABLE email confirmation in Supabase

-- INSTRUCTIONS TO RE-ENABLE EMAIL CONFIRMATION:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project: https://supabase.com/dashboard/project/okyxacjrwlypqbwaogme
-- 3. Go to Authentication > Providers
-- 4. Click on "Email" provider
-- 5. CHECK "Confirm email" checkbox
-- 6. Click Save

-- Note: After re-enabling, new users will need to confirm their email before logging in
-- Existing confirmed users will continue to work normally

-- To check which users are confirmed:
SELECT 
  email,
  created_at,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED'
    ELSE '✅ CONFIRMED'
  END as status
FROM auth.users
ORDER BY created_at DESC;
