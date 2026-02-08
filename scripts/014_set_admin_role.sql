-- Set user role to admin
-- Replace the email with your admin email

update public.profiles
set role = 'admin'
where email = 'nyanjomadmin1@gmail.com';

-- Verify the admin user
select id, email, role, created_at
from public.profiles
where email = 'nyanjomadmin1@gmail.com';
