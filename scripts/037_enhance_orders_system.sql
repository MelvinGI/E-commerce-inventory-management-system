-- Enhance orders table for better tracking and customer details
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS order_status VARCHAR(50) DEFAULT 'pending' 
    CHECK (order_status IN ('pending', 'processing', 'in_transit', 'delivered', 'received', 'cancelled'));

-- Update existing status column if needed (keep both for compatibility)
-- The new order_status will be the primary status field

-- Add timestamps for status changes
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE;

-- Create function to update timestamps based on status changes
CREATE OR REPLACE FUNCTION update_order_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_status = 'processing' AND OLD.order_status != 'processing' THEN
    NEW.confirmed_at = NOW();
  END IF;
  
  IF NEW.order_status = 'in_transit' AND OLD.order_status != 'in_transit' THEN
    NEW.shipped_at = NOW();
  END IF;
  
  IF NEW.order_status = 'delivered' AND OLD.order_status != 'delivered' THEN
    NEW.delivered_at = NOW();
  END IF;
  
  IF NEW.order_status = 'received' AND OLD.order_status != 'received' THEN
    NEW.received_at = NOW();
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status timestamp updates
DROP TRIGGER IF EXISTS order_status_timestamp_trigger ON orders;
CREATE TRIGGER order_status_timestamp_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.order_status IS DISTINCT FROM NEW.order_status)
  EXECUTE FUNCTION update_order_status_timestamps();

-- Update RLS policies for better access control
DROP POLICY IF EXISTS "orders_select_own" ON orders;
DROP POLICY IF EXISTS "orders_insert_customer" ON orders;
DROP POLICY IF EXISTS "orders_update_supplier" ON orders;
DROP POLICY IF EXISTS "Customers can view their orders" ON orders;
DROP POLICY IF EXISTS "Suppliers can view their orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Customers can update received status" ON orders;

-- Customers can view their own orders
CREATE POLICY "Customers can view their orders"
  ON orders FOR SELECT
  USING (customer_id = auth.uid());

-- Suppliers can view orders assigned to them
CREATE POLICY "Suppliers can view their orders"
  ON orders FOR SELECT
  USING (
    supplier_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'supplier'
    )
  );

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Customers can create orders
CREATE POLICY "Customers can create orders"
  ON orders FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Admins can update order status
CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Customers can update to 'received' status only
CREATE POLICY "Customers can update received status"
  ON orders FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (
    customer_id = auth.uid() AND
    order_status = 'received'
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_supplier ON orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- Grant permissions
GRANT ALL ON orders TO authenticated;
