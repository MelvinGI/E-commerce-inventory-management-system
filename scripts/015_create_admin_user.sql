-- Create admin user directly in database
-- Note: This requires proper permissions and may not work in all Supabase setups

-- First, check if user already exists
select id, email from auth.users where email = 'nyanjomadmin1@gmail.com';

-- If user doesn't exist, you'll need to create it via Supabase Dashboard
-- Then run this to set the role:
update public.profiles
set role = 'admin'
where email = 'nyanjomadmin1@gmail.com';

-- If profile doesn't exist yet, create it manually:
-- (Replace 'USER_ID_HERE' with the actual user ID from auth.users)
insert into public.profiles (id, email, role)
values (
  (select id from auth.users where email = 'nyanjomadmin1@gmail.com'),
  'nyanjomadmin1@gmail.com',
  'admin'
)
on conflict (id) do update set role = 'admin';

-- Verify
select 
  au.id,
  au.email,
  p.role
from auth.users au
join public.profiles p on p.id = au.id
where au.email = 'nyanjomadmin1@gmail.com';
