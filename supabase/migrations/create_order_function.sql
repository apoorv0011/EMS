/*
          # Create Order From Cart Function
          This function handles the entire checkout process in a single, atomic transaction.
          It creates an order, copies items from the user's cart to the order_items table,
          and then clears the user's cart. This ensures data consistency.

          ## Query Description: This operation creates a new PostgreSQL function `create_order_from_cart`.
          It is a safe, data-additive operation that also includes a data modification (DELETE from cart_items)
          within its transaction. If any step fails, the entire transaction is rolled back, preventing partial data writes.
          This also resolves the 'Function Search Path Mutable' warning by setting a secure search_path.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true (The function can be dropped)
          
          ## Structure Details:
          - Creates function: `public.create_order_from_cart(shipping_details jsonb)`
          
          ## Security Implications:
          - RLS Status: Not applicable to function definition itself.
          - Policy Changes: No
          - Auth Requirements: The function uses `auth.uid()` to securely identify the user.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Low. The function will be called once per checkout.
          */

CREATE OR REPLACE FUNCTION public.create_order_from_cart(shipping_details jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_order_id uuid;
  cart_total numeric;
  current_user_id uuid := auth.uid();
BEGIN
  -- Set a secure search path
  SET search_path = public;

  -- Calculate total from cart
  SELECT SUM(p.price * ci.quantity)
  INTO cart_total
  FROM cart_items ci
  JOIN products p ON ci.product_id = p.id
  WHERE ci.user_id = current_user_id;

  -- Return early if cart is empty or total is null
  IF cart_total IS NULL OR cart_total <= 0 THEN
    RETURN NULL;
  END IF;

  -- 1. Create a new order
  INSERT INTO orders (user_id, total_amount, shipping_details, status)
  VALUES (current_user_id, cart_total, shipping_details, 'pending')
  RETURNING id INTO new_order_id;

  -- 2. Copy cart items to order_items
  INSERT INTO order_items (order_id, product_id, quantity, price)
  SELECT new_order_id, ci.product_id, ci.quantity, p.price
  FROM cart_items ci
  JOIN products p ON ci.product_id = p.id
  WHERE ci.user_id = current_user_id;

  -- 3. Clear the user's cart
  DELETE FROM cart_items WHERE user_id = current_user_id;

  -- 4. Return the new order's ID
  RETURN new_order_id;
END;
$$;
