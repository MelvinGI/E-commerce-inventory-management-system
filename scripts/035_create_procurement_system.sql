-- Create procurement_orders table for admin to supplier orders
CREATE TABLE IF NOT EXISTS procurement_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100) NOT NULL,
  category VARCHAR(100),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  delivery_status VARCHAR(50) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'in_transit', 'delivered', 'received')),
  notes TEXT,
  ordered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_procurement_orders_admin ON procurement_orders(admin_id);
CREATE INDEX IF NOT EXISTS idx_procurement_orders_supplier ON procurement_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_procurement_orders_status ON procurement_orders(delivery_status);

-- Create function to auto-generate order number
CREATE OR REPLACE FUNCTION generate_procurement_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('procurement_order_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS procurement_order_seq START 1;

-- Create trigger to auto-generate order number
DROP TRIGGER IF EXISTS set_procurement_order_number ON procurement_orders;
CREATE TRIGGER set_procurement_order_number
  BEFORE INSERT ON procurement_orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_procurement_order_number();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_procurement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_procurement_orders_updated_at ON procurement_orders;
CREATE TRIGGER update_procurement_orders_updated_at
  BEFORE UPDATE ON procurement_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_procurement_updated_at();

-- Enable RLS
ALTER TABLE procurement_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all procurement orders" ON procurement_orders;
DROP POLICY IF EXISTS "Suppliers can view their procurement orders" ON procurement_orders;
DROP POLICY IF EXISTS "Admins can create procurement orders" ON procurement_orders;
DROP POLICY IF EXISTS "Admins can update procurement orders" ON procurement_orders;
DROP POLICY IF EXISTS "Suppliers can update their procurement orders" ON procurement_orders;

-- Create RLS policies
-- Admins can view all procurement orders
CREATE POLICY "Admins can view all procurement orders"
  ON procurement_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Suppliers can view their own procurement orders
CREATE POLICY "Suppliers can view their procurement orders"
  ON procurement_orders FOR SELECT
  USING (supplier_id = auth.uid());

-- Admins can create procurement orders
CREATE POLICY "Admins can create procurement orders"
  ON procurement_orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update procurement orders (for receiving confirmation)
CREATE POLICY "Admins can update procurement orders"
  ON procurement_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Suppliers can update their own procurement orders (for delivery status)
CREATE POLICY "Suppliers can update their procurement orders"
  ON procurement_orders FOR UPDATE
  USING (supplier_id = auth.uid())
  WITH CHECK (supplier_id = auth.uid());

-- Grant permissions
GRANT ALL ON procurement_orders TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE procurement_order_seq TO authenticated;
