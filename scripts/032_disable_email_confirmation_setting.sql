-- This script helps you understand how to disable email confirmation in Supabase
-- Note: The actual setting must be changed in the Supabase Dashboard

-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project
-- 3. Go to Authentication > Settings
-- 4. Scroll down to "Email Auth"
-- 5. DISABLE "Enable email confirmations"
-- 6. Click Save

-- After disabling email confirmation in the dashboard, run this to confirm existing users:
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;

-- Verify all users are now confirmed
SELECT 
  email,
  email_confirmed_at,
  confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED'
    ELSE '✅ CONFIRMED'
  END as status
FROM auth.users
ORDER BY created_at DESC;
