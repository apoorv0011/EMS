/*
# [Function Hardening & Vendor Management]
This migration hardens all existing database functions to resolve security warnings and adds new functionality for admin vendor management.

## Query Description: This operation will:
1. Add an `is_approved` column to the `vendors` table to allow for an approval workflow.
2. Recreate all existing database functions with a secure search path and security definer context to fix the "Function Search Path Mutable" warning.
3. Add new functions for admins to fetch and manage vendor approval status.
There is no risk of data loss, but this will momentarily drop and recreate functions.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Modifies: `vendors` table
- Recreates Functions: `handle_new_user`, `create_order_from_cart`, `get_vendor_orders`, `get_admin_dashboard_stats`, `admin_get_all_users`
- Creates Functions: `admin_get_all_vendors`, `admin_update_vendor_approval`

## Security Implications:
- RLS Status: Enabled
- Policy Changes: No
- Auth Requirements: Admin for new functions
- Fixes: Resolves "Function Search Path Mutable" security advisory for all functions.

## Performance Impact:
- Indexes: None
- Triggers: Recreates `on_auth_user_created` trigger.
- Estimated Impact: Low.
*/

-- Step 1: Add approval column to vendors table
ALTER TABLE public.vendors
ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 2: Drop all existing functions and triggers to recreate them securely.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_order_from_cart(jsonb);
DROP FUNCTION IF EXISTS public.get_vendor_orders(uuid);
DROP FUNCTION IF EXISTS public.get_admin_dashboard_stats();
DROP FUNCTION IF EXISTS public.admin_get_all_users();

-- Step 3: Recreate handle_new_user function and trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'role'
  );

  -- If the user is a vendor, create a vendor entry
  IF new.raw_user_meta_data->>'role' = 'vendor' THEN
    INSERT INTO public.vendors (user_id, business_name)
    VALUES (
      new.id,
      (new.raw_user_meta_data->>'full_name') || '''s Business' -- Default business name
    );
  END IF;
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Recreate create_order_from_cart function
CREATE OR REPLACE FUNCTION public.create_order_from_cart(shipping_details jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_order_id uuid;
  cart_total numeric;
BEGIN
  -- Calculate total from cart
  SELECT COALESCE(SUM(p.price * ci.quantity), 0)
  INTO cart_total
  FROM cart_items ci
  JOIN products p ON ci.product_id = p.id
  WHERE ci.user_id = auth.uid();

  -- Ensure cart is not empty
  IF cart_total <= 0 THEN
    RAISE EXCEPTION 'Cart is empty or total is zero.';
  END IF;

  -- Create a new order
  INSERT INTO orders (user_id, total_amount, shipping_details, status)
  VALUES (auth.uid(), cart_total, shipping_details, 'pending')
  RETURNING id INTO new_order_id;

  -- Copy cart items to order items
  INSERT INTO order_items (order_id, product_id, quantity, price)
  SELECT new_order_id, ci.product_id, ci.quantity, p.price
  FROM cart_items ci
  JOIN products p ON ci.product_id = p.id
  WHERE ci.user_id = auth.uid();

  -- Clear the user's cart
  DELETE FROM cart_items WHERE user_id = auth.uid();

  RETURN new_order_id;
END;
$$;

-- Step 5: Recreate get_vendor_orders function
CREATE OR REPLACE FUNCTION public.get_vendor_orders(p_vendor_id uuid)
RETURNS TABLE(order_details json)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH vendor_order_items AS (
    SELECT
      oi.order_id,
      oi.product_id,
      oi.quantity,
      oi.price
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE p.vendor_id = p_vendor_id
  )
  SELECT
    json_build_object(
      'id', o.id,
      'created_at', o.created_at,
      'status', o.status,
      'shipping_details', o.shipping_details,
      'customer', json_build_object(
        'id', u.id,
        'full_name', u.full_name,
        'email', u.email
      ),
      'items', (
        SELECT json_agg(
          json_build_object(
            'product_name', p.name,
            'quantity', voi.quantity,
            'price', voi.price
          )
        )
        FROM vendor_order_items voi
        JOIN products p ON voi.product_id = p.id
        WHERE voi.order_id = o.id
      ),
      'vendor_total', (
        SELECT SUM(voi.quantity * voi.price)
        FROM vendor_order_items voi
        WHERE voi.order_id = o.id
      )
    )
  FROM orders o
  JOIN profiles u ON o.user_id = u.id
  WHERE o.id IN (SELECT DISTINCT order_id FROM vendor_order_items);
END;
$$;

-- Step 6: Recreate get_admin_dashboard_stats function
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_users bigint;
  total_vendors bigint;
  total_products bigint;
  total_orders bigint;
  total_sales numeric;
BEGIN
  SELECT count(*) INTO total_users FROM profiles;
  SELECT count(*) INTO total_vendors FROM vendors;
  SELECT count(*) INTO total_products FROM products;
  SELECT count(*) INTO total_orders FROM orders;
  SELECT COALESCE(sum(total_amount), 0) INTO total_sales FROM orders WHERE status = 'delivered';

  RETURN json_build_object(
    'total_users', total_users,
    'total_vendors', total_vendors,
    'total_products', total_products,
    'total_orders', total_orders,
    'total_sales', total_sales
  );
END;
$$;

-- Step 7: Recreate admin_get_all_users function
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  role user_role,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.created_at
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- Step 8: Create new function for admin to get all vendors
CREATE OR REPLACE FUNCTION public.admin_get_all_vendors()
RETURNS TABLE (
  vendor_id uuid,
  user_id uuid,
  business_name text,
  business_description text,
  is_approved boolean,
  vendor_created_at timestamptz,
  full_name text,
  email text,
  phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id as vendor_id,
    v.user_id,
    v.business_name,
    v.business_description,
    v.is_approved,
    v.created_at as vendor_created_at,
    p.full_name,
    p.email,
    p.phone
  FROM vendors v
  JOIN profiles p ON v.user_id = p.id
  ORDER BY v.created_at DESC;
END;
$$;

-- Step 9: Create new function for admin to update vendor approval
CREATE OR REPLACE FUNCTION public.admin_update_vendor_approval(p_vendor_id uuid, p_is_approved boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE vendors
  SET is_approved = p_is_approved
  WHERE id = p_vendor_id;
END;
$$;
