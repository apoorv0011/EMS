/*
# [Schema Update for Event Management]
This migration script overhauls the database schema to support a new event management system. It replaces the old 'products' concept with 'events' and sets up related tables for carts, orders, and order items.

## Query Description: This operation is DESTRUCTIVE. It will permanently delete the 'products', 'carts', 'cart_items', 'orders', and 'order_items' tables and all their data before recreating them with a new structure. This is necessary to align the database with the new application features.

## Metadata:
- Schema-Category: "Dangerous"
- Impact-Level: "High"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- DROPPED Tables: products, carts, cart_items, orders, order_items
- CREATED Tables: events, cart_items, orders, order_items
- CREATED Function: get_user_role()
- RLS Policies: Added for all new tables to enforce access control for users, vendors, and admins.

## Security Implications:
- RLS Status: Enabled on all new tables.
- Policy Changes: Yes, new policies are created.
- Auth Requirements: Policies rely on `auth.uid()` and a `get_user_role()` helper function.

## Performance Impact:
- Indexes: Primary keys and foreign keys will have indexes.
- Triggers: None added in this script.
- Estimated Impact: Low, as this is setting up new structures.
*/

-- Drop old tables with CASCADE to remove dependencies.
-- This is a destructive action and will remove data.
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- Helper function to get user role
-- This function is useful for RLS policies.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 'anon';
  ELSE
    RETURN (
      SELECT role
      FROM public.profiles
      WHERE id = auth.uid()
    );
  END IF;
END;
$$;

-- Create the 'events' table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    date TIMESTAMPTZ NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add comments to the events table
COMMENT ON TABLE events IS 'Stores event information, managed by vendors.';
COMMENT ON COLUMN events.vendor_id IS 'The vendor who created the event.';

-- Enable RLS and define policies for 'events'
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read all events"
ON events FOR SELECT
USING (true);

CREATE POLICY "Vendors can manage their own events"
ON events FOR ALL
USING (auth.uid() = vendor_id)
WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Admins can see all events"
ON events FOR SELECT
USING (public.get_user_role() = 'admin');


-- Create the 'cart_items' table
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, event_id)
);

COMMENT ON TABLE cart_items IS 'Stores items in a user''s shopping cart.';

-- Enable RLS and define policies for 'cart_items'
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cart items"
ON cart_items FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- Create the 'orders' table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending', -- e.g., pending, completed, cancelled
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE orders IS 'Represents a customer order.';

-- Enable RLS and define policies for 'orders'
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
USING (public.get_user_role() = 'admin');

-- Create the 'order_items' table to link orders and events
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL, -- Keep order history even if event is deleted
    vendor_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Keep vendor info for reference
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_purchase NUMERIC(10, 2) NOT NULL
);

COMMENT ON TABLE order_items IS 'Stores individual items within an order.';

-- Enable RLS and define policies for 'order_items'
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items in their own orders"
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can view order items for their events"
ON order_items FOR SELECT
USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can view all order items"
ON order_items FOR SELECT
USING (public.get_user_role() = 'admin');
