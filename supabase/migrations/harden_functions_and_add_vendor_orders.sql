/*
# [Security & Feature] Harden Functions and Add Vendor Order Function
This migration enhances security by explicitly setting the `search_path` for all custom database functions, resolving the "Function Search Path Mutable" advisory. It also introduces a new RPC function `get_vendor_orders` to efficiently fetch order data for a specific vendor.

## Query Description: This operation alters two existing functions to improve security and adds one new function for vendor order retrieval. It is a safe, non-destructive operation.

## Metadata:
- Schema-Category: ["Safe", "Security", "Feature"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None
- Mitigates: "Function Search Path Mutable" security advisory.
*/

-- Harden handle_new_user function
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
      new.raw_user_meta_data->>'full_name' || '''s Store' -- Default business name
    );
  END IF;
  
  RETURN new;
END;
$$;

-- Harden create_order_from_cart function
CREATE OR REPLACE FUNCTION public.create_order_from_cart(shipping_details jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_order_id uuid;
  cart_total numeric;
  current_user_id uuid := auth.uid();
BEGIN
  -- Calculate total from cart
  SELECT SUM(p.price * ci.quantity)
  INTO cart_total
  FROM cart_items ci
  JOIN products p ON ci.product_id = p.id
  WHERE ci.user_id = current_user_id;

  -- Ensure cart is not empty
  IF cart_total IS NULL OR cart_total <= 0 THEN
    RAISE EXCEPTION 'Cart is empty or has no value';
  END IF;

  -- Create a new order
  INSERT INTO public.orders (user_id, total_amount, shipping_details, status)
  VALUES (current_user_id, cart_total, shipping_details, 'pending')
  RETURNING id INTO new_order_id;

  -- Copy cart items to order items
  INSERT INTO public.order_items (order_id, product_id, quantity, price)
  SELECT new_order_id, ci.product_id, ci.quantity, p.price
  FROM cart_items ci
  JOIN products p ON ci.product_id = p.id
  WHERE ci.user_id = current_user_id;

  -- Clear the user's cart
  DELETE FROM public.cart_items WHERE user_id = current_user_id;

  RETURN new_order_id;
END;
$$;

-- Add function to get orders for a specific vendor
CREATE OR REPLACE FUNCTION public.get_vendor_orders(p_vendor_id uuid)
RETURNS TABLE(order_details json)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    json_build_object(
      'id', o.id,
      'created_at', o.created_at,
      'status', o.status,
      'shipping_details', o.shipping_details,
      'customer', json_build_object(
        'full_name', p.full_name,
        'email', p.email
      ),
      'items', (
        SELECT json_agg(
          json_build_object(
            'product_name', prod.name,
            'quantity', oi.quantity,
            'price', oi.price
          )
        )
        FROM order_items oi
        JOIN products prod ON oi.product_id = prod.id
        WHERE oi.order_id = o.id AND prod.vendor_id = p_vendor_id
      ),
      'vendor_total', (
        SELECT SUM(oi.price * oi.quantity)
        FROM order_items oi
        JOIN products prod ON oi.product_id = prod.id
        WHERE oi.order_id = o.id AND prod.vendor_id = p_vendor_id
      )
    )
  FROM orders o
  JOIN profiles p ON o.user_id = p.id
  WHERE EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN products prod ON oi.product_id = prod.id
    WHERE oi.order_id = o.id AND prod.vendor_id = p_vendor_id
  )
  ORDER BY o.created_at DESC;
END;
$$;
