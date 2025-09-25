/*
  # [SECURITY] Set Function Search Path
  This migration updates existing functions to explicitly set the `search_path` to prevent potential security vulnerabilities (schema hijacking).

  ## Query Description: This operation will modify the `handle_new_user` and `update_updated_at_column` functions to include `SET search_path = ''`. This is a security best practice recommended by Supabase to ensure functions execute with a predictable and safe schema path, mitigating risks associated with mutable search paths. This change does not affect existing data.
  
  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Functions affected: `handle_new_user`, `update_updated_at_column`
  
  ## Security Implications:
  - RLS Status: Not Applicable
  - Policy Changes: No
  - Auth Requirements: None
  - Mitigates: `[WARN] Function Search Path Mutable` security advisory.
  
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible performance impact.
*/
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'role')::public.user_role
  );
  
  IF (NEW.raw_user_meta_data->>'role')::public.user_role = 'vendor' THEN
    INSERT INTO public.vendors (user_id, business_name)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'full_name') || '''s Business');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
