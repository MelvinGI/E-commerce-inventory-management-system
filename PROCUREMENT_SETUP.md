# Procurement System Setup Guide

## Overview
This procurement system allows admins to create purchase orders for suppliers, and suppliers to update delivery status. The system tracks the entire procurement lifecycle from order placement to delivery confirmation.

## Database Setup

### Run the SQL Script
Execute the following script in your Supabase SQL editor:

```bash
scripts/035_create_procurement_system.sql
```

This script will:
- Create the `procurement_orders` table
- Set up automatic order number generation (format: PO-YYYYMMDD-00001)
- Configure Row Level Security (RLS) policies
- Create necessary indexes for performance
- Set up triggers for auto-updating timestamps

### Database Schema

**procurement_orders table:**
- `id` - UUID primary key
- `order_number` - Auto-generated unique order number
- `admin_id` - Reference to admin who created the order
- `supplier_id` - Reference to supplier who will fulfill the order
- `product_name` - Name of the product to procure
- `product_sku` - SKU of the product
- `category` - Product category (optional)
- `quantity` - Quantity to order
- `unit_price` - Price per unit
- `total_amount` - Calculated total (quantity × unit_price)
- `description` - Additional order details (optional)
- `delivery_status` - Current status: pending, in_transit, delivered, received
- `notes` - Delivery notes from supplier (optional)
- `ordered_at` - When the order was placed
- `delivered_at` - When supplier marked as delivered
- `received_at` - When admin confirmed receipt
- `created_at` - Record creation timestamp
- `updated_at` - Record update timestamp

## Features

### Admin Features
1. **Create Procurement Orders**
   - Select supplier from dropdown
   - Enter product details (name, SKU, category)
   - Specify quantity and unit price
   - Auto-calculates total amount
   - Add optional description

2. **View All Orders**
   - See all procurement orders across all suppliers
   - Search by product name, SKU, or order number
   - View order status and progress
   - See supplier information

3. **Confirm Receipt**
   - Mark orders as "received" when delivered goods are confirmed
   - Final step in the procurement workflow

### Supplier Features
1. **View Assigned Orders**
   - See all procurement orders assigned to them
   - Search and filter orders
   - View order details and requirements

2. **Update Delivery Status**
   - Change status from pending → in_transit → delivered
   - Add delivery notes
   - Timestamps automatically recorded

## Workflow

1. **Admin creates order** → Status: `pending`
2. **Supplier updates to in transit** → Status: `in_transit`
3. **Supplier marks as delivered** → Status: `delivered` (delivered_at timestamp set)
4. **Admin confirms receipt** → Status: `received` (received_at timestamp set)

## Navigation Changes

### Admin Dashboard
- Products (existing)
- **Stock** (new) - Procurement management
- Orders
- Users
- Analytics
- Settings

### Supplier Dashboard
- ~~Products~~ (removed)
- **Stock** (new) - Procurement management
- Orders
- Analytics
- Settings

## Access Control

The system uses Row Level Security (RLS) policies:

- **Admins** can:
  - View all procurement orders
  - Create new procurement orders
  - Update orders (for receipt confirmation)

- **Suppliers** can:
  - View only their assigned orders
  - Update delivery status on their orders
  - Add delivery notes

## Testing the System

1. **As Admin:**
   - Navigate to Dashboard → Stock
   - Click "Create Procurement Order"
   - Select a supplier and fill in product details
   - Submit the order

2. **As Supplier:**
   - Navigate to Dashboard → Stock
   - See the order created by admin
   - Click "Update Status"
   - Change status to "In Transit" or "Delivered"

3. **As Admin (Receipt):**
   - View the order with "Delivered" status
   - Click "Mark Received"
   - Confirm receipt

## Notes

- Order numbers are automatically generated in format: PO-YYYYMMDD-00001
- All timestamps are in UTC
- The system prevents suppliers from accessing other suppliers' orders
- Admins have full visibility across all orders
