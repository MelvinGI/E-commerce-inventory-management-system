-- Fix: Manually confirm the user's email
-- Replace 'your-email@example.com' with the actual email you used to sign up

UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'your-email@example.com'  -- Replace with your actual email
  AND email_confirmed_at IS NULL;

-- Verify the fix
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ STILL NOT CONFIRMED'
    ELSE '✅ NOW CONFIRMED'
  END as status
FROM auth.users
WHERE email = 'your-email@example.com';  -- Replace with your actual email
