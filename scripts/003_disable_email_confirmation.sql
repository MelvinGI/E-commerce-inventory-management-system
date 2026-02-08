-- Disable email confirmation requirement in Supabase
-- This updates the auth.users table to mark all new signups as confirmed

-- Update auth schema to auto-confirm emails
-- Note: This requires running via Supabase CLI or directly in the SQL editor
-- The email_confirmed_at is set to now() to bypass email confirmation

-- For Supabase, we need to update the auth.users table's email_confirmed_at column
-- when a user signs up. This is done via a trigger.

-- Drop existing trigger
drop trigger if exists on_auth_user_created on auth.users;

-- Create updated trigger that auto-confirms emails
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Auto-confirm email by setting email_confirmed_at to now()
  update auth.users 
  set email_confirmed_at = now()
  where id = new.id;

  insert into public.profiles (id, email, role, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'customer'),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
