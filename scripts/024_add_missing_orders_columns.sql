-- Add missing columns to orders table

-- Add order_number column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'order_number'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN order_number text;
    -- Make it unique after adding
    ALTER TABLE public.orders ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);
    RAISE NOTICE 'Added order_number column';
  ELSE
    RAISE NOTICE 'order_number column already exists';
  END IF;
END $$;

-- Add customer_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN customer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added customer_id column';
  ELSE
    RAISE NOTICE 'customer_id column already exists';
  END IF;
END $$;

-- Add supplier_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'supplier_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN supplier_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added supplier_id column';
  ELSE
    RAISE NOTICE 'supplier_id column already exists';
  END IF;
END $$;

-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN status text DEFAULT 'pending';
    -- Add check constraint
    ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
      CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'));
    RAISE NOTICE 'Added status column';
  ELSE
    RAISE NOTICE 'status column already exists';
  END IF;
END $$;

-- Add total_amount column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN total_amount numeric(12, 2);
    RAISE NOTICE 'Added total_amount column';
  ELSE
    RAISE NOTICE 'total_amount column already exists';
  END IF;
END $$;

-- Add shipping_address column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'shipping_address'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN shipping_address text;
    RAISE NOTICE 'Added shipping_address column';
  ELSE
    RAISE NOTICE 'shipping_address column already exists';
  END IF;
END $$;

-- Add notes column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN notes text;
    RAISE NOTICE 'Added notes column';
  ELSE
    RAISE NOTICE 'notes column already exists';
  END IF;
END $$;

-- Now check order_items table columns

-- Add order_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items' 
    AND column_name = 'order_id'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added order_id column to order_items';
  ELSE
    RAISE NOTICE 'order_id column already exists in order_items';
  END IF;
END $$;

-- Add product_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items' 
    AND column_name = 'product_id'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added product_id column to order_items';
  ELSE
    RAISE NOTICE 'product_id column already exists in order_items';
  END IF;
END $$;

-- Add quantity column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items' 
    AND column_name = 'quantity'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN quantity integer CHECK (quantity > 0);
    RAISE NOTICE 'Added quantity column to order_items';
  ELSE
    RAISE NOTICE 'quantity column already exists in order_items';
  END IF;
END $$;

-- Add unit_price column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items' 
    AND column_name = 'unit_price'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN unit_price numeric(10, 2);
    RAISE NOTICE 'Added unit_price column to order_items';
  ELSE
    RAISE NOTICE 'unit_price column already exists in order_items';
  END IF;
END $$;

-- Add subtotal column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items' 
    AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN subtotal numeric(12, 2);
    RAISE NOTICE 'Added subtotal column to order_items';
  ELSE
    RAISE NOTICE 'subtotal column already exists in order_items';
  END IF;
END $$;

-- Verify all columns now exist
SELECT 'orders' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'orders'
UNION ALL
SELECT 'order_items' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'order_items'
ORDER BY table_name, column_name;
