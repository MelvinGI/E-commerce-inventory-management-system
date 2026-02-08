-- Create profiles table (user management)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null check (role in ('admin', 'supplier', 'customer')),
  company_name text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  country text,
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sku text unique not null,
  price numeric(10, 2) not null,
  cost_price numeric(10, 2),
  category text not null,
  supplier_id uuid not null references public.profiles(id) on delete cascade,
  image_url text,
  stock_quantity integer default 0,
  min_stock_level integer default 10,
  status text not null default 'active' check (status in ('active', 'inactive', 'discontinued')),
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp
);

alter table public.products enable row level security;

create policy "products_select_all"
  on public.products for select
  using (status = 'active');

create policy "products_select_own_inactive"
  on public.products for select
  using (supplier_id = auth.uid());

create policy "products_insert_own"
  on public.products for insert
  with check (supplier_id = auth.uid());

create policy "products_update_own"
  on public.products for update
  using (supplier_id = auth.uid());

-- Inventory transactions table
create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('purchase', 'sale', 'adjustment', 'return')),
  quantity integer not null,
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamp with time zone default current_timestamp
);

alter table public.inventory_transactions enable row level security;

create policy "inventory_transactions_insert_own"
  on public.inventory_transactions for insert
  with check (created_by = auth.uid());

create policy "inventory_transactions_select_own_products"
  on public.inventory_transactions for select
  using (exists (select 1 from products where id = product_id and supplier_id = auth.uid()));

-- Orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_id uuid not null references public.profiles(id),
  supplier_id uuid not null references public.profiles(id),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  total_amount numeric(12, 2) not null,
  shipping_address text,
  notes text,
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp
);

alter table public.orders enable row level security;

create policy "orders_select_own"
  on public.orders for select
  using (customer_id = auth.uid() or supplier_id = auth.uid());

create policy "orders_insert_customer"
  on public.orders for insert
  with check (customer_id = auth.uid());

create policy "orders_update_supplier"
  on public.orders for update
  using (supplier_id = auth.uid());

-- Order items table
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null,
  unit_price numeric(10, 2) not null,
  subtotal numeric(12, 2) not null,
  created_at timestamp with time zone default current_timestamp
);

alter table public.order_items enable row level security;

create policy "order_items_select_own_orders"
  on public.order_items for select
  using (exists (select 1 from orders where id = order_id and (customer_id = auth.uid() or supplier_id = auth.uid())));

create policy "order_items_insert_customer"
  on public.order_items for insert
  with check (exists (select 1 from orders where id = order_id and customer_id = auth.uid()));

-- Cart table
create table if not exists public.shopping_cart (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1,
  added_at timestamp with time zone default current_timestamp,
  unique(customer_id, product_id)
);

alter table public.shopping_cart enable row level security;

create policy "shopping_cart_select_own"
  on public.shopping_cart for select
  using (customer_id = auth.uid());

create policy "shopping_cart_insert_own"
  on public.shopping_cart for insert
  with check (customer_id = auth.uid());

create policy "shopping_cart_update_own"
  on public.shopping_cart for update
  using (customer_id = auth.uid());

create policy "shopping_cart_delete_own"
  on public.shopping_cart for delete
  using (customer_id = auth.uid());
