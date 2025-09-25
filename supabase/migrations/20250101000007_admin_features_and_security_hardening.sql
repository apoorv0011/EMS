/*
          # [Admin Features & Security Hardening]
          This migration introduces functions for the admin dashboard and hardens existing functions against potential security vulnerabilities by explicitly setting the search_path.

          ## Query Description: [This operation creates new database functions to support admin-level data aggregation and user management. It also modifies existing functions to enhance security by preventing search_path manipulation. No data will be lost, and this change is essential for the security and functionality of the admin panel.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Functions Created: `get_admin_dashboard_stats`, `admin_get_all_users`
          - Functions Altered: `handle_new_user`, `create_order_from_cart`, `get_vendor_orders`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [Admin role for new functions]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Low. New functions are optimized for admin use.]
          */

-- Harden existing functions by setting a secure search_path
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.create_order_from_cart(shipping_details jsonb) SET search_path = 'public';
ALTER FUNCTION public.get_vendor_orders(p_vendor_id uuid) SET search_path = 'public';

-- Function to get dashboard stats for admin
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats json;
  user_role text;
BEGIN
  -- Check if the user is an admin
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  IF user_role != 'admin' THEN
    RAISE EXCEPTION 'Permission denied: You must be an admin to access these stats.';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT count(*) FROM auth.users),
    'total_vendors', (SELECT count(*) FROM public.vendors),
    'total_products', (SELECT count(*) FROM public.products),
    'total_orders', (SELECT count(*) FROM public.orders),
    'total_sales', (SELECT sum(total_amount) FROM public.orders)
  ) INTO stats;

  RETURN stats;
END;
$$;
ALTER FUNCTION public.get_admin_dashboard_stats() SET search_path = 'public';
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;


-- Function for admin to get all users with their profiles
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- Check if the user is an admin
  SELECT p.role INTO user_role FROM public.profiles p WHERE p.id = auth.uid();
  IF user_role != 'admin' THEN
    RAISE EXCEPTION 'Permission denied: You must be an admin to access this data.';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email,
    p.full_name,
    p.role,
    u.created_at
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.id
  ORDER BY u.created_at DESC;
END;
$$;
ALTER FUNCTION public.admin_get_all_users() SET search_path = 'public';
GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO authenticated;
