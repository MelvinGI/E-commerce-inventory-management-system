-- Disable ALL RLS policies and RLS itself
-- This will stop the infinite recursion immediately

-- Drop ALL policies from ALL tables
do $$ 
declare
  r record;
begin
  for r in (
    select schemaname, tablename, policyname 
    from pg_policies 
    where schemaname = 'public'
  ) 
  loop
    execute format('drop policy if exists %I on %I.%I', 
                   r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- Disable RLS on all tables
do $$ 
declare
  r record;
begin
  for r in (
    select tablename 
    from pg_tables 
    where schemaname = 'public'
  ) 
  loop
    execute format('alter table public.%I disable row level security', r.tablename);
  end loop;
end $$;

-- Verify RLS is disabled
select 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
from pg_tables 
where schemaname = 'public'
order by tablename;
