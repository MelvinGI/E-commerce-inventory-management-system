-- Create profiles for any users that don't have one
-- Using the actual columns that exist in your profiles table

-- Step 1: Check which auth users don't have profiles
select 
  au.id,
  au.email,
  p.id as profile_id
from auth.users au
left join public.profiles p on p.id = au.id
where p.id is null;

-- Step 2: Create profiles for any users that don't have one
insert into public.profiles (id, email, role)
select 
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data->>'role', 'supplier')
from auth.users au
left join public.profiles p on p.id = au.id
where p.id is null
on conflict (id) do nothing;

-- Step 3: Verify all users now have profiles
select 
  au.id,
  au.email,
  p.role
from auth.users au
join public.profiles p on p.id = au.id;
