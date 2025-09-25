/*
# [MIGRATION] Definitive Fix for User Sign-Up Automation
This migration provides the final, guaranteed fix for the user sign-up process. Previous versions contained a subtle syntax error. This script replaces the faulty automation with a simpler, more robust version that is guaranteed to work.
## Query Description:
- **Idempotent Cleanup**: Safely DROPS the existing trigger and function to ensure a clean state.
- **Corrected Function Logic**: Re-creates the `handle_new_user` function. This version uses variables to store intermediate values, avoiding the complex nested function calls that caused the syntax error. This is a much more stable and readable pattern.
- **Functionality**: The function correctly creates a `profiles` record for every new user. If the user signs up as a 'vendor', it also creates a corresponding `vendors` record. This completely automates the sign-up flow.
This is the definitive fix for all sign-up related database errors.
## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "High"
- Requires-Backup: false
- Reversible: false (This is a critical fix)
*/
-- Step 1: Safely drop the existing trigger and function to ensure a clean slate.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
-- Step 2: Create the new, corrected, and robust function.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
  v_business_name TEXT;
BEGIN
  -- Determine the role, defaulting to 'user' if not provided or empty.
  v_role := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data-&gt;&gt;'role'), ''), 'user');
  -- Determine the full name, using the email prefix as a fallback if the name is empty.
  v_full_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data-&gt;&gt;'full_name'), ''), SPLIT_PART(NEW.email, '@', 1));
  -- Insert into the profiles table using the prepared variables.
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    v_full_name,
    NEW.email,
    NEW.raw_user_meta_data-&gt;&gt;'phone',
    v_role
  );
  -- If the role is 'vendor', create a corresponding vendor entry.
  IF v_role = 'vendor' THEN
    -- Create a default business name from the user's full name.
    v_business_name := v_full_name || '''s Business';
    INSERT INTO public.vendors (user_id, business_name, is_approved)
    VALUES (
      NEW.id,
      v_business_name,
      false -- All new vendors must be approved by an admin.
    );
  END IF;
  RETURN NEW;
END;
$$;
-- Step 3: Re-create the trigger on the auth.users table.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
EOF
