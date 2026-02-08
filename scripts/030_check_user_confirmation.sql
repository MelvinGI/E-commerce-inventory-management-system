-- Check if the user exists and their confirmation status
-- Replace 'your-email@example.com' with the actual email you used to sign up

SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ EMAIL NOT CONFIRMED'
    ELSE '✅ EMAIL CONFIRMED'
  END as confirmation_status
FROM auth.users
WHERE email = 'your-email@example.com';  -- Replace with your actual email

-- Also check if profile was created
SELECT 
  p.id,
  p.email,
  p.role,
  p.full_name,
  CASE 
    WHEN p.id IS NULL THEN '❌ NO PROFILE'
    ELSE '✅ PROFILE EXISTS'
  END as profile_status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'your-email@example.com';  -- Replace with your actual email
