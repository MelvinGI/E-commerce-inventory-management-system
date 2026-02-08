-- Create shopping_cart table if it doesn't exist

CREATE TABLE IF NOT EXISTS public.shopping_cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at timestamp with time zone DEFAULT current_timestamp,
  UNIQUE(customer_id, product_id)
);

-- Disable RLS for now (we disabled it globally earlier)
ALTER TABLE public.shopping_cart DISABLE ROW LEVEL SECURITY;

-- Verify the table was created
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'shopping_cart'
ORDER BY ordinal_position;
