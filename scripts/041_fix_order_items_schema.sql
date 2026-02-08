-- Fix order_items table schema
-- Add price column if it exists in the schema but we're not using it correctly

-- Check current columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;

-- If there's a 'price' column that's NOT NULL, make it nullable or remove it
DO $$
BEGIN
  -- Check if price column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'price'
  ) THEN
    -- Make it nullable or drop it
    ALTER TABLE order_items ALTER COLUMN price DROP NOT NULL;
    RAISE NOTICE 'Made price column nullable';
  ELSE
    RAISE NOTICE 'No price column found - this is expected';
  END IF;
END $$;

-- Ensure required columns exist and are correct
DO $$
BEGIN
  -- Ensure unit_price exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'unit_price'
  ) THEN
    ALTER TABLE order_items ADD COLUMN unit_price numeric(10, 2) NOT NULL DEFAULT 0;
    RAISE NOTICE 'Added unit_price column';
  END IF;

  -- Ensure subtotal exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE order_items ADD COLUMN subtotal numeric(12, 2) NOT NULL DEFAULT 0;
    RAISE NOTICE 'Added subtotal column';
  END IF;
END $$;
