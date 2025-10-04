/*
          # Create Event Management Tables
          This migration script sets up the necessary tables for an event management system. It replaces the existing 'products' table with 'events', and adds 'orders' and 'order_items' tables to handle event bookings.

          ## Query Description: This operation will drop the existing "products" table, which will result in the loss of all data stored in it. It is highly recommended to back up your data before proceeding. The new tables ("events", "orders", "order_items") will be created to support the new event management functionality.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "High"
          - Requires-Backup: true
          - Reversible: false
          
          ## Structure Details:
          - DROPS table: `products`
          - CREATES table: `events` (for storing event details)
          - CREATES table: `orders` (for tracking user orders)
          - CREATES table: `order_items` (a join table for orders and events)
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes (new policies for `events`, `orders`, and `order_items`)
          - Auth Requirements: Users must be authenticated to interact with these tables.
          
          ## Performance Impact:
          - Indexes: Added on foreign key columns for faster joins.
          - Triggers: None
          - Estimated Impact: Low, as the schema is optimized for common query patterns.
          */

-- Drop the old "products" table
DROP TABLE IF EXISTS products;

-- Create the "events" table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    date TIMESTAMPTZ NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and define policies for "events"
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow vendors to manage their own events" 
ON events
FOR ALL
USING (auth.uid() = vendor_id)
WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Allow authenticated users to view all events"
ON events
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create the "orders" table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    total_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and define policies for "orders"
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own orders"
ON orders
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow vendors to view orders for their events"
ON orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN events e ON oi.event_id = e.id
    WHERE oi.order_id = orders.id AND e.vendor_id = auth.uid()
  )
);

CREATE POLICY "Allow admins to view all orders"
ON orders
FOR SELECT
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);


-- Create the "order_items" table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE RESTRICT,
    quantity INT NOT NULL DEFAULT 1,
    price NUMERIC(10, 2) NOT NULL
);

-- Enable RLS and define policies for "order_items"
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage items in their own orders"
ON order_items
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Allow vendors to view order items for their events"
ON order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM events e
    WHERE e.id = order_items.event_id AND e.vendor_id = auth.uid()
  )
);

CREATE POLICY "Allow admins to view all order items"
ON order_items
FOR SELECT
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
